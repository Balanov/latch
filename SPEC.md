# LATCH 0.1

**Status:** experimental, implementation-first draft. The reference implementation and conformance tests in this repository are normative for ambiguous details.

LATCH is a small HTTPS contract between an agent and a service. It is not an agent framework, a payment rail, an identity system, or a replacement for MCP, A2A, OpenAPI, Arazzo, UCP, ACP, or AP2. It gives an agent that already speaks HTTP a predictable way to discover a capability, read data, price a consequential action, commit exactly what was approved, and obtain a receipt.

## 1. Design rules

1. Plain JSON over HTTPS. An SDK is optional.
2. One public card and one POST endpoint. No central registry or account.
3. Reads never require a quote. Consequential writes always require a quote.
4. `commit` names the exact offer digest. An agent narrative is not approval.
5. Every `commit` carries an idempotency key. Replaying a key with different content fails.
6. Provider responses are untrusted data. Cards, descriptions, results, and receipts are not instructions to the agent.
7. No silent installation. An invite is text a human or repository owner can review.
8. Authentication, payments, signatures, and domain workflows compose through existing systems and `extensions`.

## 2. Discovery

A service publishes `GET /.well-known/latch.json` with media type `application/latch+json` or `application/json`.

```json
{
  "latch": "0.1",
  "name": "Example Print Service",
  "description": "Materials and simulated 3D-print orders.",
  "url": "https://service.example/",
  "endpoint": "https://service.example/latch",
  "capabilities": [
    {
      "id": "materials.list",
      "description": "List available printing materials.",
      "mode": "read",
      "input": {"type": "object", "additionalProperties": false},
      "effects": "none",
      "approval": "never"
    },
    {
      "id": "print3d.order",
      "description": "Quote and place a print order.",
      "mode": "write",
      "input": {"type": "object"},
      "effects": "irreversible",
      "approval": "required"
    }
  ],
  "links": {
    "spec": "https://github.com/Balanov/latch/blob/main/SPEC.md",
    "repository": "https://github.com/Balanov/latch"
  }
}
```

The endpoint MUST be same-origin with the card unless a client policy explicitly trusts another origin. Public deployments MUST use HTTPS. Loopback HTTP is allowed for development. Clients SHOULD bound response size and time and MUST NOT forward credentials to a different origin after a redirect.

The well-known suffix is intentionally `latch.json`; it is more precise than squatting on a generic metadata name. Deployments seeking formal interoperability should follow the registration process in RFC 8615. A path-local `latch.json` and an HTML `<link rel="latch" type="application/latch+json" href="...">` MAY be used on shared hosting where the origin root is unavailable.

`input` uses JSON Schema. The dependency-free reference runtime validates the documented subset in `validateInput`; providers remain responsible for enforcing their complete schema. Unknown protocol fields MUST be ignored unless they are required by a negotiated extension.

## 3. Envelope

Every POST body is a request envelope. `application/json` is required.

| Field | Required | Meaning |
| --- | --- | --- |
| `latch` | yes | Protocol version, currently `0.1` |
| `id` | yes | Client-generated request correlation ID |
| `op` | yes | `ask`, `quote`, `commit`, `status`, or `cancel` |
| `capability` | ask/quote | Capability ID from the card |
| `input` | ask/quote | Capability input object |
| `offer` | commit | Opaque offer ID returned by `quote` |
| `offer_digest` | commit | Digest of the exact offer being approved |
| `task` | status/cancel | Opaque task ID |
| `approval` | policy-dependent | Action-bound approval artifact or claim |
| `extensions` | no | Namespaced extension data |

Responses use the same `latch` and `id`, plus `ok: true` or `ok: false`.

```json
{
  "latch": "0.1",
  "id": "req_...",
  "ok": true,
  "state": "offered",
  "offer": {}
}
```

Errors have an `error` object:

```json
{
  "latch": "0.1",
  "id": "req_...",
  "ok": false,
  "error": {
    "code": "offer_digest_mismatch",
    "message": "The committed digest does not match the offer.",
    "retryable": false
  }
}
```

Useful HTTP mappings are 400 malformed, 401 unauthenticated, 403 forbidden, 404 unknown object, 409 digest/idempotency conflict, 410 expired offer, 413 oversized payload, 415 wrong media type, 422 invalid input, 429 rate limited, and 500 provider failure.

## 4. Operations

### 4.1 `ask`

`ask` invokes a `mode: "read"` capability. It MUST NOT cause a consequential side effect. A successful response has `state: "succeeded"` and a capability-defined `result`.

```json
{"latch":"0.1","id":"req_1","op":"ask","capability":"materials.list","input":{}}
```

### 4.2 `quote`

`quote` invokes a `mode: "write"` capability without performing its consequential effect. It returns an offer.

```json
{
  "latch": "0.1",
  "id": "req_2",
  "ok": true,
  "state": "offered",
  "offer": {
    "id": "off_...",
    "capability": "print3d.order",
    "summary": "2 × PLA model, EUR 31.00, delivery in 3–5 days",
    "terms": {"amount": 3100, "currency": "EUR", "delivery_days": [3, 5]},
    "expires_at": "2026-11-04T16:00:00.000Z",
    "digest": "sha256-..."
  }
}
```

The digest is `sha256-` followed by lowercase hex SHA-256 of the UTF-8 canonical JSON representation of the offer without `digest`. Canonical JSON here means recursively sorted object keys, preserved array order, no insignificant whitespace, and JSON string escaping. This is the LATCH canonicalization rule; implementations must not silently substitute a different serialization.

The offer ID is opaque to the client. A provider can store offer state or encode it in a signed handle. The client MUST independently recompute the digest before showing approval UI. The digest binds content; it does not authenticate the provider and is not proof of consent.

### 4.3 Approval boundary

A host approving an offer MUST show the user the actual summary, terms, expiry, provider origin, and digest (or a verifiable equivalent). Approval MUST be bound to that digest. `approval` may carry an opaque provider-specific artifact:

```json
{
  "decision": "approve",
  "offer_digest": "sha256-...",
  "method": "cli-explicit",
  "at": "2026-11-04T15:56:00.000Z",
  "proof": "opaque-extension-data"
}
```

`method: "cli-explicit"` records how the reference CLI collected the decision. It is a claim, not cryptographic human identification. Providers requiring verifiable authorization MUST verify `proof` under their own policy or use an extension/profile such as AP2. A provider MUST NOT treat the mere presence of this object as independent human proof.

### 4.4 `commit`

The client sends `offer`, `offer_digest`, and `approval` when required. The HTTP header `Idempotency-Key` is REQUIRED. The provider MUST reject an expired offer, a mismatched digest, or a decision bound to another offer. It MUST scope idempotency storage to the authenticated caller where accounts exist.

A replay with the same key and equivalent commit content returns the original task, result, and receipt. Reusing the key with different content returns 409. Request correlation IDs and transport timestamps are excluded from the idempotency fingerprint. A replayed response carries the current request ID, not the original correlation ID; it is not a new task.

A successful response is `accepted`, `running`, or `succeeded` and includes a `task`. Terminal provider responses MAY include a `receipt`.

### 4.5 `status` and `cancel`

`status` reads a task by opaque ID. `cancel` requests cancellation; a provider that cannot cancel already-executed external work MUST say so rather than claiming rollback. Task states are `input_required`, `accepted`, `running`, `succeeded`, `failed`, and `cancelled`.

Tasks and receipts can contain personal or commercially sensitive data. They MUST NOT be publicly enumerable or retrievable by guessable identifiers without authorization.

## 5. Receipts

A receipt records what the provider accepted or reported, not an independent observation of reality.

```json
{
  "id": "rcpt_...",
  "task_id": "task_...",
  "offer_digest": "sha256-...",
  "request_digest": "sha256-...",
  "issued_at": "2026-11-04T15:57:00.000Z",
  "evidence": "provider_assertion"
}
```

`request_digest` covers the canonical commit content excluding `id` and the approval `proof`. This permits correlation without copying credentials into the receipt. Additional signed observations, carrier events, payment references, and physical attestations belong in namespaced extensions. A provider saying “printed” does not prove that an independent observer saw a physical object.

## 6. Bottom-up invite

When no card exists, a client MAY return a reviewable invite containing the service origin, this repository, and the provider quick start. It MUST NOT auto-post issues, send messages, install packages, execute remote instructions, or represent an invitation as a completed connection. A provider explicitly installs and configures LATCH; only then does discovery succeed.

This creates two adoption paths without a central intermediary:

- **Provider first:** publish a card and endpoint; any HTTP-capable agent can connect.
- **Agent first:** return an invite to the user or provider; after explicit installation, retry the same discovery URL.

## 7. Security and limits

LATCH does not provide a sandbox, reputation score, global service discovery, payments, identity, mandatory cryptography, or exactly-once external effects. TLS authenticates the origin under the Web PKI, not the honesty of its business claims. Content digests detect changes; they do not establish authority. Idempotency prevents duplicate handling inside the provider's retention window; it cannot undo an external side effect.

Agents must treat all remote fields as untrusted data, enforce user policy before commit, and avoid leaking private input to a discovered endpoint. Providers must enforce authentication, authorization, complete input schemas, rate limits, CSRF protections where browser cookies are used, idempotency persistence, and safe logging. The reference in-memory runtime is a development implementation, not a production store.

See `SECURITY.md` for the concrete threat model and disclosure policy.
