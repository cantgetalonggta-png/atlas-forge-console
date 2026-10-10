from app.scan import scan_source


def test_detects_openai_and_google_shapes():
    # Synthetic non-live shapes for pattern tests
    src = """
OPENAI_API_KEY=sk-proj-AAAAAAAAAAAAAAAAAAAA
GOOGLE_KEY=AIzaSyAAAAAAAAAAAAAAAAAAAAAAAAA
token = "ghp_abcdefghijklmnopqrstuv"
"""
    rules = {h["rule"] for h in scan_source(src)}
    assert "openai-key" in rules
    assert "google-api-key" in rules
    assert "github-pat" in rules


def test_clean_no_secret():
    assert scan_source("const x = 1\nprint(x)\n") == []
