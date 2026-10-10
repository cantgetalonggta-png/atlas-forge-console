import { createServerFn } from "@tanstack/react-start";

export type Probe = {
  id: string;
  label: string;
  ok: boolean;
  status: number | null;
  detail: string;
  ms: number;
};

async function probe(
  id: string,
  label: string,
  url: string,
  init?: RequestInit,
): Promise<Probe> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "Atlas-Forge-Console",
        Accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
      signal: AbortSignal.timeout(12000),
    });
    const ms = Date.now() - t0;
    const ok = res.ok;
    return {
      id,
      label,
      ok,
      status: res.status,
      detail: ok ? "reachable" : `HTTP ${res.status}`,
      ms,
    };
  } catch (e) {
    return {
      id,
      label,
      ok: false,
      status: null,
      detail: e instanceof Error ? e.message : String(e),
      ms: Date.now() - t0,
    };
  }
}

export const runLiveHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ checkedAt: string; probes: Probe[] }> => {
    const probes = await Promise.all([
      probe(
        "github_api",
        "GitHub API",
        "https://api.github.com/repos/nodetool-ai/nodetool",
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      ),
      probe(
        "hf_api",
        "Hugging Face API",
        "https://huggingface.co/api/models/openai/whisper-large-v3",
      ),
      probe(
        "docker_api",
        "Docker Hub API",
        "https://hub.docker.com/v2/repositories/library/nginx/",
      ),
      probe(
        "agent_network_docs",
        "Agent Network docs",
        "https://anet.sh",
        { method: "GET", headers: { Accept: "text/html" } },
      ),
      probe(
        "nodetool_releases",
        "NodeTool releases",
        "https://api.github.com/repos/nodetool-ai/nodetool/releases/latest",
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      ),
      probe(
        "natamux_repo",
        "Natamux repo",
        "https://api.github.com/repos/lenhatthanh20/natamux",
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      ),
    ]);
    return { checkedAt: new Date().toISOString(), probes };
  },
);
