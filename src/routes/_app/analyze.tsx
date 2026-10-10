import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAtlas } from "@/lib/atlas-store";
import { scanSource } from "@/lib/scan";

export const Route = createFileRoute("/_app/analyze")({
  component: AnalyzePage,
});

const sample = `def login(user, password):
    query = "SELECT * FROM users WHERE name='" + user + "'"
    os.system(password)
    token = "api_key = 'sk-live-demo-secret'"
    return eval(user)
`;

function AnalyzePage() {
  const [source, setSource] = useState(sample);
  const hits = useAtlas((s) => s.hits);
  const setHits = useAtlas((s) => s.setHits);
  const lastScanAt = useAtlas((s) => s.lastScanAt);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Instant analysis</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Pattern scan in the browser. It flags obvious sinks. It does not prove a vulnerability and it does not call a model.
        </p>
      </div>
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        className="min-h-56 w-full rounded-xl border border-border bg-surface p-4 font-mono text-sm leading-relaxed outline-none focus:border-primary"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg"
          onClick={() => setHits(scanSource(source))}
        >
          Scan snippet
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-border px-4 text-sm"
          onClick={() => {
            setSource(sample);
            setHits([]);
          }}
        >
          Reset sample
        </button>
      </div>
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">{hits.length} hits</h2>
          <span className="font-mono text-xs text-muted">{lastScanAt ? "last scan stored in this session" : "not scanned yet"}</span>
        </div>
        {hits.length === 0 ? (
          <p className="text-sm text-muted">Run a scan to list line hits.</p>
        ) : (
          <ul className="divide-y divide-border">
            {hits.map((hit, index) => (
              <li key={`${hit.rule}-${hit.line}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-primary">L{hit.line}</span> {hit.detail}
                </span>
                <span className="font-mono text-xs uppercase text-muted">{hit.severity}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
