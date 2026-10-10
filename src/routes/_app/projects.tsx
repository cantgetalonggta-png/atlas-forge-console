import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { corpus, projects } from "@/data/vault";
import { useAtlas } from "@/lib/atlas-store";
import { projectFromImport } from "@/lib/github-import";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

const setupAnchors: Record<string, { href: string; label: string; setupId?: string }> = {
  deepaudit: {
    href: "https://github.com/search?q=DeepAudit&type=repositories",
    label: "DeepAudit sources",
    setupId: "deepaudit",
  },
  "agent-network": {
    href: "https://github.com/sleep2agi/agent-network-app/releases/latest",
    label: "Install desktop binary",
    setupId: "agent-network-desktop",
  },
  natamux: {
    href: "https://github.com/lenhatthanh20/natamux",
    label: "Clone Natamux",
    setupId: "natamux",
  },
  nodetool: {
    href: "https://github.com/nodetool-ai/nodetool/releases/latest",
    label: "Install NodeTool Studio",
    setupId: "nodetool-studio",
  },
  "deer-flow": {
    href: "https://github.com/search?q=deer-flow&type=repositories",
    label: "DeerFlow sources",
    setupId: "deer-flow",
  },
  apiradar: {
    href: "/import",
    label: "Import public repos",
  },
};

function ProjectsPage() {
  const imported = useAtlas((s) => s.importedRepos);
  const live = imported.map(projectFromImport);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {corpus.note} Indexed {corpus.indexedAt}. Desktop gaps link to real installers
            on the{" "}
            <Link to="/setup" className="text-primary underline">
              Setup
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/setup"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium"
          >
            Setup binaries
          </Link>
          <Link
            to="/import"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-bg"
          >
            Live import
          </Link>
        </div>
      </div>

      {live.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-accent">
            Live imports
          </h2>
          <ul className="space-y-3">
            {live.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-primary/40 bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium">{project.name}</h3>
                  <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-accent">
                    {project.kind}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {project.stack} · {project.size}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{project.summary}</p>
                {"url" in project && project.url ? (
                  <a
                    href={String(project.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs text-primary"
                  >
                    Open source <ExternalLink size={12} />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Vault corpus
        </h2>
        <ul className="space-y-3">
          {projects.map((project) => {
            const cta = setupAnchors[project.id];
            return (
              <li
                key={project.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-medium">{project.name}</h2>
                  <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-accent">
                    {project.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {project.kind} · {project.stack} · {project.size}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{project.summary}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                  {project.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
                {cta ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cta.href.startsWith("/") ? (
                      <Link
                        to={cta.href}
                        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-3 text-xs font-medium text-bg"
                      >
                        {cta.label}
                      </Link>
                    ) : (
                      <a
                        href={cta.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-bg"
                      >
                        {cta.label} <ExternalLink size={12} />
                      </a>
                    )}
                    {cta.setupId ? (
                      <Link
                        to="/setup"
                        hash={cta.setupId}
                        className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs"
                      >
                        Full setup guide
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
