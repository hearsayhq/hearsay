# Requirements

Priority: **M** must (the submission fails without it), **S** should, **C** could (first to cut).
Milestones refer to docs/07. Commits and PRs reference FR ids. Scope is frozen (docs/07);
new ideas go to docs/ROADMAP.md.

## Connection and protocol

| Id | P | Requirement | M |
|---|---|---|---|
| FR-001 | M | Connect over Streamable HTTP offering protocol 2025-11-25; a second probe offers 2025-03-26 (`protocol.version`). Record server info and capabilities. | M1 |
| FR-002 | M | List tools; track a tool-list revision that increments on `notifications/tools/list_changed`. | M1 |
| FR-003 | M | Answer `elicitation/create` through a simulated person per case (accept / decline / cancel + content). Per case, the engine can declare no elicitation capability, to simulate hosts without it. | M1 |
| FR-004 | M | One fresh MCP session and one fresh principal (bearer token) per case × variant; the case's `after` chain runs first in that session as setup turns. | M1 |
| FR-005 | M | Verbal confirmation convention (docs/05): recognise `structuredContent.confirmation`; the scripted planner calls `confirmTool` only when the simulated person accepts. | M4 |

## Suites and orchestration

| Id | P | Requirement | M |
|---|---|---|---|
| FR-010 | M | Load and validate YAML suites against `SuiteSchema`; unknown check or perturbation ids are errors. **Done (M0).** | M0 |
| FR-011 | M | Scripted orchestrator: executes `call` (or `expect.tool/args`), composes the spoken reply from the tool result text, follows `injectedCall` as a compromised model. | M1 |
| FR-012 | M | LLM orchestrator over `ModelProvider`; Bedrock (Converse API) adapter. | M3 |
| FR-013 | M | Replay orchestrator: record llm runs into cassettes (`--record`), replay them without network. | M3 |
| FR-014 | — | *Cut:* Anthropic and OpenAI-compatible adapters. Only built if Bedrock access fails (R-06). | — |
| FR-015 | M | Seeded ASR perturbations on the utterance and on argument values, producing named variants (`asr.number_confusion#1`). Scripted mode runs only perturbations that change argument values. | M3 |
| FR-016 | M | Trace capture: spans for asr, plan, tool, elicitation, speak. Tool and plan measured; asr and speak modeled in scripted and replay mode and marked as modeled (D-004). | M1 |
| FR-017 | S | `hearsay gen-variants`: Polly → noise and telephone band → Transcribe Streaming. Heard texts are committed with the suite and replayed as `asr.roundtrip` variants; CI never calls AWS. | M3 |

## Checks and reporting

| Id | P | Requirement | M |
|---|---|---|---|
| FR-020 | M | Check framework: server and turn scope; per-check thresholds; every finding carries severity, question, source, evidence and hint. Suites can only tune Hearsay-sourced thresholds. | M1 |
| FR-021 | M | All `must` checks in the catalog implemented, each with a failing fixture (docs/08). | M1–M4 |
| FR-022 | S | All `should` checks implemented. | M4 |
| FR-023 | — | *Cut:* `conv.goal_reached` with personas (ROADMAP). | — |
| FR-024 | M | Checks a suite asks for that are not implemented are reported as skipped, never as passed. | M1 |
| FR-030 | M | `hearsay run`: summary grouped by the four questions on stdout, JSON report to `reports/`, exit 1 on any error finding. | M1 |
| FR-031 | M | `hearsay lint <url>`: server-scope checks only, no suite needed. | M2 |
| FR-032 | — | *Cut:* composite GitHub Action. The README carries a workflow snippet instead. | — |
| FR-033 | S | Agent Skill `write-hearsay-suite`: from `tools/list`, draft a suite with a case per tool, consent cases for destructive tools and fuzz entries. | M6 |
| FR-034 | S | Hearsay as an MCP server (`@hearsayhq/mcp`, Streamable HTTP and stdio): tools `hearsay_lint(url)`, `hearsay_run(suitePath, only?)`, `hearsay_explain(checkId)`. A thin wrapper around the engine with no logic of its own; the same findings as the CLI, including sources. It passes its own `protocol.*` and `lint.*` checks. README carries config snippets for Claude Code and Kiro. | M6 |

## Console

| Id | P | Requirement | M |
|---|---|---|---|
| FR-040 | M | `hearsay serve`: engine API on :4100 with an SSE stream of turns and findings. | M5 |
| FR-041 | M | Web console: connect to a server URL, text input, spoken reply through browser speech synthesis, per-turn timeline, findings grouped by the four questions with sources. | M5 |
| FR-042 | S | Run a suite from the console and browse the report. | M5 |
| FR-043 | — | *Cut:* Polly reply voice and microphone input (ROADMAP). | — |

## Reference servers

| Id | P | Requirement | M |
|---|---|---|---|
| FR-050 | M | Kitchen server per servers/kitchen/README.md; passes its suite. | M1 |
| FR-051 | M | Smart Home server with `HEARSAY_FIXED=0/1`; flawed mode produces exactly the documented (check, severity) pairs, fixed mode none. | M2 (asr.robust M3) |
| FR-052 | M | Household Orders per its README: mandate bound to the principal, static tool list, enums enforced only by `authorize()`, version stamped on cart lines, strong and verbal consent paths. | M4 |

## Delivery

| Id | P | Requirement | M |
|---|---|---|---|
| FR-060 | M | Fresh clone to first green run in under 5 minutes, with no API keys (scripted + replay). | M6 |
| FR-061 | M | Submission package per docs/09: video < 3 min, feedback, friction log, disclosures. | M7 |
| FR-062 | C | Scan of public MCP servers: `tools/list` plus calls to `readOnlyHint` tools only, no auth, terms of use respected, results published in aggregate only. | M6 |
| FR-063 | S | Open Source contribution: issue, then PR to AlSayedGamal/mcp-voice-simulator (form elicitation as a spoken confirmation, fail closed). Plan B: MCP transport for sujitnoronha/voicecheck. At most half a day. | M6 |
| FR-064 | M | A short demo clip after every gate (docs/09 §Clips per gate). | M1–M6 |

## Non-functional

- **NFR-1 Determinism.** Scripted and replay runs produce identical findings on repeat. Unit tests never call a model or the network.
- **NFR-2 Honest output.** Every verdict names the check id, the evidence, the source and a fix. No score without a reason.
- **NFR-3 Local-first.** No hosting required. Network only to the target server and, in llm mode or `gen-variants`, to AWS.
- **NFR-4 Node 22+, TypeScript strict.** One language across engine, servers, CLI and console.
- **NFR-5 Sourced thresholds.** Amazon and MCP thresholds are fixed; a suite cannot loosen them.
