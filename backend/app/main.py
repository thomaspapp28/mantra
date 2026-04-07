import asyncio
import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .database import get_accepted, init_db, save_accepted
from .dictionary import get_word_completions, load_dictionary
from .llm import llm_completion
from .models import CompletionRequest, CompletionResponse, CompletionType, ErrorResponse

logger = logging.getLogger(__name__)

MAX_COMPLETIONS = 5
MAX_LLM_RETRIES = 5
LLM_TIMEOUT = 30
_NUMBERED_RE = re.compile(r"^\d+[\.\)]\s*")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logging.basicConfig(level=logging.INFO)
    await init_db()
    n = load_dictionary()
    logger.info("Loaded %d dictionary words", n)
    yield


app = FastAPI(title="Mantra Autocomplete API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _clean_llm_lines(lines: list[str]) -> list[str]:
    results = []
    for line in lines:
        text = _NUMBERED_RE.sub("", line).strip()
        if text and text != "∅":
            results.append(text)
    return results


async def _get_sentence_completions(text: str, needed: int) -> list[str]:
    collected: list[str] = []
    seen: set[str] = set()

    for attempt in range(MAX_LLM_RETRIES):
        if needed - len(collected) <= 0:
            break
        try:
            raw = await asyncio.wait_for(
                asyncio.to_thread(llm_completion, text, needed - len(collected) + 3),
                timeout=LLM_TIMEOUT,
            )
        except Exception:
            logger.warning("LLM call failed (attempt %d/%d)", attempt + 1, MAX_LLM_RETRIES, exc_info=True)
            continue

        for item in _clean_llm_lines(raw):
            if item not in seen:
                seen.add(item)
                collected.append(item)
                if len(collected) >= needed:
                    break

    return collected


def _merge_dedup(*lists: list[str], limit: int = MAX_COMPLETIONS) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for lst in lists:
        for item in lst:
            if item not in seen:
                seen.add(item)
                result.append(item)
                if len(result) >= limit:
                    return result
    return result


@app.get(
    "/completions",
    response_model=CompletionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def get_completions(
    text: str = Query(..., min_length=1),
) -> CompletionResponse:
    is_sentence = text[-1].isspace()
    comp_type = CompletionType.SENTENCE if is_sentence else CompletionType.WORD
    accepted = await get_accepted(text, limit=MAX_COMPLETIONS)

    if is_sentence:
        if len(accepted) >= MAX_COMPLETIONS:
            return CompletionResponse(
                completions=accepted[:MAX_COMPLETIONS],
                completion_type=comp_type,
                text=text,
            )

        llm_results = await _get_sentence_completions(text, MAX_COMPLETIONS - len(accepted))
        merged = _merge_dedup(accepted, llm_results)

        if len(merged) < MAX_COMPLETIONS:
            raise HTTPException(
                status_code=500,
                detail=f"Could not produce {MAX_COMPLETIONS} sentence completions (got {len(merged)}).",
            )

        return CompletionResponse(completions=merged, completion_type=comp_type, text=text)

    parts = text.split()
    last_word = parts[-1] if parts else text
    word_results = get_word_completions(last_word, limit=MAX_COMPLETIONS)
    merged = _merge_dedup(accepted, word_results)

    return CompletionResponse(completions=merged, completion_type=comp_type, text=text)


@app.post("/completions", status_code=201)
async def record_completion(request: CompletionRequest) -> dict[str, str]:
    await save_accepted(request.text, request.completion)
    return {"status": "saved"}
