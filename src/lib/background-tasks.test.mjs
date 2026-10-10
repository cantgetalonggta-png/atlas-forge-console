import test from "node:test";
import assert from "node:assert/strict";

// Minimal reimplementation of queue concurrency semantics
class MiniManager {
  constructor(max = 2) {
    this.max = max;
    this.running = 0;
    this.queue = [];
    this.results = [];
  }
  enqueue(fn) {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        this.running++;
        try {
          const r = await fn();
          this.results.push(r);
          resolve(r);
        } finally {
          this.running--;
          this.pump();
        }
      });
      this.pump();
    });
  }
  pump() {
    while (this.running < this.max && this.queue.length) {
      const job = this.queue.shift();
      void job();
    }
  }
}

test("manager respects concurrency", async () => {
  const m = new MiniManager(2);
  let concurrent = 0;
  let peak = 0;
  const work = (id) =>
    m.enqueue(async () => {
      concurrent++;
      peak = Math.max(peak, concurrent);
      await new Promise((r) => setTimeout(r, 30));
      concurrent--;
      return id;
    });
  const out = await Promise.all([work(1), work(2), work(3), work(4)]);
  assert.deepEqual(out.sort(), [1, 2, 3, 4]);
  assert.ok(peak <= 2);
});
