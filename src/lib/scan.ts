export type Hit = {
  rule: string;
  line: number;
  detail: string;
  severity: "high" | "medium" | "low";
};

const rules: { id: string; severity: Hit["severity"]; detail: string; test: RegExp }[] = [
  { id: "dynamic-exec", severity: "high", detail: "Dynamic execution call", test: /\b(eval|exec|Function)\s*\(/ },
  { id: "shell", severity: "high", detail: "Shell invocation", test: /\b(os\.system|subprocess|child_process|popen)\b/ },
  { id: "sql-concat", severity: "high", detail: "String built into a query", test: /(SELECT|INSERT|UPDATE|DELETE).{0,40}\+|`\s*SELECT/i },
  { id: "secret-assign", severity: "medium", detail: "Possible hardcoded secret", test: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { id: "aws-key", severity: "high", detail: "AWS-style access key shape", test: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "inner-html", severity: "medium", detail: "HTML injection sink", test: /innerHTML\s*=|dangerouslySetInnerHTML/ },
  { id: "debug", severity: "low", detail: "Debug leftover", test: /\b(console\.log|debugger|print\()\b/ },
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
        });
      }
    }
  });
  return hits;
}
