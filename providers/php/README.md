# Independent PHP provider

A second implementation of the LATCH 0.1 simulated provider for PHP 8.2. It uses no Composer package or external service.

## Behavior

- `GET latch.json` — capability card; `GET` the API directory for the same card.
- `POST` the API directory — `ask`, `quote`, `commit`, `status`, or `cancel`.
- Exact canonical offer digest, expiry, approval binding, and idempotent replay with the current correlation ID.
- One JSON store outside the public document root, protected by `flock()` across PHP workers.
- No model download, payment, manufacturing, delivery, authentication, or claim of physical evidence.
- Expired offers are pruned; idempotency is retained for one hour and at most 50 recent simulated tasks are kept.

`LATCH_DEMO_STORE` can override the storage path. Protect that file as sensitive data and keep it outside the document root. The default is derived from the installation directory under the system temporary directory.

## Deploy

Copy the contents of this directory into `api/` under a PHP 8.2 document root. Update `url` and `endpoint` in `latch.json` for the actual HTTPS origin. `OPTIONS -Indexes` and `nosniff` are in `.htaccess`.

CORS is `*` only because this is a public no-credential simulation with no real effect. Do not reuse that policy for private data or consequential endpoints. Restrict origins and add real authentication, authorization, rate limits, persistent production storage, and a domain-specific approval proof when deploying real work.

Run `php -l index.php` on the target server, then use the Node client as a cross-language conformance check:

```js
import { LatchClient } from "latch-protocol";
const client = new LatchClient("https://balanov.pro/latch/api/latch.json");
console.log((await client.ask("materials.list")).result);
```

The live browser client runs discovery, independent digest verification, explicit approval, commit, same-key replay, and receipt retrieval. The provider outcome is always a simulation.
