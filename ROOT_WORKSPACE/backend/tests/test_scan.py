from app.scan import scan_source


def test_detects_sql_and_secret():
    src = """
query = "SELECT * FROM users WHERE name='" + user + "'"
token = "api_key = 'sk-live-demo-secret'"
eval(user)
"""
    hits = scan_source(src)
    rules = {h["rule"] for h in hits}
    assert "sql-injection" in rules
    assert "secret-leak" in rules
    assert "eval-exec" in rules


def test_clean_code_no_hits():
    assert scan_source("print('hello')\nx = 1 + 2\n") == []
