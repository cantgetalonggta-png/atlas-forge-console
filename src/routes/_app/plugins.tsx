import { createFileRoute } from "@tanstack/react-router";
import { plugins } from "@/data/vault";

export const Route = createFileRoute("/_app/plugins")({
  component: PluginsPage,
});

function PluginsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Plugin tree</h1>
        <p className="mt-1 text-sm text-muted">Extension points found in the three indexed codebases.</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {plugins.map((plugin) => (
          <li key={plugin.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="font-mono text-xs text-accent">{plugin.host}</p>
            <h2 className="mt-1 font-medium">{plugin.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{plugin.purpose}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
