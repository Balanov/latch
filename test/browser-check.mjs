// Real-browser checks for the local Node provider or the deployed independent PHP provider.
// Local: node test/browser-check.mjs
// Public: LATCH_TEST_ORIGIN=https://balanov.pro/latch/ node test/browser-check.mjs
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { once } from "node:events";
import { createDemoProvider, listen } from "../latch.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, ".test-tmp", "browser-check");
const profile = path.join(root, ".test-tmp", "browser-profile");
const origin = process.env.LATCH_TEST_ORIGIN || "http://127.0.0.1:7183";
const localPreview = !process.env.LATCH_TEST_ORIGIN;
const candidates = [process.env.CHROME_BIN, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
const executable = candidates.find((candidate) => existsSync(candidate));
if (!executable) throw new Error("Set CHROME_BIN to a Chrome, Chromium, or Edge executable.");
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = { origin, checks: [], errors: [], consoleErrors: [], responses: [], failedRequests: [], screenshots: [] };
function pass(name, details) {
  report.checks.push({ name, passed: true, ...(details === undefined ? {} : { details }) });
  console.log(`PASS ${name}`);
}
let browser;
let dev;
let provider;
let proxy;
let cdp;

try {
  let target = origin;
  if (localPreview) {
    dev = spawn(process.execPath, [path.join(root, "app", "dev.mjs"), "--host=127.0.0.1", "--port=7183"], { cwd: root, stdio: "ignore" });
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(origin)).ok) break; } catch {}
      if (attempt === 50) throw new Error("The static preview did not start.");
      await sleep(100);
    }
    provider = createDemoProvider();
    const upstream = await listen(provider);
    proxy = http.createServer(async (request, response) => {
      response.setHeader("access-control-allow-origin", "*");
      response.setHeader("access-control-allow-headers", "content-type,idempotency-key");
      response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
      response.setHeader("cache-control", "no-store");
      if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
      const url = request.url === "/latch.json" ? `${upstream.origin}/.well-known/latch.json` : provider.card.endpoint;
      const result = await fetch(url, { method: request.method, headers: { ...(request.headers["content-type"] ? { "content-type": request.headers["content-type"] } : {}), ...(request.headers["idempotency-key"] ? { "idempotency-key": request.headers["idempotency-key"] } : {}) }, ...(request.method === "POST" ? { body: request, duplex: "half" } : {}) });
      let body = Buffer.from(await result.arrayBuffer());
      if (request.url === "/latch.json") {
        const card = JSON.parse(body.toString());
        card.url = `${proxy.address().address}:${proxy.address().port}/`;
        card.url = `http://127.0.0.1:${proxy.address().port}/`;
        card.endpoint = `http://127.0.0.1:${proxy.address().port}/latch`;
        body = Buffer.from(JSON.stringify(card));
      }
      response.writeHead(result.status, { "content-type": result.headers.get("content-type") || "application/json" });
      response.end(body);
    });
    proxy.listen(0, "127.0.0.1");
    await once(proxy, "listening");
    target = `${origin}/?provider=${encodeURIComponent(`http://127.0.0.1:${proxy.address().port}/latch.json`)}`;
  }
  await rm(profile, { recursive: true, force: true });
  await mkdir(profile, { recursive: true });
  browser = spawn(executable, ["--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking", "--disable-component-update", "--hide-crash-restore-bubble", "--force-device-scale-factor=1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const browserWs = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error(`Browser startup timed out: ${buffer}`)), 15000);
    browser.stderr.on("data", (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    browser.once("error", reject);
    browser.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Browser exited during startup (${code}): ${buffer}`)); });
  });
  const port = new URL(browserWs).port;
  const targetInfo = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  cdp = await connect(targetInfo.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await viewport(1440, 1000);
  await navigate(target);
  await waitFor("document.querySelector('#latch-read')?.textContent.includes('ms')");
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/данные GitHub|live GitHub/)");
  pass("cold load and actual GitHub counters", await evaluate("({lang:document.documentElement.lang,stars:document.querySelector('#stars-value').textContent,forks:document.querySelector('#forks-value').textContent})"));
  await screenshot("desktop-top");
  await click('[data-lang="ru"]');
  assert.equal(await evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].every(a => document.getElementById(a.getAttribute('href').slice(1)))"), true);
  assert.equal(await evaluate("[...document.querySelectorAll('a[target=_blank]')].every(a => a.rel.includes('noopener'))"), true);
  pass("all internal anchors and safe external links");
  for (const id of ["try", "bench", "integrate"]) {
    await click(`.header nav a[href="#${id}"]`);
    assert.equal(await evaluate("location.hash"), `#${id}`);
  }
  await click('[data-lang="en"]');
  assert.match(await evaluate("document.querySelector('h1').textContent"), /Agent/);
  assert.equal(await evaluate("localStorage.getItem('latch-language')"), "en");
  await click('[data-lang="ru"]');
  assert.match(await evaluate("document.querySelector('h1').textContent"), /Агент/);
  pass("navigation, RU/EN content, and persistence");
  await click("#discover-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('PHP endpoint')");
  assert.match(await evaluate("document.querySelector('#live-json').textContent"), /print3d.order/);
  assert.equal(await evaluate("document.querySelector('#commit-button').disabled"), true);
  await click("#quote-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('digest совпал')");
  assert.match(await evaluate("document.querySelector('#offer-digest').textContent"), /^sha256-/);
  assert.equal(await evaluate("document.querySelector('#approval').disabled"), false);
  assert.equal(await evaluate("document.querySelector('#commit-button').disabled"), true);
  assert.equal(await evaluate("document.querySelector('#task-id').textContent"), "—");
  await trustedClick('[data-copy-target="live-json"]');
  await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
  pass("discover, exact quote, digest verification, no commit before approval");
  await click("#approval");
  assert.equal(await evaluate("document.querySelector('#commit-button').disabled"), false);
  await evaluate("document.querySelector('#quantity').value=3;document.querySelector('#quantity').dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal(await evaluate("document.querySelector('#approval').checked"), false);
  assert.equal(await evaluate("document.querySelector('#approval').disabled"), true);
  assert.equal(await evaluate("document.querySelector('#offer-digest').textContent"), "—");
  assert.equal(await evaluate("document.querySelector('#commit-button').disabled"), true);
  pass("changing input invalidates quote, approval, and commit");
  await click("#quote-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('digest совпал')");
  await click("#approval");
  await click("#commit-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('Симуляция записана')");
  const task = await evaluate("document.querySelector('#task-id').textContent");
  assert.match(task, /^task_/);
  assert.equal(await evaluate("document.querySelector('#receipt-button').disabled"), false);
  await click("#replay-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('Replay вернул тот же task.id')");
  assert.equal(await evaluate("document.querySelector('#task-id').textContent"), task);
  await click("#receipt-button");
  await waitFor("document.querySelector('#live-status').textContent.includes('Receipt получен')");
  assert.match(await evaluate("document.querySelector('#live-json').textContent"), /provider_assertion/);
  assert.match(await evaluate("document.querySelector('#live-json').textContent"), /recorded_simulation/);
  pass("explicit approval, commit, idempotent replay, and provider receipt boundary");
  await screenshot("desktop-live");
  await click("#reset-button");
  assert.equal(await evaluate("document.querySelector('#offer-digest').textContent"), "—");
  assert.equal(await evaluate("document.querySelector('#task-id').textContent"), "—");
  await click('[data-example="agent"]');
  assert.match(await evaluate("document.querySelector('#example-code').textContent"), /"op":"ask"/);
  await evaluate("document.querySelector('#tab-agent').focus()");
  await key("ArrowRight", "ArrowRight", 39);
  assert.match(await evaluate("document.querySelector('#example-code').textContent"), /createFileStore/);
  pass("reset and keyboard-accessible integration examples");
  await cdp.send("Browser.grantPermissions", { origin: new URL(origin).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
  await evaluate("document.querySelector('.citation').open=true");
  for (const [targetId, expected] of [["quick-code", "npm test"], ["example-code", "createFileStore"], ["invite-code", "latch.mjs invite"], ["bibtex", "@software{balanov2026latch"]]) {
    await trustedClick(`[data-copy-target="${targetId}"]`);
    await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
    assert.match(await evaluate("navigator.clipboard.readText()"), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  pass("quick start, integration, invite, and BibTeX clipboard content");
  await waitFor("!document.querySelector('#toast').classList.contains('visible')", 5000);
  for (const width of [375, 768, 1024, 1440]) {
    await viewport(width, width === 375 ? 812 : 950);
    await goto();
    const data = await evaluate("({viewport:innerWidth,dpr:devicePixelRatio,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body>header,main>section,body>footer')].filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left < -1).map(e=>e.className),smallButtons:[...document.querySelectorAll('main button,header button,footer button')].filter(e=>{const r=e.getBoundingClientRect();return r.height<43.9||r.width<43.9}).map(e=>e.id||e.textContent)})");
    assert.equal(data.viewport, width);
    assert.equal(data.dpr, 1);
    assert.equal(data.document <= width, true, JSON.stringify(data));
    assert.deepEqual(data.overflow, []);
    assert.deepEqual(data.smallButtons, []);
    await screenshot(`viewport-${width}`);
    pass(`exact ${width}px responsive layout`, data);
  }
  await viewport(1440, 950);
  await screenshot("desktop-full", true);
  const injected = await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.fetch = new Proxy(window.fetch, { apply(target,self,args) { if (String(args[0]).includes('api.github.com/repos/Balanov/latch')) return Promise.reject(new TypeError('Intentional GitHub failure test')); return Reflect.apply(target,self,args); } });" });
  await navigate(target);
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/недоступны|unavailable/)");
  assert.equal(await evaluate("document.querySelector('#stars-value').textContent"), "—");
  assert.equal(await evaluate("document.querySelector('#forks-value').textContent"), "—");
  pass("GitHub failure is explicit and never fabricates counters");
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: injected.identifier });
  await navigate(target);
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/данные GitHub|live GitHub/)");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.responses.filter((response) => response.status >= 400), []);
  pass("zero console errors, uncaught exceptions, failed requests, and HTTP errors");
  report.performance = await evaluate("({navigation:performance.getEntriesByType('navigation').map(e=>({domContentLoaded:e.domContentLoadedEventEnd,responseEnd:e.responseEnd})),resources:performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize}))})");
  report.passed = true;
  console.log(`BROWSER CHECKS PASSED: ${report.checks.length}`);
} catch (error) {
  report.passed = false;
  report.fatal = error.stack;
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  if (cdp) await cdp.close();
  for (const process of [browser, dev, proxy, provider]) {
    if (process && (typeof process.kill === "function" ? process.exitCode === null : process.listening)) {
      if (typeof process.kill === "function") {
        const exited = once(process, "exit");
        process.kill();
        await exited;
      } else {
        await new Promise((resolve) => process.close(resolve));
      }
    }
  }
  if (localPreview) {
    try {
      await fetch(origin, { signal: AbortSignal.timeout(1000) });
      throw new Error("The preview server is still running.");
    } catch (error) {
      if (error.message === "The preview server is still running.") throw error;
    }
  }
  await rm(profile, { recursive: true, force: true });
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(localPreview ? "Temporary browser, provider, and preview stopped" : "Temporary browser stopped; public services unchanged");
}

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const pending = new Map();
  let sequence = 0;
  ws.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (entry) {
        pending.delete(message.id);
        clearTimeout(entry.timer);
        if (message.error) entry.reject(new Error(`${entry.method}: ${message.error.message}`));
        else entry.resolve(message.result);
      }
      return;
    }
    if (message.method === "Runtime.exceptionThrown") report.errors.push(message.params.exceptionDetails);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") report.consoleErrors.push(message.params);
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") report.consoleErrors.push(message.params.entry);
    if (message.method === "Network.responseReceived") report.responses.push({ url: message.params.response.url, status: message.params.response.status });
    if (message.method === "Network.loadingFailed" && !message.params.canceled) report.failedRequests.push(message.params);
  });
  return {
    send(method, params = {}) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
        pending.set(id, { resolve, reject, timer, method });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { if (ws.readyState === WebSocket.OPEN) ws.close(); return Promise.resolve(); }
  };
}
async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
async function waitFor(expression, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${expression}; status=${await evaluate("document.querySelector('#live-status')?.textContent")}`);
}
async function navigate(url) {
  await cdp.send("Page.navigate", { url });
  await waitFor("document.readyState === 'complete'");
}
async function viewport(width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  await sleep(100);
}
async function click(selector) {
  assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), true, selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await sleep(100);
}
async function trustedClick(selector) {
  const point = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  await sleep(100);
}
async function key(keyValue, code, virtualKey) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: keyValue, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: keyValue, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  await sleep(100);
}
async function goto(hash = "#top") {
  await evaluate(`document.documentElement.style.scrollBehavior='auto';location.hash=${JSON.stringify(hash)};scrollTo(0,document.getElementById(${JSON.stringify(hash.slice(1))}).offsetTop);`);
  await sleep(100);
}
async function screenshot(name, fullPage = false) {
  let clip;
  if (fullPage) {
    const metrics = await cdp.send("Page.getLayoutMetrics");
    clip = { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 };
  }
  const result = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 84, captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) });
  const target = path.join(output, `${name}.jpg`);
  await writeFile(target, Buffer.from(result.data, "base64"));
  report.screenshots.push(target);
}
