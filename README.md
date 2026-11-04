# LATCH

**Any agent. Any service. One small HTTPS contract.**

**[Project page](https://latch.kimi.page/) · [Specification](SPEC.md) · [MIT license](LICENSE)**

LATCH lets an HTTP-capable agent discover a service, read a capability, obtain an exact quote, commit only the approved offer, and retrieve a task receipt. One well-known JSON card. One POST endpoint. Five operations. No SDK required.

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-176b4d)](LICENSE)

> **Experimental 0.1.** The wire contract and reference implementation work locally and have conformance tests. The in-memory server is not a production identity, persistence, or authorization layer. The included print provider is a simulation; nothing is paid for, manufactured, or shipped.

## The smallest useful boundary

Existing agent protocols already solve important problems. MCP provides a rich host/tool ecosystem; A2A delegates autonomous tasks; OpenAPI and Arazzo describe APIs and workflows; UCP/ACP/AP2 cover commerce and payments. LATCH does not replace them. It is a minimal first-contact and commitment contract for agents that did not arrive with a provider-specific integration.

```text
agent                        service
  │                            │
  ├─ GET /.well-known/latch.json┤
  ├─ ask ──────────────────────►│ read; no consequential effect
  ├─ quote ────────────────────►│ prepare; do not execute
  │◄──────── exact offer+digest │
  │                            │
  ├─ [local approval boundary]  │
  │                            │
  ├─ commit + digest ──────────►│ execute once per idempotency key
  │      Idempotency-Key        │
  ├─ status ───────────────────►│ task + provider_assertion receipt
```

- **Universal transport:** ordinary JSON over HTTPS, not a required runtime.
- **Explicit effects:** reads never require a quote; consequential writes require one.
- **Exact commitment:** SHA-256 canonical offer digest and an approval bound to it.
- **Safe retries:** a required `Idempotency-Key`, including in-flight request deduplication.
- **No middleman:** no registry, account, token, telemetry, hosted proxy, or usage fee.
- **Adaptable:** use HTTP directly, the one-file Node CLI, or the optional MCP stdio bridge.

## Run the proof

Requires Node.js 20 or newer. There are no runtime dependencies.

```sh
git clone https://github.com/Balanov/latch.git
cd latch
npm test
node latch.mjs demo --trace examples/trace.json
```

The trace contains six actual local steps: discovery, ask, quote, local approval, commit, and receipt. Request envelopes, IDs, and HTTP headers are recorded from the running client and server. The provider and outcome are explicitly simulated.

Start the demo provider and talk to it from another terminal:

```sh
node latch.mjs demo --port 8787
```

```sh
node latch.mjs discover http://127.0.0.1:8787
node latch.mjs ask http://127.0.0.1:8787 materials.list
node latch.mjs quote http://127.0.0.1:8787 print3d.order \
  '{"model_url":"https://example.com/model.stl","material":"pla","quantity":1,"delivery":{"country":"NL","postal_code":"1011"}}'
```

Review the returned summary, terms, expiry, origin, and digest. Then repeat the **exact** digest after `--yes`; a different value aborts before connecting:

```sh
node latch.mjs commit http://127.0.0.1:8787 off_YOUR_OFFER \
  --digest sha256-YOUR_REVIEWED_DIGEST \
  --yes sha256-YOUR_REVIEWED_DIGEST
node latch.mjs status http://127.0.0.1:8787 task_YOUR_TASK
```

The CLI generates a random idempotency key for each new invocation. Library users should reuse their key when retrying the same commit. Use `node latch.mjs --help` for all commands.

## Provider quick start

Scaffold a read-only local provider without overwriting existing files:

```sh
npx --yes github:Balanov/latch init my-latch-service
cd my-latch-service
npm install
node service.mjs
```

Or integrate the exported functions directly:

```js
import { createLatchServer, listen } from "latch-protocol";

const server = createLatchServer({
  latch: "0.1",
  name: "Repair booking",
  description: "Availability and repair appointments",
  url: "https://repair.example/",
  endpoint: "https://repair.example/latch",
  capabilities: [{
    id: "availability.read",
    description: "Read available repair slots",
    mode: "read",
    input: { type: "object", additionalProperties: false },
    effects: "none",
    approval: "never"
  }]
}, {
  async ask() {
    return { slots: ["2026-11-05T10:00:00Z"] };
  }
});

await listen(server, { port: 8787 }); // local HTTP; use HTTPS in production
```

For a write capability, implement `quote` separately from `commit`. Return `summary`, `terms`, and an expiry from `quote`; perform the external action only in `commit`. The reference runtime validates the exact offer and approval digests, checks expiry, and deduplicates commit handling. The provider remains responsible for real authorization, accurate terms, durable idempotency, rate limits, and the actual effect. See [SPEC.md](SPEC.md) and [SECURITY.md](SECURITY.md).

## No runtime? Use the wire contract

```http
GET /.well-known/latch.json
Accept: application/latch+json, application/json
```

```http
POST /latch
Content-Type: application/json

{"latch":"0.1","id":"req_1","op":"ask","capability":"availability.read","input":{}}
```

The other operations are `quote`, `commit`, `status`, and `cancel`. Domain-specific inputs use JSON Schema; the dependency-free reference supports the subset documented in `validateInput`, not the entire JSON Schema specification. Implementations in other languages can reproduce the short canonicalization and digest rules directly.

## Optional MCP adapter

LATCH does not require MCP, but an MCP host can use the included stdio bridge:

```json
{
  "mcpServers": {
    "latch": {
      "command": "npx",
      "args": ["--yes", "github:Balanov/latch", "mcp"]
    }
  }
}
```

The bridge exposes discovery, read, quote, commit, and status tools. A model calling `latch_commit` is **not** itself proof of human approval. The host must present the actual offer and enforce its trusted approval policy before calling the tool. Use a `--target` argument only for a provider origin you trust.

## Two adoption paths, no spam

**Provider first:** publish `/.well-known/latch.json` and your endpoint. Any compatible agent can discover it directly.

**Agent first:** if no card exists, generate a reviewable handoff:

```sh
node latch.mjs invite https://service.example
```

This only prints text. It does not contact the service, post an issue, open a PR, install code, or claim that a connection exists. A person can send that text to the provider; after explicit integration, retry discovery. Every card can link to the MIT specification, creating a natural two-sided distribution loop without a central broker or automated solicitations.

## Measured, not marketed

Run `npm run bench`. Reports include Node/OS/CPU, commands, scope, summary statistics, and raw samples in `bench/results/`. See [BENCHMARKS.md](BENCHMARKS.md) for the latest measured file size, cold CLI start, per-operation loopback latency, and full flow.

These are local measurements of this implementation, not cross-protocol rankings or production latency claims. They exclude public network transit, TLS, durable storage, external APIs, payments, manufacturing, and delivery. Equivalent implementations and workloads would be required for a fair comparison.

## Boundaries worth reading

- A digest binds content. It does not authenticate a person, provider, or business claim.
- `cli-explicit` records a local confirmation method. It is not verified human identity.
- A receipt marked `provider_assertion` is what the provider reports. It is not independent evidence of physical completion.
- Idempotency deduplicates handling inside a retention window. It cannot undo an external effect or guarantee exactly-once reality.
- Public endpoints must use HTTPS. Discovery rejects redirects and defaults to same-origin endpoints.
- Remote cards, descriptions, inputs, results, and receipts are untrusted data, not agent instructions.
- The reference stores offers, tasks, and idempotency results in memory with no authentication or retention manager. Add production controls before exposing consequential operations.
- LATCH does not replace payment, identity, authorization, rich commerce, general agent delegation, or deterministic workflow standards. Compose with the appropriate layer.

## Repository map

| Path | Purpose |
| --- | --- |
| `latch.mjs` | Reference client/server, CLI, demo, trace recorder, MCP adapter |
| `SPEC.md` | LATCH 0.1 wire contract and security boundaries |
| `test/latch.test.mjs` | End-to-end, failure, concurrency, CLI, and MCP tests |
| `bench/` | Repeatable local measurements and raw reports |
| `app/` | Zero-dependency bilingual static project page |
| `docs/RESEARCH.md` | Competitive/protocol research and design rationale |
| `llms.txt`, `SKILL.md` | Progressive, optional agent guidance |

## Contribute, fork, reimplement

MIT. No CLA. No permission needed to fork or implement the contract in another language. Run `npm test` and `npm run bench`, preserve unknown-field tolerance, and update the spec, fixtures, and tests together. See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports follow [SECURITY.md](SECURITY.md), not public issues.

Independent implementations, language ports, interoperability fixtures, and real-provider adapters are especially welcome. Do not add a mandatory registry, telemetry, silent installers, or fake evidence to make the project look bigger.

## Cite

See [CITATION.cff](CITATION.cff). GitHub can generate APA/BibTeX from that file.

```bibtex
@software{balanov2026latch,
  author = {Balanov, Anton},
  title = {LATCH: One Tiny HTTPS Contract Between Any Agent and Any Service},
  year = {2026},
  version = {0.1.0},
  license = {MIT},
  url = {https://github.com/Balanov/latch}
}
```
