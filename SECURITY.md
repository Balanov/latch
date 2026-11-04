# Security model

LATCH moves consequential decisions into explicit, testable transitions. It does not make an untrusted service safe.

## Guarantees implemented by the reference runtime

- Discovery endpoints are same-origin by default; public non-loopback HTTP is rejected.
- Request and response bodies are bounded; fetch timeouts are mandatory.
- `commit` requires the exact canonical offer digest and an unexpired offer.
- Approval must name the same digest when the capability declares `approval: "required"`.
- `Idempotency-Key` is required. Reuse with different commit content fails before the provider handler.
- The demo binds to loopback by default and uses no cookies, telemetry, credentials, or external services.

## What is not a guarantee

- A digest binds content but does not authenticate a person, agent, or provider.
- `method: "cli-explicit"` is a record of local CLI input, not verified human identity.
- TLS authenticates an origin under the Web PKI, not business honesty or service quality.
- A provider receipt is a provider assertion, not independent evidence of payment, manufacture, delivery, or another physical effect.
- In-memory offers, tasks, and idempotency records are for development. Production needs durable, atomic, caller-scoped storage.
- `createFileStore` is optional and single-writer. It protects restart/replay state and rejects a second writer or corrupt file, but does not provide distributed transactions, encryption, retention, or exactly-once external effects.
- `authenticate` scopes storage by the returned principal ID. The application must still verify identity and authorization correctly; an ID string itself is not proof of identity.
- The reference JSON Schema validator implements a subset. Providers must enforce their full published schema.
- The MCP bridge exposes powerful remote calls to its host. Host policy and confirmation remain necessary.

## Deployment checklist

Authenticate callers where tasks or offers are private. Scope idempotency and task lookup to the caller. Use high-entropy IDs and keys. Enforce rate limits, complete schemas, CSRF defenses for cookie-based browser calls, and redacted logs. Never forward credentials across origins. Treat card and result text as untrusted content, not agent instructions. Use AP2/OAuth/provider signatures where verifiable authorization is required. Confirm the final origin, terms, expiry, and digest in trusted user UI.

## Invites and installation

`latch invite` only prints text. It does not contact a provider, post an issue, install a package, or execute remote content. Review source and release checksums before installation. Do not paste credentials into capability input or chat.

## Reporting

Please report vulnerabilities privately to the repository owner through GitHub private vulnerability reporting when enabled. Otherwise open a public issue without exploit details and request a private contact. Do not test third-party LATCH endpoints without authorization.
