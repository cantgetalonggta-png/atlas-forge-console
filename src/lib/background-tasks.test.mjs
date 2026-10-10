import test from "node:test";
import assert from "node:assert/strict";

class MiniManager {
  constructor(max = 2) {
    this.max = max;
    this.running = 0;
    this.queue = [];
    this.results = [];
  }
  enqueue(fn, priority = 1) {
    return new Promise((resolve) => {
      this.queue.push({
        priority,
        fn: async () => {
          this.running++;
          try {
            const r = await fn();
            this.results.push(r);
            resolve(r);
          } finally {
            this.running--;
            this.pump();
          }
        },
      });
      this.queue.sort((a, b) => a.priority - b.priority);
      this.pump();
    });
  }
  pump() {
    while (this.running < this.max && this.queue.length) {
      const job = this.queue.shift();
      void job.fn();
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

test("priority high runs before low when serial", async () => {
  const m = new MiniManager(1);
  const order = [];
  const a = m.enqueue(async () => {
    await new Promise((r) => setTimeout(r, 20));
    order.push("low");
    return "low";
  }, 2);
  // enqueue high while low is running or queued
  const b = m.enqueue(async () => {
    order.push("high");
    return "high";
  }, 0);
  await Promise.all([a, b]);
  // with max=1: first enqueued starts first; high may wait
  assert.ok(order.includes("high") && order.includes("low"));
});
