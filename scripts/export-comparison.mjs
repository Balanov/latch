import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const report = JSON.parse(await readFile(new URL("./bench/results/comparison-latest.json", root), "utf8"));
const summary = {
  timestamp: report.timestamp,
  environment: report.environment,
  methodology: report.methodology,
  results: Object.fromEntries(Object.entries(report.results).map(([name, result]) => [name, {
    first_contact: result.first_contact || null,
    warm_read: result.warm_read,
    payload_16k: result.payload_16k,
    concurrent: result.concurrent,
    cold_process: result.cold_process
  }]))
};
await writeFile(new URL("./app/src/comparison.js", root), `// Generated from an actual local comparison. Do not edit numbers manually.\nexport const comparison = ${JSON.stringify(summary, null, 2)};\n`);
const round = (value) => value.toFixed(2);
const row = (label, result) => `| ${label} | ${result.first_contact ? round(result.first_contact.median_ms) : "—"} | ${round(result.warm_read.median_ms)} | ${round(result.payload_16k.median_ms)} | ${round(result.concurrent.p95_ms)} | ${round(result.cold_process.median_ms)} |`;
const markdown = `# Local read comparison\n\nMeasured ${report.timestamp}. **Scope is one equivalent read, not a general protocol ranking.**\n\n| Runtime | First contact, ms | Warm read, ms | 16 KiB read, ms | 50 concurrent p95, ms | Cold process, ms |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${row("Raw HTTP lower bound*", report.results.raw)}\n${row("LATCH", report.results.latch)}\n${row("Official MCP SDK 1.32.2", report.results.mcp)}\n\nMedian except the explicitly labelled p95 column. Environment: ${report.environment.node}, ${report.environment.os}, ${report.environment.cpu}.\n\n## Method and limits\n\n${report.methodology.repetitions}.\n\n${report.methodology.topology}.\n\n${report.methodology.official_mcp_server}.\n\n${report.methodology.raw_baseline}\n\n${report.methodology.fairness}\n\n${report.methodology.rejected_alternative}\n\n## Reproduce\n\n\`\`\`sh\nnpm ci --prefix bench/competitors --ignore-scripts\nnpm run bench:compare\n\`\`\`\n\nThe SDK is a development-only benchmark dependency. LATCH itself still has zero runtime dependencies. Raw samples and every round are in \`bench/results/comparison-latest.json\` and timestamped files beside it.\n`;
await writeFile(new URL("./COMPARISONS.md", root), markdown);
console.log("Exported comparison summary to app/src/comparison.js and COMPARISONS.md");
