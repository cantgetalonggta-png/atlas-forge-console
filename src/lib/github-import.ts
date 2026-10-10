export type ImportedRepo = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  language: string | null;
  stars: number;
  private: boolean;
  topics: string[];
  topLevel: string[];
  importedAt: string;
  source: "github-public";
};

export type ImportResult =
  | { ok: true; repo: ImportedRepo }
  | { ok: false; error: string };

const RE_URL =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;
const RE_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

export function parseGithubInput(raw: string): { owner: string; repo: string } | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  const url = trimmed.match(RE_URL);
  if (url) return { owner: url[1], repo: url[2].replace(/\.git$/i, "") };
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2].replace(/\.git$/i, "") };
  return null;
}

export function projectFromImport(repo: ImportedRepo) {
  return {
    id: `gh_${repo.owner}_${repo.name}`.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    name: repo.fullName,
    kind: "GitHub import",
    stack: repo.language ?? "Unknown",
    size: `${repo.stars}★ · ${repo.defaultBranch}`,
    status: "indexed" as const,
    summary:
      repo.description ||
      `Imported public repository ${repo.fullName}. Top-level: ${repo.topLevel.slice(0, 8).join(", ") || "n/a"}.`,
    gaps: repo.private
      ? ["Private repos need a connected GitHub token in production."]
      : ["Metadata import only — full tree scan is opt-in from Analyze."],
    url: repo.url,
    importedAt: repo.importedAt,
  };
}
