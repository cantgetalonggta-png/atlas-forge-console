from __future__ import annotations

import re
from typing import Any

RULES: list[tuple[str, re.Pattern[str], str, str]] = [
    ("sql-injection", re.compile(r"""(SELECT|INSERT|UPDATE|DELETE).*\+.*""", re.I), "high", "String-concatenated SQL"),
    ("command-injection", re.compile(r"""os\.system\s*\(|subprocess\.(call|run|Popen)\s*\(.*\+""", re.I), "critical", "Shell/command construction"),
    ("secret-leak", re.compile(r"""(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}""", re.I), "high", "Hardcoded secret-like string"),
    ("eval-exec", re.compile(r"""\beval\s*\(|\bexec\s*\(""", re.I), "high", "Dynamic code execution"),
    ("pickle", re.compile(r"""pickle\.loads?\s*\(""", re.I), "medium", "Unsafe deserialization"),
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
