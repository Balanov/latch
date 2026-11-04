# LATCH local measurements

Measured 2026-11-04T14:18:01.867Z. This is a reproducible local baseline, **not a claim that LATCH is faster than every protocol**. No competing implementation was measured.

| Property | Measured value |
| --- | ---: |
| Reference implementation | 1 ESM file, 42,221 bytes |
| Runtime dependencies | 0 |
| Node.js requirement | >=20 |
| Cold CLI start, median / p95 | 55.38 / 61.80 ms |
| Complete local flow, median / p95 | 1.59 / 2.27 ms |

## Environment

- Node: v24.21.0
- OS: win32 10.0.28020, x64
- CPU: AMD Ryzen 9 5950X 16-Core Processor            ; 32 logical CPUs
- Revision: not recorded (run from a commit to compare revisions)

## Loopback latency

client and in-memory reference provider in one Node.js process; real HTTP over loopback; no TLS, network transit, external API, payment, physical work, or persistent storage.

| Operation | n | Median (ms) | p95 (ms) | Mean (ms) |
| --- | ---: | ---: | ---: | ---: |
| Cold CLI start | 60 | 55.38 | 61.80 | 56.16 |
| ask | 100 | 0.54 | 1.06 | 0.61 |
| quote | 100 | 0.48 | 0.96 | 0.55 |
| commit | 100 | 0.87 | 1.42 | 0.99 |
| status | 100 | 1.07 | 2.19 | 1.24 |
| Complete flow | 100 | 1.59 | 2.27 | 1.75 |

The complete flow includes discovery, ask, quote, commit, and status. Cold start measures a new Node process running `node latch.mjs --version`. Commit/status samples obtain a fresh valid offer before the timed operation. performance.now() around awaited operations. Fixed warmup runs precede measured runs. p95 is the nearest-rank sample. No other protocol is measured; no cross-protocol or production-performance ranking is claimed.

## Reproduce and inspect

```sh
npm run bench
```

Every run stores a timestamped report with all raw samples in `bench/results/` and updates `bench/results/latest.json` and the page's `app/src/metrics.js`. Other machines, Node versions, network paths, TLS, production storage, and external provider work will change the results. The in-memory reference server is not a production persistence or authentication layer. The demo provider is simulated; these measurements do not represent printing, payment, or delivery.
