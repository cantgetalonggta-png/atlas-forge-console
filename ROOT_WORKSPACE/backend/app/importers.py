from __future__ import annotations

import re
from typing import Any

import httpx

from .allowlist import host_allowed

RE_GH = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$",
    re.I,
)
RE_SLUG = re.compile(r"^([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)$")
RE_HF = re.compile(
    r"^(?:https?://)?(?:www\.)?huggingface\.co/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/?$",
    re.I,
)


async def import_github(owner: str, repo: str, token: str | None = None) -> dict[str, Any]:
    url = f"https://api.github.com/repos/{owner}/{repo}"
    if not host_allowed(url):
        return {"ok": False, "error": "host not allowlisted"}
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Atlas-Forge-API",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers=headers)
        if r.status_code != 200:
            return {"ok": False, "error": f"GitHub HTTP {r.status_code}", "body": r.text[:300]}
        data = r.json()
        tree_r = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/",
            headers=headers,
        )
        top = []
        if tree_r.status_code == 200 and isinstance(tree_r.json(), list):
            top = [x.get("name") for x in tree_r.json() if isinstance(x, dict)]
        return {
            "ok": True,
            "repo": {
                "id": f"gh:{data.get('full_name')}",
                "owner": owner,
                "name": repo,
                "fullName": data.get("full_name"),
                "description": data.get("description") or "",
                "url": data.get("html_url"),
                "defaultBranch": data.get("default_branch"),
                "language": data.get("language"),
                "stars": data.get("stargazers_count", 0),
                "private": data.get("private", False),
                "topics": data.get("topics") or [],
                "topLevel": top[:40],
                "source": "github-public",
            },
        }


async def import_huggingface(owner: str, model: str) -> dict[str, Any]:
    url = f"https://huggingface.co/api/models/{owner}/{model}"
    if not host_allowed(url):
        return {"ok": False, "error": "host not allowlisted"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers={"User-Agent": "Atlas-Forge-API"})
        if r.status_code != 200:
            return {"ok": False, "error": f"HF HTTP {r.status_code}"}
        data = r.json()
        return {
            "ok": True,
            "repo": {
                "id": f"hf:{owner}/{model}",
                "owner": owner,
                "name": model,
                "fullName": f"{owner}/{model}",
                "description": (data.get("pipeline_tag") or "") + " model",
                "url": f"https://huggingface.co/{owner}/{model}",
                "defaultBranch": "main",
                "language": "ml",
                "stars": data.get("likes", 0),
                "private": False,
                "topics": data.get("tags") or [],
                "topLevel": [],
                "source": "huggingface",
            },
        }


async def import_docker(namespace: str, name: str) -> dict[str, Any]:
    url = f"https://hub.docker.com/v2/repositories/{namespace}/{name}/"
    if not host_allowed(url):
        return {"ok": False, "error": "host not allowlisted"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers={"User-Agent": "Atlas-Forge-API"})
        if r.status_code != 200:
            return {"ok": False, "error": f"Docker Hub HTTP {r.status_code}"}
        data = r.json()
        return {
            "ok": True,
            "repo": {
                "id": f"dh:{namespace}/{name}",
                "owner": namespace,
                "name": name,
                "fullName": f"{namespace}/{name}",
                "description": data.get("description") or "",
                "url": f"https://hub.docker.com/r/{namespace}/{name}",
                "defaultBranch": "latest",
                "language": "docker",
                "stars": data.get("star_count", 0),
                "private": False,
                "topics": [],
                "topLevel": [],
                "source": "dockerhub",
                "extra": {"pulls": data.get("pull_count")},
            },
        }


def parse_github_ref(ref: str) -> tuple[str, str] | None:
    ref = ref.strip()
    m = RE_GH.match(ref) or RE_SLUG.match(ref)
    if not m:
        return None
    return m.group(1), m.group(2).removesuffix(".git")


def parse_hf_ref(ref: str) -> tuple[str, str] | None:
    ref = ref.strip()
    m = RE_HF.match(ref) or RE_SLUG.match(ref)
    if not m:
        return None
    return m.group(1), m.group(2)
