export type Domain =
  | "Audit"
  | "Agents"
  | "Workflow"
  | "Analysis"
  | "Integration";

export type Skill = {
  id: string;
  name: string;
  domain: Domain;
  source: string;
  definition: string;
  inputs: string[];
  outputs: string[];
};

export type Tool = {
  id: string;
  name: string;
  family: string;
  languages: string;
  role: string;
};

export type Plugin = {
  id: string;
  name: string;
  host: string;
  purpose: string;
};

export type Project = {
  id: string;
  name: string;
  kind: string;
  stack: string;
  size: string;
  status: "indexed" | "partial" | "screenshot";
  summary: string;
  gaps: string[];
};

export type Advisory = {
  id: string;
  project: string;
  kind: string;
  score: string;
};

export type Relation = {
  from: string;
  rel: string;
  to: string;
};

export const corpus = {
  folder: "Drive vault",
  indexedAt: "2026-10-10",
  note: "Product trees only. Named-account folders under APIRadar were not loaded.",
};

export const skills: Skill[] = [
  {
    id: "sk_multi_agent_audit",
    name: "Multi-agent deep audit",
    domain: "Audit",
    source: "DeepAudit 3.0.4",
    definition:
      "Lead an agent team through a repository, record reasoning, and produce a structured security report.",
    inputs: ["repository", "rules", "model endpoint"],
    outputs: ["findings", "audit log", "report"],
  },
  {
    id: "sk_instant_analysis",
    name: "Instant code analysis",
    domain: "Analysis",
    source: "DeepAudit",
    definition:
      "Scan pasted source or a small upload for obvious risky patterns without a full agent run.",
    inputs: ["source snippet"],
    outputs: ["pattern hits"],
  },
  {
    id: "sk_project_import",
    name: "Project import",
    domain: "Integration",
    source: "DeepAudit",
    definition:
      "Bring a GitHub, GitLab, or Gitea repository into the audit workspace and track it beside other projects.",
    inputs: ["remote url", "credentials ref"],
    outputs: ["project record"],
  },
  {
    id: "sk_report_export",
    name: "Report export",
    domain: "Audit",
    source: "DeepAudit",
    definition: "Export an audit result as PDF, Markdown, or JSON.",
    inputs: ["findings"],
    outputs: ["report file"],
  },
  {
    id: "sk_task_stages",
    name: "Task stage machine",
    domain: "Workflow",
    source: "Natamux",
    definition:
      "Move a coding task through Context, Spec, Plan, Implement, Review, Testing, and Release, with gates the operator approves.",
    inputs: ["task", "repository config"],
    outputs: ["stage evidence", "status"],
  },
  {
    id: "sk_worktree",
    name: "Per-task worktree",
    domain: "Workflow",
    source: "Natamux",
    definition:
      "Give each task its own git worktree, branch, ports, and setup script so agents do not collide.",
    inputs: ["base branch"],
    outputs: ["workspace"],
  },
  {
    id: "sk_agent_fanout",
    name: "Agent fan-out",
    domain: "Agents",
    source: "Natamux",
    definition:
      "Start several agents on the same task and keep the strongest attempt.",
    inputs: ["task", "agent adapters"],
    outputs: ["chosen attempt"],
  },
  {
    id: "sk_legion",
    name: "Cross-machine agent legion",
    domain: "Agents",
    source: "Agent Network",
    definition:
      "Join Claude Code, Codex, Grok Build, and OpenCode nodes on many machines into one hub that hands off work over MCP.",
    inputs: ["node", "hub"],
    outputs: ["dispatch", "files", "logs"],
  },
  {
    id: "sk_commhub",
    name: "CommHub task delivery",
    domain: "Integration",
    source: "Agent Network",
    definition:
      "Expose hub tools over MCP and push tasks in real time over SSE from a self-hosted hub.",
    inputs: ["task"],
    outputs: ["node event"],
  },
  {
    id: "sk_static_catalog",
    name: "Static analysis catalog",
    domain: "Analysis",
    source: "DeepAudit tools.txt",
    definition:
      "Index known source scanners by language so an audit can pick a checker instead of inventing one.",
    inputs: ["language"],
    outputs: ["tool shortlist"],
  },
  {
    id: "sk_exposure_watch",
    name: "Public exposure watch",
    domain: "Audit",
    source: "APIRadar",
    definition:
      "Watch public repositories for exposed provider keys and summarize detection volume. Raw secrets and account folders stay out of this console.",
    inputs: ["public repo stream"],
    outputs: ["detection count", "provider mix"],
  },
  {
    id: "sk_node_graph",
    name: "Visual workflow graph",
    domain: "Workflow",
    source: "NodeTool",
    definition:
      "Compose model and data steps as a node graph with DAG kernel execution, agents, and multi-surface editors.",
    inputs: ["graph", "brief"],
    outputs: ["run", "assets"],
  },
  {
    id: "sk_nt_storyboard",
    name: "Storyboard-to-cut pipeline",
    domain: "Workflow",
    source: "NodeTool",
    definition:
      "Generate stills cheaply, animate approved shots, assemble timeline with narration and music, revise one clip without regenerating the reel.",
    inputs: ["brief", "entities", "style bible"],
    outputs: ["storyboard", "timeline", "export"],
  },
  {
    id: "sk_nt_agent_editors",
    name: "Agent-driven editors",
    domain: "Agents",
    source: "NodeTool",
    definition:
      "Let agents drive storyboard, script/voice, timeline, sketch, and 3D surfaces while the operator can take over at any step.",
    inputs: ["project", "instruction"],
    outputs: ["editor mutations"],
  },
  {
    id: "sk_nt_mcp",
    name: "NodeTool MCP surface",
    domain: "Integration",
    source: "NodeTool",
    definition:
      "Run the same workflows from studio, CLI, or an external agent over MCP.",
    inputs: ["workflow", "mcp client"],
    outputs: ["run result"],
  },
  {
    id: "sk_github_import_live",
    name: "Live GitHub import",
    domain: "Integration",
    source: "Atlas Forge",
    definition:
      "Resolve a public owner/repo, fetch metadata and top-level tree, and add it to the local vault project list.",
    inputs: ["owner/repo or URL"],
    outputs: ["project record"],
  },
];

export const tools: Tool[] = [
  { id: "tl_bandit", name: "Bandit", family: "Python SAST", languages: "Python", role: "Security checks on Python source" },
  { id: "tl_pylint", name: "Pylint", family: "Python SAST", languages: "Python", role: "Defect and style analysis" },
  { id: "tl_semgrepish", name: "flawfinder", family: "C/C++ SAST", languages: "C, C++", role: "Lexical scan for risky calls" },
  { id: "tl_cppcheck", name: "Cppcheck", family: "C/C++ SAST", languages: "C, C++", role: "Static defect checks" },
  { id: "tl_splint", name: "Splint", family: "C/C++ SAST", languages: "C", role: "Annotation-aware C checking" },
  { id: "tl_eslint", name: "ESLint", family: "JavaScript", languages: "JavaScript", role: "Pluggable lint rules" },
  { id: "tl_jshint", name: "JSHint", family: "JavaScript", languages: "JavaScript", role: "Configurable JS checks" },
  { id: "tl_findbugs", name: "FindBugs", family: "Java", languages: "Java", role: "Bytecode bug patterns" },
  { id: "tl_pmd", name: "PMD", family: "Java", languages: "Java", role: "Source defect rules" },
  { id: "tl_phpstan", name: "PHPStan", family: "PHP", languages: "PHP", role: "Static error detection" },
  { id: "tl_rips", name: "RIPS", family: "PHP", languages: "PHP", role: "PHP security audit scanner" },
  { id: "tl_stylecop", name: "StyleCop", family: ".NET", languages: "C#", role: "Style consistency" },
  { id: "tl_fastapi", name: "FastAPI gateway", family: "Runtime", languages: "Python", role: "DeepAudit API surface" },
  { id: "tl_anet", name: "anet CLI", family: "Runtime", languages: "TypeScript", role: "Start hub and nodes" },
  { id: "tl_natamux", name: "natamux CLI", family: "Runtime", languages: "TypeScript", role: "Drive task stages from a shell" },
  { id: "tl_nt_kernel", name: "NodeTool kernel", family: "NodeTool", languages: "TypeScript", role: "DAG runner for node graphs" },
  { id: "tl_nt_agents", name: "NodeTool agents", family: "NodeTool", languages: "TypeScript", role: "LLM task agents over the workspace" },
  { id: "tl_nt_ws", name: "NodeTool websocket", family: "NodeTool", languages: "TypeScript", role: "Realtime studio channel" },
  { id: "tl_nt_hf", name: "Hugging Face nodes", family: "NodeTool", languages: "Python/TS", role: "Local and hub model nodes" },
  { id: "tl_nt_fal", name: "fal nodes", family: "NodeTool", languages: "TypeScript", role: "Cloud media generation nodes" },
  { id: "tl_nt_mcp", name: "NodeTool MCP", family: "NodeTool", languages: "TypeScript", role: "External agent workflow control" },
  { id: "tl_gh_public", name: "GitHub public API", family: "Integration", languages: "HTTP", role: "Import public repo metadata" },
];

export const plugins: Plugin[] = [
  {
    id: "pl_natamux_claude",
    name: "natamux Claude plugin",
    host: "Claude Code",
    purpose: "Skill and hooks that advance a Natamux task from inside the agent.",
  },
  {
    id: "pl_adapters",
    name: "Agent adapters",
    host: "Natamux daemon",
    purpose: "Swap Claude for another agent binary while keeping the same task states.",
  },
  {
    id: "pl_mcp_hub",
    name: "CommHub MCP",
    host: "Agent Network",
    purpose: "Tools a node calls to take, update, and finish hub tasks.",
  },
  {
    id: "pl_github",
    name: "GitHub import",
    host: "DeepAudit / Natamux",
    purpose: "Pull issues and repositories into tasks or audit projects.",
  },
  {
    id: "pl_supabase",
    name: "Supabase persistence",
    host: "DeepAudit",
    purpose: "Optional hosted store beside the local audit database.",
  },
  {
    id: "pl_rules",
    name: "Audit rule packs",
    host: "DeepAudit rules/",
    purpose: "Operator-controlled checks the agent team applies per project.",
  },
  {
    id: "pl_nt_chatgpt",
    name: "ChatGPT plugin pack",
    host: "NodeTool plugins/",
    purpose: "External chat surface hooks into the NodeTool workspace.",
  },
  {
    id: "pl_nt_hf",
    name: "Hugging Face package",
    host: "NodeTool packages/huggingface",
    purpose: "Model hub + local inference nodes inside the graph runtime.",
  },
  {
    id: "pl_nt_electron",
    name: "NodeTool Studio desktop",
    host: "Electron",
    purpose: "Desktop shell for offline-capable studio runs.",
  },
];

export const projects: Project[] = [
  {
    id: "deepaudit",
    name: "DeepAudit 3.0.4",
    kind: "Security audit platform",
    stack: "FastAPI · React 18 · TypeScript · Docker · Supabase",
    size: "63 MB zip plus extracted tree",
    status: "indexed",
    summary:
      "Multi-agent vulnerability audit with dashboard, instant analysis, project import, flow logs, and PDF/Markdown/JSON reports. Public record: 49 CVE IDs and 6 GHSA advisories cited by the project README.",
    gaps: [
      "Full container stack is not started in this preview.",
      "Model provider keys stay outside the browser.",
    ],
  },
  {
    id: "agent-network",
    name: "Agent Network",
    kind: "Multi-machine agent hub",
    stack: "TypeScript · Bun hub · MCP · SQLite · desktop app",
    size: "20 MB zip",
    status: "indexed",
    summary:
      "Self-hosted hub that treats Claude Code, Codex, Grok Build, and OpenCode as nodes. Tasks, files, and rules stay on hardware you control.",
    gaps: ["Desktop binaries are not bundled in this web console."],
  },
  {
    id: "natamux",
    name: "Natamux",
    kind: "Agent development environment",
    stack: "core · daemon · web · cli · Claude plugin",
    size: "5.9 MB zip",
    status: "indexed",
    summary:
      "Parallel coding agents as tasks with stages, worktrees, review diffs, and a Needs-me dashboard.",
    gaps: ["Demo token flow is documented, not wired into this preview."],
  },
  {
    id: "nodetool",
    name: "NodeTool",
    kind: "Agent-first creative workspace",
    stack: "TS monorepo · React web · Electron · Expo · Docker · MCP",
    size: "Extracted Drive tree (1.6 GB zip cataloged)",
    status: "indexed",
    summary:
      "Visual AI workflow platform: DAG kernel, 100+ tools, agents, storyboard/script/timeline/sketch/3D editors, Hugging Face and fal node packs, CLI and MCP. Indexed from Drive folder packages/, plugins/, docs, ARCHITECTURE.md — binary blob not re-copied into this sandbox.",
    gaps: [
      "Full monorepo install is not run in this preview.",
      "Provider API keys stay outside the browser.",
    ],
  },
  {
    id: "apiradar",
    name: "APIRadar",
    kind: "Exposure monitor",
    stack: "Marketing site plus screenshot",
    size: "Homepage capture",
    status: "screenshot",
    summary:
      "Public-repo exposure monitor: detect, then summarize provider mix. This console does not store secrets or account folders.",
    gaps: ["Live GitHub scan is not connected. Counts below are product claims from the capture, not a fresh crawl."],
  },
];

export const advisories: Advisory[] = [
  { id: "GHSA-g353-mgv3-8pcj", project: "OpenClaw", kind: "Signature verification bypass", score: "8.6" },
  { id: "GHSA-99qw-6mr3-36qr", project: "OpenClaw", kind: "Code execution", score: "8.5" },
  { id: "GHSA-7h7g-x2px-94hj", project: "OpenClaw", kind: "Credential exposure", score: "6.9" },
  { id: "CVE-2025-13787", project: "Zentao PMS", kind: "Privilege escalation", score: "9.1" },
  { id: "CVE-2025-64428", project: "DataEase", kind: "JNDI injection", score: "9.8" },
  { id: "CVE-2025-64163", project: "DataEase", kind: "SSRF", score: "9.8" },
  { id: "CVE-2025-64164", project: "DataEase", kind: "JNDI injection", score: "9.8" },
  { id: "CVE-2025-13246", project: "Modulithshop", kind: "SQL injection", score: "6.3" },
  { id: "CVE-2025-11581", project: "PowerJob", kind: "Privilege escalation", score: "7.5" },
  { id: "CVE-2026-1884", project: "Zentao PMS", kind: "SSRF", score: "5.1" },
];

export const relations: Relation[] = [
  { from: "Operator", rel: "opens", to: "Atlas Forge" },
  { from: "Atlas Forge", rel: "indexes", to: "DeepAudit" },
  { from: "Atlas Forge", rel: "indexes", to: "Natamux" },
  { from: "Atlas Forge", rel: "indexes", to: "Agent Network" },
  { from: "DeepAudit", rel: "uses", to: "Static scanners" },
  { from: "DeepAudit", rel: "emits", to: "Findings" },
  { from: "Natamux", rel: "runs", to: "Task stages" },
  { from: "Agent Network", rel: "speaks", to: "MCP hub" },
  { from: "MCP hub", rel: "dispatches", to: "Agent nodes" },
  { from: "Findings", rel: "export", to: "Reports" },
  { from: "Atlas Forge", rel: "indexes", to: "NodeTool" },
  { from: "NodeTool", rel: "runs", to: "DAG kernel" },
  { from: "NodeTool", rel: "exposes", to: "MCP" },
  { from: "Atlas Forge", rel: "imports", to: "GitHub public API" },
];

export const qualityTrend = [
  { day: "Dec 6", score: 84 },
  { day: "Dec 8", score: 79 },
  { day: "Dec 9", score: 86 },
  { day: "Dec 12", score: 91 },
  { day: "Dec 13", score: 88 },
];

export const issueMix = [
  { name: "Security", value: 43 },
  { name: "Bugs", value: 26 },
  { name: "Performance", value: 14 },
  { name: "Maintainability", value: 12 },
  { name: "Style", value: 5 },
];

export const services = [
  { name: "Google Drive", state: "Vault read complete (NodeTool tree indexed)" },
  { name: "GitHub", state: "Live public import on /import" },
  { name: "Vercel", state: "Reauth required — write scope echo-ec69 blocked" },
  { name: "Hugging Face", state: "Present under NodeTool packages/huggingface*" },
];
