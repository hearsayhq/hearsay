# Eval and test plan

The engine judges other people's servers, so its own verdicts must be tested harder than anything
else in the repo. The rule: **a check without a failing fixture is not implemented.**

## Levels

| Level | Where | Runs | Network |
|---|---|---|---|
| Unit | `*.test.ts` next to code | every commit | none |
| Engine ↔ server | `packages/engine/test/` with servers started in-process | every commit | localhost only |
| Suite self-test | `earshot run` on all bundled suites, scripted + replay | CI | localhost only |
| Live model | llm mode against reference servers | manually, before recording cassettes | provider |

Unit tests never call a model. Anything that needs one runs through a cassette.

## Self-test matrix

For each check: at least one fixture that must pass and one that must fail, with the expected
finding asserted by id and severity.

| Check family | Passing fixture | Failing fixture |
|---|---|---|
| protocol.* | Kitchen | fake server negotiating 2025-06-18; server that changes tools without notifying |
| lint.* | Kitchen | Smart Home flawed; hand-written tool lists in unit tests |
| latency.* | Kitchen | Smart Home flawed (1100 ms hub); fake tool with configurable sleep |
| speak.* | Kitchen | Smart Home flawed (JSON dump); unit strings |
| asr.robust | Smart Home fixed | Smart Home flawed (free-string room) |
| mandate.* | Household Orders | unit fixtures: server without version check, server with a `place_order` tool, server that commits on declined elicitation, server whose scope grows after an injected result |

## Determinism

- Perturbations use a seeded PRNG; seed is recorded in the report.
- Replay compares request hashes; a mismatch is a hard error naming the first differing message,
  never a silent live call.
- Latency budgets in fixtures sit far from thresholds (e.g. 1100 ms vs 800 ms budget, < 50 ms for
  passing tools) so CI machines cannot flip a verdict.
- Reports sort findings by case, variant, check id; timestamps are excluded from comparisons.
