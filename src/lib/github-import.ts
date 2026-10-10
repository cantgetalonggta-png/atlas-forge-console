export type ImportSource = "github-public" | "huggingface" | "dockerhub";

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
  source: ImportSource;
  extra?: Record<string, string | number | boolean | null>;
};

export type ImportResult =
  | { ok: true; repo: ImportedRepo }
  | { ok: false; error: string };

const RE_URL =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;
const RE_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;
const RE_HF =
  /^(?:https?:\/\/)?(?:www\.)?huggingface\.co\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/i;
const RE_DOCKER =
  /^(?:https?:\/\/)?(?:www\.)?hub\.docker\.com\/r\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/i;

export function parseGithubInput(raw: string): { owner: string; repo: string } | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  const url = trimmed.match(RE_URL);
  if (url) return { owner: url[1], repo: url[2].replace(/\.git$/i, "") };
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2].replace(/\.git$/i, "") };
  return null;
}

export function parseHuggingFaceInput(
  raw: string,
): { owner: string; repo: string } | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  const url = trimmed.match(RE_HF);
  if (url) return { owner: url[1], repo: url[2] };
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2] };
  return null;
}

export function parseDockerHubInput(
  raw: string,
): { owner: string; repo: string } | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  const url = trimmed.match(RE_DOCKER);
  if (url) return { owner: url[1], repo: url[2] };
  // library/nginx or nginx (official)
  if (/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return { owner: "library", repo: trimmed };
  }
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2] };
  return null;
}

export function projectFromImport(repo: ImportedRepo) {
  const sourceLabel =
    repo.source === "huggingface"
      ? "Hugging Face"
      : repo.source === "dockerhub"
        ? "Docker Hub"
        : "GitHub import";
  return {
    id: repo.id,
    name: repo.fullName,
    kind: sourceLabel,
    stack: repo.language ?? "Unknown",
    size: `${repo.stars}★ · ${repo.defaultBranch}`,
    status: "indexed" as const,
    summary:
      repo.description ||
      `Imported ${sourceLabel} package ${repo.fullName}. Top-level: ${repo.topLevel.slice(0, 8).join(", ") || "n/a"}.`,
    gaps: repo.private
      ? ["Private packages need a connected OAuth token in production."]
      : ["Metadata import only — full tree scan is opt-in from Analyze."],
    url: repo.url,
    importedAt: repo.importedAt,
    source: repo.source,
  };
}
