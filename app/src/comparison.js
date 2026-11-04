// Generated from an actual local comparison. Do not edit numbers manually.
export const comparison = {
  "timestamp": "2026-11-04T20:07:15.492Z",
  "environment": {
    "node": "v24.21.0",
    "os": "win32 10.0.28020 x64",
    "cpu": "AMD Ryzen 9 5950X 16-Core Processor            "
  },
  "methodology": {
    "operation": "One read with the same business input and echo result. Native protocol envelopes are retained.",
    "topology": "Client and server in one Node.js process; real HTTP over loopback. No TLS, WAN, physical effects, persistent storage, or production authentication.",
    "official_mcp_server": "@modelcontextprotocol/sdk 1.32.2; official documented per-request stateless pattern: new McpServer and StreamableHTTPServerTransport per request, createMcpExpressApp, sessionIdGenerator undefined",
    "rejected_alternative": "Reusing a stateless transport across requests was tested and rejected by the SDK: 'Stateless transport cannot be reused across requests. Create a new transport per request.' No unsupported shared-transport result is included.",
    "raw_baseline": "Minimal node:http JSON handler and global fetch; no validation, discovery, approval, or receipt. A lower-bound baseline, not an equivalent safety implementation.",
    "repetitions": "4 rotated rounds × 100 measured calls per case after 10 warmups per round. Concurrency: 50 in flight. Cold starts: 30 child processes after 5 warmups.",
    "fairness": "One local read path only. Not a general protocol ranking or proof of quote/commit, WAN, or other-runtime performance."
  },
  "results": {
    "raw": {
      "first_contact": null,
      "warm_read": {
        "n": 400,
        "median_ms": 0.252100000000155,
        "p95_ms": 0.5014000000001033,
        "mean_ms": 0.3198587499999999,
        "min_ms": 0.23100000000022192,
        "max_ms": 3.3844000000001415
      },
      "payload_16k": {
        "n": 400,
        "median_ms": 0.3488999999999578,
        "p95_ms": 0.5951000000000022,
        "mean_ms": 0.4105887499999959,
        "min_ms": 0.2757000000001426,
        "max_ms": 4.073200000000043
      },
      "concurrent": {
        "n": 400,
        "median_ms": 21.183300000000145,
        "p95_ms": 37.524,
        "mean_ms": 24.164109999999987,
        "min_ms": 17.202400000000125,
        "max_ms": 38.77070000000003,
        "throughput_per_second": 1894.3430181620108
      },
      "cold_process": {
        "n": 30,
        "median_ms": 45.438600000000406,
        "p95_ms": 47.18299999999999,
        "mean_ms": 45.568763333333315,
        "min_ms": 43.535799999999654,
        "max_ms": 48.17190000000028
      }
    },
    "latch": {
      "first_contact": {
        "n": 60,
        "median_ms": 0.2300000000000182,
        "p95_ms": 0.3706999999999425,
        "mean_ms": 0.2536116666666449,
        "min_ms": 0.20429999999987558,
        "max_ms": 0.6317000000000235
      },
      "warm_read": {
        "n": 400,
        "median_ms": 0.3109999999999218,
        "p95_ms": 0.43060000000002674,
        "mean_ms": 0.3356230000000127,
        "min_ms": 0.2615000000000691,
        "max_ms": 3.2484000000001743
      },
      "payload_16k": {
        "n": 400,
        "median_ms": 0.40079999999989013,
        "p95_ms": 0.6100999999999885,
        "mean_ms": 0.4367922499999892,
        "min_ms": 0.30589999999983775,
        "max_ms": 3.1409999999996217
      },
      "concurrent": {
        "n": 400,
        "median_ms": 21.9684000000002,
        "p95_ms": 29.97440000000006,
        "mean_ms": 23.465241000000006,
        "min_ms": 18.450399999999718,
        "max_ms": 30.04720000000009,
        "throughput_per_second": 1939.188032882812
      },
      "cold_process": {
        "n": 30,
        "median_ms": 59.668800000000374,
        "p95_ms": 75.44250000000011,
        "mean_ms": 61.248106666666715,
        "min_ms": 57.35320000000047,
        "max_ms": 77.2470000000003
      }
    },
    "mcp": {
      "first_contact": {
        "n": 60,
        "median_ms": 1.6684000000000196,
        "p95_ms": 2.4512999999999465,
        "mean_ms": 1.8027833333333585,
        "min_ms": 1.3659000000000106,
        "max_ms": 4.175100000000157
      },
      "warm_read": {
        "n": 400,
        "median_ms": 0.6693000000000211,
        "p95_ms": 0.9665999999999713,
        "mean_ms": 0.7317062499999898,
        "min_ms": 0.5689000000002125,
        "max_ms": 3.5254999999999654
      },
      "payload_16k": {
        "n": 400,
        "median_ms": 0.7753999999999905,
        "p95_ms": 1.1756000000000313,
        "mean_ms": 0.8705245000000048,
        "min_ms": 0.6465999999995802,
        "max_ms": 5.47400000000016
      },
      "concurrent": {
        "n": 400,
        "median_ms": 39.049400000000105,
        "p95_ms": 51.84350000000006,
        "mean_ms": 41.49102225000002,
        "min_ms": 26.895500000000084,
        "max_ms": 57.036699999999996,
        "throughput_per_second": 1116.2053482979265
      },
      "cold_process": {
        "n": 30,
        "median_ms": 215.1844999999994,
        "p95_ms": 221.99219999999968,
        "mean_ms": 215.70196333333314,
        "min_ms": 209.76600000000053,
        "max_ms": 227.90309999999954
      }
    }
  }
};
