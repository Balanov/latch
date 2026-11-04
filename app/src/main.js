import { trace } from "./trace.js";
import { metrics } from "./metrics.js";

const copy = {
  ru: {
    pageTitle: "LATCH — любой агент. Любой сервис.", skip: "К содержанию", navLabel: "Основная навигация",
    navProtocol: "Протокол", navFlow: "Как работает", navBench: "Замеры", kicker: "Открытый коннектор · MIT",
    title: "Любой агент.<br>Любой сервис.<br><span>Один контракт.</span>",
    lede: "Минимальная HTTPS-связь между агентом и реальным действием. Без обязательного SDK, посредника и новой экосистемы ради экосистемы.",
    run: "Запустить локально", readSpec: "Прочитать спецификацию", diagramLabel: "Схема соединения LATCH", diagramImage: "Две половины соединяются",
    diagramState: "ТОЧНОЕ СОГЛАСИЕ", factsLabel: "Факты о проекте", factBytes: "байт · один ESM-файл", factDeps: "runtime-зависимостей", factOps: "операций · один endpoint", factLicense: "форки приветствуются",
    contractTitle: "Не ещё один<br>агентный стек.", contractLead: "LATCH — незаметный контракт первого подключения. Он не заменяет MCP, A2A, OpenAPI или платёжные протоколы. Он даёт агенту, у которого уже есть HTTPS, понятный путь от возможности сервиса до проверяемого результата.",
    contractOne: "Одна карта возможностей", contractTwo: "Один JSON endpoint", contractThree: "Явная граница действия", contractThreeText: "Котировка не выполняет заказ. Commit повторяет digest точных условий.", contractFour: "Никакого центрального узла", contractFourText: "Нет реестра, аккаунтов, телеметрии, hosted proxy и платы за соединение.", researchLink: "Зачем ещё один слой: исследование протоколов",
    flowTitle: "Шесть шагов.<br>Ничего скрытого.", flowLead: "Настоящий обмен с локальным reference-сервером. Пример — симуляция 3D-печати: ни оплаты, ни производства, ни доставки не происходит.", traceAgent: "Агент", traceService: "Сервис", recorded: "Записано локально", stepsLabel: "Шаги протокола", messageLabel: "Сообщение трассировки", request: "Запрос", response: "Ответ", copy: "Копировать", copyShort: "Копировать", copyJson: "Копировать JSON", playText: "Проиграть", pauseText: "Пауза", play: "Проиграть трассировку", pause: "Остановить трассировку", previous: "Предыдущий шаг", next: "Следующий шаг", traceHint: "← → для навигации · Space для паузы", traceSource: "Источник: реальный examples/trace.json. Шаг approve локальный; Idempotency-Key — HTTP-заголовок.",
    quickTitle: "Проверьте код,<br>а не обещание.", quickLead: "Node 20+. Ноль runtime-зависимостей. Тесты и полное локальное демо запускаются без регистрации и внешнего API.", providerStart: "Я подключаю сервис", agentStart: "Я подключаю агента", inviteTitle: "Сервис ещё не подключён?", inviteText: "Сформируйте приглашение и отправьте его владельцу сами. LATCH не ставит чужой код, не создаёт issue и ничего не отправляет автоматически.", copyCommand: "Копировать команду приглашения",
    layersTitle: "Сохраните стек.<br>Добавьте границу.", layersLead: "Используйте HTTP напрямую, однофайловый CLI или необязательный MCP stdio-мост. Для богатых commerce- и payment-сценариев подключайте профильные протоколы, а не раздувайте ядро.", layersLabel: "Совместимые слои протоколов", layerNeed: "Задача", layerUse: "Подходящий слой", layerOne: "Первое подключение и подтверждение действия", layerTwo: "Инструменты, ресурсы и приложения внутри хоста", layerThree: "Делегирование автономной задачи агенту", layerFour: "API, детерминированные workflows", layerFive: "Checkout, fulfillment, платёжные mandates",
    benchTitle: "Измерено здесь.<br>Воспроизводимо везде.", benchLead: "Локальный baseline этого reference-кода. Не сравнение протоколов и не обещание production-latency. В отчёте — Node, ОС, CPU, команды и исходные samples.", coldLabel: "Холодный запуск CLI", flowLabel: "Полный loopback-цикл", benchCaption: "performance.now() · медиана и nearest-rank p95", benchOperation: "Операция", benchLimit: "Клиент и in-memory сервер находятся в одном процессе; HTTP проходит по loopback. Нет TLS, внешней сети, persistent storage или физической работы. Для честного сравнения нужны эквивалентные реализации.", benchReport: "Методика и все числа", benchRaw: "Исходные samples",
    limitsTitle: "Чего LATCH<br>не доказывает.", limitsLead: "Минимальный протокол полезен ровно настолько, насколько честны его границы.", limitOne: "Digest ≠ согласие человека.", limitOneText: "Он связывает содержимое предложения, но не удостоверяет личность или полномочия.", limitTwo: "Receipt ≠ физическое доказательство.", limitTwoText: "Это утверждение провайдера, а не независимое наблюдение печати или доставки.", limitThree: "Idempotency ≠ exactly once в реальности.", limitThreeText: "Повторная обработка исключена в окне хранения провайдера; внешнее действие нельзя отменить хешем.", limitFour: "Reference ≠ production-инфраструктура.", limitFourText: "In-memory хранение не заменяет аутентификацию, авторизацию, persistence, rate limits и вашу политику безопасности.", securityLink: "Threat model и безопасность",
    sourceTitle: "Форкайте.<br>Переносите.<br>Улучшайте.", sourceText: "Один маленький контракт, который не требует нашей инфраструктуры. Независимые реализации, тесты совместимости и реальные адаптеры нужнее громких заявлений.", statsLabel: "Живая статистика GitHub-репозитория", stars: "Звёзды", forks: "Форки", statsLoading: "GitHub API…", statsLive: "данные GitHub API", statsError: "счётчики недоступны · открыть GitHub ↗", license: "MIT · используйте, изменяйте, распространяйте.",
    citeTitle: "Ссылка на работу", copyBib: "Копировать BibTeX", footer: "Открытая спецификация и reference-реализация. Anton Balanov, 2026.", backTop: "Наверх",
    copied: "Скопировано в буфер обмена", copyError: "Не удалось скопировать. Выделите текст вручную.", transport: "Транспорт", localBoundary: "Локальная граница", noNetwork: "Нет сетевого запроса", exactTerms: "Точные условия", evidence: "Доказательство", providerAssertion: "Утверждение провайдера", task: "Задача", simulation: "Симуляция · нет физического действия",
    steps: [
      { title: "Найти контракт", description: "Агент запрашивает одну карту по известному origin. Никакого реестра, логина или предварительной интеграции. Ответ — данные, а не инструкции." },
      { title: "Прочитать, ничего не меняя", description: "Операция ask вызывает read-capability. В этом примере сервис возвращает список симулированных материалов и цен без побочных эффектов." },
      { title: "Получить точное предложение", description: "quote готовит действие, но не выполняет его. Сервер возвращает условия, срок действия и digest, который клиент независимо пересчитывает." },
      { title: "Подтвердить именно это", description: "Локальная граница: пользователь или доверенный хост проверяет условия и привязывает решение к digest. Этот шаг не отправляется как отдельный сетевой запрос." },
      { title: "Выполнить без дубликата", description: "commit повторяет digest и несёт Idempotency-Key в HTTP-заголовке. Повтор с тем же ключом и содержимым вернёт исходную задачу, а не создаст новую." },
      { title: "Получить результат и его границу", description: "status возвращает задачу и receipt. Метка provider_assertion прямо говорит: это отчёт сервиса, а не независимое доказательство физического действия." }
    ]
  },
  en: {
    pageTitle: "LATCH — Any agent. Any service.", skip: "Skip to content", navLabel: "Main navigation",
    navProtocol: "Protocol", navFlow: "How it works", navBench: "Benchmarks", kicker: "Open connector · MIT",
    title: "Any agent.<br>Any service.<br><span>One small contract.</span>",
    lede: "A minimal HTTPS connection from an agent to a real action. No mandatory SDK, middleman, or new ecosystem for its own sake.",
    run: "Run it locally", readSpec: "Read the specification", diagramLabel: "LATCH connection schematic", diagramImage: "Two halves connecting", diagramState: "EXACT AGREEMENT", factsLabel: "Project facts", factBytes: "bytes · one ESM file", factDeps: "runtime dependencies", factOps: "operations · one endpoint", factLicense: "forks welcome",
    contractTitle: "Not another<br>agent stack.", contractLead: "LATCH is a small first-contact contract. It does not replace MCP, A2A, OpenAPI, or payment protocols. It gives any agent with HTTPS a legible path from a service capability to a verifiable result.",
    contractOne: "One capability card", contractTwo: "One JSON endpoint", contractThree: "An explicit action boundary", contractThreeText: "A quote does not execute an order. Commit repeats the digest of the exact terms.", contractFour: "No central node", contractFourText: "No registry, accounts, telemetry, hosted proxy, or connection fees.", researchLink: "Why another layer: protocol research",
    flowTitle: "Six steps.<br>Nothing hidden.", flowLead: "A real exchange with the local reference server. The example simulates 3D printing: no payment, manufacturing, or delivery occurs.", traceAgent: "Agent", traceService: "Service", recorded: "Recorded locally", stepsLabel: "Protocol steps", messageLabel: "Trace message", request: "Request", response: "Response", copy: "Copy", copyShort: "Copy", copyJson: "Copy JSON", playText: "Play trace", pauseText: "Pause", play: "Play trace", pause: "Pause trace", previous: "Previous step", next: "Next step", traceHint: "← → to navigate · Space to pause", traceSource: "Source: actual examples/trace.json. Approval is local; Idempotency-Key is an HTTP header.",
    quickTitle: "Test the code,<br>not the promise.", quickLead: "Node 20+. Zero runtime dependencies. Tests and the complete local demo need no account or external API.", providerStart: "I provide a service", agentStart: "I connect an agent", inviteTitle: "Service not connected yet?", inviteText: "Generate an invite and send it to the owner yourself. LATCH does not install third-party code, create issues, or send anything automatically.", copyCommand: "Copy invite command",
    layersTitle: "Keep your stack.<br>Add the boundary.", layersLead: "Use plain HTTP, the one-file CLI, or the optional MCP stdio bridge. For rich commerce and payment scenarios, compose with dedicated protocols instead of bloating the core.", layersLabel: "Composable protocol layers", layerNeed: "Need", layerUse: "Appropriate layer", layerOne: "First contact and action commitment", layerTwo: "Tools, resources, and apps inside a host", layerThree: "Delegating an autonomous task to an agent", layerFour: "APIs and deterministic workflows", layerFive: "Checkout, fulfillment, payment mandates",
    benchTitle: "Measured here.<br>Reproducible anywhere.", benchLead: "A local baseline of this reference code. Not a protocol ranking or a production-latency promise. The report includes Node, OS, CPU, commands, and raw samples.", coldLabel: "Cold CLI start", flowLabel: "Complete loopback flow", benchCaption: "performance.now() · median and nearest-rank p95", benchOperation: "Operation", benchLimit: "The client and in-memory server share one process; HTTP uses loopback. No TLS, external network, persistent storage, or physical work. A fair comparison requires equivalent implementations.", benchReport: "Methodology and all numbers", benchRaw: "Raw samples",
    limitsTitle: "What LATCH<br>does not prove.", limitsLead: "A minimal protocol is useful only when its boundaries are honest.", limitOne: "Digest ≠ human consent.", limitOneText: "It binds offer content, not a person's identity or authority.", limitTwo: "Receipt ≠ physical evidence.", limitTwoText: "It is a provider assertion, not independent observation of printing or delivery.", limitThree: "Idempotency ≠ exactly-once reality.", limitThreeText: "Duplicate handling is prevented inside the provider's retention window; a hash cannot undo an external effect.", limitFour: "Reference ≠ production infrastructure.", limitFourText: "In-memory storage does not replace authentication, authorization, persistence, rate limits, or your security policy.", securityLink: "Threat model and security",
    sourceTitle: "Fork it.<br>Port it.<br>Improve it.", sourceText: "One small contract that needs none of our infrastructure. Independent implementations, interoperability tests, and real adapters matter more than big claims.", statsLabel: "Live GitHub repository statistics", stars: "Stars", forks: "Forks", statsLoading: "GitHub API…", statsLive: "live GitHub API", statsError: "counts unavailable · open GitHub ↗", license: "MIT · use, modify, redistribute.",
    citeTitle: "Cite this work", copyBib: "Copy BibTeX", footer: "Open specification and reference implementation. Anton Balanov, 2026.", backTop: "Back to top",
    copied: "Copied to clipboard", copyError: "Could not copy. Select the text manually.", transport: "Transport", localBoundary: "Local boundary", noNetwork: "No network request", exactTerms: "Exact terms", evidence: "Evidence", providerAssertion: "Provider assertion", task: "Task", simulation: "Simulation · no physical action",
    steps: [
      { title: "Discover the contract", description: "The agent requests one card at a known origin. No registry, login, or prior integration. The response is data, never instructions." },
      { title: "Read without changing anything", description: "ask invokes a read capability. Here, the service returns simulated materials and prices without side effects." },
      { title: "Get an exact offer", description: "quote prepares an action without executing it. The server returns terms, expiry, and a digest that the client independently recomputes." },
      { title: "Approve exactly this", description: "A local boundary: the user or trusted host reviews the terms and binds the decision to the digest. This is not a separate network request." },
      { title: "Commit without a duplicate", description: "commit repeats the digest and sends Idempotency-Key as an HTTP header. Reusing the key and content returns the original task, not a new one." },
      { title: "Get a result and its boundary", description: "status returns the task and receipt. provider_assertion makes it clear: this is the service's report, not independent proof of a physical action." }
    ]
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let language = ["ru", "en"].includes(localStorage.getItem("latch-language"))
  ? localStorage.getItem("latch-language")
  : (navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en");
let currentStep = 0;
let message = "request";
let playing = false;
let playTimer;
let toastTimer;

function setLanguage(next, persist = true) {
  language = next;
  const dictionary = copy[language];
  document.documentElement.lang = language;
  document.title = dictionary.pageTitle;
  $$('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key] !== undefined) element.innerHTML = dictionary[key];
  });
  $$('[data-i18n-aria]').forEach((element) => {
    const key = element.dataset.i18nAria;
    if (dictionary[key] !== undefined) element.setAttribute("aria-label", dictionary[key]);
  });
  $$('[data-lang]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
  if (persist) localStorage.setItem("latch-language", language);
  renderTrace();
  renderMetrics();
}

function shortDigest(digest) {
  return digest ? `${digest.slice(0, 19)}…${digest.slice(-8)}` : "—";
}
function renderTrace() {
  const dictionary = copy[language];
  const step = trace.steps[currentStep];
  const description = dictionary.steps[currentStep];
  $("#trace-title").textContent = description.title;
  $("#trace-description").textContent = description.description;
  $("#step-count").textContent = `${String(currentStep + 1).padStart(2, "0")} / ${String(trace.steps.length).padStart(2, "0")}`;
  $("#stage-operation").textContent = step.name.toUpperCase();
  $("#trace").dataset.phase = step.name;
  $("#trace").dataset.direction = step.request.local ? "local" : message;
  $("#trace").style.setProperty("--packet-distance", `${Math.max(0, $(".channel-line").clientWidth - 7)}px`);
  $("#wire-json").textContent = JSON.stringify(step[message], null, 2);
  $("#trace-panel").setAttribute("aria-labelledby", `tab-${currentStep}`);
  $$('[data-step]').forEach((button) => {
    const selected = Number(button.dataset.step) === currentStep;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $$('[data-message]').forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.message === message)));
  $("#prev-step").disabled = currentStep === 0;
  $("#next-step").disabled = currentStep === trace.steps.length - 1;
  $("#play-trace span").textContent = playing ? dictionary.pauseText : dictionary.playText;
  $("#play-trace").setAttribute("aria-label", playing ? dictionary.pause : dictionary.play);
  $("#play-trace svg").innerHTML = playing ? '<path d="M4 3h3v10H4zM9 3h3v10H9z"/>' : '<path d="m5 3 8 5-8 5Z"/>';
  $("#agent-state").textContent = step.request.local ? "LOCAL REVIEW" : (message === "request" ? "REQUEST" : "RESPONSE");
  $("#service-state").textContent = step.request.local ? "SIMULATION" : ({ discover: "CARD", ask: "READ", quote: "OFFER", commit: "TASK", receipt: "RECEIPT" })[step.name];
  const facts = [];
  if (step.request.local) {
    facts.push([dictionary.localBoundary, dictionary.noNetwork], ["Digest", shortDigest(step.request.approval.offer_digest)]);
  } else {
    facts.push([dictionary.transport, `${step.request.method} · ${step.request.url ? new URL(step.request.url).pathname : "HTTPS"}`]);
    if (step.name === "quote") facts.push([dictionary.exactTerms, `${step.response.offer.terms.amount / 100} ${step.response.offer.terms.currency}`], ["Digest", shortDigest(step.response.offer.digest)]);
    if (step.name === "commit") facts.push(["Idempotency-Key", step.request.headers["idempotency-key"]], ["Digest", shortDigest(step.request.body.offer_digest)]);
    if (step.name === "receipt") facts.push([dictionary.evidence, dictionary.providerAssertion], [dictionary.task, step.response.task.state]);
    if (["discover", "ask"].includes(step.name)) facts.push([dictionary.evidence, dictionary.simulation]);
  }
  $("#trace-fact").replaceChildren(...facts.flatMap(([term, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    return [dt, dd];
  }));
}
function stopPlayback() {
  playing = false;
  clearTimeout(playTimer);
  renderTrace();
}
function schedulePlayback() {
  clearTimeout(playTimer);
  if (!playing) return;
  playTimer = setTimeout(() => {
    if (currentStep === trace.steps.length - 1) {
      stopPlayback();
      return;
    }
    currentStep++;
    message = "request";
    renderTrace();
    schedulePlayback();
  }, 2800);
}
function togglePlayback() {
  if (playing) {
    stopPlayback();
    return;
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    currentStep = currentStep === trace.steps.length - 1 ? 0 : currentStep + 1;
    message = "request";
    renderTrace();
    return;
  }
  if (currentStep === trace.steps.length - 1) currentStep = 0;
  playing = true;
  renderTrace();
  schedulePlayback();
}
function selectStep(index, focus = false) {
  stopPlayback();
  currentStep = Math.max(0, Math.min(index, trace.steps.length - 1));
  message = "request";
  renderTrace();
  if (focus) $(`#tab-${currentStep}`).focus();
}

$$('[data-lang]').forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
$$('[data-step]').forEach((button) => {
  button.addEventListener("click", () => selectStep(Number(button.dataset.step)));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") selectStep(0, true);
    else if (event.key === "End") selectStep(trace.steps.length - 1, true);
    else selectStep((currentStep + (event.key === "ArrowRight" ? 1 : -1) + trace.steps.length) % trace.steps.length, true);
  });
});
$$('[data-message]').forEach((button) => button.addEventListener("click", () => {
  message = button.dataset.message;
  renderTrace();
}));
$("#prev-step").addEventListener("click", () => selectStep(currentStep - 1));
$("#next-step").addEventListener("click", () => selectStep(currentStep + 1));
$("#play-trace").addEventListener("click", togglePlayback);
$("#trace").addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.target.closest("pre")) {
    event.preventDefault();
    togglePlayback();
    return;
  }
  if (event.target.closest("button") || event.target.closest("pre")) return;
  if (event.key === "ArrowRight") { event.preventDefault(); selectStep(currentStep + 1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); selectStep(currentStep - 1); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing) stopPlayback();
});

function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
}
$$('[data-copy-target]').forEach((button) => button.addEventListener("click", async () => {
  const source = document.getElementById(button.dataset.copyTarget);
  const text = source.textContent;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const succeeded = document.execCommand("copy");
      area.remove();
      if (!succeeded) throw new Error("Copy command returned false");
    }
    toast(copy[language].copied);
  } catch {
    toast(copy[language].copyError);
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(source);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}));

function decimal(value) {
  return value.toFixed(2).replace(".", language === "ru" ? "," : ".");
}
function renderMetrics() {
  const integer = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US");
  $("#source-size").textContent = integer.format(metrics.intrinsic.implementation_bytes);
  $("#cold-value").textContent = decimal(metrics.cold_start.median_ms);
  $("#flow-value").textContent = decimal(metrics.full_flow.median_ms);
  $("#cold-note").textContent = `median · n=${metrics.cold_start.samples}`;
  $("#flow-note").textContent = `median · n=${metrics.full_flow.samples}`;
  for (const operation of ["ask", "quote", "commit", "status"]) {
    $(`#${operation}-median`).textContent = `${decimal(metrics.operations[operation].median_ms)} ms`;
    $(`#${operation}-p95`).textContent = `${decimal(metrics.operations[operation].p95_ms)} ms`;
  }
  $("#bench-environment").textContent = `${metrics.environment.node} · ${metrics.environment.platform} · ${metrics.environment.architecture}`;
  $("#bench-date").textContent = new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" }).format(new Date(metrics.timestamp));
}

async function loadGithubStats() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch("https://api.github.com/repos/Balanov/latch", {
      headers: { accept: "application/vnd.github+json" }, signal: controller.signal
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();
    if (!Number.isFinite(data.stargazers_count) || !Number.isFinite(data.forks_count)) throw new Error("Missing counters");
    $("#stars-value").textContent = new Intl.NumberFormat(language).format(data.stargazers_count);
    $("#forks-value").textContent = new Intl.NumberFormat(language).format(data.forks_count);
    $("#stars-link").title = `${data.stargazers_count} GitHub stars`;
    $("#forks-link").title = `${data.forks_count} GitHub forks`;
    $("#stats-status").textContent = copy[language].statsLive;
  } catch {
    $("#stars-value").textContent = "—";
    $("#forks-value").textContent = "—";
    $("#stats-status").textContent = copy[language].statsError;
  } finally {
    clearTimeout(timeout);
  }
}

setLanguage(language, false);
loadGithubStats();
