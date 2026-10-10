import { Link, useRouterState } from "@tanstack/react-router";
import {
  FolderGit2,
  GitBranch,
  LayoutDashboard,
  Menu,
  Puzzle,
  ScanSearch,
  Shield,
  Download,
  Link2,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { to: "/", label: "Command", icon: LayoutDashboard },
  { to: "/skills", label: "Skills", icon: Shield },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/plugins", label: "Plugins", icon: Puzzle },
  { to: "/ontology", label: "Ontology", icon: GitBranch },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/import", label: "Import", icon: Download },
  { to: "/connectors", label: "Connectors", icon: Link2 },
  { to: "/analyze", label: "Analyze", icon: ScanSearch },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="flex min-h-screen">
        <aside
          className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-30 flex w-64 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0`}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <div>
              <p className="font-mono text-xs tracking-widest text-primary">ATLAS</p>
              <p className="text-lg font-semibold leading-tight">Forge</p>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-muted md:hidden"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {nav.map((item) => {
              const active = path === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"}`}
                >
                  <Icon size={16} className={active ? "text-primary" : ""} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="px-5 py-4 font-mono text-xs text-muted">Vault indexed · local preview</p>
        </aside>
        {open ? (
          <button
            type="button"
            aria-label="Dismiss menu"
            className="fixed inset-0 z-20 bg-bg/70 md:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-8">
            <button
              type="button"
              className="rounded-md p-2 text-fg md:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <p className="text-sm text-muted">Agent and audit vault</p>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
