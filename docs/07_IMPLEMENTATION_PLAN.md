# Implementation plan

Deadline: **Fri 23 Oct 2026, 21:00 CEST.** Target: submit by **Sun 18 Oct**; the rest is buffer.
Thirteen build days (0–12). Each milestone ends with a gate and a demo clip (docs/09 §Clips per
gate); do not start the next milestone with a red gate. `npm run check` is green at every commit.

## Scope freeze

Scope is frozen as of 30 Sep 2026. New ideas go to docs/ROADMAP.md, not into this plan. Only the
project owner lifts the freeze.

## Milestones

| Day | Milestone | Scope | Gate |
|---|---|---|---|
| 0 | **M0 Foundation** ✅ | Repo, contracts, mandate policy ported with tests, suites validate, spec pack, CI. | `npm run check` green; `validate suites/*.yaml` ok. |
| 0 | **M0b Spec v2 + rename** ✅ | Docs 00–14 per review; catalog with questions, thresholds and sources; suites; invariant in CLAUDE.md, D-005 and the Household Orders README; rename to Hearsay (`@hearsayhq/*`, binary `hearsay`); CI on ubuntu-24.04. | `npm run check` green; `hearsay validate` ok; `hearsay checks` grouped by question with sources; CI green. |
| 1–2 | **M1 Runner + Kitchen** | FR-001–004, 011, 016, 020, 024, 030, 050. `session.ts` with bearer principal; runner (fresh session and principal per case × variant, `after` chains, case checks add to suite checks, planned checks skipped); scripted orchestrator; latency model; report with sources, grouped by question; `hearsay run`; Kitchen server. Checks: `protocol.version`, `case.expect` (incl. `argsMustNotContain`), `latency.*`, `speak.length`, `speak.no_structured_dump` (incl. tool names). Issue text for mcp-voice-simulator to the owner. | `hearsay run suites/kitchen.yaml` exits 0 against the running server, skipped checks listed; every finding has a source; unit tests: a slow fake tool fails `latency.tool` as error, a wrong tool fails `case.expect`. |
| 3 | **M2 Lint + Smart Home** | FR-031, 051. `lint.*`, `protocol.refusal_as_result`, `speak.lists`; `hearsay lint <url>`; Smart Home flawed/fixed. | Flawed: exactly the (check, severity) pairs in servers/smart-home/README.md except `asr.robust`; fixed: exit 0; a fake server with both -32602 forms fails `protocol.refusal_as_result`. |
| 4–6 | **M3 Hearing + model** | FR-012, 013, 015, 017. Curated perturbations on utterance and argument level; `asr.robust` in scripted mode; llm orchestrator, Bedrock Converse, `--record`, replay; `hearsay gen-variants` (Polly → noise and telephone band → Transcribe Streaming, no S3) writing a committed variants file; tool-description fragments in `speak.no_structured_dump`. | Smart Home flawed fails `asr.robust` in scripted mode, fixed passes; a recorded kitchen llm run replays with identical findings twice, network off; a variants file for Kitchen is committed and replayed offline. |
| 7–8 | **M4 Consent + mandate** | FR-005, 021–022, 052. Household Orders: principal, static tool list, enums enforced only by `authorize()`, optional version, version stamped on cart lines and re-authorized at commit, strong and verbal paths. All `consent.*` and `mandate.*`; injection through the scripted compromised model; `protocol.list_changed`. R-03 through the KayLerch bridge, time-boxed to 2 h. | Every `consent.*` and `mandate.*` check passes on Household Orders with and without client elicitation, and fails on a fixture built to violate it; "fifteen" → "fifty" never commits. |
| 9 | **M5 Console** | FR-040–042. `hearsay serve` (Hono, SSE); text input, browser speech synthesis; timeline with the 500 ms line; findings by question with sources; elicitation as a host modal. | Talk to Kitchen and Household Orders in the browser; timeline and findings update live. |
| 10–11 | **M6 Ship** | FR-033, 060, 062, 063. README (`npx @hearsayhq/cli`, workflow snippet), tsup bundle; catalog lists only implemented checks, the rest under Roadmap; scan of public servers; Open Source PR (≤ ½ day); Agent Skill `write-hearsay-suite`; feedback and friction log final. | Fresh clone → first green run in < 5 min, no keys; scan results in the docs, aggregated; PR URL exists; the skill drafts a valid suite from Kitchen's `tools/list`. |
| 12 | **M7 Submit** | Video cut from the gate clips, Devpost form, disclosures, repo public or reviewers added (docs/09). | Submission checklist fully ticked. |

At about five build days a week this lands on Sun 18 Oct; at four, by Fri 23 Oct.

## Automatic cut rule

If the M3 gate is reached more than one build day behind this plan, the cut order below applies
without asking: items are cut from the top until the remaining plan fits Sun 18 Oct, and the owner
is told what was cut.

## Cut order

Already cut: Polly as the console voice, microphone input, the GitHub Action, `conv.goal_reached`,
`speak.numbers_dates`, `asr.dropped_word`, `asr.filler`, FR-014.

1. R-03 through the KayLerch bridge
2. Trace export in the Open Source PR
3. Agent Skill `write-hearsay-suite`
4. Scan of public servers
5. Live console → report view only, no SSE
6. Live llm in the video (replay of a recording stays)
7. `gen-variants` (curated tables stay; AWS Builder then rests on Bedrock)
8. Open Source PR, including plan B
9. llm orchestrator and Bedrock (`asr.robust` stays through scripted mode; AWS Builder is lost)

Never cut: `consent.*` and "fifteen" → "fifty", the Smart Home red → green, determinism without
keys, a source on every finding, the friction log.

## Working agreement

- One milestone per branch, merged when its gate is green.
- A check is `implemented` in `catalog.ts` only together with its failing fixture (docs/08).
- After every gate: record the clip (docs/09), then report to the owner in a few lines.
- Log friction the moment it happens (docs/FRICTION_LOG.md); it is worth up to 10 % of the score.
