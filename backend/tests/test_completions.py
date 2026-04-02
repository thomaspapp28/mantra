from unittest.mock import patch
from httpx import AsyncClient


# -- Word completions --

async def test_word_completion(client: AsyncClient):
    resp = await client.get("/completions", params={"text": "hel"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["completion_type"] == "word"
    assert 0 < len(data["completions"]) <= 5


async def test_word_completion_uses_last_word(client: AsyncClient):
    resp = await client.get("/completions", params={"text": "I want hel"})
    assert resp.status_code == 200
    assert resp.json()["completion_type"] == "word"


# -- Sentence completions --

async def test_sentence_completion_returns_five(client: AsyncClient):
    fake = ["store.", "bed.", "restaurant.", "park.", "gym.", "home."]
    with patch("app.main.llm_completion", return_value=fake):
        resp = await client.get("/completions", params={"text": "I want to "})
    assert resp.status_code == 200
    assert len(resp.json()["completions"]) == 5


async def test_sentence_filters_null_set(client: AsyncClient):
    with patch("app.main.llm_completion", side_effect=[["∅"], ["a.", "b.", "c.", "d.", "e."]]):
        resp = await client.get("/completions", params={"text": "Go "})
    assert resp.status_code == 200
    assert "∅" not in resp.json()["completions"]


async def test_sentence_strips_numbered_prefixes(client: AsyncClient):
    numbered = ["1. store.", "2. bed.", "3) park.", "4. gym.", "5. home."]
    with patch("app.main.llm_completion", return_value=numbered):
        resp = await client.get("/completions", params={"text": "I need "})
    data = resp.json()
    assert "store." in data["completions"]
    assert all(not c[0].isdigit() for c in data["completions"])


async def test_sentence_error_when_llm_keeps_failing(client: AsyncClient):
    with patch("app.main.llm_completion", return_value=["∅"]):
        resp = await client.get("/completions", params={"text": "I want "})
    assert resp.status_code == 500


async def test_sentence_retries_on_exception(client: AsyncClient):
    calls = 0
    def flaky(text, n):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise ConnectionError("boom")
        return ["a.", "b.", "c.", "d.", "e.", "f."]

    with patch("app.main.llm_completion", side_effect=flaky):
        resp = await client.get("/completions", params={"text": "Go "})
    assert resp.status_code == 200
    assert calls >= 2


async def test_sentence_deduplicates(client: AsyncClient):
    duped = ["store.", "store.", "bed.", "park.", "gym.", "home."]
    with patch("app.main.llm_completion", return_value=duped):
        resp = await client.get("/completions", params={"text": "Go "})
    completions = resp.json()["completions"]
    assert len(completions) == len(set(completions))


# -- Accepted completions --

async def test_accept_completion(client: AsyncClient):
    resp = await client.post("/completions", json={"text": "hel", "completion": "lo"})
    assert resp.status_code == 201


async def test_accepted_appears_first(client: AsyncClient):
    await client.post("/completions", json={"text": "hel", "completion": "met"})
    resp = await client.get("/completions", params={"text": "hel"})
    assert resp.json()["completions"][0] == "met"


async def test_accepted_ordered_by_recency(client: AsyncClient):
    await client.post("/completions", json={"text": "te", "completion": "st"})
    await client.post("/completions", json={"text": "te", "completion": "am"})
    resp = await client.get("/completions", params={"text": "te"})
    data = resp.json()
    assert data["completions"][0] == "am"
    assert "st" in data["completions"]


async def test_skips_llm_when_enough_accepted(client: AsyncClient):
    for i in range(5):
        await client.post("/completions", json={"text": "Go ", "completion": f"place {i}."})

    with patch("app.main.llm_completion") as mock:
        resp = await client.get("/completions", params={"text": "Go "})
    assert resp.status_code == 200
    mock.assert_not_called()


# -- Validation --

async def test_missing_text_422(client: AsyncClient):
    assert (await client.get("/completions")).status_code == 422


async def test_empty_text_422(client: AsyncClient):
    assert (await client.get("/completions", params={"text": ""})).status_code == 422


async def test_post_empty_fields_422(client: AsyncClient):
    assert (await client.post("/completions", json={"text": "", "completion": "lo"})).status_code == 422
    assert (await client.post("/completions", json={"text": "hel", "completion": ""})).status_code == 422
