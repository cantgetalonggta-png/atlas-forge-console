import { createFileRoute } from "@tanstack/react-router";
import { relations } from "@/data/vault";

export const Route = createFileRoute("/_app/ontology")({
  component: OntologyPage,
});

const classes = [
  { name: "Repository", def: "A codebase under audit or agent work." },
  { name: "Agent", def: "A model runtime that can take a task or a finding pass." },
  { name: "Skill", def: "A named procedure with inputs and outputs." },
  { name: "Tool", def: "A scanner or CLI the procedure can call." },
  { name: "Plugin", def: "An adapter that attaches a skill to a host." },
  { name: "Finding", def: "A located issue with a severity." },
  { name: "Report", def: "An export of findings." },
];

function OntologyPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Ontology</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Classes shared by the vault. Edges are the ones this console can defend from the READMEs.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {classes.map((item) => (
          <li key={item.name} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-medium">{item.name}</h2>
            <p className="mt-1 text-sm text-muted">{item.def}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium">Relations</h2>
        <ul className="space-y-2">
          {relations.map((edge) => (
            <li key={`${edge.from}-${edge.rel}-${edge.to}`} className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="rounded-md bg-surface-2 px-2 py-1">{edge.from}</span>
              <span className="text-primary">{edge.rel}</span>
              <span className="rounded-md bg-surface-2 px-2 py-1">{edge.to}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
