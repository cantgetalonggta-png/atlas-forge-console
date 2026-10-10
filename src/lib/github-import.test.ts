import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseDockerHubInput,
  parseGithubInput,
  parseHuggingFaceInput,
  projectFromImport,
} from "./github-import.ts";

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

test("parse huggingface", () => {
  assert.deepEqual(parseHuggingFaceInput("openai/whisper-large-v3"), {
    owner: "openai",
    repo: "whisper-large-v3",
  });
});

test("parse docker official", () => {
  assert.deepEqual(parseDockerHubInput("nginx"), {
    owner: "library",
    repo: "nginx",
  });
  assert.deepEqual(parseDockerHubInput("library/postgres"), {
    owner: "library",
    repo: "postgres",
  });
});

test("projectFromImport labels source", () => {
  const p = projectFromImport({
    id: "hf_x",
    owner: "o",
    name: "m",
    fullName: "o/m",
    description: "d",
    url: "https://huggingface.co/o/m",
    defaultBranch: "main",
    language: "diffusers",
    stars: 1,
    private: false,
    topics: [],
    topLevel: [],
    importedAt: "2026-01-01",
    source: "huggingface",
  });
  assert.equal(p.kind, "Hugging Face");
});
