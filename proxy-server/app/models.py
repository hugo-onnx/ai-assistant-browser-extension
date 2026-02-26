from pydantic import BaseModel, Field, field_validator


class Message(BaseModel):
    role: str
    content: str = Field(..., max_length=32000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1, max_length=200)


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ai-assistant-proxy"
