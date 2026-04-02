from enum import Enum
from pydantic import BaseModel, Field


class CompletionType(str, Enum):
    WORD = "word"
    SENTENCE = "sentence"


class CompletionResponse(BaseModel):
    completions: list[str]
    completion_type: CompletionType
    text: str


class CompletionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    completion: str = Field(..., min_length=1)


class ErrorResponse(BaseModel):
    detail: str
