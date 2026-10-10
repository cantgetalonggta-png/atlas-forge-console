import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed } from "lucide-react";

export const Route = createFileRoute("/_app/connectors")({
  component: ConnectorsPage,
});

const rows = [
  {
    name: "Vercel",
    status: "connected",
    detail:
      "Production https://atlas-forge-console.vercel.app · project atlas-forge-console · team echo-ec69.",
  },
  {
    name: "GitHub",
    status: "connected",
    detail:
      "Account cantgetalonggta-png · public REST import + search live · repo cantgetalonggta-png/atlas-forge-console.",
  },
  {
    name: "Google Drive",
    status: "connected",
    detail:
      "Vault folders indexed: DeepAudit, NodeTool, Natamux, Agent Network, APIRadar, Drive API pack (1xtF7i4XWfsPH36xgp7pS46yvi2AGpmlb). No private account packs stored.",
  },
  {
    name: "Hugging Face",
    status: "public-api",
    detail: "Public model card API import on Import tab. OAuth private repos optional later.",
  },
  {
    name: "Docker Hub",
    status: "public-api",
    detail: "Public image metadata import on Import tab.",
  },
  {
    name: "OAuth2 allowlist",
    status: "preview",
    detail:
      "Better-auth stack present in monorepo; gate not forced on vault console routes. Backend allowlist: api.github.com, huggingface.co, hub.docker.com, anet.sh.",
  },
];

function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connectors</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          External service wiring for Atlas Forge. Public metadata imports run
          without storing operator secrets in the browser.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Secret hygiene (Drive API pack)</p>
        <p className="mt-1 text-muted">
          Keys live in env / provider dashboards — never in git or browser
          localStorage. Analyzer detects sk-, ghp_, AIza, AKIA, PEM blocks.
          Rotate any keys that were pasted into Drive samples. Offensive key
          scrapers are not part of this console.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/analyze"
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            Run analyzer
          </Link>
          <Link
            to="/jobs"
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            Background jobs
          </Link>
          <Link
            to="/projects"
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            Drive API pack project
          </Link>
        </div>
      </section>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.name}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              {row.status === "connected" ? (
                <CheckCircle2 className="mt-0.5 text-accent" size={18} />
              ) : (
                <CircleDashed className="mt-0.5 text-muted" size={18} />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{row.name}</h2>
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
                    {row.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {row.detail}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
