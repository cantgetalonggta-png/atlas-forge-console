import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  ExternalLink,
  Github,
  Loader2,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useAtlas } from "@/lib/atlas-store";
import {
  importDockerImage,
  importGithubRepo,
  importHuggingFaceModel,
  searchGithubRepos,
} from "@/lib/github-import.functions";
import { projectFromImport, type ImportedRepo } from "@/lib/github-import";

export const Route = createFileRoute("/_app/import")({
  component: ImportPage,
});

type Tab = "github" | "huggingface" | "docker";

const GH_EXAMPLES = [
  "nodetool-ai/nodetool",
  "bytedance/deer-flow",
  "sleep2agi/agent-network",
  "lenhatthanh20/natamux",
];
const HF_EXAMPLES = [
  "openai/whisper-large-v3",
  "black-forest-labs/FLUX.1-dev",
  "stabilityai/stable-diffusion-xl-base-1.0",
];
const DH_EXAMPLES = ["library/nginx", "node", "postgres", "python"];

function ImportPage() {
  const [tab, setTab] = useState<Tab>("github");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<ImportedRepo[]>([]);
  const imported = useAtlas((s) => s.importedRepos);
  const addImported = useAtlas((s) => s.addImported);
  const removeImported = useAtlas((s) => s.removeImported);

  async function runImport(value: string) {
    setBusy(true);
    setError(null);
    setLastOk(null);
    try {
      const result =
        tab === "github"
          ? await importGithubRepo({ data: { input: value } })
          : tab === "huggingface"
            ? await importHuggingFaceModel({ data: { input: value } })
            : await importDockerImage({ data: { input: value } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      addImported(result.repo);
      setLastOk(result.repo.fullName);
      setInput("");
      setSearchHits([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    await runImport(input);
  }

  async function onSearch() {
    if (tab !== "github" || !input.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await searchGithubRepos({ data: { query: input } });
      if (!res.ok) {
        setError(res.error ?? "Search failed");
        setSearchHits([]);
        return;
      }
      setSearchHits(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const examples =
    tab === "github" ? GH_EXAMPLES : tab === "huggingface" ? HF_EXAMPLES : DH_EXAMPLES;
  const placeholder =
    tab === "github"
      ? "owner/repo or https://github.com/owner/repo"
      : tab === "huggingface"
        ? "owner/model or https://huggingface.co/owner/model"
        : "namespace/image, official name, or hub.docker.com URL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Live import</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pull public GitHub repos, Hugging Face models, and Docker Hub images into the
          vault project list. Metadata only — no secrets.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["github", "GitHub", Github],
            ["huggingface", "Hugging Face", Sparkles],
            ["docker", "Docker Hub", Box],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setError(null);
              setSearchHits([]);
            }}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm ${
              tab === id
                ? "border-primary bg-surface-2 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onImport}
        className="space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="block text-sm font-medium" htmlFor="import-input">
          {tab === "github"
            ? "Repository"
            : tab === "huggingface"
              ? "Model"
              : "Image"}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="import-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="min-h-11 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary"
            autoComplete="off"
          />
          {tab === "github" ? (
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={onSearch}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          ) : null}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-bg disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            Import
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted hover:text-fg"
              onClick={() => setInput(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {lastOk ? (
          <p className="text-sm text-accent">
            Imported {lastOk}. View under{" "}
            <Link to="/projects" className="underline">
              Projects
            </Link>
            .
          </p>
        ) : null}
      </form>

      {searchHits.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Search results</h2>
          <ul className="space-y-2">
            {searchHits.map((hit) => (
              <li
                key={hit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{hit.fullName}</p>
                  <p className="text-xs text-muted">
                    {hit.language ?? "n/a"} · {hit.stars}★ · {(hit.description || "").slice(0, 80)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-bg"
                  onClick={() => runImport(hit.fullName)}
                >
                  Import
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Imported ({imported.length})</h2>
        {imported.length === 0 ? (
          <p className="text-sm text-muted">No live imports yet.</p>
        ) : (
          <ul className="space-y-3">
            {imported.map((repo) => {
              const card = projectFromImport(repo);
              return (
                <li
                  key={repo.id}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{card.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {card.kind} · {card.stack} · {card.size} ·{" "}
                        {repo.topics.slice(0, 4).join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-3 text-xs text-muted hover:text-fg"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                      <button
                        type="button"
                        aria-label={`Remove ${repo.fullName}`}
                        className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-3 text-xs text-muted hover:text-fg"
                        onClick={() => removeImported(repo.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{card.summary}</p>
                  {repo.topLevel.length > 0 ? (
                    <p className="mt-2 font-mono text-xs text-muted">
                      {repo.topLevel.slice(0, 12).join(" · ")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
