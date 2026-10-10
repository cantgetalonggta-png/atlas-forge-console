import { createFileRoute } from "@tanstack/react-router";
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
      "Vault folder indexed: DeepAudit, NodeTool (tree), Natamux, Agent Network, APIRadar (no private account packs).",
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
    detail: "Better-auth stack present in monorepo; gate not forced on vault console routes.",
  },
] as const;

function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connectors</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Live service wiring for Atlas Forge. Public APIs work without tokens; private scopes
          follow the Grok connector re-auth you completed for Vercel.
        </p>
      </div>
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
                <p className="mt-2 text-sm leading-relaxed text-muted">{row.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
