from fastapi import FastAPI

from app.schemas import MessageRequest, MessageResponse

app = FastAPI(title="Python Message Service", version="1.0.0")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/message", response_model=MessageResponse)
def message(payload: MessageRequest) -> MessageResponse:
    response_text = (
        "Thanks for your message I will get back to you at the earliest. "
        f"Your received message: {payload.text}"
    )
    return MessageResponse(response=response_text)
