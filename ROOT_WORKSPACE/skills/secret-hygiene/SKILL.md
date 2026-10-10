# Skill: Secret hygiene

Source: Drive API pack (leak education + accidental exposures in pack)

## Detect
Scan for patterns:
- OpenAI: sk-, sk-proj-
- GitHub: ghp_, github_pat_
- Google: AIza
- Slack/AWS/JWT heuristics
- Firebase client configs with private RTDB write rules

## Remediate
1. Rotate exposed keys immediately.
2. Purge from git history / Drive copies.
3. Move to env / secret manager; never commit .env.
4. Mask in UI (show last 4 only).
5. CI gate: fail build on high-severity secret hits.

## Atlas Forge
- Analyzer rules in scan module (expanded cycle3)
- Jobs can enqueue scans on snippets
- Do not implement credential-harvest scrapers
