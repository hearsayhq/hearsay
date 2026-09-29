# Implementation plan

Deadline: **Fri 23 Oct 2026, 21:00 CEST.** Target: submit by **Sun 18 Oct**; the rest is buffer.
Sixteen build days (0–15). Each milestone ends with a gate and a demo clip (docs/09 §Clips per
gate); do not start the next milestone with a red gate. `npm run check` is green at every commit.

## Scope freeze

Scope is frozen as of 30 Sep 2026. New ideas go to docs/ROADMAP.md, not into this plan. Only the
project owner lifts the freeze.

Exceptions approved by the owner on 30 Sep:

- D-016 (superseded in part by D-017): the Hearsay MCP server replaces the public-server scan.
- D-017: the agent loop is core. M2b (must) adds the Hearsay MCP server, `@hearsayhq/kit`, suite
  integrity, and the `fix-hearsay-findings` skill.
- D-021: no human in the loop in the developer workflow. The suite-change consent tool is cut;
  test protection is deterministic (lock, holdouts, normal pull requests). Holdout cases
  (should, M3) and an agent-loop experiment (should, M6, replacing the scan) prove the loop.
  Not taken: watch mode, PR comments, `hearsay fix`.

## Milestones

| Day | Milestone | Scope | Gate |
|---|---|---|---|
| 0 | **M0 Foundation** ✅ | Repo, contracts, mandate policy ported with tests, suites validate, spec pack, CI. | `npm run check` green; `validate suites/*.yaml` ok. |
| 0 | **M0b Spec v2 + rename** ✅ | Docs 00–14 per review; catalog with questions, thresholds and sources; suites; invariant in CLAUDE.md, D-005 and the Household Orders README; rename to Hearsay (`@hearsayhq/*`, binary `hearsay`); CI on ubuntu-24.04. | `npm run check` green; `hearsay validate` ok; `hearsay checks` grouped by question with sources; CI green. |
| 1–2 | **M1 Runner + Kitchen** ✅ | FR-001–004, 011, 016, 020, 024, 030, 050. `session.ts` with bearer principal; runner (fresh session and principal per case × variant, `after` chains, case checks add to suite checks, planned checks skipped); scripted orchestrator; latency model; report with sources, grouped by question; `hearsay run`; Kitchen server. Checks: `protocol.version`, `case.expect` (incl. `argsMustNotContain`), `latency.*`, `speak.length`, `speak.no_structured_dump` (incl. tool names). Issue text for mcp-voice-simulator to the owner. | `hearsay run suites/kitchen.yaml` exits 0 against the running server, skipped checks listed; every finding has a source; unit tests: a slow fake tool fails `latency.tool` as error, a wrong tool fails `case.expect`. |
| 3 | **M2 Lint + Smart Home** ✅ | FR-031, 051. `lint.*`, `protocol.refusal_as_result`, `speak.lists`; `hearsay lint <url>`; Smart Home flawed/fixed, where fixed means the kit applied (`speak`, `refuse`, `confirm`). | Flawed: exactly the (check, severity) pairs in servers/smart-home/README.md except `asr.robust` (M3) and `consent.path` (M4); fixed: exit 0; a fake server with both -32602 forms fails `protocol.refusal_as_result`. |
| 4–5 | **M2b Agent loop** (must) ✅ | FR-034–036, 038. `@hearsayhq/mcp` (stdio and Streamable HTTP): `hearsay_lint(url)`, `hearsay_run(suitePath, only?: string[] \| "failed")`, `hearsay_explain(checkId)` (rule, source, short before/after); compact findings, traces only with `verbose`; no tool writes suites. Kit complete: `confirm()` with the verbal fallback of `consent.path`, asking only at commit or outside the mandate; `withMandate()`; every hint names its kit block. `hearsay lock` and `suite.integrity`. Skill `fix-hearsay-findings`. | A fresh Claude Code session with the Hearsay MCP server and the skill turns Smart Home flawed green without touching `suites/` or the lock; the Hearsay MCP server passes its own `protocol.*` and `lint.*`; editing a locked suite turns the run red (`suite.integrity`); clips `m2b-agent-loop` and `m2b-cheat`. |
| 6–8 | **M3 Hearing + model** ✅ offline · AWS items open (D-020) | FR-012, 013, 015, 017, 018. Curated perturbations on utterance and argument level; `asr.robust` in scripted mode; holdout suites (`--holdout`); llm orchestrator, Bedrock Converse, `--record`, replay; `hearsay gen-variants` (Polly → noise and telephone band → Transcribe Streaming, no S3) writing a committed variants file. | Smart Home flawed fails `asr.robust` in scripted mode, fixed passes; a holdout case runs only with `--holdout` and is reported apart, and `hearsay_run` never loads holdouts; a recorded kitchen llm run replays with identical findings twice, network off; a variants file for Kitchen is committed and replayed offline. |
| 9–10 | **M4 Consent + mandate** ✅ | FR-005, 021–022, 052. Household Orders on `withMandate()` and `confirm()`: principal, static tool list, enums enforced only by `authorize()`, optional version, version stamped on cart lines and re-authorized at commit, strong and verbal paths. All `consent.*` (including `consent.over_confirmation`) and `mandate.*`; injection through the scripted compromised model; `protocol.list_changed`. R-03 through the KayLerch bridge, time-boxed to 2 h. | Every `consent.*` and `mandate.*` check passes on Household Orders with and without client elicitation, and fails on a fixture built to violate it; "fifteen" → "fifty" never commits. |
| 11 | **M5 Console** ✅ | FR-040–042. `hearsay serve` (Hono, SSE); text input, browser speech synthesis; timeline with the 500 ms line; findings by question with sources; elicitation as a host modal. Without a model the console plans from the nearest suite case (D-023). | Talk to Kitchen and Household Orders in the browser; timeline and findings update live. |
| 12–14 | **M6 Ship + experiment** | FR-033, 060, 063, 065. README (`npx @hearsayhq/cli`, workflow snippet, MCP config for Claude Code and Kiro), tsup bundle; catalog lists only implemented checks, the rest under Roadmap; Open Source PR (≤ ½ day); skill `write-hearsay-suite`; agent-loop experiment: flawed modes (`HEARSAY_FIXED=0`) for Kitchen and Household Orders, 3 flawed servers × {Hearsay MCP + skill, task description only} × 3 runs, judged against holdouts, cost approved by the owner before the runs; feedback and friction log final. | Fresh clone → first green run in < 5 min, no keys; PR URL exists; the skill drafts a valid suite from Kitchen's `tools/list`; docs/15 holds a reproducible script and the results. |
| 15 | **M7 Submit** | Video cut from the gate clips, Devpost form, disclosures, repo public or reviewers added (docs/09). | Submission checklist fully ticked. |

At about five and a half build days a week this lands on Sun 18 Oct; at four and a half, by Fri 23 Oct.

## M6 progress

- `write-hearsay-suite` (FR-033): `scripts/skill-draft.sh` gives a fresh Claude Code session
  (no shell) the Kitchen add-on without a suite. The first draft (9 cases, $0.22) was valid and
  found two real Kitchen bugs: "step forty" and a number heard as "ate" reached the person as
  "MCP error -32602". Fixed with `looseInt()` in the kit; both cases joined `suites/kitchen.yaml`.
  It also asked for confirmation to cancel a timer, against D-022; the skill's rule was
  sharpened. Second draft: valid, green on Kitchen, 9 cases, $0.23.
- Fresh clone (FR-060): `git clone` → `npm ci` → `hearsay run suites/kitchen.yaml` green in 4 s
  with an empty npm cache on the build machine, no keys (clip `m6-fresh-clone`).
- Packages: `npm run pack` builds `@hearsayhq/cli` (with the console), `@hearsayhq/mcp` (with the
  skills) and `@hearsayhq/kit`; installed from the tarballs in an empty project, `npx hearsay run`,
  `serve`, `hearsay-mcp` over stdio and the kit's types work. Publishing waits for the owner.

## Blocked by access

If a gate item depends only on external access that has not arrived (AWS credits and Bedrock,
Polly or Transcribe access), the milestone's other gate items may close and the next milestone may
start. The blocked items stay listed as open in this table and are finished as soon as access
arrives (D-020).

Open because of access (30 Sep): recording a real kitchen llm run with Bedrock (the replay path is
built and tested with a fake model), and recording `suites/variants/kitchen.json` with Polly and
Transcribe (the channel and the pipeline are built and tested with fakes). Both need the AWS
credits and model access requested on 1 Oct.

R-03 (elicitation through the KayLerch bridge) is cut, first in the cut order: it needs AWS and an
Alexa developer account; revisit only if both are available before M6.

## Automatic cut rule

If the M3 gate is reached more than one build day behind this plan, the cut order below applies
without asking: items are cut from the top until the remaining plan fits Sun 18 Oct, and the owner
is told what was cut.

## Cut order

Already cut: Polly as the console voice, microphone input, the GitHub Action, `conv.goal_reached`,
`speak.numbers_dates`, `asr.dropped_word`, `asr.filler`, FR-014.

1. R-03 through the KayLerch bridge
2. Trace export in the Open Source PR
3. Skill `write-hearsay-suite`
4. Live console → report view only, no SSE
5. Live llm in the video (replay of a recording stays)
6. `gen-variants` (curated tables stay; AWS Builder then rests on Bedrock)
7. Holdouts and the agent-loop experiment, as a pair
8. Open Source PR, including plan B
9. llm orchestrator and Bedrock (`asr.robust` stays through scripted mode; AWS Builder is lost)

Never cut: `consent.*` and "fifteen" → "fifty", the Smart Home red → green, determinism without
keys, a source on every finding, the friction log, and M2b (MCP server, kit, suite integrity, the
fix skill).

## Working agreement

- One milestone per branch, merged when its gate is green.
- A check is `implemented` in `catalog.ts` only together with its failing fixture (docs/08).
- After every gate: record the clip (docs/09), then report to the owner in a few lines.
- Log friction the moment it happens (docs/FRICTION_LOG.md); it is worth up to 10 % of the score.
