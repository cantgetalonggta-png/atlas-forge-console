import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { binaryInstalls, hostTooling } from "@/data/setup-guide";
import { runLiveHealth, type Probe } from "@/lib/health.functions";

export const Route = createFileRoute("/_app/setup")({
  component: SetupPage,
});

function SetupPage() {
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onHealth() {
    setBusy(true);
    setError(null);
    try {
      const res = await runLiveHealth();
      setProbes(res.probes);
      setCheckedAt(res.checkedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Setup & desktop binaries</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Atlas Forge is the{" "}
          <strong className="text-fg">web control plane</strong>: vault ontology, live
          GitHub / Hugging Face / Docker import, connectors, and instant snippet analysis.
          Native agent runtimes and desktop studios are{" "}
          <strong className="text-fg">not shipped inside this browser app</strong> —
          you install them on your machines. This page is the exact wiring map.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Live dependency probes</h2>
            <p className="text-xs text-muted">
              Real HTTP checks from the server to public APIs (not mocked).
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onHealth}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-bg disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Run live health
          </button>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {checkedAt ? (
          <p className="font-mono text-xs text-muted">Checked {checkedAt}</p>
        ) : null}
        {probes.length > 0 ? (
          <ul className="divide-y divide-border">
            {probes.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-2 text-sm">
                {p.ok ? (
                  <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={16} />
                ) : (
                  <XCircle className="mt-0.5 shrink-0 text-red-400" size={16} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{p.label}</span>
                    <span className="font-mono text-xs text-muted">
                      {p.status ?? "—"} · {p.ms}ms
                    </span>
                  </div>
                  <p className="text-xs text-muted">{p.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Run health to verify GitHub, HF, Docker, and product endpoints.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Host tooling (install on your machine)</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {hostTooling.map((t) => (
            <li key={t.name} className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-medium">{t.name}</h3>
              <p className="mt-1 text-xs text-muted">Min: {t.min}</p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-fg">{t.install}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Desktop / self-hosted product installs</h2>
        <p className="text-sm text-muted">
          Why the gap says “Desktop binaries are not bundled in this web console”: each
          product below needs OS-native processes, local file access, or GPU models. Atlas
          Forge never pretends those binaries run inside Vercel serverless.
        </p>
        {binaryInstalls.map((b) => (
          <article
            key={b.id}
            id={b.id}
            className="space-y-3 rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">{b.product}</h3>
                <p className="text-sm text-muted">{b.role}</p>
                <p className="mt-1 text-xs text-muted">
                  Platforms: {b.platforms.join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={b.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-bg"
                >
                  Download <ExternalLink size={12} />
                </a>
                <a
                  href={b.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs"
                >
                  Docs <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm leading-relaxed">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Why not in the web console
              </p>
              <p className="mt-1 text-muted">{b.whyNotInWeb}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Install steps</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                {b.installSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-sm font-medium">Verify</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-bg p-3 font-mono text-xs leading-relaxed">
                {b.verifyCommands.join("\n")}
              </pre>
            </div>
            {b.notes.length ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
                {b.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">What this web console does run live</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>
            <Link to="/import" className="text-primary underline">
              Import
            </Link>{" "}
            — public GitHub / Hugging Face / Docker Hub metadata (server-side fetch).
          </li>
          <li>
            <Link to="/analyze" className="text-primary underline">
              Analyze
            </Link>{" "}
            — instant pattern scan on pasted source (no model keys).
          </li>
          <li>
            Vault encyclopedia — skills, tools, plugins, ontology from Drive indexing.
          </li>
          <li>
            <Link to="/connectors" className="text-primary underline">
              Connectors
            </Link>{" "}
            — service wiring status.
          </li>
        </ul>
      </section>
    </div>
  );
}
