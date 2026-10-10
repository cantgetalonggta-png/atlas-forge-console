# Atlas Forge — Background Task Managers

## Production
https://atlas-forge-console.vercel.app/jobs

## Frontend (best-manager)
- Priority queue · concurrency · retries · AbortSignal cancel
- localStorage job log · nav badge · dual Jobs UI
- Optional remote bridge: `VITE_ATLAS_API_URL`

## Backend
- `ROOT_WORKSPACE/backend` TaskManager: priority heap, retries, batch parents
- `POST /v1/jobs` · `POST /v1/jobs/batch` · `GET /v1/jobs` · cancel · stats · config
