from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.agent import get_agent

from app.utils.nlp import (
    parse_input,
    normalize_date,
    normalize_time,
    normalize_party_size,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "Empty message")
    try:
        reply = get_agent().run(req.message)
    except Exception:
        reply = "Oops, something went wrong. Please try again later."
    return ChatResponse(reply=reply)
