from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import init_db
from app.dictionary import load_dictionary


@pytest_asyncio.fixture
async def client(tmp_path: Path):
    await init_db(db_path=str(tmp_path / "test.db"))

    dict_path = Path(__file__).resolve().parent.parent / "data" / "hunspell_US.txt"
    if dict_path.exists():
        load_dictionary(dict_path)

    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
