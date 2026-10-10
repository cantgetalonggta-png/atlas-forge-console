"""Unified ontology distilled from Drive vault + deer-flow."""

from __future__ import annotations

from typing import Any

SKILL_TREE: list[dict[str, Any]] = [
    {
        "id": "sec-static",
        "name": "Static security scan",
        "domain": "security",
        "source": "DeepAudit / Atlas scan",
        "children": ["sql-injection", "command-injection", "secret-leak", "eval-exec"],
    },
    {
        "id": "agent-orch",
        "name": "Agent orchestration",
        "domain": "agents",
        "source": "Agent Network / Natamux / deer-flow",
        "children": ["hub-sse", "mcp-dispatch", "task-stages", "worktrees"],
    },
    {
        "id": "creative-dag",
        "name": "Creative DAG workflows",
        "domain": "creative",
        "source": "NodeTool",
        "children": ["storyboard", "timeline", "sketch", "3d-game"],
    },
    {
        "id": "deerflow-ops",
        "name": "DeerFlow operations",
        "domain": "platform",
        "source": "deer-flow-main",
        "children": [
            "blocking-io-guard",
            "deerflow-maintainer-orchestrator",
            "engineer-system-change",
            "smoke-test",
        ],
    },
    {
        "id": "research",
        "name": "Research skills",
        "domain": "research",
        "source": "ROOT_WORKSPACE cycle1",
        "children": [
            "academic-paper-review",
            "systematic-literature-review",
            "video-generation",
            "skill-creator",
            "surprise-me",
        ],
    },
]

TOOL_TREE: list[dict[str, Any]] = [
    {"id": "github-import", "name": "GitHub public import", "kind": "api", "endpoint": "/v1/import/github"},
    {"id": "hf-import", "name": "Hugging Face model import", "kind": "api", "endpoint": "/v1/import/huggingface"},
    {"id": "docker-import", "name": "Docker Hub import", "kind": "api", "endpoint": "/v1/import/docker"},
    {"id": "scan-snippet", "name": "Snippet security scan", "kind": "analyzer", "endpoint": "/v1/scan"},
    {"id": "health-probes", "name": "Live dependency probes", "kind": "ops", "endpoint": "/v1/health/live"},
    {"id": "ontology-export", "name": "Ontology export", "kind": "graph", "endpoint": "/v1/ontology"},
]

PLUGIN_TREE: list[dict[str, Any]] = [
    {"id": "oauth-github", "name": "GitHub OAuth2", "status": "configured-via-env"},
    {"id": "vercel-deploy", "name": "Vercel deployment hooks", "status": "connected"},
    {"id": "hf-models", "name": "Hugging Face models", "status": "public-api"},
    {"id": "allowlist", "name": "Outbound host allowlist", "status": "enforced"},
    {"id": "mcp-bridge", "name": "MCP bridge (Agent Network / NodeTool)", "status": "desktop-install"},
]

ONTOLOGY_MAP: dict[str, Any] = {
    "nodes": [
        {"id": "operator", "type": "actor"},
        {"id": "atlas-forge", "type": "console"},
        {"id": "deepaudit", "type": "project"},
        {"id": "agent-network", "type": "project"},
        {"id": "natamux", "type": "project"},
        {"id": "nodetool", "type": "project"},
        {"id": "deer-flow", "type": "project"},
        {"id": "github-api", "type": "service"},
        {"id": "hf-api", "type": "service"},
        {"id": "docker-api", "type": "service"},
        {"id": "vercel", "type": "service"},
        {"id": "findings", "type": "artifact"},
    ],
    "edges": [
        {"from": "operator", "rel": "opens", "to": "atlas-forge"},
        {"from": "atlas-forge", "rel": "indexes", "to": "deepaudit"},
        {"from": "atlas-forge", "rel": "indexes", "to": "agent-network"},
        {"from": "atlas-forge", "rel": "indexes", "to": "natamux"},
        {"from": "atlas-forge", "rel": "indexes", "to": "nodetool"},
        {"from": "atlas-forge", "rel": "indexes", "to": "deer-flow"},
        {"from": "atlas-forge", "rel": "calls", "to": "github-api"},
        {"from": "atlas-forge", "rel": "calls", "to": "hf-api"},
        {"from": "atlas-forge", "rel": "calls", "to": "docker-api"},
        {"from": "atlas-forge", "rel": "deploys", "to": "vercel"},
        {"from": "deepaudit", "rel": "emits", "to": "findings"},
        {"from": "atlas-forge", "rel": "emits", "to": "findings"},
    ],
}

PROJECTS: list[dict[str, Any]] = [
    {
        "id": "deer-flow",
        "name": "DeerFlow",
        "kind": "Agent platform monorepo",
        "stack": "Python backend · frontend · Docker · agent skills",
        "status": "indexed",
        "summary": "Ingested from deer-flow-main.zip: 1980 backend .py files, agent skills (blocking-io-guard, maintainer-orchestrator, engineer-system-change, smoke-test), frontend package, CI workflows.",
        "gaps": [
            "Full monorepo install runs outside Atlas web console.",
            "Channel secrets (WeChat/WeCom) stay in operator env.",
        ],
    },
    {
        "id": "deepaudit",
        "name": "DeepAudit 3.x",
        "kind": "Security audit platform",
        "stack": "FastAPI · React · Docker",
        "status": "indexed",
        "summary": "Vault-indexed multi-agent audit platform.",
        "gaps": ["Container stack on operator host."],
    },
    {
        "id": "agent-network",
        "name": "Agent Network",
        "kind": "Multi-machine agent hub",
        "stack": "TypeScript · Bun · MCP · desktop",
        "status": "indexed",
        "summary": "Desktop binaries not bundled in web console.",
        "gaps": ["Install via Setup page / anet.sh"],
    },
    {
        "id": "nodetool",
        "name": "NodeTool",
        "kind": "Creative workspace",
        "stack": "TS monorepo · Electron · Docker · MCP",
        "status": "indexed",
        "summary": "Drive tree cataloged (1.6 GB zip metadata).",
        "gaps": ["Studio desktop install separate."],
    },
    {
        "id": "natamux",
        "name": "Natamux",
        "kind": "Agent ADE",
        "stack": "core · daemon · web · cli",
        "status": "indexed",
        "summary": "Parallel coding agents with worktrees.",
        "gaps": ["Local daemon required."],
    },
]
