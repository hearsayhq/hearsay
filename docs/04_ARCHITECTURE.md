# Architecture

## Where Hearsay sits

Beside the server under test, never in front of it in production.

| Where | How | Mode |
|---|---|---|
| Developer laptop | `hearsay serve` + web console; `hearsay lint <url>` | scripted, llm |
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
       exit code, JSON

gen-variants (offline, AWS): utterance ─► Polly ─► noise + telephone band ─► Transcribe Streaming ─► variants file
```

## Packages

| Path | Depends on | Responsibility |
|---|---|---|
| `packages/mandate` (`@hearsayhq/mandate`) | nothing | Pure policy: `authorize`, `settleExpiry`, error codes. Ported from webMCP. |
| `packages/engine` (`@hearsayhq/engine`) | mandate, MCP SDK, zod, yaml | Session, runner, orchestrators (D-002), perturbations, checks, report. |
| `packages/cli` (`@hearsayhq/cli`, binary `hearsay`) | engine | Argument parsing, printing, exit codes. No logic. |
| `packages/web` | engine (types only) | Console UI. Renders traces and findings; decides nothing. |
| `servers/*` | MCP SDK, zod, mandate | Reference servers, one per demo story. |
| `suites/` | — | YAML suites; `suites/cassettes/` for replay; `suites/variants/` for recorded mishearings. |
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
  serve.ts          Hono app for the console (M5)
```

## Stack and why

Chosen for the requirements, not by habit:

- **TypeScript everywhere.** The TypeScript MCP SDK is the reference implementation: 1.31
  negotiates 2025-11-25 and has `elicitInput` and `sendToolListChanged` (verified). The console
  runs in a browser and shares the trace types with the engine. The ported mandate code is
  TypeScript.
- **npm workspaces, no build step for development.** `tsx` runs sources; `tsc --noEmit`
  typechecks. A bundle step (tsup) is added only when the CLI is published (M6).
- **zod 4 + YAML** for suites: one schema gives readable validation errors and the types.
- **Hono** for `hearsay serve`: small, SSE built in, same as the webMCP service.
- **Vite + React** for the console: a local tool with no SEO or SSR needs.
- **Vitest** for tests.
- **Bedrock Converse API** as the model provider: one tool-use shape across Claude, Nova and
  others; the documented AWS integration for the AWS Builder mini challenge.
- **Amazon Polly + Amazon Transcribe Streaming** for `gen-variants` only. Streaming takes PCM
  directly, so no S3 bucket is needed. Noise and the telephone band (300–3400 Hz, 8 kHz) are
  pure TypeScript DSP, seeded.
- **Browser speech synthesis** for the console's reply voice. No microphone input (cut, ROADMAP).

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
| `run <suite...> [--only id] [--orchestrator m] [--record] [--verbose]` | no error findings | error findings | usage / cannot connect |
| `lint <url>` | no error findings | error findings | usage / cannot connect |
| `gen-variants <suite...>` | variants written | provider error | usage / no AWS credentials |
| `serve [--port 4100]` | — | — | usage |
