import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Github, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "@/lib/atlas-store";
import { importGithubRepo } from "@/lib/github-import.functions";
import { projectFromImport } from "@/lib/github-import";

export const Route = createFileRoute("/_app/import")({
  component: ImportPage,
});

const EXAMPLES = [
  "nodetool-ai/nodetool",
  "bytedance/deer-flow",
  "cantgetalonggta-png/deer-flow-workspace",
];

function ImportPage() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);
  const imported = useAtlas((s) => s.importedRepos);
  const addImported = useAtlas((s) => s.addImported);
  const removeImported = useAtlas((s) => s.removeImported);

  async function onImport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setLastOk(null);
    try {
      const result = await importGithubRepo({ data: { input } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      addImported(result.repo);
      setLastOk(result.repo.fullName);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">GitHub import</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pull a public repository into the vault project list. Metadata only — no secrets,
          no private account folders.
        </p>
      </div>

      <form
        onSubmit={onImport}
        className="rounded-xl border border-border bg-surface p-4 space-y-3"
      >
        <label className="block text-sm font-medium" htmlFor="gh-input">
          Repository
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="gh-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="owner/repo or https://github.com/owner/repo"
            className="min-h-11 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary"
            autoComplete="off"
          />
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
          {EXAMPLES.map((ex) => (
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
                        {card.stack} · {card.size} · {repo.topics.slice(0, 4).join(", ")}
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
