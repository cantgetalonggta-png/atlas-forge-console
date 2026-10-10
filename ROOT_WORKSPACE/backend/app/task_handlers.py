"""Register concrete background job handlers."""

from __future__ import annotations

from typing import Any

from .health import run_probes
from .importers import import_docker, import_github, import_huggingface
from .ontology import ONTOLOGY_MAP, PLUGIN_TREE, PROJECTS, SKILL_TREE, TOOL_TREE
from .scan import scan_source
from .task_manager import Job, JobKind, TaskManager, manager


async def handle_health(job: Job, tm: TaskManager) -> Any:
    job.progress = 0.3
    job.message = "probing dependencies"
    result = await run_probes()
    job.progress = 0.9
    return result


async def handle_import_github(job: Job, tm: TaskManager) -> Any:
    owner = job.input.get("owner")
    repo = job.input.get("repo")
    if not owner or not repo:
        raise ValueError("owner and repo required")
    job.message = f"importing github {owner}/{repo}"
    job.progress = 0.2
    result = await import_github(str(owner), str(repo), job.input.get("token"))
    if not result.get("ok"):
        raise RuntimeError(result.get("error") or "import failed")
    job.progress = 0.9
    return result


async def handle_import_hf(job: Job, tm: TaskManager) -> Any:
    owner = job.input.get("owner")
    model = job.input.get("model") or job.input.get("repo")
    if not owner or not model:
        raise ValueError("owner and model required")
    job.message = f"importing hf {owner}/{model}"
    result = await import_huggingface(str(owner), str(model))
    if not result.get("ok"):
        raise RuntimeError(result.get("error") or "import failed")
    return result


async def handle_import_docker(job: Job, tm: TaskManager) -> Any:
    namespace = job.input.get("namespace") or job.input.get("owner")
    name = job.input.get("name") or job.input.get("repo")
    if not namespace or not name:
        raise ValueError("namespace and name required")
    job.message = f"importing docker {namespace}/{name}"
    result = await import_docker(str(namespace), str(name))
    if not result.get("ok"):
        raise RuntimeError(result.get("error") or "import failed")
    return result


async def handle_scan(job: Job, tm: TaskManager) -> Any:
    source = job.input.get("source") or ""
    if not source:
        raise ValueError("source required")
    job.message = "scanning source"
    job.progress = 0.4
    hits = scan_source(str(source))
    return {"hits": hits, "count": len(hits)}


async def handle_ontology(job: Job, tm: TaskManager) -> Any:
    job.message = "snapshot ontology"
    return {
        "skills": SKILL_TREE,
        "tools": TOOL_TREE,
        "plugins": PLUGIN_TREE,
        "map": ONTOLOGY_MAP,
        "projects": PROJECTS,
    }


async def handle_batch(job: Job, tm: TaskManager) -> Any:
    # Parent batch job: completion driven by children in TaskManager
    job.message = "waiting for children"
    job.progress = 0.1
    return {"status": "parent", "children": job.children}


def register_all(tm: TaskManager | None = None) -> TaskManager:
    tm = tm or manager
    tm.register(JobKind.health_live.value, handle_health)
    tm.register(JobKind.import_github.value, handle_import_github)
    tm.register(JobKind.import_huggingface.value, handle_import_hf)
    tm.register(JobKind.import_docker.value, handle_import_docker)
    tm.register(JobKind.scan.value, handle_scan)
    tm.register(JobKind.ontology_snapshot.value, handle_ontology)
    tm.register(JobKind.batch.value, handle_batch)
    return tm
