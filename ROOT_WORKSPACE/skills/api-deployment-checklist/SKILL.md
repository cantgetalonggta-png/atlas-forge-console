# Skill: API deployment checklist

Source: Drive folder 1xtF7i4XWfsPH36xgp7pS46yvi2AGpmlb · API deployment.txt

## When to use
Shipping LLM/agent APIs to production (OpenAI Responses-style or compatible).

## Checklist
1. Prefer Responses-style APIs for stateful agent workflows.
2. Tune reasoning.effort (none/low/medium/high/xhigh) by task class.
3. Tune text.verbosity for cost vs completeness.
4. Preserve assistant phase labels (commentary vs final_answer) on follow-ups.
5. Use tool_search / defer_loading for large tool catalogs.
6. Enable prompt_cache_key and compaction where supported.
7. Prefer background=True / resumable jobs for long work.
8. Keep secrets in env / vault — never in source or Drive paste files.
9. Allowlist outbound hosts; rate-limit auth failures.
10. Health probes + job managers (Atlas /v1/jobs) for operational visibility.

## Anti-patterns
- Hardcoded sk- / ghp_ / AIza keys in repos or chat logs
- Public internet exposure of /tools/invoke style operator endpoints
