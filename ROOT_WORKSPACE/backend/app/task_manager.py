"""In-process background job manager for Atlas Forge API (best-manager).

Design:
- asyncio workers + Semaphore concurrency
- Priority queue (high < normal < low)
- Optional per-job max_attempts with exponential backoff
- Batch parent tracks children completion
- Progress/message mutators for handlers
- No external broker required (single-node); swap for Redis later
"""

from __future__ import annotations

import asyncio
import heapq
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable


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


PRIORITY_RANK = {"high": 0, "normal": 1, "low": 2}


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
    priority: str = "normal"
    attempt: int = 0
    max_attempts: int = 1

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
        self._max_concurrent = max_concurrent
        self._max_history = max_history
        self._tasks: dict[str, asyncio.Task[Any]] = {}
        self._heap: list[tuple[int, float, str]] = []  # rank, created, id
        self._seq = 0
        self._worker: asyncio.Task[Any] | None = None
        self._wake = asyncio.Event()

    def register(self, kind: str, handler: Handler) -> None:
        self._handlers[kind] = handler

    def set_max_concurrent(self, n: int) -> None:
        n = max(1, min(32, int(n)))
        # recreate semaphore relative to free slots is hard; store desired for stats
        self._max_concurrent = n
        self._sem = asyncio.Semaphore(n)

    async def enqueue(
        self,
        kind: str,
        input_data: dict[str, Any] | None = None,
        *,
        parent_id: str | None = None,
        message: str = "queued",
        priority: str = "normal",
        max_attempts: int = 1,
    ) -> Job:
        if kind not in self._handlers:
            raise ValueError(f"No handler registered for kind={kind}")
        if priority not in PRIORITY_RANK:
            priority = "normal"
        job = Job(
            id=str(uuid.uuid4()),
            kind=kind,
            state=JobState.queued.value,
            created_at=time.time(),
            input=input_data or {},
            message=message,
            parent_id=parent_id,
            priority=priority,
            max_attempts=max(1, max_attempts),
        )
        async with self._lock:
            self._jobs[job.id] = job
            if parent_id and parent_id in self._jobs:
                self._jobs[parent_id].children.append(job.id)
            heapq.heappush(
                self._heap,
                (PRIORITY_RANK[priority], job.created_at, job.id),
            )
            self._trim_locked()
            self._ensure_dispatcher()
        self._wake.set()
        return job

    async def enqueue_batch(self, items: list[dict[str, Any]]) -> Job:
        parent = await self.enqueue(
            JobKind.batch.value,
            {"count": len(items)},
            message=f"batch of {len(items)}",
            priority="high",
        )
        for item in items:
            await self.enqueue(
                item["kind"],
                item.get("input") or {},
                parent_id=parent.id,
                priority=item.get("priority") or "normal",
                max_attempts=int(item.get("max_attempts") or 1),
            )
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
            "queued_heap": len(self._heap),
            "by_state": by_state,
            "by_kind": by_kind,
            "handlers": sorted(self._handlers.keys()),
            "max_concurrent": self._max_concurrent,
        }

    def update_progress(self, job_id: str, progress: float, message: str | None = None) -> None:
        job = self._jobs.get(job_id)
        if not job:
            return
        job.progress = max(0.0, min(1.0, float(progress)))
        if message is not None:
            job.message = message

    async def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job.state in (
            JobState.succeeded.value,
            JobState.failed.value,
            JobState.cancelled.value,
        ):
            return False
        task = self._tasks.get(job_id)
        if task and not task.done():
            task.cancel()
        job.state = JobState.cancelled.value
        job.finished_at = time.time()
        job.message = "cancelled"
        return True

    def _ensure_dispatcher(self) -> None:
        if self._worker is None or self._worker.done():
            self._worker = asyncio.create_task(self._dispatch_loop(), name="atlas-job-dispatcher")

    async def _dispatch_loop(self) -> None:
        while True:
            try:
                job_id = await self._pop_next()
                if job_id is None:
                    self._wake.clear()
                    try:
                        await asyncio.wait_for(self._wake.wait(), timeout=1.0)
                    except asyncio.TimeoutError:
                        pass
                    continue
                task = asyncio.create_task(
                    self._run(job_id), name=f"job-{job_id[:8]}"
                )
                self._tasks[job_id] = task
            except asyncio.CancelledError:
                raise
            except Exception:  # noqa: BLE001
                await asyncio.sleep(0.05)

    async def _pop_next(self) -> str | None:
        async with self._lock:
            while self._heap:
                _rank, _created, job_id = heapq.heappop(self._heap)
                job = self._jobs.get(job_id)
                if not job or job.state != JobState.queued.value:
                    continue
                return job_id
        return None

    async def _run(self, job_id: str) -> None:
        job = self._jobs[job_id]
        handler = self._handlers[job.kind]
        async with self._sem:
            while True:
                if job.state == JobState.cancelled.value:
                    return
                job.attempt += 1
                job.state = JobState.running.value
                job.started_at = time.time()
                job.message = f"running (attempt {job.attempt}/{job.max_attempts})"
                job.progress = 0.05
                try:
                    result = await handler(job, self)
                    if job.state == JobState.cancelled.value:
                        return
                    job.result = result
                    job.progress = 1.0
                    job.state = JobState.succeeded.value
                    job.message = "succeeded"
                    break
                except asyncio.CancelledError:
                    job.state = JobState.cancelled.value
                    job.message = "cancelled"
                    job.error = "cancelled"
                    break
                except Exception as e:  # noqa: BLE001
                    job.error = str(e)
                    if job.attempt < job.max_attempts:
                        backoff = min(8.0, 0.4 * (2 ** (job.attempt - 1)))
                        job.state = JobState.queued.value
                        job.message = f"retry in {backoff:.1f}s · {e}"
                        job.progress = 0.0
                        await asyncio.sleep(backoff)
                        continue
                    job.state = JobState.failed.value
                    job.message = "failed"
                    break
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
        if any(
            c.state in (JobState.queued.value, JobState.running.value) for c in children
        ):
            done = sum(
                1
                for c in children
                if c.state
                not in (JobState.queued.value, JobState.running.value)
            )
            parent.progress = done / max(len(children), 1)
            parent.message = f"{done}/{len(children)} children finished"
            parent.state = JobState.running.value
            if parent.started_at is None:
                parent.started_at = time.time()
            return
        failed = [c for c in children if c.state == JobState.failed.value]
        parent.progress = 1.0
        parent.finished_at = time.time()
        parent.result = {
            "children": [c.to_public() for c in children],
            "failed": len(failed),
            "succeeded": sum(1 for c in children if c.state == JobState.succeeded.value),
            "cancelled": sum(1 for c in children if c.state == JobState.cancelled.value),
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
            if j.state
            in (
                JobState.succeeded.value,
                JobState.failed.value,
                JobState.cancelled.value,
            )
        ]
        finished.sort(key=lambda j: j.created_at)
        while len(self._jobs) > self._max_history and finished:
            old = finished.pop(0)
            self._jobs.pop(old.id, None)


manager = TaskManager()
