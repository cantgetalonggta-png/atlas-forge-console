import { createFileRoute, Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Line, LineChart, XAxis, YAxis } from "recharts";
import { advisories, issueMix, projects, qualityTrend, services, skills, tools } from "@/data/vault";

export const Route = createFileRoute("/_app/")({
  component: Command,
});

const pieColors = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-danger)",
  "var(--color-muted)",
  "var(--color-fg)",
];

function Command() {
  const indexed = projects.filter((p) => p.status === "indexed").length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          One map of the vault: DeepAudit, Natamux, Agent Network, NodeTool (Drive-indexed), and APIRadar capture. Use Import for live public GitHub repos. Numbers below mix corpus data with service status.
        </p>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Projects" value={String(projects.length)} hint={`${indexed} fully indexed`} />
        <Stat label="Skills" value={String(skills.length)} hint="Across five domains" />
        <Stat label="Tools" value={String(tools.length)} hint="Scanners and runtimes" />
        <Stat label="Public advisories" value={String(advisories.length)} hint="Cited by DeepAudit README" />
      </section>
      <section className="grid gap-3 lg:grid-cols-5">
        <article className="rounded-xl border border-border bg-surface p-4 lg:col-span-3">
          <h2 className="text-sm font-medium">Quality trend</h2>
          <p className="mb-2 text-xs text-muted">Sample series from the DeepAudit dashboard capture.</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrend}>
                <XAxis dataKey="day" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[60, 100]} stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Issue mix</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={issueMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {issueMix.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium">Cited advisories</h2>
          <ul className="divide-y divide-border">
            {advisories.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-primary">{item.id}</span>
                  <span className="mt-0.5 block text-muted">
                    {item.project} · {item.kind}
                  </span>
                </span>
                <span className="font-mono text-xs text-fg">{item.score}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium">Connections</h2>
            <ul className="space-y-2">
              {services.map((svc) => (
                <li key={svc.name} className="flex items-start justify-between gap-3 text-sm">
                  <span>{svc.name}</span>
                  <span className="text-right text-xs text-muted">{svc.state}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <Link
              to="/import"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
            >
              Live import
            </Link>
            <Link
              to="/setup"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
            >
              Setup desktop binaries
            </Link>
            <Link
              to="/jobs"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
            >
              Background jobs
            </Link>
            <Link
              to="/analyze"
              className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-fg"
            >
              Run instant analysis
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl font-medium">{value}</p>
      <p className="mt-1 text-xs text-accent">{hint}</p>
    </article>
  );
}
