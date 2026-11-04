# Contribute to LATCH

Forks and independent implementations are welcome. MIT applies; there is no contributor license agreement and no requirement to assign copyright.

## Before a pull request

1. Read `AGENTS.md`, `SPEC.md`, and `SECURITY.md`.
2. Use Node.js 20+ and keep runtime dependencies at zero.
3. Run `npm test` and `npm run bench`.
4. Update the spec, fixtures, tests, and docs together when changing wire behavior.
5. Keep benchmark raw samples and describe the environment. Never invent a measurement or a cross-protocol ranking.
6. Keep unrelated formatting out of the change.

Useful contributions include conformance cases, other-language implementations, real-provider adapters, interoperability evidence, accessibility fixes, and clearer security documentation. The best addition may be a test that removes an ambiguity rather than a new feature.

## Design boundaries

Do not introduce a mandatory account, central registry, hosted relay, telemetry, payment rail, or automatic execution of remote code. Keep `quote` separate from `commit`. Never weaken the exact offer digest, explicit approval, idempotency, same-origin default, or HTTPS requirements.

An invite must remain reviewable text. Do not automate unsolicited issues, pull requests, emails, or messages to providers.

## Security

Do not open a public issue for an unpatched vulnerability. Follow `SECURITY.md`. A digest is not consent, a CLI claim is not identity, and a provider receipt is not independent physical evidence. Changes must not blur those boundaries.

## Static page

`app/` has no framework or external assets. Run `cd app && npm run dev -- --host 127.0.0.1 --port 7100`. Check RU/EN, the complete trace stepper, keyboard focus, GitHub API failure, and 375/768/1024/1440px viewports. `node test/browser-check.mjs` automates this in a temporary Chrome/Chromium/Edge; set `CHROME_BIN` if detection fails. It stops its preview and browser processes on exit. Update page metrics through `npm run bench`, not by typing unmeasured values.
