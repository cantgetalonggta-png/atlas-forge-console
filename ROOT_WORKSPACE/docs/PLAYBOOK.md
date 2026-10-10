# Atlas Forge Operational Playbook

Generated: 2026-10-10T15:02:25.087215Z

## Production
- Web console: https://atlas-forge-console.vercel.app
- GitHub: https://github.com/cantgetalonggta-png/atlas-forge-console
- Backend: Python FastAPI under ROOT_WORKSPACE/backend (Docker or uvicorn)

## Architecture
- **Frontend**: TanStack Start (TypeScript) — production on Vercel
- **Backend**: FastAPI microservices — `/v1/ontology`, `/v1/scan`, `/v1/import`, `/v1/health/live`, OAuth status
- **Skills/Tools/Plugins**: Distilled from Drive vault + deer-flow + cycle1 TAR

## Desktop binaries (not in web console)
See console /setup — Agent Network, NodeTool Studio, Natamux, DeepAudit.

## Backend local run
```bash
cd ROOT_WORKSPACE/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest -q
```

## DeerFlow ingest
- Zip: deer-flow-main.zip
- Backend Python index: source-mirror/deer-flow/backend_py_index.txt (~1980 files)
- Skills: skills/blocking-io-guard, deerflow-maintainer-orchestrator, engineer-system-change, smoke-test
