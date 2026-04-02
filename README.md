# Mantra Autocomplete

Full-stack autocomplete app — FastAPI backend + React/TypeScript frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [LM Studio](https://lmstudio.ai/) running locally (for sentence completions)

## Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1
# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs on http://localhost:8000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173 (proxies `/api` to the backend).

### LM Studio

Sentence completions require LM Studio running at `localhost:1234` with a model loaded. Without it, word completions still work fine but sentence completions will error.

## How It Works

**Word completions** — triggered when input doesn't end with whitespace. Looks up the last partial word against `hunspell_US.txt` using binary search. Returns up to 5 suffix completions.

**Sentence completions** — triggered when input ends with whitespace. Calls a local LLM through LM Studio. The LLM is intentionally unreliable, so the endpoint retries up to 5 times to gather exactly 5 unique results.

**Accepted completions** — clicking a suggestion saves it via `POST /completions`. On future lookups with the same input, previously accepted completions appear first (most recent first). Stored in SQLite with WAL mode for multi-process safety.

## Tests

```bash
# Backend
cd backend
python -m pytest tests -v

# Frontend
cd frontend
npm test
```

## Key Decisions

- **Sorted array + bisect** for dictionary: O(log n) prefix lookup, low memory.
- **`asyncio.to_thread`** for LLM calls: the provided `llm.py` is synchronous — offloading to a thread keeps the event loop responsive.
- **SQLite WAL mode**: multi-process safe persistence without a DB server.
- **useReducer** in the autocomplete hook: models the fetch lifecycle cleanly and avoids React's strict-mode lint warnings about setState in effects.
- **Debounce (200ms) + AbortController**: prevents request storms and stale response races.
