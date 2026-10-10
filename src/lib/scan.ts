export type Hit = {
  rule: string;
  line: number;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  snippet?: string;
};

const rules: {
  id: string;
  severity: Hit["severity"];
  detail: string;
  test: RegExp;
}[] = [
  {
    id: "dynamic-exec",
    severity: "high",
    detail: "Dynamic execution call",
    test: /\b(eval|exec|Function)\s*\(/,
  },
  {
    id: "shell",
    severity: "high",
    detail: "Shell invocation",
    test: /\b(os\.system|subprocess|child_process|popen)\b/,
  },
  {
    id: "sql-concat",
    severity: "high",
    detail: "String built into a query",
    test: /(SELECT|INSERT|UPDATE|DELETE).{0,40}\+|`\s*SELECT/i,
  },
  {
    id: "secret-assign",
    severity: "high",
    detail: "Possible hardcoded secret assignment",
    test: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{6,}['"]/i,
  },
  {
    id: "openai-key",
    severity: "critical",
    detail: "OpenAI API key shape (sk- / sk-proj-)",
    test: /\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}\b/,
  },
  {
    id: "github-pat",
    severity: "critical",
    detail: "GitHub token shape (ghp_ / github_pat_)",
    test: /\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    id: "google-api-key",
    severity: "critical",
    detail: "Google API key shape (AIza…)",
    test: /\bAIza[0-9A-Za-z\-_]{20,}\b/,
  },
  {
    id: "aws-key",
    severity: "critical",
    detail: "AWS-style access key shape",
    test: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "slack-token",
    severity: "critical",
    detail: "Slack token shape",
    test: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: "jwt-hardcoded",
    severity: "medium",
    detail: "Possible hardcoded JWT",
    test: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    id: "private-key-block",
    severity: "critical",
    detail: "PEM private key block",
    test: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    id: "inner-html",
    severity: "medium",
    detail: "HTML injection sink",
    test: /innerHTML\s*=|dangerouslySetInnerHTML/,
  },
  {
    id: "debug",
    severity: "low",
    detail: "Debug leftover",
    test: /\b(console\.log|debugger|print\()\b/,
  },
];

export function scanSource(source: string): Hit[] {
  const hits: Hit[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.test.test(line)) {
        hits.push({
          rule: rule.id,
          line: index + 1,
          detail: rule.detail,
          severity: rule.severity,
          snippet: line.trim().slice(0, 160),
        });
      }
    }
  });
  return hits;
}

export const SCAN_RULE_IDS = rules.map((r) => r.id);
