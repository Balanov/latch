# Changelog

## 0.2.0 — 2026-11-04

- Optional caller-scoped authentication and storage adapters; in-memory remains the default.
- Atomic single-writer JSON store with restart recovery, lock protection, and fail-closed corruption handling.
- Caller-isolated offers, tasks, pending commits, and idempotency keys.
- Streaming response limits, structured timeouts, and explicit cross-origin header policy.
- 29 protocol/security/restart/concurrency tests, including 50 identical in-flight commits.
- Independent PHP 8.2 provider with `flock()`-protected idempotency and live browser client.
- Four rotated local benchmark rounds against the official MCP SDK per-request stateless pattern.

## 0.1.0 — 2026-11-04

Initial experimental release.

- LATCH 0.1 discovery card and JSON/HTTPS envelope.
- `ask`, `quote`, `commit`, `status`, and `cancel` operations.
- Canonical offer digests, approval binding, expiry checks, and idempotent commit handling.
- Zero-runtime-dependency Node.js reference client/server and CLI.
- Simulated 3D-print provider and actual six-step local wire trace.
- Optional MCP stdio bridge and review-only provider invite.
- Provider scaffold with overwrite protection.
- End-to-end, security-invariant, concurrency, CLI, and MCP tests.
- Reproducible local benchmark reports with raw samples.
- Bilingual static project page, MIT license, and citation metadata.

This is an implementation-first draft, not a production authentication or durable-storage system. See `SPEC.md` and `SECURITY.md`.
