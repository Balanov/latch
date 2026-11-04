// Optional real-browser release check. No npm packages or user browser profile required.
// Run: node test/browser-check.mjs (set CHROME_BIN if Chrome/Edge is not auto-detected).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, ".test-tmp", "browser-check");
const profile = path.join(root, ".test-tmp", "browser-profile");
const origin = process.env.LATCH_TEST_ORIGIN || "http://127.0.0.1:7183";
const localPreview = !process.env.LATCH_TEST_ORIGIN;
const candidates = [
  process.env.CHROME_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);
const executable = candidates.find((candidate) => existsSync(candidate));
if (!executable) throw new Error("Set CHROME_BIN to a Chrome, Chromium, or Edge executable.");
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = { checks: [], errors: [], consoleErrors: [], responses: [], failedRequests: [], screenshots: [] };
const pass = (name, details) => {
  report.checks.push({ name, passed: true, ...(details === undefined ? {} : { details }) });
  console.log(`PASS ${name}`);
};

let browser;
let dev;
let cdp;
try {
  if (localPreview) {
    dev = spawn(process.execPath, [path.join(root, "app", "dev.mjs"), "--host=127.0.0.1", "--port=7183"], { cwd: root, stdio: "ignore" });
    for (let attempt = 0; ; attempt++) {
      try {
        if ((await fetch(origin)).ok) break;
      } catch {}
      if (attempt === 50) throw new Error("The local static server did not start.");
      await sleep(100);
    }
  }
  await rm(profile, { recursive: true, force: true });
  await mkdir(profile, { recursive: true });
  browser = spawn(executable, [
    "--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--disable-background-networking", "--disable-component-update", "--hide-crash-restore-bubble",
    "--force-device-scale-factor=1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const browserWs = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error(`Browser startup timed out: ${buffer}`)), 15000);
    browser.stderr.on("data", (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    browser.once("error", reject);
    browser.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited during startup (${code}): ${buffer}`));
    });
  });
  const port = new URL(browserWs).port;
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await viewport(1440, 1000);
  await navigate(origin);
  await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else addEventListener('load', () => resolve(true), {once:true}); })");
  await waitFor("document.querySelector('#ask-median')?.textContent.includes('ms')");
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/данные GitHub|live GitHub/)");
  pass("cold load and actual GitHub API counters", await evaluate("({lang:document.documentElement.lang,stars:document.querySelector('#stars-value').textContent,forks:document.querySelector('#forks-value').textContent,status:document.querySelector('#stats-status').textContent})"));
  await screenshot("desktop-top");
  await setLanguage("ru");
  assert.equal(await evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].every(a => document.getElementById(a.getAttribute('href').slice(1)))"), true);
  assert.equal(await evaluate("[...document.querySelectorAll('a[target=_blank]')].every(a => a.rel.includes('noopener'))"), true);
  pass("all internal anchors and safe external links");
  for (const id of ["protocol", "flow", "benchmarks"]) {
    await click(`.site-header nav a[href="#${id}"]`);
    assert.equal(await evaluate("location.hash"), `#${id}`);
  }
  await click(".button.primary");
  assert.equal(await evaluate("location.hash"), "#quick-start");
  await click(".footer-brand");
  assert.equal(await evaluate("location.hash"), "#top");
  pass("main CTA, all nav items, and back-to-top");
  await setLanguage("en");
  assert.match(await evaluate("document.querySelector('h1').textContent"), /Any agent/);
  assert.equal(await evaluate("localStorage.getItem('latch-language')"), "en");
  await screenshot("desktop-english");
  await setLanguage("ru");
  assert.match(await evaluate("document.querySelector('h1').textContent"), /Любой агент/);
  pass("RU/EN content and persistence");
  for (let index = 0; index < 6; index++) {
    await click(`#tab-${index}`);
    assert.equal(await evaluate("document.querySelector('[data-step][aria-selected=true]').dataset.step"), String(index));
    assert.equal(await evaluate("JSON.parse(document.querySelector('#wire-json').textContent) !== null"), true);
  }
  await click("#tab-1");
  await click('[data-message="response"]');
  assert.match(await evaluate("document.querySelector('#wire-json').textContent"), /materials/);
  await click("#tab-4");
  const commit = await evaluate("JSON.parse(document.querySelector('#wire-json').textContent)");
  assert.equal(commit.headers["idempotency-key"], "demo-trace-idempotency-key-0001");
  assert.equal(commit.body.idempotency_key, undefined);
  assert.match(commit.body.id, /^req_/);
  await click("#tab-5");
  await click('[data-message="response"]');
  assert.match(await evaluate("document.querySelector('#wire-json').textContent"), /provider_assertion/);
  assert.equal(await evaluate("document.querySelector('#next-step').disabled"), true);
  pass("all six steps, full envelopes, response switching, and provider receipt boundary");
  await goto("#flow");
  await screenshot("desktop-trace");
  await click("#play-trace");
  assert.equal(await evaluate("document.querySelector('#play-trace span').textContent"), "Пауза");
  await waitFor("document.querySelector('[data-step][aria-selected=true]').dataset.step === '1'", 8000);
  await click("#play-trace");
  assert.equal(await evaluate("document.querySelector('#play-trace span').textContent"), "Проиграть");
  await click("#prev-step");
  assert.equal(await evaluate("document.querySelector('#prev-step').disabled"), true);
  await evaluate("document.querySelector('#tab-0').focus()");
  await key("ArrowRight", "ArrowRight", 39);
  assert.equal(await evaluate("document.querySelector('[data-step][aria-selected=true]').dataset.step"), "1");
  await key(" ", "Space", 32);
  assert.equal(await evaluate("document.querySelector('#play-trace span').textContent"), "Пауза");
  await click("#play-trace");
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await click("#play-trace");
  assert.equal(await evaluate("document.querySelector('[data-step][aria-selected=true]').dataset.step"), "2");
  assert.equal(await evaluate("document.querySelector('#play-trace span').textContent"), "Проиграть");
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  pass("play/pause, previous, actual keyboard events, and reduced motion");
  await cdp.send("Browser.grantPermissions", { origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
  await trustedClick('[data-copy-target="quick-code"]');
  await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
  assert.match(await evaluate("navigator.clipboard.readText()"), /npm test/);
  await click("#tab-4");
  await trustedClick('[data-copy-target="wire-json"]');
  await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
  assert.match(await evaluate("navigator.clipboard.readText()"), /idempotency-key/);
  await trustedClick('[data-copy-target="invite-code"]');
  await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
  assert.match(await evaluate("navigator.clipboard.readText()"), /latch.mjs invite/);
  await trustedClick('[data-copy-target="bibtex"]');
  await waitFor("document.querySelector('#toast').textContent.includes('Скопировано')");
  assert.match(await evaluate("navigator.clipboard.readText()"), /@software\{balanov2026latch/);
  pass("all four copy controls and exact clipboard content");
  await waitFor("!document.querySelector('#toast').classList.contains('visible')", 4000);
  for (const width of [375, 768, 1024, 1440]) {
    await viewport(width, width === 375 ? 812 : 950);
    await goto();
    const data = await evaluate("({viewport:innerWidth,dpr:devicePixelRatio,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main > *,header,footer')].filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left < -1).map(e=>e.className),smallButtons:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.height<43.9||r.width<43.9}).map(e=>e.id||e.textContent)})");
    assert.equal(data.viewport, width);
    assert.equal(data.dpr, 1);
    assert.equal(data.document <= width, true, JSON.stringify(data));
    assert.deepEqual(data.overflow, []);
    assert.deepEqual(data.smallButtons, []);
    await screenshot(`viewport-${width}`);
    pass(`exact ${width}px layout without overflow or undersized buttons`, data);
  }
  await viewport(1440, 950);
  await screenshot("desktop-full", true);
  await goto("#cite");
  await screenshot("desktop-citation");
  await goto();
  const injected = await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.fetch = new Proxy(window.fetch, { apply(target,self,args) { if (String(args[0]).includes('api.github.com/repos/Balanov/latch')) return Promise.reject(new TypeError('Intentional API failure test')); return Reflect.apply(target,self,args); } });" });
  await navigate(origin);
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/недоступны|unavailable/)");
  assert.equal(await evaluate("document.querySelector('#stars-value').textContent"), "—");
  assert.equal(await evaluate("document.querySelector('#forks-value').textContent"), "—");
  pass("GitHub API failure is explicit and never fabricates counters");
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: injected.identifier });
  await navigate(origin);
  await waitFor("document.querySelector('#stats-status')?.textContent.match(/данные GitHub|live GitHub/)");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.responses.filter((response) => response.status >= 400), []);
  pass("zero console errors, uncaught exceptions, failed requests, and HTTP errors");
  const performanceData = await evaluate("({navigation:performance.getEntriesByType('navigation').map(e=>({domContentLoaded:e.domContentLoadedEventEnd,responseEnd:e.responseEnd})),resources:performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize}))})");
  report.performance = performanceData;
  report.passed = true;
  console.log(`BROWSER CHECKS PASSED: ${report.checks.length}`);
} catch (error) {
  report.passed = false;
  report.fatal = error.stack;
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  if (cdp) await cdp.close();
  if (browser && browser.exitCode === null) {
    const exited = new Promise((resolve) => browser.once("exit", resolve));
    browser.kill();
    await exited;
  }
  if (dev && dev.exitCode === null) {
    const exited = new Promise((resolve) => dev.once("exit", resolve));
    dev.kill();
    await exited;
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
  console.log(localPreview ? "Temporary browser and preview server stopped" : "Temporary browser stopped; public origin left untouched");
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
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${method} timed out`));
        }, 15000);
        pending.set(id, { resolve, reject, timer, method });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      if (ws.readyState === WebSocket.OPEN) ws.close();
      return Promise.resolve();
    }
  };
}
async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
async function waitFor(expression, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${expression}`);
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
  await sleep(80);
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
  await sleep(80);
}
async function setLanguage(language) {
  await click(`[data-lang="${language}"]`);
  assert.equal(await evaluate("document.documentElement.lang"), language);
}
async function goto(hash = "#top") {
  await evaluate(`document.documentElement.style.scrollBehavior='auto'; location.hash=${JSON.stringify(hash)}; scrollTo(0, document.getElementById(${JSON.stringify(hash.slice(1))}).offsetTop);`);
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
