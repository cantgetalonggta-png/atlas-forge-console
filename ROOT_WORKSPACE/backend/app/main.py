from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import __version__
from .config import settings
from .health import run_probes
from .importers import import_docker, import_github, import_huggingface, parse_github_ref, parse_hf_ref
from .oauth import github_authorize_url, oauth_status
from .ontology import ONTOLOGY_MAP, PLUGIN_TREE, PROJECTS, SKILL_TREE, TOOL_TREE
from .scan import scan_source
from .task_manager import manager
from .task_handlers import register_all

app = FastAPI(title=settings.app_name, version=__version__)
register_all(manager)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanBody(BaseModel):
    source: str = Field(..., min_length=1, max_length=500_000)


class ImportBody(BaseModel):
    ref: str = Field(..., min_length=1, max_length=500)
    source: str = Field(default="github-public")


class OAuthStartBody(BaseModel):
    redirect_uri: str
    state: str = "atlas"


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "service": settings.app_name, "version": __version__, "env": settings.environment}


@app.get("/v1/health/live")
async def health_live() -> dict:
    return await run_probes()


@app.get("/v1/ontology")
async def ontology() -> dict:
    return {
        "skills": SKILL_TREE,
        "tools": TOOL_TREE,
        "plugins": PLUGIN_TREE,
        "map": ONTOLOGY_MAP,
        "projects": PROJECTS,
    }


@app.get("/v1/skills")
async def skills() -> dict:
    return {"items": SKILL_TREE}


@app.get("/v1/tools")
async def tools() -> dict:
    return {"items": TOOL_TREE}


@app.get("/v1/plugins")
async def plugins() -> dict:
    return {"items": PLUGIN_TREE}


@app.get("/v1/projects")
async def projects() -> dict:
    return {"items": PROJECTS}


@app.post("/v1/scan")
async def scan(body: ScanBody) -> dict:
    hits = scan_source(body.source)
    return {"ok": True, "hits": hits, "count": len(hits)}


@app.post("/v1/import")
async def import_ref(body: ImportBody) -> dict:
    src = body.source
    if src == "github-public":
        parsed = parse_github_ref(body.ref)
        if not parsed:
            raise HTTPException(400, "Invalid GitHub ref")
        owner, repo = parsed
        return await import_github(owner, repo, settings.github_token)
    if src == "huggingface":
        parsed = parse_hf_ref(body.ref)
        if not parsed:
            raise HTTPException(400, "Invalid Hugging Face ref")
        owner, model = parsed
        return await import_huggingface(owner, model)
    if src == "dockerhub":
        parsed = parse_hf_ref(body.ref)  # same owner/name form
        if not parsed:
            raise HTTPException(400, "Invalid Docker ref namespace/name")
        ns, name = parsed
        if "/" not in body.ref and ns == name:
            raise HTTPException(400, "Use namespace/name")
        return await import_docker(ns, name)
    raise HTTPException(400, f"Unknown source {src}")


@app.get("/v1/integrations/status")
async def integrations_status() -> dict:
    return oauth_status()


@app.post("/v1/oauth/github/start")
async def oauth_github_start(body: OAuthStartBody) -> dict:
    return github_authorize_url(body.redirect_uri, body.state)


class JobCreateBody(BaseModel):
    kind: str
    input: dict = Field(default_factory=dict)


class BatchCreateBody(BaseModel):
    items: list[JobCreateBody]


@app.get("/v1/jobs/stats")
async def job_stats() -> dict:
    return manager.stats()


@app.get("/v1/jobs")
async def list_jobs(limit: int = 50, kind: str | None = None) -> dict:
    jobs = manager.list_jobs(limit=limit, kind=kind)
    return {"items": [j.to_public() for j in jobs]}


@app.get("/v1/jobs/{job_id}")
async def get_job(job_id: str) -> dict:
    job = manager.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return job.to_public()


@app.post("/v1/jobs")
async def create_job(body: JobCreateBody) -> dict:
    try:
        job = await manager.enqueue(body.kind, body.input)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return job.to_public()


@app.post("/v1/jobs/batch")
async def create_batch(body: BatchCreateBody) -> dict:
    try:
        job = await manager.enqueue_batch(
            [{"kind": i.kind, "input": i.input} for i in body.items]
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return job.to_public()


@app.post("/v1/jobs/{job_id}/cancel")
async def cancel_job(job_id: str) -> dict:
    ok = await manager.cancel(job_id)
    if not ok:
        raise HTTPException(400, "cannot cancel")
    job = manager.get(job_id)
    return job.to_public() if job else {"ok": True}
