import { createFileRoute, Link } from "@tanstack/react-router";
import { corpus, projects } from "@/data/vault";
import { useAtlas } from "@/lib/atlas-store";
import { projectFromImport } from "@/lib/github-import";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const imported = useAtlas((s) => s.importedRepos);
  const live = imported.map(projectFromImport);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {corpus.note} Indexed {corpus.indexedAt}.
          </p>
        </div>
        <Link
          to="/import"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-bg"
        >
          Import from GitHub
        </Link>
      </div>

      {live.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-accent">
            Live imports
          </h2>
          <ul className="space-y-3">
            {live.map((project) => (
              <li key={project.id} className="rounded-xl border border-primary/40 bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium">{project.name}</h3>
                  <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-accent">
                    github
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
          {projects.map((project) => (
            <li key={project.id} className="rounded-xl border border-border bg-surface p-4">
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
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
