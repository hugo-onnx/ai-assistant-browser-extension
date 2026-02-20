import asyncio
import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.auth import token_manager
from app.config import get_settings
from app.models import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

FLOW_INDICATORS = [
    "a new flow has started",
    "flow and will resume",
    "dedicated to the flow",
    "currently dedicated to",
]


async def _get_auth_headers() -> dict[str, str]:
    token = await token_manager.get_token()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _build_payload(request: ChatRequest) -> dict:
    settings = get_settings()
    payload: dict = {
        "message": {
            "role": "user",
            "content": request.message,
        },
        "agent_id": settings.wxo_agent_id,
    }
    if request.thread_id and request.thread_id != "null":
        payload["thread_id"] = request.thread_id
    return payload


def _is_flow_message(text: str) -> bool:
    lower = text.lower()
    return any(indicator in lower for indicator in FLOW_INDICATORS)


async def _poll_thread_messages(
    thread_id: str,
    known_message_ids: set[str],
    max_wait: int = 600,
    interval: int = 8,
) -> AsyncGenerator[dict, None]:
    """
    Poll the thread's message list for NEW assistant messages.
    Ignores all messages we already saw during the initial stream.
    """
    settings = get_settings()
    base_url = settings.wxo_base

    logger.info(
        "Flow detected — polling thread %s for new messages (ignoring %d known msgs: %s). Max %ds, every %ds.",
        thread_id, len(known_message_ids), known_message_ids, max_wait, interval,
    )

    yield {"event": "flow_status", "message": "Processing flow…"}

    elapsed = 0
    initial_msg_count = None

    while elapsed < max_wait:
        await asyncio.sleep(interval)
        elapsed += interval

        try:
            headers = await _get_auth_headers()

            async with httpx.AsyncClient(timeout=30.0) as client:
                messages_url = f"{base_url}/v1/orchestrate/threads/{thread_id}/messages"
                resp = await client.get(messages_url, headers=headers)

                if resp.status_code != 200:
                    logger.debug("Poll messages returned %d", resp.status_code)
                    continue

                data = resp.json()

                # Extract messages list
                if isinstance(data, list):
                    messages = data
                elif isinstance(data, dict):
                    messages = data.get("messages", data.get("data", data.get("items", [])))
                    if not isinstance(messages, list):
                        messages = []
                else:
                    messages = []

                # Log summary of all messages
                msg_summary = [
                    {"id": m.get("id", "?")[:12], "role": m.get("role", "?"), "text": (m.get("content", [{}])[0].get("text", "") if m.get("content") else "")[:80]}
                    for m in messages if isinstance(m, dict)
                ]
                # Log summary — verbose on first poll and when count changes, quiet otherwise
                if initial_msg_count is None:
                    initial_msg_count = len(messages)
                    logger.info("Poll [%ds]: %d messages — %s", elapsed, len(messages), json.dumps(msg_summary))
                elif len(messages) != initial_msg_count:
                    logger.info("Poll [%ds]: %d messages (was %d) — %s", elapsed, len(messages), initial_msg_count, json.dumps(msg_summary))
                elif elapsed % 60 < interval:
                    logger.info("Poll [%ds]: still %d messages", elapsed, len(messages))

                for msg in messages:
                    if not isinstance(msg, dict):
                        continue

                    msg_id = msg.get("id", msg.get("message_id", ""))
                    msg_role = msg.get("role", "")

                    if msg_id in known_message_ids:
                        continue
                    if msg_role != "assistant":
                        known_message_ids.add(msg_id)
                        continue

                    content_list = msg.get("content", [])
                    texts = []
                    for item in content_list:
                        if isinstance(item, dict):
                            text = item.get("text", "")
                        elif isinstance(item, str):
                            text = item
                        else:
                            text = ""
                        if text:
                            texts.append(text)

                    combined = "\n\n".join(texts)

                    if combined and not _is_flow_message(combined):
                        logger.info("Flow result found (msg %s): %s", msg_id[:12] if msg_id else "?", combined[:300])
                        yield {"event": "new_message"}
                        yield {"event": "delta", "text": combined}
                        return

                    known_message_ids.add(msg_id)

        except Exception as e:
            logger.debug("Poll error: %s", e)

        if elapsed % 30 == 0:
            yield {"event": "flow_status", "message": f"Still processing… ({elapsed}s)"}

    logger.warning("Flow polling timed out after %ds", max_wait)
    yield {"event": "new_message"}
    yield {
        "event": "delta",
        "text": "⏳ The flow is still processing after 10 minutes. The result will appear in watsonx Orchestrate when ready.",
    }


async def _stream_response(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """
    Stream from /v1/orchestrate/runs?stream=true.
    If an async flow is detected, automatically polls for the flow result.
    """
    settings = get_settings()
    payload = _build_payload(request)
    headers = await _get_auth_headers()
    url = settings.wxo_stream_url

    logger.info("Streaming from: %s", url)

    full_text = ""
    thread_id = request.thread_id or ""
    run_id = ""
    known_message_ids: set[str] = set()
    is_flow = False

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=30.0)) as client:
            async with client.stream(
                "POST", url, headers=headers, json=payload,
            ) as response:
                if response.status_code == 401:
                    token_manager.invalidate()
                    yield {"event": "error", "message": "Authentication failed. Please retry."}
                    return

                if response.status_code != 200:
                    body = await response.aread()
                    logger.error("WXO error %d: %s", response.status_code, body.decode())
                    yield {
                        "event": "error",
                        "message": f"Orchestrate API error: {response.status_code} - {body.decode()[:300]}",
                    }
                    return

                async for raw_line in response.aiter_lines():
                    raw_line = raw_line.strip()
                    if not raw_line:
                        continue

                    try:
                        line = json.loads(raw_line)
                    except json.JSONDecodeError:
                        continue

                    event_type = line.get("event", "")
                    data = line.get("data", {})

                    logger.info("SSE event: %s", event_type)

                    if event_type == "run.started":
                        thread_id = data.get("thread_id", thread_id)
                        run_id = data.get("run_id", run_id)
                        yield {
                            "event": "start",
                            "thread_id": thread_id,
                            "run_id": run_id,
                        }

                    elif event_type == "message.delta":
                        delta = data.get("delta", {})
                        for content_item in delta.get("content", []):
                            text = content_item.get("text", "")
                            if text:
                                full_text += text
                                yield {"event": "delta", "text": text}
                                if _is_flow_message(text):
                                    is_flow = True

                    elif event_type == "run.step.intermediate":
                        msg = data.get("message", {})
                        status_text = msg.get("text", "")
                        if status_text:
                            yield {"event": "status", "message": status_text}

                    elif event_type == "message.created":
                        msg = data.get("message", data)
                        msg_id = msg.get("id", "")
                        if msg_id:
                            known_message_ids.add(msg_id)

                    elif event_type == "message.started":
                        # Track the user message ID too
                        msg_id = data.get("message_id", "")
                        if msg_id:
                            known_message_ids.add(msg_id)

                    elif event_type in ("run.completed", "done"):
                        thread_id = data.get("thread_id", thread_id)
                        run_id = data.get("run_id", run_id)

    except httpx.TimeoutException:
        logger.error("Timeout connecting to watsonx Orchestrate")
        yield {"event": "error", "message": "Request timed out"}
        return
    except httpx.HTTPError as e:
        logger.error("HTTP error: %s", e)
        yield {"event": "error", "message": f"Connection error: {str(e)}"}
        return
    except Exception as e:
        logger.error("Unexpected error: %s", e, exc_info=True)
        yield {"event": "error", "message": "Internal proxy error"}
        return

    logger.info("Stream ended. is_flow=%s, thread=%s, known_msgs=%s", is_flow, thread_id, known_message_ids)

    # If a flow was detected, poll for the result
    if is_flow and thread_id:
        async for event in _poll_thread_messages(
            thread_id=thread_id,
            known_message_ids=known_message_ids,
        ):
            yield event

    yield {
        "event": "done",
        "thread_id": thread_id,
        "run_id": run_id,
        "full_text": full_text,
    }


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream a chat response from watsonx Orchestrate.
    Returns SSE events: start, delta, status, new_message, flow_status, done, error
    """

    async def event_generator():
        async for event in _stream_response(request):
            yield {"data": json.dumps(event)}

    return EventSourceResponse(event_generator())


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Non-streaming chat. Internally collects the full streaming response."""
    full_text = ""
    thread_id = ""
    run_id = ""

    async for event in _stream_response(request):
        evt = event.get("event")
        if evt == "delta":
            full_text += event.get("text", "")
        elif evt == "done":
            thread_id = event.get("thread_id", "")
            run_id = event.get("run_id", "")
            if not full_text:
                full_text = event.get("full_text", "")
        elif evt == "error":
            raise HTTPException(status_code=502, detail=event.get("message", "Unknown error"))

    return ChatResponse(thread_id=thread_id, run_id=run_id, content=full_text)