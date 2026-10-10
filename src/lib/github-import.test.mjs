import { test } from "node:test";
import assert from "node:assert/strict";

const RE_URL =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;
const RE_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

function parseGithubInput(raw) {
  const trimmed = raw.trim().replace(/\/$/, "");
  const url = trimmed.match(RE_URL);
  if (url) return { owner: url[1], repo: url[2].replace(/\.git$/i, "") };
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2].replace(/\.git$/i, "") };
  return null;
}

function parseDockerHubInput(raw) {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (/^[A-Za-z0-9_.-]+$/.test(trimmed)) return { owner: "library", repo: trimmed };
  const slug = trimmed.match(RE_SLUG);
  if (slug) return { owner: slug[1], repo: slug[2] };
  return null;
}

test("parse github slug and url", () => {
  assert.deepEqual(parseGithubInput("nodetool-ai/nodetool"), {
    owner: "nodetool-ai",
    repo: "nodetool",
  });
  assert.deepEqual(parseGithubInput("https://github.com/a/b.git"), {
    owner: "a",
    repo: "b",
  });
});

test("parse docker official", () => {
  assert.deepEqual(parseDockerHubInput("nginx"), {
    owner: "library",
    repo: "nginx",
  });
});
