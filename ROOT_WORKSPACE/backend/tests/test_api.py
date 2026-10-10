from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_ontology():
    r = client.get("/v1/ontology")
    assert r.status_code == 200
    data = r.json()
    assert "skills" in data and len(data["skills"]) >= 4
    assert "tools" in data and len(data["tools"]) >= 4
    assert "plugins" in data


def test_scan_endpoint():
    r = client.post("/v1/scan", json={"source": "eval(user)\nos.system(x)"})
    assert r.status_code == 200
    assert r.json()["count"] >= 1


def test_integrations_status():
    r = client.get("/v1/integrations/status")
    assert r.status_code == 200
    assert "github" in r.json()
