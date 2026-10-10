# Atlas Forge — Cycle 2 BUILD STATUS

## Production
https://atlas-forge-console.vercel.app

## Cycle 2 (Drive TAR + deer-flow)
- Ingested Drive TAR: ROOT_WORKSPACE-cycle1-2026-10-10.tar.gz
- Ingested deer-flow-main.zip (~1980 backend .py indexed)
- Monorepo: `/ROOT_WORKSPACE` (backend FastAPI, skills, encyclopedias, ontology)
- DeerFlow project + setup guide wired into console

## Backend API (self-host)
```
cd ROOT_WORKSPACE/backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000
pytest -q
```

## Desktop binaries
Still not bundled in web console — see /setup
