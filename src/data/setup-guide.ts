export type BinaryInstall = {
  id: string;
  product: string;
  role: string;
  whyNotInWeb: string;
  platforms: string[];
  downloadUrl: string;
  docsUrl: string;
  installSteps: string[];
  verifyCommands: string[];
  notes: string[];
};

export const binaryInstalls: BinaryInstall[] = [
  {
    id: "agent-network-desktop",
    product: "Agent Network Desktop",
    role: "Local hub + node manager GUI (macOS / Windows / Android)",
    whyNotInWeb:
      "Desktop apps ship OS installers (.dmg / .exe / APK). Browsers cannot install native agent runtimes or own your local Claude/Codex/Grok sessions. Atlas Forge indexes and links them; your machine runs the binary.",
    platforms: ["macOS", "Windows", "Android"],
    downloadUrl: "https://github.com/sleep2agi/agent-network-app/releases/latest",
    docsUrl: "https://anet.sh/guide/desktop-app",
    installSteps: [
      "Open https://anet.sh or the GitHub releases page above.",
      "Download the installer for your OS (macOS .dmg, Windows .exe, Android APK).",
      "Install, then choose Local workspace so the built-in Hub starts on this machine.",
      "In Servers, install and start the local anet daemon.",
      "Create a node (claude-code-cli, codex, grok-build, or opencode) and wait for SSE connected.",
      "Optional: anet hub dashboard opens Web UI at http://localhost:3000.",
    ],
    verifyCommands: [
      "curl -fsSL https://anet.sh/install.sh | sh",
      "npm i -g bun",
      "anet hub start",
      "anet login --hub http://127.0.0.1:9200 --username admin",
      "anet node create my-bot && anet node start my-bot",
    ],
    notes: [
      "Requires Node.js ≥ 22.13 for CLI path.",
      "Change admin password immediately on public deploy (anet passwd).",
      "Hub + SQLite stay self-hosted — no SaaS lock-in.",
    ],
  },
  {
    id: "nodetool-studio",
    product: "NodeTool Studio",
    role: "Agent-first creative desktop (Electron) with local models",
    whyNotInWeb:
      "Studio is a multi-GB Electron app with GPU model runtimes, file system access, and offline assets. Atlas Forge catalogs its architecture and Drive tree; you install Studio from GitHub Releases on your workstation.",
    platforms: ["macOS", "Windows", "Linux"],
    downloadUrl: "https://github.com/nodetool-ai/nodetool/releases/latest",
    docsUrl: "https://docs.nodetool.ai/",
    installSteps: [
      "Open the latest NodeTool release on GitHub.",
      "Download the package for your OS and install.",
      "Launch Studio → Settings → Models & Providers; add API keys or local model paths.",
      "Create a project; try storyboard or node graph.",
      "Optional Docker: use repo docker-compose.yml for server mode.",
      "Optional MCP: point external agents at NodeTool MCP surface (docs).",
    ],
    verifyCommands: [
      "# After install, open Studio UI",
      "# Docker path (from cloned monorepo):",
      "docker compose up -d",
    ],
    notes: [
      "Local models need sufficient VRAM/RAM.",
      "Provider keys never leave your machine unless you choose a cloud provider.",
    ],
  },
  {
    id: "natamux",
    product: "Natamux ADE",
    role: "Parallel coding agents with task stages, worktrees, dashboard",
    whyNotInWeb:
      "Natamux needs a local daemon, git worktrees, terminals, and Claude (or adapter) binaries on the host. The web UI talks to that daemon — it is not a pure browser app.",
    platforms: ["Linux", "macOS", "Codespaces", "Docker"],
    downloadUrl: "https://github.com/lenhatthanh20/natamux",
    docsUrl: "https://github.com/lenhatthanh20/natamux/blob/main/docs/docker.md",
    installSteps: [
      "Clone https://github.com/lenhatthanh20/natamux",
      "Install pnpm and Node (see package engines).",
      "Run scripts/dev.sh demo (or seed) — opens dashboard on port 5173.",
      "Sign in with token devtoken for the demo.",
      "For real agents: install Claude Code (or configured adapter), then scripts/dev.sh up.",
      "Desktop package optional under packages/desktop when building from monorepo.",
    ],
    verifyCommands: [
      "git clone https://github.com/lenhatthanh20/natamux && cd natamux",
      "scripts/dev.sh demo",
      "# open http://localhost:5173 token=devtoken",
    ],
    notes: [
      "No telemetry (see PRIVACY.md).",
      "Each task gets its own worktree/ports via .natamux-setup.",
    ],
  },
  {
    id: "deepaudit",
    product: "DeepAudit 3.x",
    role: "Multi-agent security audit platform (API + React dashboard)",
    whyNotInWeb:
      "DeepAudit runs FastAPI, Docker services, optional Supabase, and LLM providers. Atlas Forge embeds the vault ontology and instant snippet scan; full container stack runs on your infra.",
    platforms: ["Docker", "Linux"],
    downloadUrl: "https://github.com/search?q=DeepAudit&type=repositories",
    docsUrl: "https://github.com/search?q=DeepAudit+3.0&type=repositories",
    installSteps: [
      "Obtain the DeepAudit 3.0 pack from your Drive vault (DeepAudit-3.0.0.zip) or upstream repo.",
      "Extract, copy .env.example → .env, set model endpoint + keys.",
      "docker compose up -d (or project-specific start script).",
      "Open the dashboard URL from the README (typically localhost).",
      "Import a GitHub project and run multi-agent audit.",
    ],
    verifyCommands: [
      "docker compose ps",
      "curl -fsS http://127.0.0.1:8000/health || true",
    ],
    notes: [
      "Model keys stay server-side.",
      "Atlas Forge Analyze is the browser-safe snippet scanner only.",
    ],
  },

  {
    id: "deer-flow",
    product: "DeerFlow platform",
    role: "Full agent monorepo (Python backend + frontend + skills)",
    whyNotInWeb:
      "DeerFlow includes long-running workers, channel integrations, and Docker images. Atlas Forge indexes the zip and exposes a FastAPI control API under ROOT_WORKSPACE/backend; you run DeerFlow itself on your infra.",
    platforms: ["Linux", "macOS", "Docker"],
    downloadUrl: "https://github.com/search?q=deer-flow&type=repositories",
    docsUrl: "https://github.com/search?q=deer-flow&type=repositories",
    installSteps: [
      "Obtain deer-flow-main.zip from Drive or clone upstream.",
      "Extract; copy .env.example → .env and set model/channel secrets.",
      "Install Python backend deps (see backend pyproject/requirements).",
      "Install frontend deps from frontend/package.json.",
      "Use smoke-test skill scripts under .agent/skills/smoke-test/scripts/.",
      "Optional: run Atlas ROOT_WORKSPACE/backend API alongside the console.",
    ],
    verifyCommands: [
      "cd ROOT_WORKSPACE/backend && pytest -q",
      "uvicorn app.main:app --port 8000",
      "curl -fsS http://127.0.0.1:8000/health",
    ],
    notes: [
      "Agent skills live under skills/ after distill (blocking-io-guard, etc.).",
      "Do not commit channel secrets.",
    ],
  },
];

export const hostTooling = [
  {
    name: "Node.js",
    min: "≥ 22.12 (22.13+ for Agent Network CLI)",
    install: "https://nodejs.org/ or nvm install 22",
  },
  {
    name: "Docker + Compose",
    min: "Docker Engine 24+",
    install: "https://docs.docker.com/get-docker/",
  },
  {
    name: "Git",
    min: "2.40+",
    install: "https://git-scm.com/downloads",
  },
  {
    name: "Bun",
    min: "latest (Agent Network Hub)",
    install: "npm i -g bun",
  },
  {
    name: "pnpm",
    min: "9+ (Natamux monorepo)",
    install: "corepack enable && corepack prepare pnpm@latest --activate",
  },
  {
    name: "Claude Code / Codex / Grok CLI",
    min: "latest signed-in runtimes",
    install:
      "Install each vendor CLI and complete login (claude auth login, codex login, grok login).",
  },
];
