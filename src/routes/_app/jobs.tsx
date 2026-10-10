import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Trash2, Server, Cpu, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBackgroundTasks } from "@/lib/use-background-tasks";
import { runLiveHealth } from "@/lib/health.functions";
import { importGithubRepo } from "@/lib/github-import.functions";
import { scanSource } from "@/lib/scan";
import { useAtlas } from "@/lib/atlas-store";
import {
  remoteJobsConfigured,
  remoteListJobs,
  remoteJobStats,
  remoteCreateJob,
  remoteCreateBatch,
  remoteCancelJob,
  type RemoteJob,
} from "@/lib/remote-jobs";

export const Route = createFileRoute("/_app/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const {
    tasks,
    stats,
    active,
    enqueue,
    enqueueBatch,
    cancel,
    clearFinished,
    setMaxConcurrent,
  } = useBackgroundTasks();
  const setHits = useAtlas((s) => s.setHits);
  const addImported = useAtlas((s) => s.addImported);

  const [remote, setRemote] = useState<RemoteJob[]>([]);
  const [remoteStats, setRemoteStats] = useState<Record<string, unknown> | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const configured = remoteJobsConfigured();

  const refreshRemote = useCallback(async () => {
    if (!remoteJobsConfigured()) {
      setRemoteError(null);
      setRemote([]);
      setRemoteStats(null);
      return;
    }
    setRemoteBusy(true);
    try {
      const [items, st] = await Promise.all([
        remoteListJobs(40),
        remoteJobStats(),
      ]);
      setRemote(items);
      setRemoteStats(st);
      setRemoteError(null);
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoteBusy(false);
    }
  }, []);

  useEffect(() => {
    void refreshRemote();
    if (!configured) return;
    const t = setInterval(() => void refreshRemote(), 2500);
    return () => clearInterval(t);
  }, [refreshRemote, configured]);

  function runHealthJob() {
    enqueue(
      "health_live",
      async (_t, update, signal) => {
        if (signal.aborted) throw new DOMException("aborted", "AbortError");
        update({ progress: 0.2, message: "probing public APIs" });
        const res = await runLiveHealth();
        update({ progress: 0.9, message: "probes complete" });
        return res;
      },
      { priority: "high", maxAttempts: 2 },
    );
  }

  function runSampleScanJob() {
    const sample = `query = "SELECT * FROM t WHERE id='" + x + "'\neval(user)\napi_key = 'sk-live-demo-secret'`;
    enqueue(
      "scan",
      async (_t, update) => {
        update({ progress: 0.3, message: "scanning snippet" });
        const hits = scanSource(sample);
        setHits(hits);
        update({ progress: 0.95, message: `${hits.length} hits` });
        return { count: hits.length, hits };
      },
      { priority: "normal" },
    );
  }

  function runGithubImportJob() {
    enqueue(
      "import_github",
      async (_t, update, signal) => {
        update({ progress: 0.25, message: "fetching GitHub metadata" });
        if (signal.aborted) throw new DOMException("aborted", "AbortError");
        const res = await importGithubRepo({
          data: { input: "nodetool-ai/nodetool" },
        });
        if (!res.ok) throw new Error(res.error || "import failed");
        addImported(res.repo);
        update({ progress: 0.9, message: res.repo.fullName });
        return res.repo;
      },
      { priority: "normal", maxAttempts: 2, input: { input: "nodetool-ai/nodetool" } },
    );
  }

  function runBatchDemo() {
    enqueueBatch([
      {
        kind: "health_live",
        runner: async (_t, update) => {
          update({ progress: 0.5, message: "batch health" });
          return runLiveHealth();
        },
        opts: { priority: "high" },
      },
      {
        kind: "scan",
        runner: async (_t, update) => {
          update({ progress: 0.5, message: "batch scan" });
          const hits = scanSource("eval(x)");
          setHits(hits);
          return { count: hits.length };
        },
      },
      {
        kind: "import_github",
        runner: async (_t, update) => {
          update({ progress: 0.4, message: "batch import" });
          const res = await importGithubRepo({
            data: { input: "vercel/next.js" },
          });
          if (!res.ok) throw new Error(res.error || "import failed");
          addImported(res.repo);
          return res.repo;
        },
        opts: { maxAttempts: 2 },
      },
    ]);
  }

  async function runRemoteHealth() {
    setRemoteBusy(true);
    try {
      await remoteCreateJob("health_live", {});
      await refreshRemote();
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoteBusy(false);
    }
  }

  async function runRemoteBatch() {
    setRemoteBusy(true);
    try {
      await remoteCreateBatch([
        { kind: "health_live", input: {} },
        {
          kind: "scan",
          input: {
            source: "eval(user)\nos.system(x)\napi_key = 'sk-demo-secret'",
          },
        },
        {
          kind: "import_github",
          input: { owner: "nodetool-ai", repo: "nodetool" },
        },
        { kind: "ontology_snapshot", input: {} },
      ]);
      await refreshRemote();
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoteBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Background tasks</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Dual-plane job control: browser{" "}
            <strong className="text-fg">frontend manager</strong> (priority queue,
            concurrency, retries, AbortSignal) and optional{" "}
            <strong className="text-fg">backend TaskManager</strong>{" "}
            (<code className="text-xs">ROOT_WORKSPACE/backend</code>{" "}
            <code className="text-xs">/v1/jobs</code>). Desktop binaries stay off
            the web plane — see Setup.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMaxConcurrent(2)}
            className="rounded-lg border border-border px-2 py-1 text-xs"
          >
            Workers 2
          </button>
          <button
            type="button"
            onClick={() => setMaxConcurrent(3)}
            className="rounded-lg border border-border px-2 py-1 text-xs"
          >
            Workers 3
          </button>
          <button
            type="button"
            onClick={() => setMaxConcurrent(5)}
            className="rounded-lg border border-border px-2 py-1 text-xs"
          >
            Workers 5
          </button>
          <button
            type="button"
            onClick={clearFinished}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs"
          >
            <Trash2 size={14} /> Clear finished
          </button>
        </div>
      </div>

      {/* LOCAL FE MANAGER */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cpu size={16} className="text-primary" /> Frontend manager
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
            active {active}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Total" value={String(stats.total)} />
          <Stat label="Running" value={String(stats.running)} />
          <Stat label="Queued" value={String(stats.queued)} />
          <Stat label="Succeeded" value={String(stats.byState.succeeded ?? 0)} />
          <Stat label="Max concurrent" value={String(stats.maxConcurrent ?? 3)} />
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
        <JobLog
          title="Job log (browser)"
          empty="No frontend jobs yet. Enqueue a task above."
          items={tasks.map((t) => ({
            id: t.id,
            kind: t.kind,
            state: t.state,
            message: t.message,
            error: t.error,
            progress: t.progress,
            meta: `p=${t.priority} · try ${t.attempt}/${t.maxAttempts}`,
            cancellable: t.state === "queued" || t.state === "running",
          }))}
          onCancel={cancel}
        />
      </section>

      {/* REMOTE BE MANAGER */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Server size={16} className="text-accent" /> Backend manager
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
              {configured ? "API linked" : "self-host"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refreshRemote()}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
          >
            <RefreshCw size={12} className={remoteBusy ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
        {!configured ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            <p>
              Set <code className="text-xs text-fg">VITE_ATLAS_API_URL</code> to your
              FastAPI base (e.g. <code className="text-xs">http://127.0.0.1:8000</code>
              ) to control remote jobs from this UI. Local run:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs text-fg">
{`cd ROOT_WORKSPACE/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
# then rebuild console with VITE_ATLAS_API_URL=http://127.0.0.1:8000`}
            </pre>
            <p className="mt-2">
              Endpoints:{" "}
              <code className="text-xs">POST /v1/jobs</code>,{" "}
              <code className="text-xs">POST /v1/jobs/batch</code>,{" "}
              <code className="text-xs">GET /v1/jobs</code>,{" "}
              <code className="text-xs">POST /v1/jobs/{"{id}"}/cancel</code>
            </p>
          </div>
        ) : (
          <>
            {remoteStats ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Remote total" value={String(remoteStats.total ?? "—")} />
                <Stat
                  label="Remote running"
                  value={String(remoteStats.running_tasks ?? "—")}
                />
                <Stat
                  label="Handlers"
                  value={
                    Array.isArray(remoteStats.handlers)
                      ? String((remoteStats.handlers as string[]).length)
                      : "—"
                  }
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Action onClick={() => void runRemoteHealth()}>
                Remote live health
              </Action>
              <Action primary onClick={() => void runRemoteBatch()}>
                Remote batch (4)
              </Action>
            </div>
            {remoteError ? (
              <p className="text-sm text-red-400">{remoteError}</p>
            ) : null}
            <JobLog
              title="Job log (backend API)"
              empty="No remote jobs yet."
              items={remote.map((t) => ({
                id: t.id,
                kind: t.kind,
                state: t.state,
                message: t.message,
                error: t.error || undefined,
                progress: t.progress,
                meta: t.duration_ms != null ? `${t.duration_ms}ms` : undefined,
                cancellable: t.state === "queued" || t.state === "running",
              }))}
              onCancel={(id) => {
                void remoteCancelJob(id).then(() => refreshRemote());
              }}
            />
          </>
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

function JobLog({
  title,
  empty,
  items,
  onCancel,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    kind: string;
    state: string;
    message: string;
    error?: string;
    progress: number;
    meta?: string;
    cancellable?: boolean;
  }>;
  onCancel: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 text-sm font-medium">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((t) => (
            <li key={t.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    <span className="font-mono text-xs text-primary">{t.kind}</span>{" "}
                    <StateBadge state={t.state} />
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{t.message}</p>
                  {t.meta ? (
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{t.meta}</p>
                  ) : null}
                  {t.error ? (
                    <p className="mt-1 text-xs text-red-400">{t.error}</p>
                  ) : null}
                </div>
                <div className="text-right font-mono text-xs text-muted">
                  <p>{Math.round(t.progress * 100)}%</p>
                  {t.cancellable ? (
                    <button
                      type="button"
                      className="mt-1 text-primary underline"
                      onClick={() => onCancel(t.id)}
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
          : state === "cancelled"
            ? "text-muted"
            : "text-muted";
  return <span className={`font-mono text-xs ${color}`}>{state}</span>;
}
