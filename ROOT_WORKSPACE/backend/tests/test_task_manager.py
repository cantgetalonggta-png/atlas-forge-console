import asyncio

import pytest

from app.task_manager import TaskManager


@pytest.mark.asyncio
async def test_priority_and_success():
    tm = TaskManager(max_concurrent=2)

    async def quick(job, manager):
        manager.update_progress(job.id, 0.5, "mid")
        await asyncio.sleep(0.05)
        return {"ok": True, "kind": job.kind}

    tm.register("quick", quick)
    low = await tm.enqueue("quick", {}, priority="low")
    high = await tm.enqueue("quick", {}, priority="high")
    # wait
    for _ in range(50):
        if high.state == "succeeded" and low.state == "succeeded":
            break
        await asyncio.sleep(0.05)
    assert high.state == "succeeded"
    assert low.state == "succeeded"
    assert high.result["ok"] is True


@pytest.mark.asyncio
async def test_batch_children():
    tm = TaskManager(max_concurrent=4)

    async def unit(job, manager):
        return 1

    async def batch(job, manager):
        # wait for children
        for _ in range(100):
            kids = [manager.get(c) for c in job.children]
            if kids and all(k and k.state not in ("queued", "running") for k in kids):
                return {"n": len(kids)}
            await asyncio.sleep(0.02)
        return {"n": 0}

    tm.register("unit", unit)
    tm.register("batch", batch)
    parent = await tm.enqueue_batch(
        [{"kind": "unit", "input": {}}, {"kind": "unit", "input": {}}]
    )
    for _ in range(80):
        p = tm.get(parent.id)
        if p and p.state in ("succeeded", "failed"):
            break
        await asyncio.sleep(0.05)
    p = tm.get(parent.id)
    assert p is not None
    assert p.state == "succeeded"
    assert len(p.children) == 2
