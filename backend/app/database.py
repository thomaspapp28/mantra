import os

import aiosqlite

_db_path = os.getenv("DATABASE_URL", "completions.db").removeprefix("sqlite:///./")

_SCHEMA = """\
CREATE TABLE IF NOT EXISTS accepted_completions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    input_text  TEXT NOT NULL,
    completion  TEXT NOT NULL,
    accepted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accepted_input ON accepted_completions(input_text);
"""


async def _connect() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(_db_path, timeout=10)
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA busy_timeout=5000")
    return conn


async def init_db(db_path: str | None = None) -> None:
    global _db_path
    if db_path is not None:
        _db_path = str(db_path)
    conn = await _connect()
    try:
        await conn.executescript(_SCHEMA)
        await conn.commit()
    finally:
        await conn.close()


async def save_accepted(input_text: str, completion: str) -> None:
    conn = await _connect()
    try:
        await conn.execute(
            "INSERT INTO accepted_completions (input_text, completion) VALUES (?, ?)",
            (input_text, completion),
        )
        await conn.commit()
    finally:
        await conn.close()


async def get_accepted(input_text: str, limit: int = 5) -> list[str]:
    conn = await _connect()
    try:
        cursor = await conn.execute(
            "SELECT completion FROM accepted_completions WHERE input_text = ? ORDER BY id DESC",
            (input_text,),
        )
        rows = await cursor.fetchall()
    finally:
        await conn.close()

    seen: set[str] = set()
    results: list[str] = []
    for (comp,) in rows:
        if comp not in seen:
            seen.add(comp)
            results.append(comp)
            if len(results) >= limit:
                break
    return results
