# Eval and test plan

The engine judges other people's servers, so its own verdicts must be tested harder than anything
else in the repo. The rule: **a check without a failing fixture is not implemented.**

## Levels

| Level | Where | Runs | Network |
|---|---|---|---|
| Unit | `*.test.ts` next to code | every commit | none |
| Engine ↔ server | `packages/engine/test/` with servers started in-process | every commit | localhost only |
| Suite self-test | `hearsay run` on all bundled suites, scripted + replay | CI | localhost only |
| Dogfood | `hearsay lint` against Hearsay's own MCP server (`@hearsayhq/mcp`): `protocol.*` and `lint.*` pass (FR-034) | CI, from M2b | localhost only |
| Holdout | `hearsay run --holdout` with holdout suites from a CI secret | CI, from M3 | localhost only |
| Agent loop | docs/15: coding agents with and without Hearsay, judged against holdouts | manually, M6, owner-approved cost | model provider |
| Live model | llm mode against reference servers | manually, before recording cassettes | AWS |
| Recorded hearing | `hearsay gen-variants` | manually, when utterances change | AWS |

Unit tests never call a model or AWS. Anything that needs one runs through a cassette or a
committed variants file.

## Self-test matrix

For each check: at least one fixture that must pass and one that must fail, with the expected
finding asserted by id and severity.

| Check family | Passing fixture | Failing fixture |
|---|---|---|
| `protocol.version` | Kitchen | fake server negotiating only 2025-06-18 (error); fake server that rejects 2025-03-26 (warn) |
| `protocol.list_changed` | Household Orders | fake server that changes tools without notifying |
| `protocol.refusal_as_result` | Kitchen | fake server returning a JSON-RPC error; SDK server with a strict zod enum (wrapped -32602) |
| `lint.*` | Kitchen | Smart Home flawed; hand-written tool lists in unit tests; a tool with `readOnlyHint: true` that mutates |
| `latency.*` | Kitchen | Smart Home flawed (1100 ms hub); fake tool with configurable sleep |
| `speak.*` | Kitchen | Smart Home flawed (JSON dump); unit strings with tool names and description fragments |
| `asr.robust` | Kitchen (read-back), Smart Home fixed | Smart Home flawed (free-string room, "Done." without effect) |
| `case.expect` | all bundled suites | unit traces with wrong tool, wrong args, forbidden args, missing confirmation |
| `consent.*` | Household Orders with and without client elicitation | Smart Home flawed (no confirmation); unit fixtures: server that commits on decline, confirmation without amount, token that is replayable / unbound / 5-minute / survives a cart change, verbal path on an eliciting client |
| `suite.integrity` | intact locked suites | a suite edited after `hearsay lock` |
| `consent.over_confirmation` | Household Orders (staging inside the mandate runs without asking) | a server that elicits for a read-only tool; a server that elicits for staging inside an active mandate |
| `mandate.*` | Household Orders | unit fixtures: server without version check, server that commits stale lines, server whose scope grows after an injected result, server keyed by session instead of principal, enum enforced only by schema |

## Determinism

- Perturbations use a seeded PRNG; the seed is recorded in the report.
- `asr.roundtrip` variants come from a committed file with provenance (voice, noise seed, provider,
  date); runs never call AWS.
- Replay compares request hashes; a mismatch is a hard error naming the first differing message,
  never a silent live call.
- Latency fixtures sit far from thresholds (1100 ms vs the 500 ms tool limit; < 50 ms for passing
  tools) so CI machines cannot flip a verdict.
- Reports sort findings by case, variant, check id; timestamps are excluded from comparisons.
