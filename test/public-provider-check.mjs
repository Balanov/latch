// Cross-language conformance check: Node LatchClient -> independent PHP provider.
// Run: node test/public-provider-check.mjs [card-url]
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LatchClient } from "../latch.mjs";

const cardUrl = process.argv[2] || "https://balanov.pro/latch/api/latch.json";
const client = new LatchClient(cardUrl, { timeout: 30_000 });
const started = new Date();
const checks = [];
const check = (name, details) => {
  checks.push({ name, passed: true, ...(details === undefined ? {} : { details }) });
  console.log(`PASS ${name}`);
};
async function expectCode(promise, code, status) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return true;
  });
  check(`${code} returns HTTP ${status}`);
}
const input = {
  model_url: "https://example.com/models/duck.stl",
  material: "pla",
  quantity: 2,
  delivery: { country: "NL", postal_code: "1011" }
};
const approvalFor = (offer) => ({ decision: "approve", offer_digest: offer.digest, method: "conformance-explicit", at: new Date().toISOString() });
const key = `public-check-${randomUUID()}`;
let taskId;
let receipt;

try {
  await client.connect();
  const card = client.card;
  assert.equal(card.latch, "0.1");
  assert.equal(new URL(card.endpoint).origin, new URL(cardUrl).origin);
  assert.ok(card.capabilities.some((capability) => capability.id === "print3d.order"));
  check("same-origin discovery over HTTPS", { endpoint: card.endpoint });

  const read = await client.ask("materials.list");
  assert.equal(read.result.materials.length, 3);
  assert.equal(read.result.materials[0].currency, "EUR");
  check("independent PHP read");

  const quoted = await client.quote("print3d.order", input);
  assert.equal(quoted.state, "offered");
  assert.equal(quoted.offer.terms.simulation, true);
  assert.equal(quoted.offer.terms.amount, 3100);
  check("quote returns exact simulated terms and a valid digest");

  const approval = approvalFor(quoted.offer);
  const committed = await client.commit(quoted.offer, approval, key);
  taskId = committed.task.id;
  receipt = committed.receipt;
  assert.equal(committed.state, "succeeded");
  assert.equal(committed.task.result.status, "recorded_simulation");
  assert.equal(receipt.evidence, "provider_assertion");
  check("explicit approval and simulated commit");

  const replayed = await client.commit(quoted.offer, approval, key);
  assert.equal(replayed.task.id, taskId);
  assert.deepEqual(replayed.receipt, receipt);
  assert.notEqual(replayed.id, committed.id);
  check("same-key replay preserves the task and updates only correlation ID");

  const parallel = await Promise.all(Array.from({ length: 12 }, () => client.commit(quoted.offer, approval, key)));
  assert.equal(new Set(parallel.map((result) => result.task.id)).size, 1);
  check("12 concurrent same-key commits return one task");

  const status = await client.status(taskId);
  assert.equal(status.receipt.task_id, taskId);
  assert.equal(status.receipt.evidence, "provider_assertion");
  check("status returns the provider receipt boundary");

  await expectCode(client.cancel(taskId), "task_not_cancellable", 409);
  await expectCode(client.status("task_does_not_exist"), "task_not_found", 404);
  await expectCode(client.call("commit", {
    offer: quoted.offer.id,
    offer_digest: quoted.offer.digest,
    approval: { decision: "approve", offer_digest: `sha256-${"0".repeat(64)}` }
  }, { idempotencyKey: `wrong-approval-${randomUUID()}` }), "approval_digest_mismatch", 409);

  const result = { passed: true, provider: cardUrl, started_at: started.toISOString(), finished_at: new Date().toISOString(), checks };
  if (process.env.LATCH_CHECK_OUT) {
    await mkdir(path.dirname(process.env.LATCH_CHECK_OUT), { recursive: true });
    await writeFile(process.env.LATCH_CHECK_OUT, `${JSON.stringify(result, null, 2)}\n`);
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const result = { passed: false, provider: cardUrl, started_at: started.toISOString(), error: { code: error.code || error.name, message: error.message, status: error.status }, checks };
  console.error(JSON.stringify(result, null, 2));
  if (process.env.LATCH_CHECK_OUT) {
    await mkdir(path.dirname(process.env.LATCH_CHECK_OUT), { recursive: true });
    await writeFile(process.env.LATCH_CHECK_OUT, `${JSON.stringify(result, null, 2)}\n`);
  }
  process.exitCode = 1;
}
