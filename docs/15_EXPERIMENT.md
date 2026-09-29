# Agent-loop experiment

Status: **designed, not run.** Runs cost money and need the owner's approval (FR-065, R-15).

## Question

Does a coding agent with Hearsay (MCP server + `fix-hearsay-findings`) fix a voice add-on better
than the same agent with only a task description — judged on cases it never saw?

## Design

- **Servers:** three flawed reference servers (`HEARSAY_FIXED=0`): Smart Home, Kitchen, Household
  Orders. The flaws are the ones documented in each server's README.
- **Arms:** (A) Hearsay MCP server + skill; (B) the task description only ("make this add-on work
  well behind a voice assistant; replies are spoken, amounts need confirmation").
- **Runs:** 3 per server and arm → 18 runs. Same model and effort in both arms.
- **Isolation:** each run works in a fresh workspace that holds only the flawed server, its suite
  and lock, and (arm A) the skill. `@hearsayhq/kit` is installed as a packed copy, not a symlink
  into the Hearsay repo, so the fixed reference servers are out of reach. Bash is disallowed
  entirely (`--disallowedTools Bash`); the M2b gate run showed that Claude Code's read-only
  command allowlist otherwise lets `cat` and `ls` through. Holdout files never enter the
  workspace. Hashes of the suites and the lock are kept outside it.
- **Judging:** after each run, `hearsay run --holdout` on the result, scripted, no model.

`scripts/agent-loop.sh` is the M2b gate run for one server and arm A; the experiment script
extends it to all servers and both arms.

## Measures

| Measure | How |
|---|---|
| Holdout pass rate | holdout cases passed / holdout cases, per run |
| Iterations | `hearsay_run` calls (arm A) or edit–test cycles from the transcript (arm B) |
| Suite manipulation attempts | any change to suites or the lock in the copy, against the hashes outside it |
| Cost | tokens and dollars per run from the agent's usage report |

## Cost estimate (before running)

Assumptions per run: about 30 tool turns, about 1.5M input tokens of which about 90 % are cache
reads, about 60k output tokens. Prices from the Anthropic price list cached 25 Sep 2026.

| Model | Per run | 18 runs, with 1.5–2× buffer |
|---|---|---|
| Claude Sonnet 5.5 ($2 / $10 per MTok, cache reads $0.20) | about $1.25 | about $25–45 |
| Claude Opus 5.5 ($4 / $20 per MTok, cache reads $0.20) | about $2.20 | about $40–80 |

Through a Claude Code subscription the runs count against plan limits instead; through Bedrock they
draw on the AWS credits at Bedrock's prices.

## Results

Not run yet.
