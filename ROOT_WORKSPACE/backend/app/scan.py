from __future__ import annotations

import re
from typing import Any

RULES: list[tuple[str, re.Pattern[str], str, str]] = [
    ("sql-injection", re.compile(r"""(SELECT|INSERT|UPDATE|DELETE).*\+.*""", re.I), "high", "String-concatenated SQL"),
    ("command-injection", re.compile(r"""os\.system\s*\(|subprocess\.(call|run|Popen)\s*\(.*\+""", re.I), "critical", "Shell/command construction"),
    ("secret-leak", re.compile(r"""(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}""", re.I), "high", "Hardcoded secret-like string"),
    ("openai-key", re.compile(r"""\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}\b"""), "critical", "OpenAI API key shape"),
    ("github-pat", re.compile(r"""\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"""), "critical", "GitHub token shape"),
    ("google-api-key", re.compile(r"""\bAIza[0-9A-Za-z\-_]{20,}\b"""), "critical", "Google API key shape"),
    ("aws-key", re.compile(r"""\bAKIA[0-9A-Z]{16}\b"""), "critical", "AWS access key shape"),
    ("slack-token", re.compile(r"""\bxox[baprs]-[A-Za-z0-9-]{10,}\b"""), "critical", "Slack token shape"),
    ("private-key", re.compile(r"""-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"""), "critical", "PEM private key"),
    ("eval-exec", re.compile(r"""\beval\s*\(|\bexec\s*\("""), "high", "Dynamic code execution"),
    ("pickle", re.compile(r"""pickle\.loads?\s*\("""), "medium", "Unsafe deserialization"),
]


def scan_source(source: str) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for i, line in enumerate(source.splitlines(), start=1):
        for rule_id, pattern, severity, detail in RULES:
            if pattern.search(line):
                hits.append(
                    {
                        "rule": rule_id,
                        "line": i,
                        "severity": severity,
                        "detail": detail,
                        "snippet": line.strip()[:200],
                    }
                )
    return hits
