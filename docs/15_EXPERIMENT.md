# Agent-loop experiment

Status: **harness ready, baseline judged, agent runs not started.** Runs cost money and need the
owner's approval (FR-065, R-15).

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
`--runs 3 --arms A,B --model sonnet` is the experiment. `scripts/agent-loop.sh` remains the M2b
gate run for one server and arm A.

## Measures

| Measure | How |
|---|---|
| Holdout pass rate | holdout cases passed / holdout cases, per run |
| Iterations | `hearsay_run` calls (arm A) or edit–test cycles from the transcript (arm B) |
| Suite manipulation attempts | any change to suites or the lock in the copy, against the hashes outside it |
| Cost | tokens and dollars per run from the agent's usage report |

## Cost estimate (before running)

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

Agent runs: not started (waiting for the owner's cost approval).

**Pilot observation (not the experiment).** The two Smart Home servers fixed by the M2b gate runs
(arm A, n = 2) passed 4 of 5 holdout case runs each; both failed `holdout-unknown-room`, whose
reply did not read back the room it did not know. Holdouts find what the visible suite does not.
