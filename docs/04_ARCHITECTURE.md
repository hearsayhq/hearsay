# Architecture

## Where Earshot sits

Beside the server under test, never in front of it in production.

| Where | How | Mode |
|---|---|---|
| Developer laptop | `earshot serve` + web console; `earshot lint <url>` | scripted, llm |
| CI (pull requests) | CLI or GitHub Action; starts the server from `server.start`, exit 1 on error findings, JSON report as artifact | scripted, replay |
| Pre-release | llm mode against a staging URL: does a real model pick the right tools from these descriptions? | llm (+ `--record`) |

Any server that speaks MCP Streamable HTTP works. Nothing is installed into the server.

```
suite.yaml ──► engine ──────────────────── MCP Streamable HTTP ──► server under test
               runner                                          ◄── elicitation/create
               ├─ perturb (seeded)                             ◄── notifications/tools/list_changed
               ├─ orchestrator: scripted | llm | replay
               │                 └─ ModelProvider: bedrock | anthropic | openai-compatible
               ├─ trace (spans, calls, elicitations)
               └─ checks ──► findings ──► report
                     │
          ┌──────────┴───────────┐
       cli (run/lint/validate)   serve (Hono, HTTP + SSE) ──► web console (Vite + React)
       exit code, JSON           timeline, voice, findings
```

## Packages

| Path | Depends on | Responsibility |
|---|---|---|
| `packages/mandate` | nothing | Pure policy: `authorize`, `settleExpiry`, error codes. Ported from webMCP. |
| `packages/engine` | mandate, MCP SDK, zod, yaml | Session, runner, orchestrators, perturbations, checks, report. |
| `packages/cli` | engine | Argument parsing, printing, exit codes. No logic. |
| `packages/web` | engine (types only) | Console UI. Renders traces and findings; decides nothing. |
| `servers/*` | MCP SDK, zod, mandate | Reference servers, one per demo story. |
| `suites/` | — | YAML suites; `suites/cassettes/` for replay. |

Planned engine layout (M1–M4):

```
engine/src/
  session.ts        McpSession: Client + StreamableHTTPClientTransport, elicitation handler,
                    list_changed → toolListRevision
  runner.ts         cases in order, fresh session per case×variant (D-003), setup chains
  orchestrators/    scripted.ts, llm.ts, replay.ts, providers/{bedrock,anthropic,openai}.ts
  perturb/          one file per perturbation, seeded PRNG
  checks/           one file per category; each exports CheckSpec-bound implementations
  latency.ts        the model from docs/03
  serve.ts          Hono app for the console (M5)
```

## Stack and why

Chosen for the requirements, not by habit:

- **TypeScript everywhere.** The TypeScript MCP SDK is the reference implementation: 1.31 already
  negotiates 2025-11-25 and has `elicitInput` and `sendToolListChanged` (verified). The console
  runs in a browser and must share the trace types with the engine. CLI distribution via `npx`
  and a GitHub Action are native to Node. The ported mandate code is TypeScript.
- **npm workspaces, no build step for development.** `tsx` runs sources; `tsc --noEmit`
  typechecks. A bundle step (tsup) is added only when the CLI is published (M6).
- **zod 4 + YAML** for suites: one schema gives validation errors people can read and the
  TypeScript types.
- **Hono** for `earshot serve`: small, SSE built in, same as the webMCP service.
- **Vite + React** for the console: a local tool with no SEO or SSR needs; Next.js would add a
  server we don't want.
- **Vitest** for tests.
- **Bedrock Converse API** as default model provider: one tool-use shape across Claude, Nova and
  others, and it is the documented AWS integration for the AWS Builder mini challenge.
- **Web Speech API** for microphone input in the console (Chrome). Amazon Polly optional for the
  reply voice (FR-043).

## Model providers and budget

Scripted and replay modes cost nothing and are what CI and judges run. Money is only spent in
llm mode.

Rough sizing per llm turn: ~2 model calls, ~5k input and ~300 output tokens (tool schemas
dominate). A full run of the three bundled suites is about 50 turns including variants. With a
small, fast model at roughly $1 per million input and $5 per million output tokens that is
around $0.30–0.40 per full run; a larger model is 3–5× that. Prices change; check the Bedrock
pricing page before relying on this.

| Budget | Use |
|---|---|
| AWS credits via the hackathon form ($150) | Bedrock: all llm runs, cassette recording, Polly |
| Anthropic credits | Fallback provider; comparing models |
| DeepSeek credits | Cheap bulk runs through the OpenAI-compatible adapter |

**No hosting and no VM are needed.** Judges run the repo locally (hackathon FAQ). The console
runs on localhost.

## CLI contract

| Command | Exit 0 | Exit 1 | Exit 2 |
|---|---|---|---|
| `validate <suite...>` | all valid | any invalid | usage |
| `checks` | always | — | — |
| `run <suite...> [--only id] [--orchestrator m] [--record]` | no error findings | error findings | usage / cannot connect |
| `lint <url>` | no error findings | error findings | usage / cannot connect |
| `serve [--port 4100]` | — | — | usage |
