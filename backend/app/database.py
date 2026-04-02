import aiosqlite

_DB_PATH = "completions.db"

_SCHEMA = """\
CREATE TABLE IF NOT EXISTS accepted_completions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    input_text  TEXT NOT NULL,
    completion  TEXT NOT NULL,
    accepted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accepted_input ON accepted_completions(input_text);
"""


async def _get_conn() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(_DB_PATH, timeout=10)
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA busy_timeout=5000")
    return conn


async def init_db(db_path: str | None = None) -> None:
    global _DB_PATH
    if db_path is not None:
        _DB_PATH = str(db_path)
    conn = await _get_conn()
    try:
        await conn.executescript(_SCHEMA)
        await conn.commit()
    finally:
        await conn.close()


async def save_accepted_completion(input_text: str, completion: str) -> None:
    conn = await _get_conn()
    try:
        await conn.execute(
            "INSERT INTO accepted_completions (input_text, completion) VALUES (?, ?)",
            (input_text, completion),
        )
        await conn.commit()
    finally:
        await conn.close()


async def get_accepted_completions(input_text: str, limit: int = 5) -> list[str]:
    """Most-recently accepted first, deduplicated."""
    conn = await _get_conn()
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
