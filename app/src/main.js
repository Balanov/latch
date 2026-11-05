import { metrics } from "./metrics.js";
import { comparison } from "./comparison.js";

const CARD_URL = "https://balanov.pro/latch/api/latch.json";
const copy = {
  ru: {
    pageTitle: "LATCH — заказ у сервиса одной фразой агенту",
    skip: "К содержанию", nav: "Основная навигация", navCase: "Кейс", navBusiness: "Для бизнеса", navTry: "Live", navIntegrate: "Подключение",
    repoStats: "Звёзды и форки GitHub", starsLabel: "Звёзды", forksLabel: "Форки", statsLoading: "GitHub API…", statsLive: "данные GitHub API", statsError: "счётчики недоступны",
    openLabel: "Открытый протокол · MIT",
    title: "Одна фраза агенту.<br><span>Готовый заказ у сервиса.</span>",
    lede: "LATCH соединяет агента клиента и ваш сервис: передаёт параметры, получает точные условия, запрашивает подтверждение и оформляет заказ по HTTPS. Без дублей при повторе запроса.",
    heroPrimary: "Запустить живой пример", heroSecondary: "Подключить свой сервис",
    factHttp: "Обычный JSON по HTTPS", factRegistry: "Без центрального реестра", factRuntimes: "Node и PHP",
    caseKicker: "3D-печать · схема сценария", caseTitle: "Как проходит заказ", scenePause: "Пауза", sceneResume: "Продолжить", sceneReduced: "Без анимации", sceneSteps: "Этапы заказа",
    caseClient: "Клиент своему агенту", caseRequest: "«Напечатай две детали из PLA и доставь в Амстердам»",
    sceneDiscover: "Узнать возможности", sceneDiscoverText: "Агент читает карту сервиса",
    sceneRead: "Получить параметры", sceneReadText: "Материалы и цены в EUR",
    sceneQuote: "Согласовать условия", sceneQuoteText: "Точная цена и срок доставки",
    sceneApprove: "Подтвердить предложение", sceneApproveText: "Клиент выбирает этот digest",
    sceneCommit: "Оформить без дублей", sceneCommitText: "Повтор возвращает тот же task.id",
    caseOffer: "Предложение сервиса", caseOfferDetail: "2 × PLA · 3–5 дней", caseReceipt: "Ответ сервиса", caseReceiptDetail: "Один заказ при повторах", sceneDisclaimer: "Анимация сценария, не реальный заказ",
    businessLabel: "Для бизнеса", businessTitle: "Не новый магазин.<br>Новый способ принять заказ.",
    businessText: "Сервис остаётся на вашем домене. LATCH лишь описывает его действия в формате, который агент клиента может проверить и вызвать.",
    benefit1Title: "Меньше ручных действий у клиента", benefit1Text: "Агент заполняет структурированные параметры. Клиент проверяет конкретное предложение вместо повторного прохождения формы и личного кабинета.",
    benefit2Title: "Один endpoint для разных агентов", benefit2Text: "Любой агент, который умеет HTTP и JSON, может использовать контракт. Node SDK и MCP bridge — необязательные адаптеры, а не ещё одна обязательная инфраструктура.",
    benefit3Title: "Retry не создаёт второй заказ", benefit3Text: "Idempotency-Key связывает повтор с исходным task.id. Перед последствиями сервис отдаёт точные условия и ждёт подтверждения.",
    businessNote: "Подходит для производства, доставки, бронирования и внутренних сервисов — там, где действие можно описать входными данными и точными условиями.",
    liveLabel: "Настоящий HTTPS · Node ↔ PHP", liveTitle: "Теперь выполните сами",
    liveText: "Это независимый PHP-сервис на balanov.pro. Заказ симулируется: никакой оплаты, печати или доставки.",
    orderTitle: "Параметры симуляции", cardUrl: "Карта сервиса · card_url", modelUrl: "Ссылка на модель · model_url", material: "Материал", quantity: "Количество", country: "Страна", postal: "Почтовый индекс",
    privacy: "Не вводите секреты или реальные адреса. Это публичная симуляция.",
    discover: "Найти возможности", quote: "Получить цену", approve: "Подтверждаю эти условия и digest", commit: "Оформить заказ", receipt: "Получить receipt", replay: "Повторить с тем же ключом", reset: "Сбросить",
    idle: "Соединение не выполнялось", request: "Запрос", response: "Ответ", messageView: "Просмотр сообщения", copyJson: "Копировать JSON", copy: "Копировать",
    flowAgent: "АГЕНТ", flowProvider: "СЕРВИС", approvalNote: "Checkbox — локальное подтверждение, не идентификация человека. Receipt — утверждение провайдера, не доказательство физического действия.",
    protocolLabel: "Прозрачный контракт", integrateTitle: "Пять операций.<br>Обычный HTTPS.",
    integrateText: "Сервис публикует карту возможностей на своём домене. Агент получает её адрес от пользователя или другого сервиса. Регистрация в центральном каталоге не нужна.",
    opAsk: "Прочитать данные без последствий", opQuote: "Получить точные условия действия", opCommit: "Выполнить после подтверждения", opStatus: "Получить состояние и receipt", opCancel: "Отменить, если сервис это позволяет",
    examples: "Примеры интеграции", provider: "Сервис", agent: "Агент", storage: "Хранение", localTitle: "Проверить локально",
    inviteTitle: "Сервис ещё не поддерживает LATCH?", inviteText: "Агент может подготовить текст приглашения со ссылкой на GitHub. Ничего не отправляет и не устанавливает автоматически.", copyCommand: "Копировать команду приглашения",
    limitsTitle: "Что протокол не доказывает", limit1: "Digest — не согласие человека.", limit2: "Receipt — не независимое доказательство физического действия.", limit3: "Idempotency — не гарантия exactly-once для внешних систем.", limit4: "Для production нужны auth, защищённое хранилище и rate limits.",
    benchLabel: "Измерения", benchTitle: "Замеры можно повторить", benchText: "Node.js, loopback, 4 ротационных раунда × 100 вызовов после warmup. Не production и не общий рейтинг протоколов.", contact: "Первый контакт", bytes: "байт · 1 ESM · 0 runtime-зависимостей",
    benchNote: "* HTTP baseline без discovery и валидации — нижняя граница, не эквивалент безопасности. MCP: официальный stateless server на каждый запрос. Все числа и samples в репозитории.", methodology: "Методика ↗",
    sourceLabel: "OPEN SOURCE · MIT", sourceTitle: "Код открыт.<br>Форки приветствуются.", sourceText: "Меняйте, встраивайте и делайте независимые реализации. CLA не требуется.",
    noRequest: "Запрос ещё не выполнялся", copied: "Скопировано", copyError: "Не удалось скопировать — текст выделен",
    needCard: "Сначала получите карту сервиса", needApproval: "Проверьте digest и отметьте подтверждение", changed: "Входные изменены — нужна новая котировка", loading: "Запрос выполняется…",
    cardDone: "Карта получена · PHP endpoint готов", quoteDone: "Котировка получена · digest совпал", approveDone: "Условия отмечены · commit ещё не выполнен", commitDone: "Симуляция записана · заказ не является физическим", receiptDone: "Receipt получен · provider_assertion", replayDone: "Replay вернул тот же task.id", resetDone: "Форма сброшена; карта сохранена"
  },
  en: {
    pageTitle: "LATCH — an order through your agent, directly from the service",
    skip: "Skip to content", nav: "Main navigation", navCase: "Use case", navBusiness: "For business", navTry: "Live", navIntegrate: "Integrate",
    repoStats: "GitHub stars and forks", starsLabel: "Stars", forksLabel: "Forks", statsLoading: "GitHub API…", statsLive: "live GitHub API", statsError: "counters unavailable",
    openLabel: "Open protocol · MIT",
    title: "Your agent places the order.<br><span>Directly with the service.</span>",
    lede: "LATCH connects a customer's agent to your service. It reads capabilities, gets exact terms, asks for approval, and places an order over HTTPS — without duplicates on retry.",
    heroPrimary: "Run the live example", heroSecondary: "Connect your service",
    factHttp: "Plain JSON over HTTPS", factRegistry: "No central registry", factRuntimes: "Node and PHP",
    caseKicker: "3D printing · scenario map", caseTitle: "How an order moves", scenePause: "Pause", sceneResume: "Resume", sceneReduced: "Reduced motion", sceneSteps: "Order stages",
    caseClient: "Customer to their agent", caseRequest: "“Print two PLA parts and deliver them to Amsterdam”",
    sceneDiscover: "Discover capabilities", sceneDiscoverText: "The agent reads the service card",
    sceneRead: "Read the parameters", sceneReadText: "Materials and prices in EUR",
    sceneQuote: "Review exact terms", sceneQuoteText: "Exact price and delivery window",
    sceneApprove: "Approve the offer", sceneApproveText: "The customer chooses this digest",
    sceneCommit: "Order without duplicates", sceneCommitText: "A retry returns the same task.id",
    caseOffer: "Service offer", caseOfferDetail: "2 × PLA · 3–5 days", caseReceipt: "Service response", caseReceiptDetail: "One order across retries", sceneDisclaimer: "Scenario animation, not a real order",
    businessLabel: "For business", businessTitle: "Not another storefront.<br>A new way to accept orders.",
    businessText: "Your service stays on your domain. LATCH describes its actions in a format the customer's agent can inspect and call.",
    benefit1Title: "Fewer manual steps for the customer", benefit1Text: "The agent fills in structured parameters. The customer reviews one exact offer instead of going through another form and account flow.",
    benefit2Title: "One endpoint for different agents", benefit2Text: "Any agent that can use HTTP and JSON can use the contract. The Node SDK and MCP bridge are optional adapters, not more mandatory infrastructure.",
    benefit3Title: "A retry does not create a second order", benefit3Text: "An Idempotency-Key ties retries to the original task.id. Before consequences, the service returns exact terms and waits for approval.",
    businessNote: "Useful for manufacturing, delivery, booking, and internal services — wherever an action can be described by inputs and exact terms.",
    liveLabel: "Real HTTPS · Node ↔ PHP", liveTitle: "Now run it yourself",
    liveText: "This is an independent PHP provider on balanov.pro. Orders are simulated: no payment, manufacturing, or delivery.",
    orderTitle: "Simulation parameters", cardUrl: "Service card · card_url", modelUrl: "Model URL · model_url", material: "Material", quantity: "Quantity", country: "Country", postal: "Postal code",
    privacy: "Do not enter secrets or real addresses. This is a public simulation.",
    discover: "Discover capabilities", quote: "Get exact price", approve: "I approve these terms and digest", commit: "Place order", receipt: "Get receipt", replay: "Replay with the same key", reset: "Reset",
    idle: "No connection made yet", request: "Request", response: "Response", messageView: "Message view", copyJson: "Copy JSON", copy: "Copy",
    flowAgent: "AGENT", flowProvider: "SERVICE", approvalNote: "The checkbox is local confirmation, not human identification. A receipt is a provider assertion, not proof of a physical action.",
    protocolLabel: "Transparent contract", integrateTitle: "Five operations.<br>Plain HTTPS.",
    integrateText: "The service publishes a capability card on its domain. The agent gets its address from the user or another service. No central directory registration is required.",
    opAsk: "Read data without consequences", opQuote: "Get exact terms for an action", opCommit: "Execute after explicit approval", opStatus: "Get task state and receipt", opCancel: "Cancel when the service allows it",
    examples: "Integration examples", provider: "Provider", agent: "Agent", storage: "Storage", localTitle: "Test locally",
    inviteTitle: "Service does not support LATCH yet?", inviteText: "An agent can prepare a reviewable invitation with the GitHub link. It does not send or install anything automatically.", copyCommand: "Copy invite command",
    limitsTitle: "What the protocol does not prove", limit1: "A digest is not human consent.", limit2: "A receipt is not independent physical evidence.", limit3: "Idempotency does not guarantee exactly-once external effects.", limit4: "Production needs auth, durable storage, and rate limits.",
    benchLabel: "Measurements", benchTitle: "Repeat the measurements", benchText: "Node.js, loopback, 4 rotated rounds × 100 calls after warmup. Not production or a general protocol ranking.", contact: "First contact", bytes: "bytes · 1 ESM · 0 runtime dependencies",
    benchNote: "* The HTTP baseline has no discovery or validation. It is a lower bound, not a security equivalent. MCP: official stateless server per request. All numbers and samples are in the repository.", methodology: "Methodology ↗",
    sourceLabel: "OPEN SOURCE · MIT", sourceTitle: "Open code.<br>Forks welcome.", sourceText: "Modify, embed, and build independent implementations. No CLA required.",
    noRequest: "No request made yet", copied: "Copied", copyError: "Copy failed — text selected",
    needCard: "Discover the service card first", needApproval: "Verify the digest and confirm explicitly", changed: "Input changed — request a new quote", loading: "Request in flight…",
    cardDone: "Card received · PHP endpoint ready", quoteDone: "Quote received · digest matched", approveDone: "Terms confirmed · commit has not run", commitDone: "Simulation recorded · no physical order", receiptDone: "Receipt received · provider_assertion", replayDone: "Replay returned the same task.id", resetDone: "Form reset; card retained"
  }
};
const sceneKeys = ["sceneDiscover", "sceneRead", "sceneQuote", "sceneApprove", "sceneCommit"];
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
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let sceneStep = reducedMotion.matches ? sceneKeys.length - 1 : 0;
let scenePlaying = !reducedMotion.matches;
let sceneTimer = null;
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
  if (!state.exchange) return { note: copy[language].noRequest };
  return state.exchange[message];
}
function renderScene() {
  const text = copy[language];
  $("#case").dataset.step = String(sceneStep);
  $$('[data-case-step]').forEach((button) => {
    const step = Number(button.dataset.caseStep);
    button.classList.toggle("is-active", step === sceneStep);
    button.classList.toggle("is-complete", step < sceneStep);
    button.setAttribute("aria-pressed", String(step === sceneStep));
  });
  $("#case-status").textContent = text[sceneKeys[sceneStep]];
  const pause = $("#case-pause");
  pause.disabled = reducedMotion.matches;
  pause.setAttribute("aria-pressed", String(!scenePlaying));
  $("#case-pause-label").textContent = reducedMotion.matches ? text.sceneReduced : (scenePlaying ? text.scenePause : text.sceneResume);
}
function syncSceneTimer() {
  clearInterval(sceneTimer);
  sceneTimer = null;
  if (scenePlaying && !document.hidden && !reducedMotion.matches) {
    sceneTimer = setInterval(() => {
      sceneStep = (sceneStep + 1) % sceneKeys.length;
      renderScene();
    }, 1800);
  }
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
  $("#offer-digest").title = state.offer?.digest || "";
  $("#task-id").textContent = state.task?.id || "—";
  $("#task-id").title = state.task?.id || "";
  $("#live-flow").dataset.stage = state.stage;
  $("#live-flow").style.setProperty("--packet-distance", `${Math.max(0, $(".channel").clientWidth - 7)}px`);
  $(".channel i").style.opacity = ["idle", "approve", "dirty"].includes(state.stage) ? "0" : "1";
  const statusKey = { idle: "idle", card: "cardDone", quote: "quoteDone", approve: "approveDone", commit: "commitDone", receipt: "receiptDone", dirty: "changed", replay: "replayDone", reset: "resetDone" }[state.stage];
  $("#live-status").textContent = state.busy ? text.loading : (state.error || text[statusKey] || text.idle);
  $("#status-dot").className = `status-dot${state.error ? " error" : (state.card ? " connected" : "")}`;
  $("#stats-status").textContent = text[statsState === "live" ? "statsLive" : (statsState === "error" ? "statsError" : "statsLoading")];
  renderBench();
  renderScene();
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
  const cardUrl = $("#card-url").value;
  state = initialState();
  state.card = card;
  $("#order-form").reset();
  $("#card-url").value = cardUrl;
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
    if (!Number.isFinite(data.stargazers_count) || !Number.isFinite(data.forks_count)) throw new Error("Invalid GitHub counters");
    $("#stars-value").textContent = new Intl.NumberFormat(language).format(data.stargazers_count);
    $("#forks-value").textContent = new Intl.NumberFormat(language).format(data.forks_count);
    statsState = "live";
  } catch { statsState = "error"; }
  render();
}

$("#case-pause").addEventListener("click", () => {
  scenePlaying = !scenePlaying;
  syncSceneTimer();
  renderScene();
});
$$('[data-case-step]').forEach((button) => button.addEventListener("click", () => {
  sceneStep = Number(button.dataset.caseStep);
  scenePlaying = false;
  syncSceneTimer();
  renderScene();
}));
document.addEventListener("visibilitychange", syncSceneTimer);
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    scenePlaying = false;
    sceneStep = sceneKeys.length - 1;
  }
  syncSceneTimer();
  renderScene();
});
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
syncSceneTimer();
loadStats();
