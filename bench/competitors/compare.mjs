import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createLatchServer, LatchClient, listen } from "../../latch.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const COUNT = Number(process.env.LATCH_BENCH_COUNT || 100);
const PARALLEL = Number(process.env.LATCH_BENCH_PARALLEL || 50);
const ROUNDS = Number(process.env.LATCH_BENCH_ROUNDS || 4);
const PAYLOAD = "x".repeat(16 * 1024);
const report = {
  schema: "latch-equivalent-local-comparison/v1",
  timestamp: new Date().toISOString(),
  environment: { node: process.version, os: `${process.platform} ${os.release()} ${process.arch}`, cpu: os.cpus()[0]?.model },
  methodology: {
    operation: "One read with the same business input and echo result. Native protocol envelopes are retained.",
    topology: "Client and server in one Node.js process; real HTTP over loopback. No TLS, WAN, physical effects, persistent storage, or production authentication.",
    official_mcp_server: "@modelcontextprotocol/sdk 1.32.2; official documented per-request stateless pattern: new McpServer and StreamableHTTPServerTransport per request, createMcpExpressApp, sessionIdGenerator undefined",
    rejected_alternative: "Reusing a stateless transport across requests was tested and rejected by the SDK: 'Stateless transport cannot be reused across requests. Create a new transport per request.' No unsupported shared-transport result is included.",
    raw_baseline: "Minimal node:http JSON handler and global fetch; no validation, discovery, approval, or receipt. A lower-bound baseline, not an equivalent safety implementation.",
    repetitions: `${ROUNDS} rotated rounds × ${COUNT} measured calls per case after 10 warmups per round. Concurrency: ${PARALLEL} in flight. Cold starts: 30 child processes after 5 warmups.`,
    fairness: "One local read path only. Not a general protocol ranking or proof of quote/commit, WAN, or other-runtime performance."
  },
  rounds: [],
  results: {}
};

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const pick = (p) => sorted[Math.ceil(sorted.length * p) - 1];
  return { n: samples.length, median_ms: pick(0.5), p95_ms: pick(0.95), mean_ms: samples.reduce((a, b) => a + b, 0) / samples.length, min_ms: sorted[0], max_ms: sorted.at(-1) };
}
async function timed(fn, count = COUNT, warmup = 10) {
  const samples = [];
  for (let i = 0; i < count + warmup; i++) {
    const start = performance.now();
    await fn(i);
    if (i >= warmup) samples.push(performance.now() - start);
  }
  return samples;
}
async function concurrent(fn) {
  const samples = [];
  const start = performance.now();
  for (let i = 0; i < COUNT; i += PARALLEL) {
    await Promise.all(Array.from({ length: Math.min(PARALLEL, COUNT - i) }, async () => {
      const before = performance.now();
      await fn();
      samples.push(performance.now() - before);
    }));
  }
  return { samples, throughput_per_second: samples.length / ((performance.now() - start) / 1000) };
}
async function firstContact(connect) {
  const samples = [];
  for (let i = 0; i < 15; i++) {
    const start = performance.now();
    const close = await connect();
    samples.push(performance.now() - start);
    await close();
  }
  return samples;
}
async function listenRaw(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}
const close = (server) => new Promise((resolve) => server.close(resolve));
const verify = (actual, input) => {
  if (actual !== (input.text || "ok")) throw new Error("Fixture result mismatch");
};

async function rawBaseline() {
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const { input } = JSON.parse(Buffer.concat(chunks).toString());
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ result: { echo: input.text || "ok" } }));
  });
  const origin = await listenRaw(server);
  return {
    server,
    async call(input) {
      const response = await fetch(`${origin}/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "read", input }) });
      verify((await response.json()).result.echo, input);
    }
  };
}
async function latchBaseline() {
  const server = createLatchServer({
    latch: "0.1", name: "Benchmark", description: "Equivalent read fixture", endpoint: "http://127.0.0.1/latch",
    capabilities: [{ id: "catalog.read", description: "Echo", mode: "read", input: { type: "object", additionalProperties: false, properties: { text: { type: "string", maxLength: 16384 } } }, effects: "none", approval: "never" }]
  }, { ask: async ({ input }) => ({ echo: input.text || "ok" }) });
  const { origin } = await listen(server);
  const client = new LatchClient(origin);
  await client.connect();
  return {
    server,
    connect: async () => {
      const other = new LatchClient(origin);
      await other.connect();
      return async () => {};
    },
    async call(input) {
      verify((await client.ask("catalog.read", input)).result.echo, input);
    }
  };
}
async function mcpBaseline() {
  const app = createMcpExpressApp();
  app.post("/mcp", async (request, response) => {
    const server = new McpServer({ name: "equivalent-benchmark", version: "1.0.0" });
    server.registerTool("catalog_read", {
      description: "Echo the same fixture as LATCH and raw HTTP",
      inputSchema: { text: z.string().max(16384).optional() }
    }, async ({ text }) => ({ content: [{ type: "text", text: JSON.stringify({ echo: text || "ok" }) }] }));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      if (!response.headersSent) response.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
      console.error(error);
    } finally {
      response.on("close", () => {
        transport.close();
        server.close();
      });
    }
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  const connect = async () => {
    const client = new Client({ name: "benchmark-client", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`)));
    return client;
  };
  const client = await connect();
  return {
    server,
    client,
    connect: async () => {
      const other = await connect();
      return () => other.close();
    },
    async call(input) {
      const result = await client.callTool({ name: "catalog_read", arguments: input });
      verify(JSON.parse(result.content[0].text).echo, input);
    }
  };
}
async function measure(name, setup, round) {
  console.log(`Round ${round + 1}: measuring ${name}...`);
  const context = await setup();
  try {
    const small = await timed(() => context.call({}));
    const large = await timed(() => context.call({ text: PAYLOAD }));
    const parallel = await concurrent(() => context.call({}));
    const summary = {
      round: round + 1,
      name,
      warm_read: stats(small),
      payload_16k: stats(large),
      concurrent: { ...stats(parallel.samples), throughput_per_second: parallel.throughput_per_second }
    };
    const target = report.results[name] ||= { contact: [], elapsed_seconds: 0, samples: { small: [], large: [], concurrent: [] } };
    target.samples.small.push(...small);
    target.samples.large.push(...large);
    target.samples.concurrent.push(...parallel.samples);
    target.elapsed_seconds += parallel.samples.length / parallel.throughput_per_second;
    if (context.connect) {
      const contacts = await firstContact(context.connect);
      target.contact.push(...contacts);
      summary.first_contact = stats(contacts);
    }
    report.rounds.push(summary);
  } finally {
    await context.client?.close();
    await close(context.server);
  }
}
const orders = [
  [["raw", rawBaseline], ["latch", latchBaseline], ["mcp", mcpBaseline]],
  [["latch", latchBaseline], ["mcp", mcpBaseline], ["raw", rawBaseline]],
  [["mcp", mcpBaseline], ["raw", rawBaseline], ["latch", latchBaseline]],
  [["raw", rawBaseline], ["latch", latchBaseline], ["mcp", mcpBaseline]]
];
for (let round = 0; round < ROUNDS; round++) {
  for (const [name, setup] of orders[round % orders.length]) await measure(name, setup, round);
}
for (const [name, data] of Object.entries(report.results)) {
  report.results[name] = {
    warm_read: stats(data.samples.small),
    payload_16k: stats(data.samples.large),
    concurrent: { ...stats(data.samples.concurrent), throughput_per_second: data.samples.concurrent.length / data.elapsed_seconds },
    ...(data.contact.length ? { first_contact: stats(data.contact) } : {}),
    raw_samples_ms: data.samples
  };
}

for (const target of ["raw", "latch", "mcp"]) {
  const samples = await timed(() => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "bench", "competitors", "cold.mjs"), target], { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Cold start ${target}: ${code}`)));
  }), 30, 5);
  report.results[target].cold_process = stats(samples);
  report.results[target].cold_samples_ms = samples;
}
const timestamp = report.timestamp.replaceAll(":", "-");
await mkdir(path.join(root, "bench", "results"), { recursive: true });
await writeFile(path.join(root, "bench", "results", `comparison-${timestamp}.json`), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(root, "bench", "results", "comparison-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, result] of Object.entries(report.results)) {
  console.log(JSON.stringify({ name, first_contact_ms: result.first_contact?.median_ms, warm_read_ms: result.warm_read.median_ms, payload_16k_ms: result.payload_16k.median_ms, concurrent_p95_ms: result.concurrent.p95_ms, throughput_per_second: result.concurrent.throughput_per_second, cold_process_ms: result.cold_process.median_ms }));
}
