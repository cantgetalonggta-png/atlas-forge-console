import { createFileRoute } from "@tanstack/react-router";
import { tools } from "@/data/vault";

export const Route = createFileRoute("/_app/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  const families = [...new Set(tools.map((tool) => tool.family))];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Tool tree</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Scanners named in DeepAudit tools.txt, plus the three runtime CLIs. This list does not ship exploit tooling.
        </p>
      </div>
      {families.map((family) => (
        <section key={family}>
          <h2 className="mb-2 font-mono text-xs tracking-wide text-primary">{family}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {tools
              .filter((tool) => tool.family === family)
              .map((tool) => (
                <li key={tool.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-sm text-muted">{tool.role}</span>
                  <span className="font-mono text-xs text-muted">{tool.languages}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
