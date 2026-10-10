from app.allowlist import host_allowed


def test_github_allowed():
    assert host_allowed("https://api.github.com/repos/a/b") is True


def test_evil_blocked():
    assert host_allowed("https://evil.example/x") is False
