import assert from "node:assert/strict";
import test from "node:test";
import { plugins, projects, skills, tools } from "./vault.ts";
import { scanSource } from "../lib/scan.ts";

test("vault has the indexed trees", () => {
  assert.ok(skills.length >= 10);
  assert.ok(tools.length >= 10);
  assert.ok(plugins.length >= 4);
  assert.equal(projects.length, 5);
  assert.ok(skills.every((skill) => skill.definition.length > 20));
});

test("scanner flags the sample sinks", () => {
  const hits = scanSource("eval(x)\npassword = \"hunter2secret\"\n");
  assert.ok(hits.some((hit) => hit.rule === "dynamic-exec"));
  assert.ok(hits.some((hit) => hit.rule === "secret-assign"));
});
