/**
 * Atlas Forge — Frontend Background Task Manager (best-manager)
 *
 * Features:
 * - Priority queue (high | normal | low)
 * - Concurrency limit (default 3, tunable)
 * - Per-job runner with progress patches
 * - Optional retries with exponential backoff
 * - AbortSignal for cooperative cancel of running work
 * - localStorage job log (survives navigation; reload marks interrupted)
 * - Snapshot API for React hooks / nav badges
 */

export type BgTaskState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type BgTaskPriority = "high" | "normal" | "low";

export type BgTaskKind =
  | "health_live"
  | "import_github"
  | "import_huggingface"
  | "import_docker"
  | "scan"
  | "ontology_snapshot"
  | "remote_poll"
  | "remote_enqueue"
  | "batch";

export type BgTask = {
  id: string;
  kind: BgTaskKind | string;
  state: BgTaskState;
  priority: BgTaskPriority;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  progress: number;
  message: string;
  input?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  remoteId?: string;
  attempt: number;
  maxAttempts: number;
  parentId?: string;
};

export type BgRunner = (
  task: BgTask,
  update: (patch: Partial<BgTask>) => void,
  signal: AbortSignal,
) => Promise<unknown>;

export type EnqueueOptions = {
  input?: Record<string, unknown>;
  priority?: BgTaskPriority;
  maxAttempts?: number;
  parentId?: string;
};

type Listener = () => void;

const STORAGE_KEY = "atlas-bg-tasks-v1";
const MAX = 120;
const PRIORITY_RANK: Record<BgTaskPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

function uid() {
  return crypto.randomUUID();
}

function load(): BgTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BgTask[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => ({
      priority: t.priority ?? "normal",
      attempt: t.attempt ?? 0,
      maxAttempts: t.maxAttempts ?? 1,
      ...t,
    }));
  } catch {
    return [];
  }
}

function save(tasks: BgTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

class BackgroundTaskManager {
  private tasks: BgTask[] = [];
  private runners = new Map<string, BgRunner>();
  private aborts = new Map<string, AbortController>();
  private listeners = new Set<Listener>();
  private queue: string[] = [];
  private running = 0;
  private maxConcurrent = 3;
  private hydrated = false;

  hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.tasks = load().map((t) =>
      t.state === "running" || t.state === "queued"
        ? {
            ...t,
            state: "failed" as const,
            message: "interrupted (page reload)",
            error: "session ended",
            finishedAt: Date.now(),
          }
        : t,
    );
    save(this.tasks);
    this.hydrated = true;
    this.emit();
  }

  setMaxConcurrent(n: number) {
    this.maxConcurrent = Math.max(1, Math.min(16, Math.floor(n)));
    this.pump();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    save(this.tasks);
    for (const fn of this.listeners) fn();
  }

  list(limit = 60): BgTask[] {
    return [...this.tasks]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  get(id: string) {
    return this.tasks.find((t) => t.id === id);
  }

  stats() {
    const byState: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    for (const t of this.tasks) {
      byState[t.state] = (byState[t.state] || 0) + 1;
      byKind[t.kind] = (byKind[t.kind] || 0) + 1;
    }
    return {
      total: this.tasks.length,
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      byState,
      byKind,
      active:
        this.running +
        this.queue.length +
        (byState.running || 0) -
        this.running /* display helper */,
    };
  }

  activeCount() {
    return (
      this.tasks.filter((t) => t.state === "queued" || t.state === "running")
        .length
    );
  }

  enqueue(kind: BgTaskKind | string, runner: BgRunner, opts: EnqueueOptions = {}): BgTask {
    this.hydrate();
    const task: BgTask = {
      id: uid(),
      kind,
      state: "queued",
      priority: opts.priority ?? "normal",
      createdAt: Date.now(),
      progress: 0,
      message: "queued",
      input: opts.input,
      attempt: 0,
      maxAttempts: Math.max(1, opts.maxAttempts ?? 1),
      parentId: opts.parentId,
    };
    this.tasks = [task, ...this.tasks].slice(0, MAX);
    this.runners.set(task.id, runner);
    this.queue.push(task.id);
    this.sortQueue();
    this.emit();
    this.pump();
    return task;
  }

  /** Enqueue many independent jobs; returns parent batch metadata task. */
  enqueueBatch(
    items: Array<{
      kind: BgTaskKind | string;
      runner: BgRunner;
      opts?: EnqueueOptions;
    }>,
  ): BgTask {
    const parent = this.enqueue(
      "batch",
      async (task, update) => {
        update({ progress: 0.1, message: `batch parent · ${items.length} children` });
        // Parent resolves immediately; children run independently.
        return { status: "parent", count: items.length, id: task.id };
      },
      { input: { count: items.length }, priority: "high" },
    );
    for (const item of items) {
      this.enqueue(item.kind, item.runner, {
        ...item.opts,
        parentId: parent.id,
      });
    }
    return parent;
  }

  cancel(id: string) {
    const t = this.get(id);
    if (!t) return false;
    if (t.state === "queued") {
      this.queue = this.queue.filter((q) => q !== id);
      this.runners.delete(id);
      this.patch(id, {
        state: "cancelled",
        message: "cancelled",
        finishedAt: Date.now(),
      });
      return true;
    }
    if (t.state === "running") {
      const ac = this.aborts.get(id);
      ac?.abort();
      this.patch(id, {
        state: "cancelled",
        message: "cancel requested",
        error: "aborted",
        finishedAt: Date.now(),
      });
      return true;
    }
    return false;
  }

  clearFinished() {
    this.tasks = this.tasks.filter(
      (t) => t.state === "queued" || t.state === "running",
    );
    this.emit();
  }

  private patch(id: string, patch: Partial<BgTask>) {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.emit();
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      const ta = this.get(a);
      const tb = this.get(b);
      const pa = PRIORITY_RANK[ta?.priority ?? "normal"];
      const pb = PRIORITY_RANK[tb?.priority ?? "normal"];
      if (pa !== pb) return pa - pb;
      return (ta?.createdAt ?? 0) - (tb?.createdAt ?? 0);
    });
  }

  private async sleep(ms: number, signal: AbortSignal) {
    if (ms <= 0) return;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => resolve(), ms);
      const onAbort = () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      };
      if (signal.aborted) {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  private pump() {
    while (this.running < this.maxConcurrent && this.queue.length) {
      this.sortQueue();
      const id = this.queue.shift()!;
      const task = this.get(id);
      const runner = this.runners.get(id);
      if (!task || !runner || task.state === "cancelled") {
        this.runners.delete(id);
        continue;
      }
      this.running += 1;
      const ac = new AbortController();
      this.aborts.set(id, ac);
      this.patch(id, {
        state: "running",
        startedAt: Date.now(),
        message: "running",
        progress: 0.05,
        attempt: task.attempt + 1,
      });
      void (async () => {
        const update = (patch: Partial<BgTask>) => this.patch(id, patch);
        try {
          const current = this.get(id)!;
          const result = await runner(current, update, ac.signal);
          if (ac.signal.aborted) {
            this.patch(id, {
              state: "cancelled",
              message: "cancelled",
              error: "aborted",
              finishedAt: Date.now(),
            });
          } else {
            this.patch(id, {
              state: "succeeded",
              progress: 1,
              message: "succeeded",
              result,
              finishedAt: Date.now(),
            });
          }
        } catch (e) {
          if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
            this.patch(id, {
              state: "cancelled",
              message: "cancelled",
              error: "aborted",
              finishedAt: Date.now(),
            });
          } else {
            const cur = this.get(id)!;
            const err = e instanceof Error ? e.message : String(e);
            if (cur.attempt < cur.maxAttempts) {
              const backoff = Math.min(8000, 400 * 2 ** (cur.attempt - 1));
              this.patch(id, {
                state: "queued",
                message: `retry in ${backoff}ms · ${err}`,
                error: err,
                progress: 0,
              });
              this.runners.set(id, runner);
              try {
                await this.sleep(backoff, ac.signal);
                this.queue.push(id);
                this.sortQueue();
              } catch {
                this.patch(id, {
                  state: "cancelled",
                  message: "cancelled during backoff",
                  finishedAt: Date.now(),
                });
              }
            } else {
              this.patch(id, {
                state: "failed",
                message: "failed",
                error: err,
                finishedAt: Date.now(),
              });
            }
          }
        } finally {
          this.runners.delete(id);
          this.aborts.delete(id);
          this.running -= 1;
          this.pump();
        }
      })();
    }
  }
}

export const bgTasks = new BackgroundTaskManager();

export function getBgTasksSnapshot() {
  if (typeof window !== "undefined") bgTasks.hydrate();
  return {
    tasks: bgTasks.list(),
    stats: bgTasks.stats(),
    active: bgTasks.activeCount(),
  };
}
