/**
 * Remote backend job client — talks to ROOT_WORKSPACE FastAPI /v1/jobs
 * Configure with VITE_ATLAS_API_URL or window.__ATLAS_API_URL__
 */

export type RemoteJob = {
  id: string;
  kind: string;
  state: string;
  created_at: number;
  started_at?: number | null;
  finished_at?: number | null;
  progress: number;
  message: string;
  input?: Record<string, unknown>;
  result?: unknown;
  error?: string | null;
  parent_id?: string | null;
  children?: string[];
  duration_ms?: number | null;
};

function baseUrl(): string | null {
  if (typeof window !== "undefined") {
    const w = (window as unknown as { __ATLAS_API_URL__?: string }).__ATLAS_API_URL__;
    if (w) return w.replace(/\/$/, "");
  }
  const env = (import.meta as { env?: Record<string, string> }).env;
  const v = env?.VITE_ATLAS_API_URL;
  return v ? v.replace(/\/$/, "") : null;
}

export function remoteJobsConfigured(): boolean {
  return Boolean(baseUrl());
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const base = baseUrl();
  if (!base) throw new Error("ATLAS API URL not configured (VITE_ATLAS_API_URL)");
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`API ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}

export async function remoteListJobs(limit = 40): Promise<RemoteJob[]> {
  const data = await req<{ items: RemoteJob[] }>(`/v1/jobs?limit=${limit}`);
  return data.items || [];
}

export async function remoteJobStats(): Promise<Record<string, unknown>> {
  return req("/v1/jobs/stats");
}

export async function remoteCreateJob(
  kind: string,
  input: Record<string, unknown> = {},
): Promise<RemoteJob> {
  return req("/v1/jobs", {
    method: "POST",
    body: JSON.stringify({ kind, input }),
  });
}

export async function remoteCreateBatch(
  items: Array<{ kind: string; input?: Record<string, unknown> }>,
): Promise<RemoteJob> {
  return req("/v1/jobs/batch", {
    method: "POST",
    body: JSON.stringify({
      items: items.map((i) => ({ kind: i.kind, input: i.input || {} })),
    }),
  });
}

export async function remoteCancelJob(id: string): Promise<RemoteJob> {
  return req(`/v1/jobs/${id}/cancel`, { method: "POST" });
}

export async function remoteGetJob(id: string): Promise<RemoteJob> {
  return req(`/v1/jobs/${id}`);
}

/** Poll until terminal or timeout. */
export async function remoteWaitJob(
  id: string,
  opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<RemoteJob> {
  const interval = opts.intervalMs ?? 400;
  const timeout = opts.timeoutMs ?? 60_000;
  const start = Date.now();
  while (true) {
    if (opts.signal?.aborted) throw new DOMException("aborted", "AbortError");
    const job = await remoteGetJob(id);
    if (["succeeded", "failed", "cancelled"].includes(job.state)) return job;
    if (Date.now() - start > timeout) throw new Error("remote job wait timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}
