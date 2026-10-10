import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { skills, type Domain } from "@/data/vault";

export const Route = createFileRoute("/_app/skills")({
  component: SkillsPage,
});

const domains: Array<Domain | "All"> = ["All", "Audit", "Agents", "Workflow", "Analysis", "Integration"];

function SkillsPage() {
  const [domain, setDomain] = useState<(typeof domains)[number]>("All");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return skills.filter((skill) => {
      const domainOk = domain === "All" || skill.domain === domain;
      const text = `${skill.name} ${skill.definition} ${skill.source}`.toLowerCase();
      return domainOk && (!query || text.includes(query));
    });
  }, [domain, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Skill tree</h1>
        <p className="mt-1 text-sm text-muted">{rows.length} skills from the indexed products.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search skills"
          className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          {domains.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDomain(item)}
              className={`min-h-11 rounded-lg px-3 text-sm ${domain === item ? "bg-primary text-primary-fg" : "bg-surface text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-3">
        {rows.map((skill) => (
          <li key={skill.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-medium">{skill.name}</h2>
              <span className="font-mono text-xs text-primary">{skill.domain}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{skill.definition}</p>
            <p className="mt-3 font-mono text-xs text-muted">
              {skill.source} · in {skill.inputs.join(", ")} · out {skill.outputs.join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
