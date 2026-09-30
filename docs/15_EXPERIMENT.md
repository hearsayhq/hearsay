# Agent-loop experiment

Status: **done, 30 Sep 2026: 18 of 18 runs.** Approved by the owner (FR-065, R-15), run on the
owner's Claude Code subscription.

## Question

Does a coding agent with Hearsay (MCP server + `fix-hearsay-findings`) fix a voice add-on better
than the same agent with only a task description — judged on cases it never saw?

## Design

- **Servers:** three flawed reference servers (`HEARSAY_FIXED=0`): Smart Home, Kitchen, Household
  Orders. The flaws are the ones documented in each server's README. Each flawed build is a
  standalone file (`src/flawed.ts`), so a workspace never contains the fixed code.
- **Arms:** (A) Hearsay MCP server + skill; (B) the task description only ("make this add-on work
  well behind a voice assistant; replies are spoken, amounts need confirmation").
- **Runs:** 3 per server and arm → 18 runs. Same model and effort in both arms.
- **Isolation:** each run works in a fresh workspace that holds only the flawed server, its suite
  and lock, and (arm A) the skill. `@hearsayhq/kit` is installed as a packed copy, not a symlink
  into the Hearsay repo, so the fixed reference servers are out of reach. Bash is disallowed
  entirely (`--disallowedTools Bash`); the M2b gate run showed that Claude Code's read-only
  command allowlist otherwise lets `cat` and `ls` through. Holdout files enter the workspace only
  after the agent has finished. Hashes of the suites and the lock are kept outside it.
- **Sanitising:** file headers, comments that name a flaw, a check or a decision, and the
  `-flawed` version suffix are removed; the script refuses to build a workspace that still says
  "flaw" anywhere.
- **Holdouts:** Smart Home 5, Kitchen 4 (5 case runs with a variant), Household Orders 4 cases;
  local and CI secret only. They are copied into the workspace after the agent has finished.
- **Judging:** after each run the suites are restored from the copy outside the workspace, then
  `hearsay run --holdout`, scripted, no model. A changed suite is recorded as manipulation.
- **Prompts:** (A) "Make it pass its Hearsay suite … Use the fix-hearsay-findings skill and the
  hearsay tools." (B) "Make it work well behind a voice assistant: replies are spoken, a person
  may be misheard, and money must only move on the person's confirmation. The suite describes
  what should happen. Change the server code only." Arm B can read the suite but cannot run it.

`scripts/experiment.mjs` runs it: `--dry-run` judges the untouched flawed servers for free;
`--first k --runs 1` runs block k, one run index across all servers and arms (six runs). Rows
already in `results.jsonl` are skipped, so a block can be resumed. The script refuses to start
with `ANTHROPIC_API_KEY` set and stops if a run reports any key source but the subscription.
`scripts/agent-loop.sh` remains the M2b gate run for one server and arm A.

**Execution (30 Sep 2026).** Owner-approved, on the owner's Claude Code subscription (Pro, extra
usage off), in three blocks of six runs with the interim state in `STATUS.md` between blocks.
Model `claude-sonnet-5-5` in both arms.

## Measures

| Measure | How |
|---|---|
| Holdout pass rate | holdout cases passed / holdout cases, per run |
| Iterations | `hearsay_run` calls (arm A) or edit–test cycles from the transcript (arm B) |
| Suite manipulation attempts | any change to suites or the lock in the copy, against the hashes outside it |
| Cost | turns, time and `total_cost_usd` per run from the agent's result. On a subscription this is an API-equivalent figure (what the tokens would cost at API prices), not a bill. |

## Cost estimate (before running, API prices)

Measured so far with Claude Code's default model: the three M2b gate runs (arm A, Smart Home) cost
$0.35–0.44 each in about 21 turns and a minute; the two `write-hearsay-suite` runs $0.22–0.23.
Household Orders has more to fix and arm B has no feedback, so per run $0.40–1.50 is the working
range: **18 runs about $8–27**, and at most $90 because each run is capped at $5
(`--max-budget-usd 5`).

The first estimate, from token assumptions rather than runs, is kept for comparison.
Assumptions per run: about 30 tool turns, about 1.5M input tokens of which about 90 % are cache
reads, about 60k output tokens. Prices from the Anthropic price list cached 25 Sep 2026.

| Model | Per run | 18 runs, with 1.5–2× buffer |
|---|---|---|
| Claude Sonnet 5.5 ($2 / $10 per MTok, cache reads $0.20) | about $1.25 | about $25–45 |
| Claude Opus 5.5 ($4 / $20 per MTok, cache reads $0.20) | about $2.20 | about $40–80 |

Through a Claude Code subscription the runs count against plan limits instead; through Bedrock they
draw on the AWS credits at Bedrock's prices.

## Results

Baseline (`--dry-run`, 30 Sep 2026): the flawed servers as handed to the agent.

| Server | Holdout passed | Visible errors |
|---|---|---|
| Smart Home | 0/5 | 17 |
| Kitchen | 1/5 | 14 |
| Household Orders | 1/4 | 20 |

Agent runs (30 Sep 2026, `claude-sonnet-5-5`, blocks of six; clip `m6-experiment`):

| Server | Arm | Run 1 | Run 2 | Run 3 | Holdout | Visible errors left | hearsay_run calls |
|---|---|---|---|---|---|---|---|
| Smart Home | A (Hearsay) | 3/5 | 3/5 | 3/5 | 9/15 | none | 3, 2, 3 |
| Smart Home | B (task only) | 4/5 | 3/5 | 4/5 | 11/15 | run 2: 1 | – |
| Kitchen | A (Hearsay) | 5/5 | 5/5 | 5/5 | 15/15 | none | 5, 3, 3 |
| Kitchen | B (task only) | 5/5 | 5/5 | 5/5 | 15/15 | none | – |
| Household Orders | A (Hearsay) | 4/4 | 4/4 | 4/4 | 12/12 | none | 3, 2, 2 |
| Household Orders | B (task only) | 4/4 | 4/4 | 4/4 | 12/12 | runs 1–3: 2, 2, 1 | – |

| Arm | Holdout passed | Runs that ended with visible errors | Suite changed | Turns (mean) | Time per run (median) | API-equivalent cost¹ |
|---|---|---|---|---|---|---|
| A: Hearsay MCP + skill | 36/42 (86 %) | 0 of 9 | 0 of 9 | 23.6 | 50 s | $2.62 ($0.29 per run) |
| B: task description only | 38/42 (90 %) | 4 of 9 | 0 of 9 | 15.6 | 40 s | $2.12 ($0.24 per run) |

¹ `total_cost_usd` as Claude Code reports it: what the tokens would cost at API prices. The runs
went through the owner's subscription (every run reported `apiKeySource: none`), so nothing was
billed; they counted against the plan's limits (5-hour window 3 % after two blocks).

**What failed.** Holdouts: `holdout-unknown-room` (the reply does not name the room it did not
know) failed in all six Smart Home runs, in both arms. `holdout-whole-house-on` (confirm before
switching the whole house on) failed in all three arm A runs and in one arm B run. Visible errors
that arm B left: `mandate.schema_ignoring_caller` (3 runs; in one of them the refusal still read
"MCP error -32602" aloud) and `mandate.version_race` (2 runs: a line staged before the permission
was narrowed was still ordered) on Household Orders, and `consent.states_details` once on Smart
Home.

**Reading.** On spoken behaviour a precise task description does about as well as Hearsay: the
holdout rates are 86 % and 90 %, a difference of two cases at n = 3. What Hearsay adds here is
verification. Every arm A run ended with its suite green and knew it; four of nine arm B runs
ended with errors they could not see, and the ones that matter are two mandate flaws on the
server that moves money: a checkout race and a caller that ignores the advertised enum. Neither
is named in the task description, and neither is tested by the holdouts. No run in either arm
touched a suite.

Arm A's `holdout-whole-house-on` failures follow the skill's rule: "confirm only when money
moves or when an action falls outside what the person already allowed" (D-022). The agents
confirmed "whole house off", which the visible suite demands, and did not generalise it to "on".
Whether switching everything on needs a confirmation is a judgement call under D-022; the
holdout says yes. It is scored as written.

**Limits.** Three runs per cell and one model. Thirteen holdout cases in all; Kitchen and
Household Orders reach the ceiling in both arms, so only Smart Home separates them. Arm B's prompt
already names the three voice rules (spoken replies, mishearing, confirmation before money
moves), which makes it a strong baseline. The flaws are the documented ones of our own reference
servers.

**Pilot observation (not the experiment).** The two Smart Home servers fixed by the M2b gate runs
(arm A, n = 2) passed 4 of 5 holdout case runs each; both failed `holdout-unknown-room`, whose
reply did not read back the room it did not know. Holdouts find what the visible suite does not.
