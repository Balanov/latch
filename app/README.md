# LATCH live client

Small HTML/CSS/JS client with no framework, external font, analytics, or runtime secret. It supports discovery, exact quote verification, explicit approval, commit, idempotent replay, and receipt display. Any service card URL can be entered explicitly. HTTPS is required outside loopback.

## Local preview

```sh
npm run dev -- --host 127.0.0.1 --port 7100
```

The static preview does not execute PHP. For local development use `?provider=http://127.0.0.1:PORT/latch.json` after starting a LATCH provider with appropriate CORS policy. No provider request occurs until the user clicks Discover.

## Build and browser verification

```sh
npm run build
node ../test/browser-check.mjs
```

Build creates `dist/` with the static client and independent PHP provider in `dist/api/`.

For the deployed independent implementation:

```sh
LATCH_TEST_ORIGIN=https://balanov.pro/latch/ node ../test/browser-check.mjs
```

The browser script starts no public server and leaves deployed state unchanged. It validates discovery, digest, approval invalidation, commit, replay, receipt, clipboard, RU/EN, keyboard controls, exact 375/768/1024/1440px viewports, and console/network failures. Set `CHROME_BIN` if browser detection fails. Reports and temporary screenshots go to `.test-tmp/browser-check/`; all temporary processes are stopped in `finally`.

`src/comparison.js` and `src/metrics.js` are generated from actual measurements. `src/trace.js` is generated from a real local exchange. Do not type benchmark numbers manually.
