from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Request from the Chrome extension."""

    message: str
    thread_id: str | None = None

    def model_post_init(self, __context) -> None:
        if self.thread_id in (None, "", "null", "undefined"):
            self.thread_id = None


class ChatResponse(BaseModel):
    """Non-streaming response."""

    thread_id: str
    run_id: str
    content: str


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "wxo-proxy"