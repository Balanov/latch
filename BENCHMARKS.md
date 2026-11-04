# LATCH local measurements

Measured 2026-11-04T20:14:09.266Z. This is a reproducible intrinsic local baseline. For the official MCP SDK comparison see [COMPARISONS.md](COMPARISONS.md); neither report is a universal protocol ranking.

| Property | Measured value |
| --- | ---: |
| Reference implementation | 1 ESM file, 47,461 bytes |
| Runtime dependencies | 0 |
| Node.js requirement | >=20 |
| Cold CLI start, median / p95 | 59.30 / 61.14 ms |
| Complete local flow, median / p95 | 1.58 / 2.03 ms |

## Environment

- Node: v24.21.0
- OS: win32 10.0.28020, x64
- CPU: AMD Ryzen 9 5950X 16-Core Processor            ; 32 logical CPUs
- Revision: not recorded (run from a commit to compare revisions)

## Loopback latency

client and in-memory reference provider in one Node.js process; real HTTP over loopback; no TLS, network transit, external API, payment, physical work, or persistent storage.

| Operation | n | Median (ms) | p95 (ms) | Mean (ms) |
| --- | ---: | ---: | ---: | ---: |
| Cold CLI start | 60 | 59.30 | 61.14 | 59.56 |
| ask | 100 | 0.47 | 1.05 | 0.55 |
| quote | 100 | 0.47 | 1.03 | 0.53 |
| commit | 100 | 0.86 | 1.49 | 1.02 |
| status | 100 | 0.98 | 1.85 | 1.15 |
| Complete flow | 100 | 1.58 | 2.03 | 1.67 |

The complete flow includes discovery, ask, quote, commit, and status. Cold start measures a new Node process running `node latch.mjs --version`. Commit/status samples obtain a fresh valid offer before the timed operation. performance.now() around awaited operations. Fixed warmup runs precede measured runs. p95 is the nearest-rank sample. No other protocol is measured in this intrinsic report; see COMPARISONS.md for the official MCP comparison.

## Reproduce and inspect

```sh
npm run bench
```

Every run stores a timestamped report with all raw samples in `bench/results/` and updates `bench/results/latest.json` and the page's `app/src/metrics.js`. Other machines, Node versions, network paths, TLS, production storage, and external provider work will change the results. The in-memory reference server is not a production persistence or authentication layer. The demo provider is simulated; these measurements do not represent printing, payment, or delivery.
