# LATCH market and protocol research

**Checked:** 4 November 2026. This document records the design evidence, not a claim that LATCH replaces the projects below.

## Executive summary

The useful opening is not another general agent protocol. MCP already covers tool invocation and, in its 2026-07-28 revision, has a stateless core with optional discovery, multi-round input requests, cacheable lists, routing headers, and extensions.[^1^] A2A covers delegated work between agents with Agent Cards, task lifecycles, multiple bindings, and signed-card work.[^2^] WebMCP exposes browser-registered tools but remains a Draft Community Group Report rather than a W3C standard.[^3^] A new entrant claiming merely “stateless tools over HTTP” would therefore be late and redundant. LATCH instead occupies a narrower operational gap: an HTTP-capable agent with no preinstalled SDK should be able to discover a service’s actionable contract, perform a read, obtain a binding quote, commit an explicitly approved digest, retry safely, and receive a portable receipt. The implementation is deliberately compatible with existing protocols rather than attempting to displace them.

The commerce example is illustrative rather than the market boundary. UCP already defines rich merchant/platform profiles, capability negotiation, schema composition, REST/MCP/A2A bindings, checkout, fulfillment, orders, and payment handlers.[^4^] ACP defines buyer-agent-business checkout and delegated payment artifacts maintained by OpenAI and Stripe.[^5^] AP2 and related authorization work address signed payment mandates, while A2CN and Concordia explore negotiation, mandates, and signed receipts.[^6^] Reimplementing those systems would make LATCH heavier and less useful. The viable product is the minimal pre-protocol connector and proof discipline around any service: manufacturing, logistics, bookings, data, maintenance, local services, digital goods, and read-only capabilities. Commerce-specific deployments should compose with UCP/ACP/AP2 instead of translating their semantics into a weak generic imitation.

## 1. What the existing layers already solve

MCP’s current direction removes some of the most obvious criticisms that a lightweight project might otherwise exploit. Its latest core no longer requires an initialize session and lets any request reach any compatible server instance; optional discovery, caching, and MRTR make it more web-like than earlier versions.[^1^] It would be inaccurate to market LATCH as uniquely stateless or uniquely capable of asking for missing input. The remaining difference is the consumer boundary: LATCH can be implemented from a short JSON contract with an existing HTTP stack, without an MCP client or a JSON-RPC tool model. That is not inherently “better” for every deployment. MCP remains the stronger choice when a host already provides its ecosystem, registry, authorization machinery, UI extensions, and SDKs. LATCH’s value is the no-client first contact and the explicit offer/commit/receipt state machine across services that do not behave like tools inside one host.

A2A and WebMCP answer different questions again. A2A is appropriate when the remote side performs an autonomous task and needs task/message/artifact semantics; an ordinary booking endpoint does not automatically deserve to become an agent.[^2^] WebMCP runs in a page and can use the visitor’s browser session, which is valuable for local, human-in-the-loop web workflows but does not replace a server-to-server first-contact contract.[^3^] AGENTS.md and llms.txt show the adoption power of predictable, low-cost documents: the former gives coding agents repository instructions and is used across a large open-source ecosystem, while the latter offers concise documentation links and path-local publishing.[^7^][^8^] Neither defines an executable transaction boundary. LATCH borrows their distribution simplicity but puts machine-checked state transitions behind the document.

| Layer | Strongest fit | What LATCH deliberately does not duplicate |
| --- | --- | --- |
| MCP | Host-mediated tools, resources, prompts, apps, authorization, SDK ecosystem | JSON-RPC tool hosting, MCP registry semantics, MCP UI |
| A2A | Delegating tasks to remote autonomous agents | General agent identity, messages, artifacts, multi-transport task delegation |
| WebMCP | Browser-page tools with local session and browser consent surface | Browser APIs and page-owned execution |
| OpenAPI + Arazzo | Endpoint description and deterministic multi-step workflows | General API documentation and workflow graph execution[^9^] |
| UCP / ACP | Commerce discovery, checkout, orders, fulfillment, delegated payment | Vertical commerce semantics and payment token exchange |
| AP2 / x402 | Payment authorization mandates and payment settlement | Wallets, settlement rails, verifiable payment credentials |
| AGENTS.md / llms.txt | Agent-readable instructions and documentation discovery | Prose documentation conventions |

Two adjacent findings constrain the design further. NLWeb already offers natural-language site interaction and native MCP support, so “chat with a website” is not a vacant category.[^10^] Agent Reach demonstrates an effective bottom-up distribution loop: a user sends an agent one installation document, and the agent installs and configures channels locally.[^11^] LATCH should borrow the clarity of that loop but narrow its authority: the invite identifies one service connector and requires review, rather than encouraging arbitrary remote instructions or silent package execution. Its provider-first card and agent-first invite are two sides of the same retryable discovery URL, with no central service needed to complete the connection.

## 2. The marketable technical gap

The defensible gap is **portable commitment for agents that did not come pre-integrated with a provider**. Ordinary API schemas describe inputs and outputs, while agent frameworks often leave the model to infer whether a call is safe, whether a price is final, whether a retry duplicates an order, and what the resulting receipt actually proves. LATCH turns those four uncertainties into a small state machine: `ask` is read-only, `quote` prepares but does not execute, `commit` repeats the exact offer digest with an idempotency key, and a receipt states the evidentiary boundary. This is useful outside commerce: an agent can reserve a repair slot, request a manufacturing run, initiate a storage operation, submit a print job, or invoke a read-only inventory capability under the same envelope. Domain-specific fields remain in capability inputs and extensions rather than bloating the core.

Security is not an accessory to this gap. OWASP identifies excessive agency as a risk arising from excessive functionality, permissions, and autonomy, including manipulated model outputs that cause harmful actions.[^12^] The IETF’s agent principal-binding draft explicitly warns that digest equality is not authorization, same-party evidence is not independent verification, and reported success is not proof of physical completion.[^13^] Consequently, LATCH must never claim that a hash proves a human approved, that a CLI confirmation identifies a human, or that a provider receipt proves physical fulfillment. Its useful guarantee is narrower and testable: changing the offer breaks the digest, a mismatched approval is rejected, an expired offer is rejected, and an idempotency-key conflict is rejected before the provider handler runs.

| Failure without a small contract | LATCH mechanism | Explicit non-guarantee |
| --- | --- | --- |
| Agent executes while asking for a price | Separate `quote` and `commit` | The provider still must implement quote correctly |
| Agent approves one thing and executes another | Canonical offer digest repeated at commit | A digest does not authenticate the provider or human |
| Timeout causes a duplicate order | Required `Idempotency-Key`, conflict on changed content | Exactly-once external effects are impossible to promise |
| Agent treats a result as physical proof | `evidence: provider_assertion` receipt boundary | Independent physical observation needs another verifier |
| Service is not integrated yet | Reviewable invite and later retry of discovery | No auto-install, auto-issue, or trust by URL |
| Every harness needs a custom adapter | Plain HTTPS + optional CLI/MCP bridge | No universal discovery of every service on the web |

The HTTP conventions should be reused rather than reinvented. RFC 8615 reserves `/.well-known/` for precisely this kind of origin metadata and asks new suffixes to be specific and registered.[^14^] The IETF idempotency-key draft defines how a client-supplied key makes non-idempotent POST requests fault tolerant, while its security guidance calls for validated, high-entropy keys and scoped lookups to avoid leaks and collisions.[^15^] LATCH follows those conventions and adds only the semantics missing between them: an action-bound offer, approval boundary, task state, and receipt. This keeps the core legible to web developers who have no interest in agent protocol politics.

## 3. Adoption and viral mechanics without spam

The provider-first motion is a one-afternoon integration target: publish a card, map a read or write capability, run the conformance suite, and place a small “LATCH-enabled” link in developer documentation. There is no registry approval, central uptime dependency, usage fee, token, or hosted relay. The agent-first motion is an invite artifact generated locally by `latch invite`, containing the service origin and provider quick start. A user can review it and send it through an existing support or repository channel. The tool does not auto-post GitHub issues or pull requests, because unsolicited automated integration requests would burn goodwill and reproduce the spam dynamics that harm open-source maintainers. Adoption comes from shortening integration and execution, not from manufacturing notifications.

The repository itself is the second distribution surface. A short Agent Skill can teach any skill-capable agent the state machine, while agents without skills can read `llms.txt` or call the CLI. MCP users get a stdio bridge, but it is an adapter rather than a tax on everyone else. Each public card links back to the open specification, so one provider integration gives every visiting agent a path to understand the protocol. Forks are explicitly cheap: MIT licensing, no CLA, conformance fixtures, and no dependency on Balanov infrastructure. The project should measure successful local flows, interoperability fixtures, integration time, and real provider adoption—not stars alone, and certainly not fabricated “number of agents connected.”

| Mechanic | User value | Anti-spam boundary |
| --- | --- | --- |
| `/.well-known/latch.json` | Deterministic discovery from a known origin | No crawling or registration requirement |
| One-file CLI | Agents with shell access can use it immediately | Explicit install; verify repository and release |
| `SKILL.md` + `llms.txt` | Progressive disclosure for different agent hosts | Remote text remains untrusted data |
| `latch invite` | Turns missing integration into an actionable handoff | Never sends or posts automatically |
| MCP stdio bridge | Reuses hosts that already speak MCP | Optional, not required by providers or agents |
| MIT + conformance tests | Safe forks and independent implementations | No trademark or compatibility claim without tests |

The strongest launch artifact is therefore not a manifesto but a working cross-environment proof: one command starts a provider, another discovers it, and a short transcript shows the exact wire messages through quote, explicit approval, commit, status, and receipt. Benchmarks must measure that artifact on declared hardware and runtime versions. Payload sizes, cold starts, local round trips, and full-flow timings are meaningful only with commands, raw samples, and limitations. There is no honest basis for claiming LATCH “beats every protocol” before equivalent implementations are measured; even after measurement, results rank a specific local scenario, not the feature-rich ecosystems being compared.

## 4. Product boundary and implementation priorities

The first release should ship one dependency-free ESM executable, a Node 20+ reference server/client, a strict same-origin discovery policy, canonical offer digests, explicit CLI approval, in-memory idempotency for development, a complete simulated provider, and tests for the security invariants. It should also ship an MCP stdio bridge and a static bilingual page with the real recorded exchange. It should not ship a central registry, wallets, DID infrastructure, visual workflow builder, hosted proxy, account system, automatic package installer, or promises of independent real-world verification. Those features would multiply the trusted computing base before the minimal loop has external users. Production persistence, OAuth profiles, signed cards, UCP/ACP/AP2 composition examples, and additional language runtimes are sensible later increments after the wire contract is exercised by independent implementations.

Success depends on resisting the temptation to call every possible integration “universal.” Universality here has a precise meaning: any environment that can make an HTTPS JSON request can implement the contract, and any harness with shell access can use the optional CLI. It does not mean every existing agent automatically discovers every provider, every schema is understood by every model, or every side effect becomes safe. The project’s public limits should be as visible as its quick start. That combination—small code, runnable proof, measured performance, and candid boundaries—is both more useful to startups and more credible to developers than a broad claim of replacing the agent stack.

[^1^]: [Model Context Protocol — 2026-07-28 specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
[^2^]: [A2A — specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md)
[^3^]: [W3C Web Machine Learning CG — WebMCP draft](https://webmachinelearning.github.io/webmcp)
[^4^]: [Universal Commerce Protocol — overview](https://ucp.dev/2026-08-25/specification/overview/)
[^5^]: [Agentic Commerce Protocol — repository](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
[^6^]: [A2A discussion — negotiation, mandates, and commit authority](https://github.com/a2aproject/A2A/discussions/1737)
[^7^]: [AGENTS.md](https://agents.md/)
[^8^]: [llms.txt proposal](https://llmstxt.org/)
[^9^]: [OpenAPI Initiative — Arazzo specification](https://github.com/OAI/Arazzo-Specification)
[^10^]: [NLWeb — reference implementation](https://github.com/nlweb-ai/NLWeb)
[^11^]: [Agent Reach — installation and distribution model](https://github.com/Panniantong/agent-reach/blob/main/docs/README_en.md)
[^12^]: [OWASP Top 10 for LLM Applications — Excessive Agency](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)
[^13^]: [IETF draft — Agent Principal Binding](https://datatracker.ietf.org/doc/draft-bu-agentproto-security-principal-binding/)
[^14^]: [RFC 8615 — Well-Known URIs](https://www.rfc-editor.org/rfc/rfc8615.html)
[^15^]: [IETF draft — Idempotency-Key HTTP Header](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header)
