import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import {
  LatchClient,
  canonicalize,
  createLatchServer,
  createDemoProvider,
  discover,
  listen,
  runDemoTrace,
  sha256,
  validateInput
} from "../latch.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENTRY = path.join(ROOT, "latch.mjs");
const TEMP = path.join(ROOT, ".test-tmp");
const DIGEST_ZERO = `sha256-${"0".repeat(64)}`;
const input = { sku: "widget", quantity: 2 };

async function fixture(t, options = {}) {
  const counters = { asks: 0, quotes: 0, commits: 0 };
  const card = {
    latch: "0.1",
    name: "Test provider",
    description: "Local conformance fixture",
    endpoint: "http://127.0.0.1/latch",
    capabilities: [
      {
        id: "catalog.read", description: "Read a catalog", mode: "read",
        input: { type: "object", additionalProperties: false }, effects: "none", approval: "never"
      },
      {
        id: "orders.create", description: "Create a test order", mode: "write",
        input: {
          type: "object", additionalProperties: false, required: ["sku", "quantity"],
          properties: { sku: { type: "string", minLength: 1 }, quantity: { type: "integer", minimum: 1 } }
        },
        effects: "irreversible", approval: "required"
      }
    ]
  };
  const server = createLatchServer(card, {
    async ask() { counters.asks++; return { items: [{ sku: "widget" }] }; },
    async quote({ input: value }) {
      counters.quotes++;
      return {
        summary: `${value.quantity} ${value.sku}`,
        terms: { sku: value.sku, quantity: value.quantity, total: value.quantity * 500, currency: "EUR" },
        expires_in: 300
      };
    },
    async commit({ offer }) {
      counters.commits++;
      if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay));
      return { state: options.state || "succeeded", result: { digest: offer.digest, call: counters.commits } };
    }
  }, options.serverOptions);
  const { origin } = await listen(server);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { server, origin, counters, client: new LatchClient(origin) };
}

async function rejectsCode(promise, code, status) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code);
    if (status !== undefined) assert.equal(error.status, status);
    return true;
  });
}

function cli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ENTRY, ...args], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function mcpSession(t, origin) {
  const child = spawn(process.execPath, [ENTRY, "mcp", "--target", origin], { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: child.stdout });
  const waiting = new Map();
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    const waiter = waiting.get(message.id);
    if (waiter) {
      waiting.delete(message.id);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    }
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    lines.close();
  });
  let sequence = 0;
  return async (method, params = {}) => {
    const id = ++sequence;
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiting.delete(id);
        reject(new Error(`MCP response timed out: ${method}`));
      }, 5000);
      waiting.set(id, { resolve, reject, timer });
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return response;
  };
}

test("full discovery, read, quote, approval, commit, and receipt flow", async (t) => {
  const f = await fixture(t);
  const card = await discover(f.origin);
  assert.equal(new URL(card.url).port, new URL(f.origin).port);
  assert.equal(card.endpoint, `${f.origin}/latch`);
  const read = await f.client.ask("catalog.read");
  assert.deepEqual(read.result.items, [{ sku: "widget" }]);
  const quote = await f.client.quote("orders.create", input);
  assert.equal(f.counters.commits, 0, "quote must not execute a write");
  const approval = { decision: "approve", offer_digest: quote.offer.digest, method: "test-explicit", at: new Date().toISOString() };
  const commit = await f.client.commit(quote.offer, approval, "full-flow-key-0000000001");
  const status = await f.client.status(commit.task.id);
  assert.equal(status.state, "succeeded");
  assert.equal(status.receipt.offer_digest, quote.offer.digest);
  assert.equal(status.receipt.evidence, "provider_assertion");
  assert.equal(status.receipt.task_id, commit.task.id);
  assert.equal(f.counters.commits, 1);
});

test("canonical JSON and offer digests are stable but bind exact terms", () => {
  const left = { b: [2, { d: true, c: null }], a: "×" };
  const right = { a: "×", b: [2, { c: null, d: true }] };
  assert.equal(canonicalize(left), canonicalize(right));
  assert.equal(sha256(left), sha256(right));
  assert.notEqual(sha256(left), sha256({ ...left, b: [2, { c: null, d: false }] }));
  assert.equal(sha256({ n: -0 }), sha256({ n: 0 }));
  assert.throws(() => canonicalize({ n: Infinity }), /Non-finite/);
});

test("schema validation rejects invalid input and preserves optional unknown protocol fields", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(validateInput({ value: 2 }, { type: "object", properties: { value: { type: "integer" } } }), []);
  await rejectsCode(f.client.call("quote", { capability: "orders.create", input: { sku: "widget", quantity: 0 }, future: { tolerated: true } }), "invalid_input", 422);
  const response = await f.client.call("quote", { capability: "orders.create", input, future: { tolerated: true } });
  assert.equal(response.state, "offered");
});

test("a changed offer digest cannot be committed", async (t) => {
  const f = await fixture(t);
  const { offer } = await f.client.quote("orders.create", input);
  await rejectsCode(f.client.call("commit", {
    offer: offer.id, offer_digest: DIGEST_ZERO,
    approval: { decision: "approve", offer_digest: DIGEST_ZERO }
  }, { idempotencyKey: "wrong-offer-key-00000001" }), "offer_digest_mismatch", 409);
  assert.equal(f.counters.commits, 0);
});

test("approval for another offer is rejected", async (t) => {
  const f = await fixture(t);
  const { offer } = await f.client.quote("orders.create", input);
  await rejectsCode(f.client.call("commit", {
    offer: offer.id, offer_digest: offer.digest,
    approval: { decision: "approve", offer_digest: DIGEST_ZERO }
  }, { idempotencyKey: "wrong-approval-key-000001" }), "approval_digest_mismatch", 409);
  assert.equal(f.counters.commits, 0);
});

test("expired offers return 410 and never execute", async (t) => {
  let time = Date.parse("2026-11-04T12:00:00.000Z");
  class Clock extends Date {
    constructor(value) { super(value === undefined ? time : value); }
  }
  const f = await fixture(t, { serverOptions: { clock: Clock } });
  const { offer } = await f.client.quote("orders.create", input);
  time += 301_000;
  await rejectsCode(f.client.commit(offer, { decision: "approve", offer_digest: offer.digest }, "expired-offer-key-0000001"), "offer_expired", 410);
  assert.equal(f.counters.commits, 0);
});

test("a serialized idempotency replay returns the original task with a new correlation ID", async (t) => {
  const f = await fixture(t);
  const { offer } = await f.client.quote("orders.create", input);
  const approval = { decision: "approve", offer_digest: offer.digest };
  const first = await f.client.commit(offer, approval, "repeat-commit-key-000001");
  const second = await f.client.commit(offer, approval, "repeat-commit-key-000001");
  assert.notEqual(first.id, second.id);
  assert.equal(first.task.id, second.task.id);
  assert.deepEqual(first.receipt, second.receipt);
  assert.equal(f.counters.commits, 1);
});

test("concurrent idempotent commits invoke the handler once", async (t) => {
  const f = await fixture(t, { delay: 40 });
  const { offer } = await f.client.quote("orders.create", input);
  const approval = { decision: "approve", offer_digest: offer.digest };
  const [first, second, third] = await Promise.all([
    f.client.commit(offer, approval, "concurrent-commit-key-0001"),
    f.client.commit(offer, approval, "concurrent-commit-key-0001"),
    f.client.commit(offer, approval, "concurrent-commit-key-0001")
  ]);
  assert.equal(f.counters.commits, 1);
  assert.equal(new Set([first.task.id, second.task.id, third.task.id]).size, 1);
  assert.equal(new Set([first.id, second.id, third.id]).size, 3);
});

test("reusing an idempotency key for different content returns 409", async (t) => {
  const f = await fixture(t);
  const { offer } = await f.client.quote("orders.create", input);
  await f.client.commit(offer, { decision: "approve", offer_digest: offer.digest }, "conflicting-key-000000001");
  await rejectsCode(f.client.commit(offer, { decision: "approve", offer_digest: offer.digest, at: new Date().toISOString() }, "conflicting-key-000000001"), "idempotency_conflict", 409);
  assert.equal(f.counters.commits, 1);
});

test("approval proof affects authorization but not replay identity", async (t) => {
  const f = await fixture(t);
  const { offer } = await f.client.quote("orders.create", input);
  const first = await f.client.commit(offer, { decision: "approve", offer_digest: offer.digest, proof: "secret" }, "proof-replay-key-00000001");
  const second = await f.client.commit(offer, { decision: "approve", offer_digest: offer.digest, proof: "rotated" }, "proof-replay-key-00000001");
  assert.equal(first.task.id, second.task.id);
  assert.equal(f.counters.commits, 1);
});

test("unknown tasks return 404 and terminal tasks cannot be cancelled", async (t) => {
  const f = await fixture(t);
  await rejectsCode(f.client.status("task_missing"), "task_not_found", 404);
  const { offer } = await f.client.quote("orders.create", input);
  const { task } = await f.client.commit(offer, { decision: "approve", offer_digest: offer.digest }, "terminal-cancel-key-000001");
  await rejectsCode(f.client.cancel(task.id), "task_not_cancellable", 409);
});

test("an accepted task can be cancelled without claiming a rollback", async (t) => {
  const f = await fixture(t, { state: "accepted" });
  const { offer } = await f.client.quote("orders.create", input);
  const { task } = await f.client.commit(offer, { decision: "approve", offer_digest: offer.digest }, "accepted-cancel-key-000001");
  const cancelled = await f.client.cancel(task.id);
  assert.equal(cancelled.state, "cancelled");
  assert.equal(cancelled.task.id, task.id);
});

test("cross-origin and public plaintext endpoints are rejected", async () => {
  const card = {
    latch: "0.1", name: "Remote", description: "URL policy fixture", endpoint: "https://elsewhere.example/latch",
    capabilities: [{ id: "read", description: "Read", mode: "read", input: { type: "object" }, effects: "none", approval: "never" }]
  };
  await rejectsCode(new LatchClient("https://service.example", { card }).connect(), "cross_origin_endpoint", 403);
  card.endpoint = "http://service.example/latch";
  await rejectsCode(new LatchClient("http://service.example", { card }).connect(), "https_required");
});

test("discovery refuses to follow redirects", async (t) => {
  const server = http.createServer((request, response) => {
    response.writeHead(302, { location: "https://example.com/latch.json" });
    response.end();
  });
  const { origin } = await listen(server);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await rejectsCode(discover(origin), "redirect_rejected");
});

test("CLI refuses a mismatched --yes before any network request", async (t) => {
  const f = await fixture(t);
  let requests = 0;
  f.server.on("request", () => { requests++; });
  const result = await cli(["commit", f.origin, "off_test", "--digest", DIGEST_ZERO, "--yes", `sha256-${"1".repeat(64)}`]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /approval_digest_mismatch/);
  assert.equal(requests, 0);
  assert.equal(f.counters.commits, 0);
});

test("MCP bridge lists tools and performs read, quote, approval, and commit", async (t) => {
  const f = await fixture(t);
  const rpc = mcpSession(t, f.origin);
  const initialized = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
  assert.equal(initialized.result.serverInfo.name, "latch");
  const tools = await rpc("tools/list");
  assert.equal(tools.result.tools.length, 5);
  const read = await rpc("tools/call", { name: "latch_ask", arguments: { capability: "catalog.read", input: {} } });
  assert.equal(read.result.structuredContent.state, "succeeded");
  const quoted = await rpc("tools/call", { name: "latch_quote", arguments: { capability: "orders.create", input } });
  const offer = quoted.result.structuredContent.offer;
  assert.equal(f.counters.commits, 0);
  const committed = await rpc("tools/call", {
    name: "latch_commit",
    arguments: { offer, approval: { decision: "approve", offer_digest: offer.digest }, idempotency_key: "mcp-commit-key-000000001" }
  });
  assert.equal(committed.result.structuredContent.state, "succeeded");
  assert.equal(f.counters.commits, 1);
});

test("invite is reviewable text and makes no connection", async (t) => {
  const f = await fixture(t);
  let requests = 0;
  f.server.on("request", () => { requests++; });
  const result = await cli(["invite", f.origin]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /https:\/\/github.com\/Balanov\/latch/);
  assert.match(result.stdout, /This invite is only text/);
  assert.equal(requests, 0);
  assert.equal(f.counters.commits, 0);
});

test("init writes a non-destructive provider scaffold and validates its card", async (t) => {
  await mkdir(TEMP, { recursive: true });
  const directory = await mkdtemp(path.join(TEMP, "scaffold-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = path.join(directory, "provider");
  const created = await cli(["init", target, "--name", "Fixture Service"]);
  assert.equal(created.code, 0);
  const card = JSON.parse(await readFile(path.join(target, "latch.json"), "utf8"));
  assert.equal(card.name, "Fixture Service");
  const validated = await cli(["validate", path.join(target, "latch.json")]);
  assert.equal(validated.code, 0);
  const original = await readFile(path.join(target, "service.mjs"), "utf8");
  const duplicate = await cli(["init", target]);
  assert.equal(duplicate.code, 1);
  assert.equal(await readFile(path.join(target, "service.mjs"), "utf8"), original);
  await stat(path.join(target, "package.json"));
});

test("demo trace records full envelopes, HTTP headers, and a simulation disclaimer", async (t) => {
  await mkdir(TEMP, { recursive: true });
  const directory = await mkdtemp(path.join(TEMP, "trace-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = path.join(directory, "trace.json");
  const trace = await runDemoTrace(target);
  assert.deepEqual(trace.steps.map((step) => step.name), ["discover", "ask", "quote", "approve", "commit", "receipt"]);
  for (const name of ["ask", "quote", "commit", "receipt"]) {
    const step = trace.steps.find((item) => item.name === name);
    assert.equal(step.request.body.latch, "0.1");
    assert.match(step.request.body.id, /^req_/);
    assert.equal(step.request.url, trace.steps[0].response.endpoint);
  }
  const commit = trace.steps.find((step) => step.name === "commit");
  assert.equal(commit.request.headers["idempotency-key"], "demo-trace-idempotency-key-0001");
  assert.equal(commit.request.body.idempotency_key, undefined);
  assert.equal(trace.steps[3].request.local, true);
  assert.equal(trace.steps.at(-1).response.receipt.evidence, "provider_assertion");
  assert.match(trace.note, /no payment, manufacturing, or delivery occurred/);
  assert.deepEqual(JSON.parse(await readFile(target, "utf8")), trace);
});

test("demo provider always declares its simulated effects", async (t) => {
  const server = createDemoProvider();
  const { origin } = await listen(server);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const client = new LatchClient(origin);
  const { offer } = await client.quote("print3d.order", {
    model_url: "https://example.com/model.stl", material: "pla", quantity: 1,
    delivery: { country: "NL", postal_code: "1011" }
  });
  assert.equal(offer.terms.simulation, true);
  const result = await client.commit(offer, { decision: "approve", offer_digest: offer.digest }, "simulation-key-0000000001");
  assert.equal(result.task.result.status, "recorded_simulation");
  assert.match(result.task.result.note, /No object was printed/);
});

test.after(async () => {
  await rm(TEMP, { recursive: true, force: true });
});
