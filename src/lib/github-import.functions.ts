import { createServerFn } from "@tanstack/react-start";
import type { ImportResult, ImportedRepo } from "./github-import";
import {
  parseDockerHubInput,
  parseGithubInput,
  parseHuggingFaceInput,
} from "./github-import";

type GhRepo = {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  private: boolean;
  topics?: string[];
};

type GhContent = { name: string; type: string };

type GhSearchItem = {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  private: boolean;
};

const GH_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Atlas-Forge-Console",
  "X-GitHub-Api-Version": "2022-11-28",
};

export const importGithubRepo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Expected object");
    const input = (data as { input?: string }).input;
    if (typeof input !== "string" || !input.trim()) {
      throw new Error("Repository URL or owner/name is required");
    }
    return { input: input.trim() };
  })
  .handler(async ({ data }): Promise<ImportResult> => {
    const parsed = parseGithubInput(data.input);
    if (!parsed) {
      return {
        ok: false,
        error: "Use owner/repo or a github.com URL (example: nodetool-ai/nodetool).",
      };
    }

    const repoRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers: GH_HEADERS },
    );
    if (repoRes.status === 404) {
      return { ok: false, error: "Repository not found or not public." };
    }
    if (repoRes.status === 403) {
      return {
        ok: false,
        error: "GitHub rate limit or access blocked for anonymous public API.",
      };
    }
    if (!repoRes.ok) {
      return { ok: false, error: `GitHub API error ${repoRes.status}` };
    }

    const body = (await repoRes.json()) as GhRepo;
    let topLevel: string[] = [];
    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/?ref=${encodeURIComponent(body.default_branch)}`,
        { headers: GH_HEADERS },
      );
      if (treeRes.ok) {
        const entries = (await treeRes.json()) as GhContent[];
        if (Array.isArray(entries)) {
          topLevel = entries.slice(0, 40).map((e) =>
            e.type === "dir" ? `${e.name}/` : e.name,
          );
        }
      }
    } catch {
      /* optional */
    }

    const repo: ImportedRepo = {
      id: `gh_${body.owner.login}_${body.name}`.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      owner: body.owner.login,
      name: body.name,
      fullName: body.full_name,
      description: body.description ?? "",
      url: body.html_url,
      defaultBranch: body.default_branch,
      language: body.language,
      stars: body.stargazers_count,
      private: body.private,
      topics: body.topics ?? [],
      topLevel,
      importedAt: new Date().toISOString(),
      source: "github-public",
    };

    return { ok: true, repo };
  });

export const searchGithubRepos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Expected object");
    const q = (data as { query?: string }).query;
    if (typeof q !== "string" || !q.trim()) throw new Error("query required");
    return { query: q.trim().slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(data.query)}&per_page=8&sort=stars`,
      { headers: GH_HEADERS },
    );
    if (!res.ok) {
      return { ok: false as const, error: `GitHub search error ${res.status}`, items: [] as ImportedRepo[] };
    }
    const json = (await res.json()) as { items?: GhSearchItem[] };
    const items: ImportedRepo[] = (json.items ?? []).map((it) => ({
      id: `gh_${it.owner.login}_${it.name}`.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      owner: it.owner.login,
      name: it.name,
      fullName: it.full_name,
      description: it.description ?? "",
      url: it.html_url,
      defaultBranch: "main",
      language: it.language,
      stars: it.stargazers_count,
      private: it.private,
      topics: [],
      topLevel: [],
      importedAt: new Date().toISOString(),
      source: "github-public" as const,
    }));
    return { ok: true as const, items, error: null };
  });

export const importHuggingFaceModel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Expected object");
    const input = (data as { input?: string }).input;
    if (typeof input !== "string" || !input.trim()) {
      throw new Error("model id or huggingface.co URL required");
    }
    return { input: input.trim() };
  })
  .handler(async ({ data }): Promise<ImportResult> => {
    const parsed = parseHuggingFaceInput(data.input);
    if (!parsed) {
      return {
        ok: false,
        error: "Use owner/model or a huggingface.co URL (example: openai/whisper-large-v3).",
      };
    }
    const id = `${parsed.owner}/${parsed.repo}`;
    const res = await fetch(`https://huggingface.co/api/models/${id}`, {
      headers: { Accept: "application/json", "User-Agent": "Atlas-Forge-Console" },
    });
    if (res.status === 404) {
      return { ok: false, error: "Model not found on Hugging Face." };
    }
    if (!res.ok) {
      return { ok: false, error: `Hugging Face API error ${res.status}` };
    }
    const body = (await res.json()) as {
      id?: string;
      modelId?: string;
      pipeline_tag?: string;
      library_name?: string;
      tags?: string[];
      downloads?: number;
      likes?: number;
      private?: boolean;
      sha?: string;
      siblings?: { rfilename: string }[];
    };
    const topLevel = (body.siblings ?? [])
      .slice(0, 30)
      .map((s) => s.rfilename);
    const repo: ImportedRepo = {
      id: `hf_${parsed.owner}_${parsed.repo}`.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      owner: parsed.owner,
      name: parsed.repo,
      fullName: body.id ?? body.modelId ?? id,
      description: [
        body.pipeline_tag ? `pipeline: ${body.pipeline_tag}` : null,
        body.library_name ? `library: ${body.library_name}` : null,
        typeof body.downloads === "number" ? `${body.downloads} downloads` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      url: `https://huggingface.co/${id}`,
      defaultBranch: body.sha?.slice(0, 8) ?? "main",
      language: body.library_name ?? body.pipeline_tag ?? "model",
      stars: body.likes ?? 0,
      private: Boolean(body.private),
      topics: (body.tags ?? []).slice(0, 12),
      topLevel,
      importedAt: new Date().toISOString(),
      source: "huggingface",
      extra: {
        downloads: body.downloads ?? null,
        pipeline: body.pipeline_tag ?? null,
      },
    };
    return { ok: true, repo };
  });

export const importDockerImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Expected object");
    const input = (data as { input?: string }).input;
    if (typeof input !== "string" || !input.trim()) {
      throw new Error("image name or hub.docker.com URL required");
    }
    return { input: input.trim() };
  })
  .handler(async ({ data }): Promise<ImportResult> => {
    const parsed = parseDockerHubInput(data.input);
    if (!parsed) {
      return {
        ok: false,
        error: "Use namespace/image, official image name, or hub.docker.com URL.",
      };
    }
    const path =
      parsed.owner === "library"
        ? `https://hub.docker.com/v2/repositories/library/${parsed.repo}/`
        : `https://hub.docker.com/v2/repositories/${parsed.owner}/${parsed.repo}/`;
    const res = await fetch(path, {
      headers: { Accept: "application/json", "User-Agent": "Atlas-Forge-Console" },
    });
    if (res.status === 404) {
      return { ok: false, error: "Image not found on Docker Hub." };
    }
    if (!res.ok) {
      return { ok: false, error: `Docker Hub API error ${res.status}` };
    }
    const body = (await res.json()) as {
      name?: string;
      namespace?: string;
      description?: string;
      star_count?: number;
      pull_count?: number;
      is_private?: boolean;
      last_updated?: string;
      full_description?: string;
    };
    const ns = body.namespace ?? parsed.owner;
    const name = body.name ?? parsed.repo;
    const full = ns === "library" ? name : `${ns}/${name}`;
    const repo: ImportedRepo = {
      id: `dh_${ns}_${name}`.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      owner: ns,
      name,
      fullName: full,
      description:
        (body.description || body.full_description || "").slice(0, 400) ||
        `Docker image ${full}`,
      url:
        ns === "library"
          ? `https://hub.docker.com/_/${name}`
          : `https://hub.docker.com/r/${ns}/${name}`,
      defaultBranch: body.last_updated?.slice(0, 10) ?? "latest",
      language: "container",
      stars: body.star_count ?? 0,
      private: Boolean(body.is_private),
      topics: ["docker"],
      topLevel: ["Dockerfile?", "tags"],
      importedAt: new Date().toISOString(),
      source: "dockerhub",
      extra: {
        pulls: body.pull_count ?? null,
      },
    };
    return { ok: true, repo };
  });
