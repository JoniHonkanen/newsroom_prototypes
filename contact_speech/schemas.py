from pydantic import BaseModel
from typing import Literal, List, TypedDict
import time

class Message(BaseModel):
    role: Literal['user', 'assistant', 'system']
    content: str
    timestamp: float = time.time()

class CallState(TypedDict):
    messages: List[Message]
    user_input: str