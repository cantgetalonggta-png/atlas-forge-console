/**
 * Frontend Background Task Manager — best-manager design
 * - Per-job runner (not shared across queue)
 * - Concurrency limit (default 3)
 * - localStorage persistence of job log
 */

export type BgTaskState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type BgTaskKind =
  | "health_live"
  | "import_github"
  | "import_huggingface"
  | "import_docker"
  | "scan"
  | "ontology_snapshot"
  | "remote_poll"
  | "batch";

export type BgTask = {
  id: string;
  kind: BgTaskKind | string;
  state: BgTaskState;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  progress: number;
  message: string;
  input?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  remoteId?: string;
};

type Runner = (
  task: BgTask,
  update: (patch: Partial<BgTask>) => void,
) => Promise<unknown>;

type Listener = () => void;

const STORAGE_KEY = "atlas-bg-tasks-v1";
const MAX = 100;

function uid() {
  return crypto.randomUUID();
}

function load(): BgTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BgTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(tasks: BgTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

class BackgroundTaskManager {
  private tasks: BgTask[] = [];
  private runners = new Map<string, Runner>();
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

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    save(this.tasks);
    for (const fn of this.listeners) fn();
  }

  list(limit = 50): BgTask[] {
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
      byState,
      byKind,
    };
  }

  enqueue(
    kind: BgTaskKind | string,
    input: Record<string, unknown> | undefined,
    runner: Runner,
  ): BgTask {
    this.hydrate();
    const task: BgTask = {
      id: uid(),
      kind,
      state: "queued",
      createdAt: Date.now(),
      progress: 0,
      message: "queued",
      input,
    };
    this.tasks = [task, ...this.tasks].slice(0, MAX);
    this.runners.set(task.id, runner);
    this.queue.push(task.id);
    this.emit();
    this.pump();
    return task;
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

  private pump() {
    while (this.running < this.maxConcurrent && this.queue.length) {
      const id = this.queue.shift()!;
      const task = this.get(id);
      const runner = this.runners.get(id);
      if (!task || !runner || task.state === "cancelled") {
        this.runners.delete(id);
        continue;
      }
      this.running += 1;
      this.patch(id, {
        state: "running",
        startedAt: Date.now(),
        message: "running",
        progress: 0.05,
      });
      const update = (patch: Partial<BgTask>) => this.patch(id, patch);
      void (async () => {
        try {
          const current = this.get(id)!;
          const result = await runner(current, update);
          this.patch(id, {
            state: "succeeded",
            progress: 1,
            message: "succeeded",
            result,
            finishedAt: Date.now(),
          });
        } catch (e) {
          this.patch(id, {
            state: "failed",
            message: "failed",
            error: e instanceof Error ? e.message : String(e),
            finishedAt: Date.now(),
          });
        } finally {
          this.runners.delete(id);
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
  };
}
