import bisect
from pathlib import Path

DICT_PATH = Path(__file__).resolve().parent.parent / "data" / "hunspell_US.txt"

_words: list[str] = []


def load_dictionary(path: Path | None = None) -> int:
    global _words
    target = path or DICT_PATH

    words = set()
    with open(target, encoding="utf-8", errors="replace") as f:
        for line in f:
            w = line.strip()
            if w and not w.startswith("#"):
                words.add(w.lower())

    _words = sorted(words)
    return len(_words)


def get_word_completions(prefix: str, limit: int = 5) -> list[str]:
    if not _words:
        load_dictionary()

    q = prefix.lower()
    if not q:
        return []

    i = bisect.bisect_left(_words, q)
    results: list[str] = []
    while i < len(_words) and _words[i].startswith(q):
        suffix = _words[i][len(q):]
        if suffix:
            results.append(suffix)
            if len(results) >= limit:
                break
        i += 1
    return results
