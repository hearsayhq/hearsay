# Requirements

Priority: **M** must (the submission fails without it), **S** should, **C** could (first to cut).
Milestones refer to docs/07. Commits and PRs reference FR ids.

## Connection and protocol

| Id | P | Requirement | M |
|---|---|---|---|
| FR-001 | M | Connect to an MCP server over Streamable HTTP, negotiate protocol 2025-11-25, record server info and capabilities. | M1 |
| FR-002 | M | List tools; track a tool-list revision that increments on `notifications/tools/list_changed`. | M1 |
| FR-003 | M | Answer `elicitation/create` through a simulated human configured per case (accept / decline / cancel + content). | M1 |
| FR-004 | M | One fresh MCP session per case × variant; the case's `after` chain is replayed first as untraced-for-judging setup turns. | M1 |

## Suites and orchestration

| Id | P | Requirement | M |
|---|---|---|---|
| FR-010 | M | Load and validate YAML suites against `SuiteSchema`; unknown check or perturbation ids are errors. **Done (M0).** | M0 |
| FR-011 | M | Scripted orchestrator: executes `call` (or `expect.tool/args`) and composes the spoken reply from the tool result text. | M1 |
| FR-012 | M | LLM orchestrator over `ModelProvider`; Bedrock (Converse API) adapter as default. | M3 |
| FR-013 | M | Replay orchestrator: record llm runs into cassettes (`--record`), replay them without network. | M3 |
| FR-014 | S | Provider adapters for Anthropic API and OpenAI-compatible endpoints (DeepSeek). | M3 |
| FR-015 | M | Deterministic, seeded ASR perturbations producing named variants (`asr.number_confusion#1`). | M3 |
| FR-016 | M | Trace capture: spans for asr, plan, tool, elicitation, speak. Tool and plan times measured; asr and speak modeled from config in scripted/replay modes (D-004). | M1 |

## Checks and reporting

| Id | P | Requirement | M |
|---|---|---|---|
| FR-020 | M | Check framework: server-scope and turn-scope checks producing `Finding`s with severity and hint. | M1 |
| FR-021 | M | All `must` checks in the catalog implemented, each with a failing self-test fixture (docs/08). | M2–M4 |
| FR-022 | S | All `should` checks implemented. | M4 |
| FR-023 | C | `conv.goal_reached` with persona-driven simulated users. | M6 |
| FR-030 | M | `earshot run`: human summary on stdout, JSON report to `reports/`, exit 1 on any error finding. | M1 |
| FR-031 | M | `earshot lint <url>`: server-scope checks only, no suite needed. | M2 |
| FR-032 | S | Composite GitHub Action wrapping `earshot run`. | M6 |

## Console

| Id | P | Requirement | M |
|---|---|---|---|
| FR-040 | M | `earshot serve`: engine API on :4100 with SSE stream of turns and findings. | M5 |
| FR-041 | M | Web console: connect to a server URL, text or microphone input, spoken reply, per-turn timeline. | M5 |
| FR-042 | S | Run a suite from the console and browse the report. | M5 |
| FR-043 | C | Amazon Polly voice for replies (AWS Builder), browser speech synthesis as fallback. | M5 |

## Reference servers

| Id | P | Requirement | M |
|---|---|---|---|
| FR-050 | M | Kitchen server per servers/kitchen/README.md; passes its suite. | M1 |
| FR-051 | M | Smart Home server with `EARSHOT_FIXED=0/1`; flawed mode produces exactly the documented findings. | M2 |
| FR-052 | M | Household Orders with mandate, elicitation-only commit and list_changed per its README. | M4 |

## Delivery

| Id | P | Requirement | M |
|---|---|---|---|
| FR-060 | M | Fresh clone to first green run in under 5 minutes, with no API keys (scripted + replay). | M6 |
| FR-061 | M | Submission package per docs/09: video < 3 min, feedback, friction log, disclosures. | M7 |

## Non-functional

- **NFR-1 Determinism.** Scripted and replay runs produce identical findings on repeat. Unit tests never call a model or the network.
- **NFR-2 Honest output.** Every verdict names the check id, the evidence and a fix. No score without a reason.
- **NFR-3 Local-first.** No hosting required. Network only to the target server and the chosen model provider.
- **NFR-4 Node 22+, TypeScript strict.** One language across engine, servers, CLI and console.
