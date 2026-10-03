# Architecture

## Where Hearsay sits

Beside the server under test, never in front of it in production.

| Where | How | Mode |
|---|---|---|
| Developer laptop | `hearsay serve` + web console; `hearsay lint <url>` | scripted, llm |
| Coding agent (Claude Code, Kiro) | `@hearsayhq/mcp`: `hearsay_lint`, `hearsay_run`, `hearsay_explain`; the agent fixes findings in a loop | scripted, replay |
| CI (pull requests) | CLI from a workflow step; starts the server from `server.start`, exit 1 on error findings, JSON report as artifact | scripted, replay |
| Pre-release | llm mode against a staging URL: does a real model pick the right tools from these descriptions? `gen-variants` to record real mishearings. | llm (+ `--record`) |

Any server that speaks MCP Streamable HTTP works. Nothing is installed into the server.

```
suite.yaml ──► engine ─────────────────────── MCP Streamable HTTP ──► server under test
 + variants    runner  (session + principal per case × variant)   ◄── elicitation/create
               ├─ perturb: seeded tables | recorded roundtrip      ◄── notifications/tools/list_changed
               ├─ orchestrator: scripted | llm | replay
               │                 └─ ModelProvider: bedrock
               ├─ trace (spans, calls, elicitations, confirmations)
               └─ checks ──► findings (question, severity, source) ──► report
                     │
          ┌──────────┴───────────┐
       cli (run/lint/validate/     serve (Hono, HTTP + SSE) ──► web console (Vite + React)
            checks/gen-variants)   timeline, findings by question
       exit code, JSON             mcp (@hearsayhq/mcp) ──► coding agents: lint, run, explain

gen-variants (offline, AWS): utterance ─► Polly (4 voices) ─► noise + telephone band ─► Transcribe Streaming ─► variants file
```

## Packages

| Path | Depends on | Responsibility |
|---|---|---|
| `packages/mandate` (`@hearsayhq/mandate`) | nothing | Pure policy: `authorize`, `settleExpiry`, error codes. Ported from webMCP. |
| `packages/kit` (`@hearsayhq/kit`) | MCP SDK | Building blocks for voice-ready servers: `speak()`, `refuse()`, `serveMcp()` (principal per session) from M1; `confirm()`, `withMandate()` in M2b. Reference servers use it. |
| `packages/engine` (`@hearsayhq/engine`) | mandate, MCP SDK, zod, yaml | Session, runner, orchestrators (D-002), perturbations, checks, report. |
| `packages/cli` (`@hearsayhq/cli`, binary `hearsay`) | engine | Argument parsing, printing, exit codes. No logic. |
| `packages/mcp` (`@hearsayhq/mcp`) | engine, MCP SDK | Hearsay as an MCP server (stdio and Streamable HTTP) for coding agents: lint, run, explain (FR-034). No logic of its own; no tool writes suites. |
| `packages/web` | engine (types only) | Console UI. Renders traces and findings; decides nothing. |
| `servers/*` | MCP SDK, zod, mandate | Reference servers, one per demo story. |
| `suites/` | — | YAML suites; `suites/cassettes/` for replay (keyed by request; a request asked again, such as the same first turns in two cases, keeps every answer and replays them in order); `suites/variants/` for recorded mishearings. |
| `skills/fix-hearsay-findings` | — | Agent Skill: the fix loop for coding agents (FR-038). |
| `skills/write-hearsay-suite` | — | Agent Skill that drafts a suite from `tools/list` (FR-033). |

The npm name `hearsay` belongs to an unrelated library. Docs always say `npx @hearsayhq/cli`.

Planned engine layout (M1–M4):

```
engine/src/
  session.ts        McpSession: Client + StreamableHTTPClientTransport, bearer principal,
                    elicitation handler (or none), list_changed → toolListRevision
  runner.ts         cases in order, fresh session + principal per case × variant (D-003, D-009),
                    after chains, skipped checks
  orchestrators/    scripted.ts, llm.ts, replay.ts, providers/bedrock.ts
  perturb/          one file per perturbation, seeded PRNG; args.ts applies word diffs to arguments;
                    roundtrip.ts reads suites/variants/
  voice/            polly.ts, channel.ts (noise, telephone band; pure TS), transcribe.ts (gen-variants only)
  checks/           one file per category; each binds to a CheckSpec from catalog.ts
  latency.ts        the model from docs/03
  server-process.ts starts `server.start` with PORT set from the suite URL, stops it on exit
  console/          planner.ts (nearest case, D-023), session-hub.ts (one MCP session per tab,
                    the person answers elicitations), serve.ts (Hono app), wire.ts (event types)
  types.ts          types only, for the browser: `@hearsayhq/engine/types`
```

### Console API (`hearsay serve`, FR-040)

Localhost only (127.0.0.1:4100). The console proxies `/api` to it; the engine decides, the
console renders. Requests with a non-local Host or Origin, and POSTs that are not JSON, are
refused; `suitePath` must name a suite under `suites/` (docs/06 §Hearsay's own local surfaces).

| Endpoint | Does |
|---|---|
| `GET /api/catalog`, `GET /api/suites` | checks by question with sources; suites in `suites/` (holdouts never listed) |
| `POST /api/connect {suitePath}` | starts the suite's server if nothing answers, opens an MCP session with elicitation and a fresh principal |
| `GET /api/events/:sessionId` | SSE: `turn` (trace turn, planner, first-audio breakdown, findings), `elicitation`, `elicitation-answered`, `tools` |
| `POST /api/say {sessionId, text}` | plays one turn; the result arrives as a `turn` event, after any elicitation is answered |
| `POST /api/elicitation/:id {sessionId, action}` | the person's answer: accept, decline or cancel |
| `POST /api/run {suitePath}` | runs the suite as `hearsay run` does and writes the report to `reports/` (FR-042) |
| `POST /api/disconnect {sessionId}` | closes the session; servers the console started stop when `serve` stops |

Live checks per console turn: of `latency.*`, `speak.*`, `lint.error_actionable`,
`protocol.refusal_as_result`, `consent.path` and `consent.states_details`, those the suite
selects, as in CI. Checks that need variants, state snapshots or exact arguments run with
"Run suite".

## Stack and why

Chosen for the requirements, not by habit:

- **TypeScript everywhere.** The TypeScript MCP SDK is the reference implementation: 1.31
  negotiates 2025-11-25 and has `elicitInput` and `sendToolListChanged` (verified). The console
  runs in a browser and shares the trace types with the engine. The ported mandate code is
  TypeScript.
- **npm workspaces, no build step for development.** `tsx` runs sources; `tsc --noEmit`
  typechecks. Publishing bundles with tsup (§Distribution).
- **zod 4 + YAML** for suites: one schema gives readable validation errors and the types.
- **Hono** for `hearsay serve`: small, SSE built in, same as the webMCP service.
- **Vite + React** for the console: a local tool with no SEO or SSR needs.
- **Vitest** for tests.
- **Bedrock Converse API** as the model provider: one tool-use shape across Claude, Nova and
  others; the documented AWS integration for the AWS Builder mini challenge.
- **Amazon Polly + Amazon Transcribe Streaming** for `gen-variants` only. Streaming takes PCM
  directly, so no S3 bucket is needed. Noise and the telephone band (300–3400 Hz, 8 kHz) are
  pure TypeScript DSP, seeded. Voices: Joanna, Matthew, Amy and Kajal by default
  (`HEARSAY_POLLY_VOICES` overrides); one US voice alone was heard almost always right (3 Oct).
- **Browser speech synthesis** for the console's reply voice. No microphone input (cut, ROADMAP).

## Distribution

`npm run pack` (scripts/pack.mjs) builds three packages into `build/npm/`, each with the
workspace code (engine, mandate, kit) bundled by tsup and third-party dependencies external at
the workspace's versions:

| Package | Contains |
|---|---|
| `@hearsayhq/cli` | binary `hearsay`; the built console in `dist/console`, served by `hearsay serve` at `/` |
| `@hearsayhq/mcp` | binary `hearsay-mcp`; the Agent Skills in `skills/` |
| `@hearsayhq/kit` | the kit as a library, with type declarations |

The workspace itself runs from `src` (tsx) and never needs a build. Publishing
(`npm publish build/npm/<file>.tgz --access public`) is the owner's step.

## Model providers and budget

Scripted and replay modes cost nothing and are what CI and judges run. Money is only spent in
llm mode and in `gen-variants`.

Rough sizing per llm turn: ~2 model calls, ~5k input and ~300 output tokens (tool schemas
dominate). A full run of the three bundled suites is about 50 turns including variants; with a
small, fast model at roughly $1 per million input and $5 per million output tokens that is around
$0.30–0.40 per run. `gen-variants` for all suites is a few hundred Polly characters and a few
minutes of Transcribe. Prices change; check the AWS pricing pages before relying on this.

| Budget | Use |
|---|---|
| AWS credits via the hackathon form ($150) | Bedrock llm runs and cassette recording; Polly and Transcribe for `gen-variants` |
| Anthropic, DeepSeek credits | Fallback only if Bedrock access fails (R-06) |

No hosting and no VM are needed. Judges run the repo locally (hackathon FAQ).

## CLI contract

| Command | Exit 0 | Exit 1 | Exit 2 |
|---|---|---|---|
| `validate <suite...>` | all valid | any invalid | usage |
| `checks` | always | — | — |
| `run <suite...> [--only id] [--failed] [--holdout] [--orchestrator m] [--record] [--verbose]` | no error findings | error findings | usage / cannot connect |
| `lock [suite...]` | lock written | — | usage |
| `lint <url>` | no error findings | error findings | usage / cannot connect |
| `gen-variants <suite...>` | variants written | provider error | usage / no AWS credentials |
| `serve [--port 4100]` | runs until stopped | — | usage |

`hearsay-mcp` (`npm run mcp`): stdio by default, `--http --port 4199` for Streamable HTTP, `--cwd` for the project root.
