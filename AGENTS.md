# LATCH contributor contract

## Commands

- Run tests: `npm test`
- Run the local provider: `npm run demo -- --port 8787`
- Record a real demo exchange: `node latch.mjs demo --trace examples/trace.json`
- Run measurements: `npm run bench`
- Preview the static page: `cd app && npm run dev -- --host 127.0.0.1 --port 7100`

## Engineering rules

- Node.js 20+ only; runtime dependencies must remain zero.
- Keep the client, server, CLI, demo, and MCP bridge in `latch.mjs` unless a measured constraint forces a split.
- Do not add a central registry, telemetry, accounts, payment logic, or automatic remote-code installation.
- Public remote endpoints require HTTPS. Same-origin discovery is the default.
- Every consequential capability requires a quote, exact offer digest, explicit approval, and idempotency key.
- Never describe a digest as consent, a CLI claim as verified human identity, or a provider receipt as independent physical proof.
- Update `SPEC.md`, fixtures, and tests together. Preserve unknown-field tolerance.
- Never fabricate benchmark values. Record commands, environment, raw samples, and limitations.

## Pull requests

Run `npm test` and `npm run bench` before submitting. Keep unrelated formatting out of the diff. Security reports follow `SECURITY.md`, not public issues. Forks and independent implementations are welcome; MIT applies without a CLA.
