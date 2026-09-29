# Implementation plan

Seven build days. Deadline: **Fri 23 Oct 2026, 21:00 CEST**. Aim to submit by Sun 18 Oct and keep
the rest as buffer. Each milestone ends with a gate; do not start the next milestone with a red
gate. `npm run check` is green at every commit.

| Day | Milestone | Scope | Gate |
|---|---|---|---|
| 0 | **M0 Foundation** ✅ | Repo, contracts (trace, report, suite, orchestrator, catalog), mandate policy ported with tests, suites validate, spec pack. | `npm run check` green; `earshot validate suites/*.yaml` ok. |
| 1 | **M1 Engine core + Kitchen** | FR-001–004, 011, 016, 020, 030, 050. `session.ts`, `runner.ts`, scripted orchestrator, latency model, report + CLI `run`. Kitchen server. Checks: `protocol.version`, `latency.*`, `speak.length`, `speak.no_structured_dump`. | `earshot run suites/kitchen.yaml` exits 0 against the running server; JSON report written; a unit test proves a slow fake tool fails `latency.tool`. |
| 2 | **M2 Lint + Smart Home** | FR-031, 051. All `lint.*`, remaining `speak.*`. Smart Home flawed/fixed. `earshot lint <url>`. | Flawed: exactly the findings in servers/smart-home/README.md. Fixed: exit 0. |
| 3 | **M3 Hearing + models** | FR-012–015. Perturbations, `asr.robust`, llm orchestrator, Bedrock adapter, `--record` and replay. | Replay of a recorded kitchen llm run gives identical findings twice with the network off. |
| 4 | **M4 Mandate** | FR-052, 021–022 for `mandate.*`, `protocol.list_changed`. Household Orders server using `@earshot/mandate`. | Every `mandate.*` check passes on the server and fails on a unit fixture built to violate it. |
| 5 | **M5 Console** | FR-040–042 (043 if time). `earshot serve`, SSE, web console with timeline, voice input, elicitation modal. | Speak to Kitchen and Household Orders in the browser; timeline and findings update live. |
| 6 | **M6 Ship** | FR-032, 060; `conv.*` only if everything else is green. README quickstart, GitHub Action, tsup bundle for the CLI, feedback and friction log final. | Fresh clone on a clean machine → first green run in < 5 min, no keys. |
| 7 | **M7 Submit** | Video, Devpost form, disclosures, repo public or reviewers added (docs/09). | Submission checklist fully ticked. |

## Cut order when time runs out

1. `conv.goal_reached` and simulated personas
2. `speak.numbers_dates`, `asr.dropped_word`
3. GitHub Action (keep the CLI exit code)
4. Polly voice (keep browser speech)
5. Microphone input in the console (keep text input)
6. Live llm mode in the video (keep replay of a recorded run)

Never cut: the mandate story, the smart-home red → green, replay determinism, the friction log.

## Working agreement

- One milestone per branch, merged when its gate is green.
- A check is `implemented` in `catalog.ts` only together with its failing fixture (docs/08).
- Log friction the moment it happens (docs/FRICTION_LOG.md); it is worth up to 10 % of the score.
