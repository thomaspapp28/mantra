# Mantra Autocomplete

Full-stack autocomplete app — FastAPI backend + React/TypeScript frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [LM Studio](https://lmstudio.ai/) with a model loaded (for sentence completions)

## Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

cp .env.example .env
# Edit .env if your LM Studio runs on a different port

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs on http://localhost:8000.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Runs on http://localhost:5173. API calls are proxied to the backend via the config in `vite.config.ts`.

## Environment Variables

Both backend and frontend use `.env` files for configuration. Copy the provided `.env.example` files and adjust as needed.

**`.env` files are gitignored and must not be committed.**

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `LM_STUDIO_URL` | `http://localhost:1234` | LM Studio server URL |
| `DATABASE_URL` | `sqlite:///./completions.db` | SQLite database path |
| `APP_PORT` | `8000` | Backend server port |

> Note: The LM Studio URL in `llm.py` is hardcoded to `localhost:1234` per the assignment spec. The env var is provided for documentation and potential future use.

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` (via Vite proxy) | Backend API base URL. When set, bypasses the Vite dev proxy and hits the backend directly. |

## Verify It's Working

1. Start LM Studio and load a model
2. Start the backend: `uvicorn app.main:app --reload`
3. Start the frontend: `npm run dev`
4. Open http://localhost:5173
5. Type `ha` — word completions should appear immediately
6. Type `I want to go ` (trailing space) — sentence completions will take a few seconds due to the local LLM
7. Click a suggestion — it fills the input and is remembered for future lookups with the same prefix

## Dictionary

The word list lives at `backend/data/hunspell_US.txt` and is included in the repo. No extra download needed.

## How It Works

**Word completions** — triggered when input doesn't end with whitespace. Looks up the last partial word against the dictionary using binary search. Returns up to 5 suffix completions.

**Sentence completions** — triggered when input ends with whitespace. Calls a local LLM through LM Studio. The LLM is intentionally unreliable, so the endpoint retries up to 5 times to gather exactly 5 unique results.

**Accepted completions** — clicking a suggestion saves it via `POST /completions`. On subsequent lookups with the same input, previously accepted completions appear first, ordered by most recent. Stored in SQLite with WAL mode for multi-process safety.

## Tests

```bash
# Backend (pytest)
cd backend
python -m pytest tests -v

# Frontend (Vitest)
cd frontend
npm test
```

**Backend:** endpoint behavior, LLM retry logic, word lookup, accepted completion ordering, input validation.

**Frontend:** autocomplete rendering, ARIA accessibility, click-to-apply, API error handling, empty state.

## Key Decisions

- **Sorted array + bisect** for dictionary: O(log n) prefix lookup, low memory overhead.
- **`asyncio.to_thread`** for LLM calls: `llm.py` is synchronous, so offloading to a thread keeps the event loop responsive.
- **SQLite WAL mode**: multi-process safe persistence without a DB server.
- **useReducer** in the autocomplete hook: cleanly models the fetch lifecycle and avoids React lint warnings about setState in effects.
- **Debounce (200ms) + AbortController**: prevents request storms and stale response races.
