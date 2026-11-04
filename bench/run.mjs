import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoProvider, listen, LatchClient } from "../latch.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const started = new Date();
const stamp = started.toISOString().replaceAll(":", "-");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const source = await readFile(path.join(root, "latch.mjs"));

function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
function summarize(samples) {
  return {
    samples: samples.length,
    mean_ms: samples.reduce((a, b) => a + b, 0) / samples.length,
    median_ms: percentile(samples, 0.5),
    p95_ms: percentile(samples, 0.95),
    min_ms: Math.min(...samples),
    max_ms: Math.max(...samples)
  };
}
async function measure(target, count, warmup = 5) {
  const samples = [];
  for (let i = 0; i < count + warmup; i++) {
    const start = performance.now();
    await target(i);
    const duration = performance.now() - start;
    if (i >= warmup) samples.push(duration);
  }
  return samples;
}
async function coldStart() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "latch.mjs"), "--version"], { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Cold start exited ${code}`)));
  });
}

const cold = await measure(coldStart, 60, 10);
const server = createDemoProvider();
const { origin } = await listen(server);
const operations = {};
const full = [];
try {
  const client = new LatchClient(origin);
  await client.connect();
  const approvalFor = (offer) => ({ decision: "approve", offer_digest: offer.digest, method: "benchmark", at: new Date().toISOString() });
  const order = { model_url: "https://example.com/models/duck.stl", material: "pla", quantity: 2, delivery: { country: "NL", postal_code: "1011" } };
  operations.ask = await measure(() => client.ask("materials.list"), 100);
  operations.quote = await measure(() => client.quote("print3d.order", order), 100);
  operations.commit = await measure(async (i) => {
    const { offer } = await client.quote("print3d.order", order);
    await client.commit(offer, approvalFor(offer), `bench-commit-${stamp}-${i}`);
  }, 100);
  operations.status = await measure(async () => {
    const { offer } = await client.quote("print3d.order", order);
    const result = await client.commit(offer, approvalFor(offer), `bench-status-${stamp}-${Math.random()}`);
    await client.status(result.task.id);
  }, 100);
  const samples = await measure(async (i) => {
    const current = new LatchClient(origin);
    await current.connect();
    await current.ask("materials.list");
    const { offer } = await current.quote("print3d.order", order);
    const { task } = await current.commit(offer, approvalFor(offer), `bench-flow-${stamp}-${i}`);
    await current.status(task.id);
  }, 100, 10);
  full.push(...samples);
} finally {
  await new Promise((resolve) => server.close(resolve));
}

const report = {
  schema: "latch-local-benchmark/v1",
  timestamp: started.toISOString(),
  commands: ["npm run bench", "node latch.mjs --version (60 measured child processes; 10 warmups)"],
  environment: {
    node: process.version,
    platform: process.platform,
    os_release: os.release(),
    architecture: process.arch,
    cpu: os.cpus()[0]?.model || "unknown",
    logical_cpus: os.cpus().length,
    git_commit: "not recorded (run from a commit to compare revisions)"
  },
  intrinsic: {
    implementation_files: 1,
    implementation_bytes: source.byteLength,
    runtime_dependencies: Object.keys(pkg.dependencies || {}).length,
    node_requirement: pkg.engines.node
  },
  scope: {
    topology: "client and in-memory reference provider in one Node.js process; real HTTP over loopback; no TLS, network transit, external API, payment, physical work, or persistent storage",
    methodology: "performance.now() around awaited operations. Fixed warmup runs precede measured runs. p95 is the nearest-rank sample. No other protocol is measured in this intrinsic report; see COMPARISONS.md for the official MCP comparison.",
    commit_preparation: "Each commit/status sample includes an unmeasured quote to obtain a valid offer. The full flow measures discovery, ask, quote, commit, and status together.",
    note: "The demo records a simulated order. No object was printed, paid for, or delivered."
  },
  cold_start: summarize(cold),
  full_flow: summarize(full),
  operations: Object.fromEntries(Object.entries(operations).map(([name, samples]) => [name, summarize(samples)])),
  raw_samples_ms: { cold_start: cold, full_flow: full, ...operations }
};
const reportText = `${JSON.stringify(report, null, 2)}\n`;
await mkdir(path.join(root, "bench", "results"), { recursive: true });
await writeFile(path.join(root, "bench", "results", `${stamp}.json`), reportText);
await writeFile(path.join(root, "bench", "results", "latest.json"), reportText);
await writeFile(path.join(root, "app", "src", "metrics.js"), `// Generated by npm run bench. Local measurements, not a cross-protocol ranking.\nexport const metrics = ${JSON.stringify(report, null, 2)};\n`);

const round = (number) => number.toFixed(2);
const row = (name, summary) => `| ${name} | ${summary.samples} | ${round(summary.median_ms)} | ${round(summary.p95_ms)} | ${round(summary.mean_ms)} |`;
const markdown = `# LATCH local measurements\n\nMeasured ${report.timestamp}. This is a reproducible intrinsic local baseline. For the official MCP SDK comparison see [COMPARISONS.md](COMPARISONS.md); neither report is a universal protocol ranking.\n\n| Property | Measured value |\n| --- | ---: |\n| Reference implementation | ${report.intrinsic.implementation_files} ESM file, ${report.intrinsic.implementation_bytes.toLocaleString("en-US")} bytes |\n| Runtime dependencies | ${report.intrinsic.runtime_dependencies} |\n| Node.js requirement | ${report.intrinsic.node_requirement} |\n| Cold CLI start, median / p95 | ${round(report.cold_start.median_ms)} / ${round(report.cold_start.p95_ms)} ms |\n| Complete local flow, median / p95 | ${round(report.full_flow.median_ms)} / ${round(report.full_flow.p95_ms)} ms |\n\n## Environment\n\n- Node: ${report.environment.node}\n- OS: ${report.environment.platform} ${report.environment.os_release}, ${report.environment.architecture}\n- CPU: ${report.environment.cpu}; ${report.environment.logical_cpus} logical CPUs\n- Revision: ${report.environment.git_commit}\n\n## Loopback latency\n\n${report.scope.topology}.\n\n| Operation | n | Median (ms) | p95 (ms) | Mean (ms) |\n| --- | ---: | ---: | ---: | ---: |\n${row("Cold CLI start", report.cold_start)}\n${row("ask", report.operations.ask)}\n${row("quote", report.operations.quote)}\n${row("commit", report.operations.commit)}\n${row("status", report.operations.status)}\n${row("Complete flow", report.full_flow)}\n\nThe complete flow includes discovery, ask, quote, commit, and status. Cold start measures a new Node process running \`node latch.mjs --version\`. Commit/status samples obtain a fresh valid offer before the timed operation. ${report.scope.methodology}\n\n## Reproduce and inspect\n\n\`\`\`sh\nnpm run bench\n\`\`\`\n\nEvery run stores a timestamped report with all raw samples in \`bench/results/\` and updates \`bench/results/latest.json\` and the page's \`app/src/metrics.js\`. Other machines, Node versions, network paths, TLS, production storage, and external provider work will change the results. The in-memory reference server is not a production persistence or authentication layer. The demo provider is simulated; these measurements do not represent printing, payment, or delivery.\n`;
await writeFile(path.join(root, "BENCHMARKS.md"), markdown);
console.log(JSON.stringify({
  bytes: report.intrinsic.implementation_bytes,
  runtime_dependencies: report.intrinsic.runtime_dependencies,
  cold_start_median_ms: round(report.cold_start.median_ms),
  cold_start_p95_ms: round(report.cold_start.p95_ms),
  full_flow_median_ms: round(report.full_flow.median_ms),
  full_flow_p95_ms: round(report.full_flow.p95_ms),
  raw: `bench/results/${stamp}.json`
}, null, 2));
