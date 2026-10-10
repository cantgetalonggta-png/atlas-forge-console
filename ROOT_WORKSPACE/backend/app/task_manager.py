"""In-process background job manager for Atlas Forge API.

Best-manager design:
- Single process registry (dict + asyncio.Lock)
- Job states: queued → running → succeeded | failed | cancelled
- Workers are asyncio tasks; no external broker required for single-node
- Optional fan-out for health/import/scan workloads
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Awaitable, Callable, Optional


class JobState(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"


class JobKind(str, Enum):
    health_live = "health_live"
    import_github = "import_github"
    import_huggingface = "import_huggingface"
    import_docker = "import_docker"
    scan = "scan"
    ontology_snapshot = "ontology_snapshot"
    batch = "batch"


@dataclass
class Job:
    id: str
    kind: str
    state: str
    created_at: float
    started_at: float | None = None
    finished_at: float | None = None
    progress: float = 0.0
    message: str = ""
    input: dict[str, Any] = field(default_factory=dict)
    result: Any = None
    error: str | None = None
    parent_id: str | None = None
    children: list[str] = field(default_factory=list)

    def to_public(self) -> dict[str, Any]:
        d = asdict(self)
        d["duration_ms"] = None
        if self.started_at and self.finished_at:
            d["duration_ms"] = int((self.finished_at - self.started_at) * 1000)
        elif self.started_at:
            d["duration_ms"] = int((time.time() - self.started_at) * 1000)
        return d


Handler = Callable[[Job, "TaskManager"], Awaitable[Any]]


class TaskManager:
    def __init__(self, max_concurrent: int = 8, max_history: int = 200) -> None:
        self._jobs: dict[str, Job] = {}
        self._handlers: dict[str, Handler] = {}
        self._lock = asyncio.Lock()
        self._sem = asyncio.Semaphore(max_concurrent)
        self._max_history = max_history
        self._tasks: dict[str, asyncio.Task[Any]] = {}

    def register(self, kind: str, handler: Handler) -> None:
        self._handlers[kind] = handler

    async def enqueue(
        self,
        kind: str,
        input_data: dict[str, Any] | None = None,
        *,
        parent_id: str | None = None,
        message: str = "queued",
    ) -> Job:
        if kind not in self._handlers:
            raise ValueError(f"No handler registered for kind={kind}")
        job = Job(
            id=str(uuid.uuid4()),
            kind=kind,
            state=JobState.queued.value,
            created_at=time.time(),
            input=input_data or {},
            message=message,
            parent_id=parent_id,
        )
        async with self._lock:
            self._jobs[job.id] = job
            if parent_id and parent_id in self._jobs:
                self._jobs[parent_id].children.append(job.id)
            self._trim_locked()
        task = asyncio.create_task(self._run(job.id), name=f"job-{job.kind}-{job.id[:8]}")
        self._tasks[job.id] = task
        return job

    async def enqueue_batch(self, items: list[dict[str, Any]]) -> Job:
        """items: [{kind, input}, ...] — parent batch job tracks children."""
        parent = await self.enqueue(
            JobKind.batch.value,
            {"count": len(items)},
            message=f"batch of {len(items)}",
        )
        for item in items:
            kind = item["kind"]
            data = item.get("input") or {}
            await self.enqueue(kind, data, parent_id=parent.id)
        return parent

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def list_jobs(self, *, limit: int = 50, kind: str | None = None) -> list[Job]:
        jobs = list(self._jobs.values())
        if kind:
            jobs = [j for j in jobs if j.kind == kind]
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs[:limit]

    def stats(self) -> dict[str, Any]:
        by_state: dict[str, int] = {}
        by_kind: dict[str, int] = {}
        for j in self._jobs.values():
            by_state[j.state] = by_state.get(j.state, 0) + 1
            by_kind[j.kind] = by_kind.get(j.kind, 0) + 1
        running = sum(1 for t in self._tasks.values() if not t.done())
        return {
            "total": len(self._jobs),
            "running_tasks": running,
            "by_state": by_state,
            "by_kind": by_kind,
            "handlers": sorted(self._handlers.keys()),
            "max_concurrent": self._sem._value + running,  # type: ignore[attr-defined]
        }

    async def cancel(self, job_id: str) -> bool:
        task = self._tasks.get(job_id)
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job.state in (JobState.succeeded.value, JobState.failed.value, JobState.cancelled.value):
            return False
        if task and not task.done():
            task.cancel()
        job.state = JobState.cancelled.value
        job.finished_at = time.time()
        job.message = "cancelled"
        return True

    async def _run(self, job_id: str) -> None:
        job = self._jobs[job_id]
        handler = self._handlers[job.kind]
        async with self._sem:
            job.state = JobState.running.value
            job.started_at = time.time()
            job.message = "running"
            job.progress = 0.05
            try:
                result = await handler(job, self)
                if job.state == JobState.cancelled.value:
                    return
                job.result = result
                job.progress = 1.0
                job.state = JobState.succeeded.value
                job.message = "succeeded"
            except asyncio.CancelledError:
                job.state = JobState.cancelled.value
                job.message = "cancelled"
                job.error = "cancelled"
            except Exception as e:  # noqa: BLE001
                job.state = JobState.failed.value
                job.message = "failed"
                job.error = str(e)
            finally:
                job.finished_at = time.time()
                self._tasks.pop(job_id, None)
                await self._maybe_finish_parent(job)

    async def _maybe_finish_parent(self, job: Job) -> None:
        if not job.parent_id:
            return
        parent = self._jobs.get(job.parent_id)
        if not parent or parent.kind != JobKind.batch.value:
            return
        children = [self._jobs[c] for c in parent.children if c in self._jobs]
        if not children:
            return
        if any(c.state in (JobState.queued.value, JobState.running.value) for c in children):
            done = sum(1 for c in children if c.state not in (JobState.queued.value, JobState.running.value))
            parent.progress = done / max(len(children), 1)
            parent.message = f"{done}/{len(children)} children finished"
            return
        failed = [c for c in children if c.state == JobState.failed.value]
        parent.progress = 1.0
        parent.finished_at = time.time()
        parent.result = {
            "children": [c.to_public() for c in children],
            "failed": len(failed),
            "succeeded": sum(1 for c in children if c.state == JobState.succeeded.value),
        }
        if failed:
            parent.state = JobState.failed.value
            parent.message = f"batch failed ({len(failed)} child errors)"
            parent.error = failed[0].error
        else:
            parent.state = JobState.succeeded.value
            parent.message = "batch succeeded"

    def _trim_locked(self) -> None:
        if len(self._jobs) <= self._max_history:
            return
        finished = [
            j
            for j in self._jobs.values()
            if j.state in (JobState.succeeded.value, JobState.failed.value, JobState.cancelled.value)
        ]
        finished.sort(key=lambda j: j.created_at)
        while len(self._jobs) > self._max_history and finished:
            old = finished.pop(0)
            self._jobs.pop(old.id, None)


# Global singleton for process
manager = TaskManager()
