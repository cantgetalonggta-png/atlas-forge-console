import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useBackgroundTasks } from "@/lib/use-background-tasks";
import { runLiveHealth } from "@/lib/health.functions";
import { importGithubRepo } from "@/lib/github-import.functions";
import { scanSource } from "@/lib/scan";
import { useAtlas } from "@/lib/atlas-store";

export const Route = createFileRoute("/_app/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const { tasks, stats, enqueue, cancel, clearFinished } = useBackgroundTasks();
  const setHits = useAtlas((s) => s.setHits);
  const addImported = useAtlas((s) => s.addImported);

  function runHealthJob() {
    enqueue("health_live", {}, async (_t, update) => {
      update({ progress: 0.2, message: "probing public APIs" });
      const res = await runLiveHealth();
      update({ progress: 0.9, message: "probes complete" });
      return res;
    });
  }

  function runSampleScanJob() {
    const sample = `query = "SELECT * FROM t WHERE id='" + x + "'\neval(user)\napi_key = 'sk-live-demo-secret'`;
    enqueue("scan", { lines: sample.split("\n").length }, async (_t, update) => {
      update({ progress: 0.3, message: "scanning snippet" });
      const hits = scanSource(sample);
      setHits(hits);
      update({ progress: 0.95, message: `${hits.length} hits` });
      return { count: hits.length, hits };
    });
  }

  function runGithubImportJob() {
    enqueue(
      "import_github",
      { input: "nodetool-ai/nodetool" },
      async (_t, update) => {
        update({ progress: 0.25, message: "fetching GitHub metadata" });
        const res = await importGithubRepo({ data: { input: "nodetool-ai/nodetool" } });
        if (!res.ok) throw new Error(res.error || "import failed");
        addImported(res.repo);
        update({ progress: 0.9, message: res.repo.fullName });
        return res.repo;
      },
    );
  }

  function runBatchDemo() {
    runHealthJob();
    runSampleScanJob();
    runGithubImportJob();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Background tasks</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Frontend task manager (queued / concurrent workers) plus backend{" "}
            <code className="text-xs">/v1/jobs</code> API under{" "}
            <code className="text-xs">ROOT_WORKSPACE/backend</code>. Jobs keep running
            while you navigate; reloads mark interrupted work as failed.
          </p>
        </div>
        <button
          type="button"
          onClick={clearFinished}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs"
        >
          <Trash2 size={14} /> Clear finished
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={String(stats.total)} />
        <Stat label="Running" value={String(stats.running)} />
        <Stat label="Queued" value={String(stats.queued)} />
        <Stat label="Succeeded" value={String(stats.byState.succeeded ?? 0)} />
      </section>

      <section className="flex flex-wrap gap-2">
        <Action onClick={runHealthJob}>Enqueue live health</Action>
        <Action onClick={runSampleScanJob}>Enqueue sample scan</Action>
        <Action onClick={runGithubImportJob}>Enqueue GitHub import</Action>
        <Action primary onClick={runBatchDemo}>
          Enqueue batch demo (3)
        </Action>
        <Link
          to="/import"
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs"
        >
          Import page
        </Link>
        <Link
          to="/setup"
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs"
        >
          Setup / probes
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          Job log
        </div>
        {tasks.length === 0 ? (
          <p className="p-4 text-sm text-muted">No jobs yet. Enqueue a task above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      <span className="font-mono text-xs text-primary">{t.kind}</span>{" "}
                      <StateBadge state={t.state} />
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{t.message}</p>
                    {t.error ? (
                      <p className="mt-1 text-xs text-red-400">{t.error}</p>
                    ) : null}
                  </div>
                  <div className="text-right font-mono text-xs text-muted">
                    <p>{Math.round(t.progress * 100)}%</p>
                    {t.state === "queued" ? (
                      <button
                        type="button"
                        className="mt-1 text-primary underline"
                        onClick={() => cancel(t.id)}
                      >
                        cancel
                      </button>
                    ) : null}
                    {t.state === "running" ? (
                      <Loader2 size={14} className="ml-auto mt-1 animate-spin" />
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-surface-2">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.round(t.progress * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
    </article>
  );
}

function Action({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-medium ${
        primary ? "bg-primary text-bg" : "border border-border bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function StateBadge({ state }: { state: string }) {
  const color =
    state === "succeeded"
      ? "text-accent"
      : state === "failed"
        ? "text-red-400"
        : state === "running"
          ? "text-primary"
          : "text-muted";
  return <span className={`font-mono text-xs ${color}`}>{state}</span>;
}
