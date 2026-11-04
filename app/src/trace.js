// Generated from a real local reference-server exchange.
export const trace = {
  "latch": "0.1",
  "generated_at": "2026-11-04T14:18:06.587Z",
  "environment": {
    "node": "v24.21.0",
    "platform": "win32"
  },
  "note": "Recorded against the real local reference server. The provider and outcome are simulations; no payment, manufacturing, or delivery occurred.",
  "steps": [
    {
      "name": "discover",
      "request": {
        "method": "GET",
        "url": "http://127.0.0.1:58714/.well-known/latch.json"
      },
      "response": {
        "latch": "0.1",
        "name": "LATCH Print Lab (simulation)",
        "description": "A deterministic materials and 3D-print order provider. No physical production or payment occurs.",
        "endpoint": "http://127.0.0.1:58714/latch",
        "capabilities": [
          {
            "id": "materials.list",
            "description": "List simulated printing materials and unit prices in EUR minor units.",
            "mode": "read",
            "input": {
              "type": "object",
              "additionalProperties": false
            },
            "effects": "none",
            "approval": "never"
          },
          {
            "id": "print3d.order",
            "description": "Quote and record a simulated 3D-print order. This demo does not manufacture or ship objects.",
            "mode": "write",
            "input": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "model_url",
                "material",
                "quantity",
                "delivery"
              ],
              "properties": {
                "model_url": {
                  "type": "string",
                  "minLength": 8,
                  "maxLength": 2048
                },
                "material": {
                  "type": "string",
                  "enum": [
                    "pla",
                    "petg",
                    "resin"
                  ]
                },
                "quantity": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 100
                },
                "delivery": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "country",
                    "postal_code"
                  ],
                  "properties": {
                    "country": {
                      "type": "string",
                      "minLength": 2,
                      "maxLength": 2
                    },
                    "postal_code": {
                      "type": "string",
                      "minLength": 2,
                      "maxLength": 20
                    }
                  }
                }
              }
            },
            "effects": "irreversible",
            "approval": "required"
          }
        ],
        "links": {
          "spec": "https://github.com/Balanov/latch/blob/main/SPEC.md",
          "repository": "https://github.com/Balanov/latch"
        },
        "url": "http://127.0.0.1:58714/"
      }
    },
    {
      "name": "ask",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:58714/latch",
        "headers": {
          "content-type": "application/json"
        },
        "body": {
          "latch": "0.1",
          "id": "req_3d13c0bb-b754-4460-b984-ea5fced8b59e",
          "op": "ask",
          "capability": "materials.list",
          "input": {}
        }
      },
      "response": {
        "latch": "0.1",
        "id": "req_3d13c0bb-b754-4460-b984-ea5fced8b59e",
        "ok": true,
        "state": "succeeded",
        "result": {
          "materials": [
            {
              "id": "pla",
              "unit_price": 950,
              "currency": "EUR"
            },
            {
              "id": "petg",
              "unit_price": 1200,
              "currency": "EUR"
            },
            {
              "id": "resin",
              "unit_price": 1900,
              "currency": "EUR"
            }
          ]
        }
      }
    },
    {
      "name": "quote",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:58714/latch",
        "headers": {
          "content-type": "application/json"
        },
        "body": {
          "latch": "0.1",
          "id": "req_73df1746-a3f4-41ea-9c48-416d12dbf62d",
          "op": "quote",
          "capability": "print3d.order",
          "input": {
            "model_url": "https://example.com/models/duck.stl",
            "material": "pla",
            "quantity": 2,
            "delivery": {
              "country": "NL",
              "postal_code": "1011"
            }
          }
        }
      },
      "response": {
        "latch": "0.1",
        "id": "req_73df1746-a3f4-41ea-9c48-416d12dbf62d",
        "ok": true,
        "state": "offered",
        "offer": {
          "id": "off_7895a7e6-f4c1-4833-bf1d-2723332e246e",
          "capability": "print3d.order",
          "summary": "2 × PLA model, EUR 31.00, simulated delivery in 3–5 days",
          "terms": {
            "amount": 3100,
            "currency": "EUR",
            "unit_amount": 950,
            "shipping_amount": 1200,
            "delivery_days": [
              3,
              5
            ],
            "simulation": true
          },
          "expires_at": "2026-11-04T14:23:06.583Z",
          "digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6"
        }
      }
    },
    {
      "name": "approve",
      "request": {
        "local": true,
        "approval": {
          "decision": "approve",
          "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
          "method": "cli-explicit",
          "at": "2026-11-04T14:18:06.583Z"
        }
      },
      "response": {
        "summary": "2 × PLA model, EUR 31.00, simulated delivery in 3–5 days",
        "terms": {
          "amount": 3100,
          "currency": "EUR",
          "unit_amount": 950,
          "shipping_amount": 1200,
          "delivery_days": [
            3,
            5
          ],
          "simulation": true
        },
        "digest_verified": true
      }
    },
    {
      "name": "commit",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:58714/latch",
        "headers": {
          "content-type": "application/json",
          "idempotency-key": "demo-trace-idempotency-key-0001"
        },
        "body": {
          "latch": "0.1",
          "id": "req_041e4bcb-a128-4a5c-a861-45c9fbb1c7d4",
          "op": "commit",
          "offer": "off_7895a7e6-f4c1-4833-bf1d-2723332e246e",
          "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
          "approval": {
            "decision": "approve",
            "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
            "method": "cli-explicit",
            "at": "2026-11-04T14:18:06.583Z"
          }
        }
      },
      "response": {
        "latch": "0.1",
        "id": "req_041e4bcb-a128-4a5c-a861-45c9fbb1c7d4",
        "ok": true,
        "state": "succeeded",
        "task": {
          "id": "task_e93a93af-b331-4b9a-8140-5f6776e15629",
          "capability": "print3d.order",
          "state": "succeeded",
          "created_at": "2026-11-04T14:18:06.585Z",
          "result": {
            "order_id": "demo_order_89d4b052-7435-4524-87f9-968c44663b22",
            "status": "recorded_simulation",
            "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
            "model_url": "https://example.com/models/duck.stl",
            "note": "No object was printed, paid for, or shipped. This is a local conformance demo."
          }
        },
        "receipt": {
          "id": "rcpt_eedda533-ba54-428a-ab0a-c02a92cc0562",
          "task_id": "task_e93a93af-b331-4b9a-8140-5f6776e15629",
          "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
          "request_digest": "sha256-019650d62e6c1365f89b9131a30fc0811866dd83a3a727c8386af3a6ee614019",
          "issued_at": "2026-11-04T14:18:06.585Z",
          "evidence": "provider_assertion"
        }
      }
    },
    {
      "name": "receipt",
      "request": {
        "method": "POST",
        "url": "http://127.0.0.1:58714/latch",
        "headers": {
          "content-type": "application/json"
        },
        "body": {
          "latch": "0.1",
          "id": "req_d7a5a226-3fbd-4f95-a0a3-2a9bde056be9",
          "op": "status",
          "task": "task_e93a93af-b331-4b9a-8140-5f6776e15629"
        }
      },
      "response": {
        "latch": "0.1",
        "id": "req_d7a5a226-3fbd-4f95-a0a3-2a9bde056be9",
        "ok": true,
        "state": "succeeded",
        "task": {
          "id": "task_e93a93af-b331-4b9a-8140-5f6776e15629",
          "capability": "print3d.order",
          "state": "succeeded",
          "created_at": "2026-11-04T14:18:06.585Z",
          "result": {
            "order_id": "demo_order_89d4b052-7435-4524-87f9-968c44663b22",
            "status": "recorded_simulation",
            "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
            "model_url": "https://example.com/models/duck.stl",
            "note": "No object was printed, paid for, or shipped. This is a local conformance demo."
          }
        },
        "receipt": {
          "id": "rcpt_eedda533-ba54-428a-ab0a-c02a92cc0562",
          "task_id": "task_e93a93af-b331-4b9a-8140-5f6776e15629",
          "offer_digest": "sha256-99becfc206bdc1bc170f6ccabdc31afd3e6958233a9f39cb56aa7054ce3f62e6",
          "request_digest": "sha256-019650d62e6c1365f89b9131a30fc0811866dd83a3a727c8386af3a6ee614019",
          "issued_at": "2026-11-04T14:18:06.585Z",
          "evidence": "provider_assertion"
        }
      }
    }
  ]
};
