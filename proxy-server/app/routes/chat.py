import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.config import get_settings
from app.models import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions"


async def _stream_chat(request: ChatRequest) -> AsyncGenerator[dict, None]:
    settings = get_settings()
    provider = request.provider or settings.provider

    if provider == "cerebras":
        url = CEREBRAS_URL
        api_key = settings.cerebras_api_key
        model = settings.cerebras_model
    else:
        url = GROQ_URL
        api_key = settings.groq_api_key
        model = settings.groq_model

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in request.messages],
        "temperature": settings.temperature,
        "top_p": settings.top_p,
        "stream": True,
    }

    # Cerebras uses max_tokens; Groq uses max_completion_tokens
    if provider == "cerebras":
        payload["max_tokens"] = settings.max_completion_tokens
    else:
        payload["max_completion_tokens"] = settings.max_completion_tokens

    yield {"event": "start"}

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=30.0)) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    logger.error("%s error %d: %s", provider, response.status_code, body.decode())
                    yield {"event": "error", "message": "Failed to get a response from the AI service"}
                    return

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data:"):
                        continue

                    data_str = line[5:].strip()
                    if data_str == "[DONE]":
                        yield {"event": "done"}
                        return

                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        text = delta.get("content", "")
                        if text:
                            yield {"event": "delta", "text": text}
                    except (json.JSONDecodeError, IndexError):
                        continue

    except httpx.TimeoutException:
        logger.error("Timeout connecting to %s", provider)
        yield {"event": "error", "message": "Request timed out"}
    except httpx.HTTPError as e:
        logger.error("HTTP error: %s", e)
        yield {"event": "error", "message": "Connection error"}
    except Exception as e:
        logger.error("Unexpected error: %s", e, exc_info=True)
        yield {"event": "error", "message": "Internal proxy error"}


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream a chat response from Groq or Cerebras.
    Returns SSE events: start, delta, done, error
    """
    async def event_generator():
        async for event in _stream_chat(request):
            yield {"data": json.dumps(event)}

    return EventSourceResponse(event_generator())
