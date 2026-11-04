# Local read comparison

Measured 2026-11-04T20:07:15.492Z. **Scope is one equivalent read, not a general protocol ranking.**

| Runtime | First contact, ms | Warm read, ms | 16 KiB read, ms | 50 concurrent p95, ms | Cold process, ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Raw HTTP lower bound* | — | 0.25 | 0.35 | 37.52 | 45.44 |
| LATCH | 0.23 | 0.31 | 0.40 | 29.97 | 59.67 |
| Official MCP SDK 1.32.2 | 1.67 | 0.67 | 0.78 | 51.84 | 215.18 |

Median except the explicitly labelled p95 column. Environment: v24.21.0, win32 10.0.28020 x64, AMD Ryzen 9 5950X 16-Core Processor            .

## Method and limits

4 rotated rounds × 100 measured calls per case after 10 warmups per round. Concurrency: 50 in flight. Cold starts: 30 child processes after 5 warmups..

Client and server in one Node.js process; real HTTP over loopback. No TLS, WAN, physical effects, persistent storage, or production authentication..

@modelcontextprotocol/sdk 1.32.2; official documented per-request stateless pattern: new McpServer and StreamableHTTPServerTransport per request, createMcpExpressApp, sessionIdGenerator undefined.

Minimal node:http JSON handler and global fetch; no validation, discovery, approval, or receipt. A lower-bound baseline, not an equivalent safety implementation.

One local read path only. Not a general protocol ranking or proof of quote/commit, WAN, or other-runtime performance.

Reusing a stateless transport across requests was tested and rejected by the SDK: 'Stateless transport cannot be reused across requests. Create a new transport per request.' No unsupported shared-transport result is included.

## Reproduce

```sh
npm ci --prefix bench/competitors --ignore-scripts
npm run bench:compare
```

The SDK is a development-only benchmark dependency. LATCH itself still has zero runtime dependencies. Raw samples and every round are in `bench/results/comparison-latest.json` and timestamped files beside it.
