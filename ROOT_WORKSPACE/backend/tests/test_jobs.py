import time

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_job_stats():
    r = client.get("/v1/jobs/stats")
    assert r.status_code == 200
    body = r.json()
    assert "handlers" in body
    assert "health_live" in body["handlers"]


def test_enqueue_scan_job():
    r = client.post("/v1/jobs", json={"kind": "scan", "input": {"source": "eval(x)"}})
    assert r.status_code == 200
    job_id = r.json()["id"]
    final = None
    for _ in range(40):
        g = client.get(f"/v1/jobs/{job_id}")
        assert g.status_code == 200
        final = g.json()
        if final["state"] in ("succeeded", "failed"):
            break
        time.sleep(0.05)
    assert final is not None
    assert final["state"] == "succeeded"
    assert final["result"]["count"] >= 1


def test_list_jobs():
    r = client.get("/v1/jobs?limit=10")
    assert r.status_code == 200
    assert "items" in r.json()


def test_unknown_kind():
    r = client.post("/v1/jobs", json={"kind": "nope", "input": {}})
    assert r.status_code == 400
