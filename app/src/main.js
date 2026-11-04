import { metrics } from "./metrics.js";
import { comparison } from "./comparison.js";

const CARD_URL = "https://balanov.pro/latch/api/latch.json";
const copy = {
  ru: {
    pageTitle: "LATCH — JSON/HTTPS для агентов и сервисов", skip: "К коду", nav: "Основная навигация", navTry: "Live", navBench: "Замеры", navIntegrate: "Интеграция", copy: "Копировать",
    title: "Агент → сервис.<br>Без обязательного SDK.", lede: "Одна карта, пять операций, точный digest предложения и безопасный повтор commit.", bytes: "байт · 1 ESM", deps: "runtime deps", ops: "операций",
    liveTitle: "Запросить. Проверить. Выполнить.", liveText: "Независимый PHP-provider на balanov.pro. Только симуляция заказа: никакой оплаты, печати или доставки.", privacy: "Не вводите секреты или реальные адреса. Это публичная симуляция.", discover: "Карта", quote: "Котировка", approve: "Проверил условия и digest", commit: "Commit", receipt: "Receipt", replay: "Повторить с тем же ключом", reset: "Сбросить форму", idle: "Соединение не выполнялось", request: "Запрос", response: "Ответ", messageView: "Просмотр сообщения", copyJson: "Копировать JSON", approvalNote: "Checkbox — локальное подтверждение, не идентификация человека. Receipt — утверждение провайдера, не доказательство физического действия.",
    benchTitle: "Один read. Одинаковые входные.", benchText: "Медиана, Node.js, loopback, 100 вызовов после warmup. Не production и не общий рейтинг протоколов.", contact: "Первый контакт", benchNote: "* HTTP baseline без discovery и валидации — нижняя граница, не эквивалент безопасности. MCP: официальный stateless server на каждый запрос. Все числа и samples в репозитории.", methodology: "Методика ↗",
    integrateTitle: "Три способа подключить.", examples: "Примеры интеграции", provider: "Сервис", agent: "Агент", storage: "Хранение", limitsTitle: "Границы", limit1: "Digest ≠ согласие человека.", limit2: "Receipt ≠ независимое доказательство.", limit3: "Idempotency ≠ exactly-once внешнего мира.", limit4: "Production: auth, HTTPS, durable store, rate limits.", inviteTitle: "Сервиса нет в списке?", inviteText: "Текстовое приглашение. Ничего не отправляет и не устанавливает автоматически.", copyCommand: "Копировать команду приглашения", statsLoading: "GitHub API…", statsLive: "данные GitHub API", statsError: "счётчики недоступны", copied: "Скопировано", copyError: "Не удалось скопировать — текст выделен",
    needCard: "Сначала получите карту сервиса", needApproval: "Проверьте digest и отметьте подтверждение", changed: "Входные изменены — нужна новая котировка", loading: "Запрос выполняется…", cardDone: "Карта получена · PHP endpoint готов", quoteDone: "Котировка получена · digest совпал", approveDone: "Условия отмечены · commit ещё не выполнен", commitDone: "Симуляция записана · заказ не является физическим", receiptDone: "Receipt получен · provider_assertion", replayDone: "Replay вернул тот же task.id", resetDone: "Форма сброшена; карта сохранена"
  },
  en: {
    pageTitle: "LATCH — JSON/HTTPS for agents and services", skip: "Skip to code", nav: "Main navigation", navTry: "Live", navBench: "Benchmarks", navIntegrate: "Integrate", copy: "Copy",
    title: "Agent → service.<br>No mandatory SDK.", lede: "One card, five operations, exact offer digest, and safe commit retries.", bytes: "bytes · 1 ESM", deps: "runtime deps", ops: "operations",
    liveTitle: "Request. Review. Commit.", liveText: "An independent PHP provider on balanov.pro. Simulated orders only: no payment, manufacturing, or delivery.", privacy: "Do not enter secrets or real addresses. This is a public simulation.", discover: "Discover", quote: "Quote", approve: "I reviewed terms and digest", commit: "Commit", receipt: "Receipt", replay: "Replay with the same key", reset: "Reset form", idle: "No connection made yet", request: "Request", response: "Response", messageView: "Message view", copyJson: "Copy JSON", approvalNote: "The checkbox is local confirmation, not human identification. A receipt is a provider assertion, not proof of a physical action.",
    benchTitle: "One read. Same inputs.", benchText: "Median, Node.js, loopback, 100 calls after warmup. Not production or a general protocol ranking.", contact: "First contact", benchNote: "* HTTP baseline without discovery or validation is a lower bound, not a security equivalent. MCP: official stateless server per request. All numbers and samples are in the repository.", methodology: "Methodology ↗",
    integrateTitle: "Three ways to connect.", examples: "Integration examples", provider: "Provider", agent: "Agent", storage: "Storage", limitsTitle: "Boundaries", limit1: "Digest ≠ human consent.", limit2: "Receipt ≠ independent physical evidence.", limit3: "Idempotency ≠ exactly-once external effects.", limit4: "Production: auth, HTTPS, durable store, rate limits.", inviteTitle: "Service not connected?", inviteText: "A reviewable text invite. It does not send or install anything automatically.", copyCommand: "Copy invite command", statsLoading: "GitHub API…", statsLive: "live GitHub API", statsError: "counters unavailable", copied: "Copied", copyError: "Copy failed — text selected",
    needCard: "Discover the service card first", needApproval: "Verify the digest and confirm explicitly", changed: "Input changed — request a new quote", loading: "Request in flight…", cardDone: "Card received · PHP endpoint ready", quoteDone: "Quote received · digest matched", approveDone: "Terms confirmed · commit has not run", commitDone: "Simulation recorded · no physical order", receiptDone: "Receipt received · provider_assertion", replayDone: "Replay returned the same task.id", resetDone: "Form reset; card retained"
  }
};
const examples = {
  provider: { label: "NODE PROVIDER", code: `npx --yes github:Balanov/latch init my-service\ncd my-service\nnpm install\nnode service.mjs` },
  agent: { label: "PLAIN HTTPS / MCP OPTIONAL", code: `POST /latch HTTP/1.1\nContent-Type: application/json\n\n{"latch":"0.1","id":"req_1","op":"ask","capability":"materials.list","input":{}}\n\n# Optional MCP stdio bridge:\nnpx --yes github:Balanov/latch mcp --target https://balanov.pro/latch/api/latch.json` },
  storage: { label: "RESTART / CALLER SCOPING", code: `import { createDemoProvider, createFileStore, listen } from "latch-protocol";\n\nconst server = createDemoProvider({\n  store: createFileStore("./data/latch.json"),\n  authenticate: async (request) => verifyRequest(request)\n  // Your verifier returns a stable principal id or null.\n});\nawait listen(server, { port: 8787 });\n// On shutdown: await server.latch.close();` }
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let language = localStorage.getItem("latch-language") || (navigator.language.startsWith("ru") ? "ru" : "en");
let message = "response";
let example = "provider";
let toastTimer;
let statsState = "loading";
const initialState = () => ({ card: null, offer: null, task: null, approval: null, commitContext: null, stage: "idle", busy: false, exchange: null, replay: false });
let state = initialState();

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}
async function digest(offer) {
  const unsigned = { ...offer };
  delete unsigned.digest;
  const bytes = new TextEncoder().encode(canonicalize(unsigned));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256-${[...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
async function readJson(response) {
  const reader = response.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 262144) {
        await reader.cancel();
        throw new Error("Response exceeds 256 KiB");
      }
      chunks.push(value);
    }
  }
  const text = new TextDecoder().decode(concat(chunks));
  if (!response.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(`${data.error?.code || "http_error"} · ${data.error?.message || response.status}`);
    } catch (error) {
      if (error.message.includes("·")) throw error;
      throw new Error(`HTTP ${response.status}`);
    }
  }
  return JSON.parse(text);
}
function concat(chunks) {
  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
function exchangeDisplay() {
  if (!state.exchange) return { note: "No request made yet" };
  return state.exchange[message];
}
function render() {
  const text = copy[language];
  document.documentElement.lang = language;
  document.title = text.pageTitle;
  $$('[data-i18n]').forEach((element) => { if (text[element.dataset.i18n] !== undefined) element.innerHTML = text[element.dataset.i18n]; });
  $$('[data-i18n-aria]').forEach((element) => { if (text[element.dataset.i18nAria] !== undefined) element.setAttribute("aria-label", text[element.dataset.i18nAria]); });
  $$('[data-lang]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
  $("#discover-button").disabled = state.busy;
  $("#quote-button").disabled = state.busy;
  $("#approval").disabled = state.busy || !state.offer;
  $("#commit-button").disabled = state.busy || !state.offer || !$("#approval").checked;
  $("#receipt-button").disabled = state.busy || !state.task;
  $("#replay-button").disabled = state.busy || !state.commitContext;
  $("#reset-button").disabled = state.busy;
  $$('[data-message]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.message === message)));
  $("#live-json").textContent = JSON.stringify(exchangeDisplay(), null, 2);
  $("#offer-digest").textContent = state.offer?.digest || "—";
  $("#task-id").textContent = state.task?.id || "—";
  $("#live-flow").dataset.stage = state.stage;
  $("#live-flow").style.setProperty("--packet-distance", `${Math.max(0, $(".channel").clientWidth - 7)}px`);
  $(".channel i").style.opacity = ["idle", "approve", "dirty"].includes(state.stage) ? "0" : "1";
  const statusKey = { idle: "idle", card: "cardDone", quote: "quoteDone", approve: "approveDone", commit: "commitDone", receipt: "receiptDone", dirty: "changed", replay: "replayDone", reset: "resetDone" }[state.stage];
  $("#live-status").textContent = state.busy ? text.loading : (state.error || text[statusKey] || text.idle);
  $("#status-dot").className = `status-dot${state.error ? " error" : (state.card ? " connected" : "")}`;
  $("#stats-status").textContent = text[statsState === "live" ? "statsLive" : (statsState === "error" ? "statsError" : "statsLoading")];
  renderBench();
}
function setStage(stage) {
  state.stage = stage;
  state.error = null;
  render();
}
async function execute(action) {
  if (state.busy) return;
  state.busy = true;
  state.error = null;
  render();
  try { await action(); }
  catch (error) { state.error = error.message; render(); }
  finally { state.busy = false; render(); }
}
async function request(op, fields = {}, idempotencyKey) {
  if (!state.card) throw new Error(copy[language].needCard);
  const body = { latch: "0.1", id: `req_${crypto.randomUUID()}`, op, ...fields };
  const headers = { "content-type": "application/json", accept: "application/latch+json, application/json" };
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
  const response = await fetch(state.card.endpoint, { method: "POST", headers, body: JSON.stringify(body), redirect: "error", signal: AbortSignal.timeout(15000) });
  const data = await readJson(response);
  state.exchange = { request: { method: "POST", url: state.card.endpoint, headers, body }, response: data };
  if (data.latch !== "0.1" || data.id !== body.id || data.ok !== true) throw new Error("Invalid provider response envelope");
  return data;
}
async function discover() {
  const cardUrl = $("#card-url").value.trim() || CARD_URL;
  const parsedCardUrl = new URL(cardUrl);
  if (parsedCardUrl.protocol !== "https:" && !(parsedCardUrl.protocol === "http:" && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedCardUrl.hostname))) throw new Error("HTTPS is required outside loopback");
  const response = await fetch(cardUrl, { redirect: "error", signal: AbortSignal.timeout(15000) });
  const card = await readJson(response);
  const endpoint = new URL(card.endpoint);
  const loopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(endpoint.hostname);
  if (card.latch !== "0.1" || endpoint.origin !== parsedCardUrl.origin || !["https:", "http:"].includes(endpoint.protocol) || (endpoint.protocol === "http:" && !loopback) || !Array.isArray(card.capabilities)) throw new Error("Invalid or unsafe LATCH card");
  state.card = card;
  state.exchange = { request: { method: "GET", url: cardUrl }, response: card };
  setStage("card");
}
async function quote() {
  if (!$("#order-form").reportValidity()) return;
  if (!state.card) throw new Error(copy[language].needCard);
  const input = {
    model_url: $("#model-url").value.trim(), material: $("#material").value,
    quantity: Number($("#quantity").value),
    delivery: { country: $("#country").value.trim(), postal_code: $("#postal-code").value.trim() }
  };
  const data = await request("quote", { capability: "print3d.order", input });
  if (await digest(data.offer) !== data.offer.digest) throw new Error("Provider offer digest does not match");
  state.offer = data.offer;
  state.task = null;
  state.approval = null;
  state.commitContext = null;
  state.replay = false;
  $("#approval").checked = false;
  setStage("quote");
}
async function commit(replay = false) {
  if (!state.offer || !$("#approval").checked) throw new Error(copy[language].needApproval);
  if (await digest(state.offer) !== state.offer.digest) throw new Error("The offer changed; request a new quote");
  const context = state.commitContext || {
    offer: state.offer,
    approval: { decision: "approve", offer_digest: state.offer.digest, method: "browser-checkbox", at: new Date().toISOString() },
    key: crypto.randomUUID()
  };
  state.commitContext = context;
  const data = await request("commit", { offer: context.offer.id, offer_digest: context.offer.digest, approval: context.approval }, context.key);
  if (replay && data.task.id !== state.task.id) throw new Error("Replay returned a different task");
  state.task = data.task;
  setStage(replay ? "replay" : "commit");
}
async function receipt() {
  const data = await request("status", { task: state.task.id });
  state.task = data.task;
  setStage("receipt");
}
function reset() {
  const card = state.card;
  state = initialState();
  state.card = card;
  $("#order-form").reset();
  $("#approval").checked = false;
  setStage(card ? "reset" : "idle");
}
function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2400);
}
function renderExample() {
  $("#example-label").textContent = examples[example].label;
  $("#example-code").textContent = examples[example].code;
  $("#code-panel").setAttribute("aria-labelledby", `tab-${example}`);
  $$('[data-example]').forEach((button) => {
    const selected = button.dataset.example === example;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}
function decimal(value) { return value.toFixed(2).replace(".", language === "ru" ? "," : "."); }
function renderBench() {
  $("#source-size").textContent = new Intl.NumberFormat(language).format(metrics.intrinsic.implementation_bytes);
  for (const name of ["raw", "latch", "mcp"]) {
    const result = comparison.results[name];
    if (!result) continue;
    if (result.first_contact) $(`#${name}-contact`).textContent = `${decimal(result.first_contact.median_ms)} ms`;
    $(`#${name}-read`).textContent = `${decimal(result.warm_read.median_ms)} ms`;
    $(`#${name}-large`).textContent = `${decimal(result.payload_16k.median_ms)} ms`;
    $(`#${name}-parallel`).textContent = `${decimal(result.concurrent.p95_ms)} ms`;
    $(`#${name}-cold`).textContent = `${decimal(result.cold_process.median_ms)} ms`;
  }
  $("#bench-environment").textContent = `${comparison.environment.node} · ${comparison.environment.os}`;
  $("#bench-date").textContent = new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" }).format(new Date(comparison.timestamp));
}
async function loadStats() {
  try {
    const response = await fetch("https://api.github.com/repos/Balanov/latch", { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("GitHub unavailable");
    const data = await response.json();
    $("#stars-value").textContent = new Intl.NumberFormat(language).format(data.stargazers_count);
    $("#forks-value").textContent = new Intl.NumberFormat(language).format(data.forks_count);
    statsState = "live";
  } catch { statsState = "error"; }
  render();
}

$("#discover-button").addEventListener("click", () => execute(discover));
$("#order-form").addEventListener("submit", (event) => { event.preventDefault(); execute(quote); });
$("#approval").addEventListener("change", () => setStage($("#approval").checked ? "approve" : "quote"));
$("#order-form").addEventListener("input", (event) => {
  if (event.target.id === "approval") return;
  if (event.target.id === "card-url") state.card = null;
  state.offer = null;
  state.task = null;
  state.approval = null;
  state.commitContext = null;
  $("#approval").checked = false;
  setStage(event.target.id === "card-url" ? "idle" : "dirty");
});
$("#commit-button").addEventListener("click", () => execute(() => commit(false)));
$("#receipt-button").addEventListener("click", () => execute(receipt));
$("#replay-button").addEventListener("click", () => execute(() => commit(true)));
$("#reset-button").addEventListener("click", reset);
$$('[data-lang]').forEach((button) => button.addEventListener("click", () => {
  language = button.dataset.lang;
  localStorage.setItem("latch-language", language);
  render();
}));
$$('[data-message]').forEach((button) => button.addEventListener("click", () => { message = button.dataset.message; render(); }));
$$('[data-example]').forEach((button) => {
  button.addEventListener("click", () => { example = button.dataset.example; renderExample(); });
  button.addEventListener("keydown", (event) => {
    const names = Object.keys(examples);
    let index = names.indexOf(example);
    if (event.key === "ArrowRight") index = (index + 1) % names.length;
    else if (event.key === "ArrowLeft") index = (index - 1 + names.length) % names.length;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = names.length - 1;
    else return;
    event.preventDefault();
    example = names[index];
    renderExample();
    $(`#tab-${example}`).focus();
  });
});
$$('[data-copy-target]').forEach((button) => button.addEventListener("click", async () => {
  const source = document.getElementById(button.dataset.copyTarget);
  try {
    await navigator.clipboard.writeText(source.textContent);
    toast(copy[language].copied);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    toast(copy[language].copyError);
  }
}));

$("#card-url").value = new URLSearchParams(location.search).get("provider") || CARD_URL;
render();
renderExample();
loadStats();
