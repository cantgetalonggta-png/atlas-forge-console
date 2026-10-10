from __future__ import annotations

import time
from typing import Any

import httpx

from .allowlist import host_allowed

PROBES = [
    ("github_api", "GitHub API", "https://api.github.com/repos/nodetool-ai/nodetool"),
    ("hf_api", "Hugging Face API", "https://huggingface.co/api/models/openai/whisper-large-v3"),
    ("docker_api", "Docker Hub API", "https://hub.docker.com/v2/repositories/library/nginx/"),
    ("agent_network_docs", "Agent Network docs", "https://anet.sh"),
]


async def run_probes() -> dict[str, Any]:
    results = []
    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
        for pid, label, url in PROBES:
            t0 = time.time()
            if not host_allowed(url):
                results.append(
                    {
                        "id": pid,
                        "label": label,
                        "ok": False,
                        "status": None,
                        "detail": "host not allowlisted",
                        "ms": 0,
                    }
                )
                continue
            try:
                r = await client.get(url, headers={"User-Agent": "Atlas-Forge-API", "Accept": "*/*"})
                results.append(
                    {
                        "id": pid,
                        "label": label,
                        "ok": r.is_success,
                        "status": r.status_code,
                        "detail": "reachable" if r.is_success else f"HTTP {r.status_code}",
                        "ms": int((time.time() - t0) * 1000),
                    }
                )
            except Exception as e:  # noqa: BLE001
                results.append(
                    {
                        "id": pid,
                        "label": label,
                        "ok": False,
                        "status": None,
                        "detail": str(e),
                        "ms": int((time.time() - t0) * 1000),
                    }
                )
    return {"checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "probes": results}
