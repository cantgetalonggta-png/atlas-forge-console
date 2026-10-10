import { createServerFn } from "@tanstack/react-start";
import type { ImportResult, ImportedRepo } from "./github-import";
import { parseGithubInput } from "./github-import";

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

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Atlas-Forge-Console",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const repoRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers },
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
        { headers },
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
      id: `gh_${body.owner.login}_${body.name}`.toLowerCase(),
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
