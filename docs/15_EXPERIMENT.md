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
  into the Hearsay repo. Bash is disallowed entirely (`--disallowedTools Bash`); the M2b gate run
  showed that Claude Code's read-only command allowlist otherwise lets `cat` and `ls` through.
  Holdout files enter the workspace only after the agent has finished. Hashes of the suites and
  the lock are kept outside it. File tools can still read absolute paths, so every run is audited
  from its own transcript (`--audit`, below): each file access outside the workspace is listed,
  both what the agent asked for and what came back, and any path into `servers/`, `suites/`,
  `docs/`, `skills/`, a holdout or another run's sources counts as a breach. Workspaces live
  outside the repo (the system temp directory); the script refuses an `--out` inside it.
- **Sanitising:** file headers, comments that name a flaw, a check or a decision, and the
  `-flawed` version suffix are removed; the script refuses to build a workspace that still says
  "flaw" anywhere.
- **Holdouts:** four cases per server, twelve in all. Two of them also run misheard (Smart Home
  `holdout-office-dim`, Kitchen `holdout-egg-timer-misheard`), so each agent run is judged on
  holdout runs: Smart Home 5, Kitchen 5, Household Orders 4, fourteen per replicate;
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
| Holdout pass rate | holdout runs passed / holdout runs (a case with a misheard variant counts twice), per agent run |
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

| Server | Holdout runs passed | Visible errors |
|---|---|---|
| Smart Home | 0/5 | 17 |
| Kitchen | 1/5 | 14 |
| Household Orders | 1/4 | 20 |

Agent runs (30 Sep 2026, `claude-sonnet-5-5`, blocks of six; clip `m6-experiment`):

| Server | Arm | Run 1 | Run 2 | Run 3 | Holdout runs | Visible errors left | hearsay_run calls |
|---|---|---|---|---|---|---|---|
| Smart Home | A (Hearsay) | 3/5 | 3/5 | 3/5 | 9/15 | none | 3, 2, 3 |
| Smart Home | B (task only) | 4/5 | 3/5 | 4/5 | 11/15 | run 2: 1 | – |
| Kitchen | A (Hearsay) | 5/5 | 5/5 | 5/5 | 15/15 | none | 5, 3, 3 |
| Kitchen | B (task only) | 5/5 | 5/5 | 5/5 | 15/15 | none | – |
| Household Orders | A (Hearsay) | 4/4 | 4/4 | 4/4 | 12/12 | none | 3, 2, 2 |
| Household Orders | B (task only) | 4/4 | 4/4 | 4/4 | 12/12 | runs 1–3: 2, 2, 1 | – |

| Arm | Holdout runs passed | Agent runs that ended with visible errors | Suite changed | Turns (mean) | Time per run (median) | API-equivalent cost¹ |
|---|---|---|---|---|---|---|
| A: Hearsay MCP + skill | 36/42 (86 %) | 0 of 9 | 0 of 9 | 23.6 | 50 s | $2.62 ($0.29 per run) |
| B: task description only | 38/42 (90 %) | 4 of 9 | 0 of 9 | 15.6 | 40 s | $2.12 ($0.24 per run) |

**In one sentence.** README, Devpost and the video use exactly this:

> On unseen cases, agents did about the same with or without Hearsay. But without it, 4 of 9 runs stopped with defects they couldn't see, including a checkout race and a product allowlist enforced in the wrong place. With Hearsay: 0 of 9.

After v2 this sentence tells only half: in the harder second round the agents without Hearsay did
better on unseen cases (§v2). README, Devpost and the video keep it until the owner picks the new
wording; the proposal is at the end of §v2.

Where each part comes from: "unseen cases" are the holdouts (12 cases, 36/42 and 38/42 runs
passed); "without it" is arm B, which got a precise task description naming the three voice
rules; N = 3 per server and arm, one model. The checkout race is `mandate.version_race` (2 runs):
a line staged before the permission was narrowed was still ordered. The allowlist enforced in
the wrong place is `mandate.schema_ignoring_caller` (3 runs): products outside the list were
still refused, but by the schema or the catalog lookup instead of the permission check, once
with "MCP error -32602" read aloud. It was not bypassed.

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
holdout rates are 86 % and 90 %, a difference of two runs at n = 3. What Hearsay adds here is
verification. Every arm A run ended with its suite green and knew it; four of nine arm B runs
ended with errors they could not see, and the ones that matter are two mandate flaws on the
server that moves money: a checkout race and an allowlist enforced in the wrong place. Neither
is named in the task description, and neither is tested by the holdouts. No run in either arm
touched a suite.

Arm A's `holdout-whole-house-on` failures follow the skill's rule: "confirm only when money
moves or when an action falls outside what the person already allowed" (D-022). The agents
confirmed "whole house off", which the visible suite demands, and did not generalise it to "on".
Whether switching everything on needs a confirmation is a judgement call under D-022; the
holdout says yes. It is scored as written.

**Isolation audit.** The 30 Sep runs worked in workspaces under the repo's `build/`, which the
design did not intend: an agent could have walked up into the fixed servers. The transcripts show
none did. `--audit` over all 18: no run asked for or got back a path into `servers/`, `suites/`,
`docs/`, `skills/`, a holdout or another run's sources. Eight runs (seven in arm A, one in arm B)
did reach outside, all for the same library they had installed: the sources and type files of
`packages/kit` and `packages/mandate`, and searches from the repo root restricted to kit and
mandate files, whose results also listed other runs' packed kit copies. The harness has since
moved workspaces out of the repo and audits every run.

**Limits.** Three runs per cell and one model. Twelve holdout cases in all, fourteen runs per
replicate; Kitchen and
Household Orders reach the ceiling in both arms, so only Smart Home separates them. Arm B's prompt
already names the three voice rules (spoken replies, mishearing, confirmation before money
moves), which makes it a strong baseline. The flaws are the documented ones of our own reference
servers.

**Pilot observation (not the experiment).** The two Smart Home servers fixed by the M2b gate runs
(arm A, n = 2) passed 4 of 5 holdout case runs each; both failed `holdout-unknown-room`, whose
reply did not read back the room it did not know. Holdouts find what the visible suite does not.

## v2 (pre-registered 30 Sep 2026, before any v2 run)

Status: **done, 30 Sep 2026: 27 of 27 runs. H1 and H2 not supported, H3 and H4 supported**
(FR-066, D-024).

Why a second round: in v1 Kitchen and Household Orders reached the ceiling in both arms, the flaws
were obvious (JSON read aloud, 1.1 s calls, no confirmation at all), arm B had no way to try the
server, and twelve holdout cases were few. v2 changes exactly these and nothing else.

**Design.**

- **Servers:** the same three, each with a new flawed build whose defects pass a one-sentence smoke
  test: the happy path sounds right. Six flaws per server, each listed with its check in the
  server's README before the first run and marked *suite* (the visible suite can find it) or
  *holdout* (only a holdout case can); at least two per server are *holdout*.
- **Holdouts:** at least ten cases per server, local only, written before the first run. At least
  half test the three rules arm B's prompt names (spoken replies, mishearing, confirmation before
  money moves); the rest test other catalog rules (waiting, lists, error wording, mandate). The
  SHA-256 of each holdout file is added to this section before the first run.
- **Arms:** A, Hearsay MCP server and `fix-hearsay-findings`, no shell (as in v1); B, the task
  description only, no shell (prompt unchanged); B′, B's prompt plus "You can use the shell to run
  the server and try it", with Bash allowed. Same model (`claude-sonnet-5-5`), same visible suite,
  same cap of $5 API-equivalent per run.
- **Isolation:** workspaces outside the repo. B′ gets its own copies of `tsx` and the dependencies,
  so no path in its workspace points into the repo, and the audit also reads shell commands and
  their output. B′'s shell runs in Claude Code's sandbox, set on the command line where the agent
  cannot change it: writes only inside the workspace and the temp directory, network only to
  localhost (it may start the server and call it), no retry outside the sandbox. Reads are not
  sandboxed; the audit covers them.
- **Runs:** 3 servers × 3 arms × 3 runs = 27, on the owner's subscription, in blocks of at most
  six with the interim state in `STATUS.md`.

**Measures:** as in v1. Primary: holdout runs passed. Also: agent runs that ended with visible
errors, suite changes, audit breaches, turns, time and API-equivalent cost; holdout results per
rule category.

**Hypotheses.**

- **H1 (primary):** arm A passes at least 10 percentage points more holdout runs than arm B.
- **H2:** arm A passes no fewer holdout runs than arm B′ minus 5 percentage points.
- **H3:** runs that end with visible errors: A at most 1 of 9, B at least 3 of 9, B′ at least 2 of 9.
- **H4:** no run changes a suite, and the audit finds no breach.

**Analysis rules.**

- Per arm: holdout runs passed over holdout runs, across all nine runs; per server and per rule
  category as secondary tables.
- A difference under 10 percentage points is reported as "about the same". With N = 3 per cell
  and one model there are no significance claims.
- An agent run that fails (rate limit, crash, no result) is repeated once in the same block and
  counted only in the repeat; both are listed. A run with an audit breach is reported and left
  out of the rates.
- Each hypothesis is reported as supported or not, with its numbers, and nothing is re-scored
  afterwards. If a holdout or a flaw changes after the first run, v2 starts again from zero.

**Materials, fixed before the first run.**

- Flaws: the §v2 table in each server's README (`HEARSAY_FIXED=v2`, `src/flawed-v2.ts`), six per
  server, two or three found by the visible suite and the rest only by holdouts. Server tests pin
  the visible findings of each build.
- Holdouts (`holdouts/v2/`, gitignored), per server: cases, runs with variants, cases on the rules
  arm B's prompt names:

  | Server | Cases | Runs | Named-rule cases | SHA-256 |
  |---|---|---|---|---|
  | Kitchen | 15 | 16 | 9 | `65466cb951cfe15d736e0978bd955d6077a5a0a9c95514d2bd9823c3cffd9d09` |
  | Smart Home | 12 | 13 | 7 | `7fe92e089049bb9e20cfdab374d6c77c79f464c78e42aa7da2c855107802b540` |
  | Household Orders | 13 | 14 | 9 | `2953122d6ac7f14c1f63dfa66b1a0a23bb35b3832b785d443caf128840c54b7e` |

  The fixed reference servers pass every holdout run; the v2 builds fail them where the tables
  say.
- Harness: `node scripts/experiment.mjs --version v2 --limit 6` runs the next block of six.
  Workspaces are self-contained (their own `tsx` and dependencies from the npm cache, the kit as a
  local tarball); arm A's Hearsay MCP server is the packed `@hearsayhq/mcp`, installed outside
  the repo. No path in a workspace points into the repo.

Baseline (`--version v2 --dry-run`, 30 Sep): the v2 builds as handed to the agents.

| Server | Holdout runs passed | Visible errors |
|---|---|---|
| Smart Home | 5/13 | 2 |
| Kitchen | 7/16 | 5 |
| Household Orders | 6/14 | 7 |

**Results (27 runs, 30 Sep 2026).** `claude-sonnet-5-5`, five blocks of at most six, every run on
the subscription (`apiKeySource: none`), every agent run completed. `node scripts/experiment.mjs
--version v2 --analyze` produces these tables from the transcripts and reports.

| Arm | Holdout runs passed | Runs that ended with visible errors | Suite changed | Audit breaches | Turns (mean) | Time (median) | API-equivalent cost |
|---|---|---|---|---|---|---|---|
| A: Hearsay MCP + skill | 88/129 (68.2 %) | 0 of 9 | 0 | 0 | 17.3 | 21 s | $1.60 |
| B: task description only | 107/129 (82.9 %) | 4 of 9 | 0 | 0 | 17.3 | 33 s | $1.75 |
| B′: task description + sandboxed shell | 98/129 (76.0 %) | 3 of 9 | 0 | 0 | 9.1 | 45 s | $1.91 |

| Server | A | B | B′ |
|---|---|---|---|
| Smart Home | 24/39 (61.5 %) | 31/39 (79.5 %) | 24/39 (61.5 %) |
| Kitchen | 40/48 (83.3 %) | 44/48 (91.7 %) | 44/48 (91.7 %) |
| Household Orders | 24/42 (57.1 %) | 32/42 (76.2 %) | 30/42 (71.4 %) |

| Rule category | A | B | B′ |
|---|---|---|---|
| Rules arm B's prompt names | 60/84 (71.4 %) | 79/84 (94.0 %) | 69/84 (82.1 %) |
| Other catalog rules | 28/45 (62.2 %) | 28/45 (62.2 %) | 29/45 (64.4 %) |

**Hypotheses, as registered.**

- H1, A at least 10 points above B: **not supported.** A was 14.7 points *below* B.
- H2, A no more than 5 points below B′: **not supported.** A was 7.8 points below.
- H3, visible errors in at most 1 of 9 A runs, at least 3 of 9 B and 2 of 9 B′: **supported**
  (0, 4, 3).
- H4, no suite changed and no audit breach: **supported.**

**What failed.** Holdout runs failed per arm (of 3 agent runs each; ~ marks the misheard variant):

| Holdout case | Defect | A | B | B′ |
|---|---|---|---|---|
| ho-checkout-two-lines, -declined, -verbal | "Ready to place your order?" with two lines | 3, 3, 3 | 0, 0, 0 | 1, 1, 1 |
| ho-fruit-fifteen, ~ | amounts not read back | 3, 3 | 1, 2 | 1, 2 |
| ho-milk-six | asked inside the permission | 3 | 2 | 2 |
| hs-study-off, hs-lounge-on | synonyms missing | 3, 3 | 0, 0 | 1, 1 |
| hs-whole-house-dim | dimming the house without asking | 3 | 2 | 3 |
| hk-restart-tea | a restart said as "set" | 3 | 1 | 1 |
| ho-wine, ho-over-budget | refusal codes read aloud | 0, 0 | 2, 2 | 1, 1 |
| hk-list-six, hs-garage | six timers read out; unknown room with a code | 3, 3 | 3, 3 | 3, 3 |

**Reading.** Every arm A run fixed what the visible suite reported, reached green, and stopped.
The defects only holdouts could find stayed in all three A runs; B and B′, asked to make the
server "work well behind a voice assistant", reviewed the whole server against the rules their
prompt named and fixed most of them. A beat B only where the visible suite itself fired (refusal
codes read aloud). A green suite is a stopping signal: with Hearsay an agent does exactly what
the suite covers, no more. That is the verification v1 found (no run with Hearsay ever stopped
on a defect it could see), and it is also the limit v2 shows: Hearsay is as good as the suite it
runs. The shell (B′) did not help over B; it spent its turns running the server rather than
reading the code.

**Operations.** Block 4 was first started with base port 4190, which fetch refuses; the operator
stopped it within seconds, before any agent result, deleted the one workspace it had built and
restarted from port 4200 (the harness now skips such ports). Block 1's recorded counts of
accesses outside the workspace were inflated by macOS's `/var` and `/private/var`; the audit now
compares real paths, and the re-audit of all 27 runs finds no breach. Arm A and B agents tried a
shell command five times in all; Bash was disallowed for them and nothing ran.

**Limits.** Three runs per cell and one model. The holdouts were written by the author of the
flaws, knowing which defects were holdout-only, so they test exactly those gaps; a suite written
to cover the tool surface (the `write-hearsay-suite` skill) was not part of either arm. Arm B's
prompt names the rules most of the holdouts test.

**Confound (named by the owner, 30 Sep).** Arms A and B differ in two things, not one: A had
Hearsay *and* the narrow goal "make it pass its Hearsay suite"; B and B′ had the broad goal "make
it work well behind a voice assistant". The holdout gap can come from the goal as much as from
the tool, and nobody would tell their agent only to make a suite green. The sentence proposed
here earlier is withdrawn; README, Devpost and the video keep the v1 sentence until A″ and A‴
are in.

## v2 follow-up: A″ and A‴ (pre-registered 30 Sep 2026, before any A″ run)

Status: **done, 30 Sep 2026: A″ (H5 not supported) and A‴ (H6 supported, by one holdout run).**

- **A″:** arm B's prompt word for word, with the Hearsay MCP server and `fix-hearsay-findings`
  available exactly as in arm A (no shell). Same servers, v2 builds, holdouts, model, cap, harness
  and blocks of at most six; 9 runs. It separates the tool from the goal.
- **Product change (D-025, owner's freeze exception):** `coverage.*` checks (warn, source
  `hearsay`) report what the visible suite does not exercise: tools without a case, enum values
  and bounds that never occur, tools that ask for confirmation without a decline case, mandate
  tools without a limit case. `hearsay_run` reports them. `fix-hearsay-findings` no longer stops
  at green: it reviews the whole catalog (`hearsay_explain` per question) and proposes cases for
  every coverage gap as text, never writing `suites/`. `write-hearsay-suite` drafts against
  `coverage.*`.
- **A‴:** arm B's prompt word for word, with the changed Hearsay MCP server and skill; 9 runs.
- Arms A″ and A‴ are compared with arm B's nine v2 runs; B is not run again. Model and alias are
  the same (`sonnet`, recorded as `claude-sonnet-5-5` in every transcript); a different model id
  in a new run is reported.

**Hypotheses.**

- **H5:** A″ passes at least as many holdout runs as B minus 3 percentage points, and at most 1 of
  9 A″ runs ends with visible errors.
- **H6:** A‴ passes at least as many holdout runs as B, and at most 1 of 9 A‴ runs ends with
  visible errors.

Analysis rules as in §v2. The wording for README, Devpost and the video is proposed only after
both, and names the limit that the holdouts were written by the author of the flaws.

**A″ results (9 runs, 30 Sep 2026).** Two blocks (six, three), every run on the subscription, every
agent run completed, model `claude-sonnet-5-5` in all nine, no audit breach.

| Arm | Holdout runs passed | Runs that ended with visible errors | Turns (mean) | Time (median) | API-equivalent cost |
|---|---|---|---|---|---|
| A: Hearsay, goal "pass the suite" | 88/129 (68.2 %) | 0 of 9 | 17.3 | 21 s | $1.60 |
| A″: Hearsay, B's goal | 91/129 (70.5 %) | 0 of 9 | 16.2 | 22 s | $1.43 |
| B: B's goal, no Hearsay | 107/129 (82.9 %) | 4 of 9 | 17.3 | 33 s | $1.75 |

Per server, A″: Smart Home 27/39, Kitchen 40/48, Household Orders 24/42 (A: 24, 40, 24). Rules
arm B's prompt names: A″ 62/84, A 60/84, B 79/84.

- **H5: not supported.** A″ was 12.4 points below B (needs at least −3); visible errors 0 of 9.

**Reading.** The goal was not the cause. With B's goal word for word and Hearsay available, the
agent ran the suite (twice per run, like A), fixed what it reported, reached green and stopped; the
holdout-only defects stayed. Having Hearsay changes how the agent works: the green run becomes the
definition of done. That is what the product change targets.

**A‴ results (9 runs, 30 Sep 2026).** After the product change (PR #17): two blocks, every run on
the subscription, model `claude-sonnet-5-5` in all nine, no suite changed, no audit breach. A‴'s
Hearsay MCP server was installed from the pack of that commit, apart from A's and A″'s.

| Arm | Holdout runs passed | Runs that ended with visible errors | Turns (mean) | Time (median) | API-equivalent cost |
|---|---|---|---|---|---|
| A: Hearsay, goal "pass the suite" | 88/129 (68.2 %) | 0 of 9 | 17.3 | 21 s | $1.60 |
| A″: Hearsay, B's goal | 91/129 (70.5 %) | 0 of 9 | 16.2 | 22 s | $1.43 |
| **A‴: Hearsay with coverage and the reviewing skill, B's goal** | **108/129 (83.7 %)** | **0 of 9** | 21.3 | 36 s | $2.02 |
| B: B's goal, no Hearsay | 107/129 (82.9 %) | 4 of 9 | 17.3 | 33 s | $1.75 |
| B′: B's goal and a shell | 98/129 (76.0 %) | 3 of 9 | 9.1 | 45 s | $1.91 |

| Rule category | A | A″ | A‴ | B | B′ |
|---|---|---|---|---|---|
| Rules arm B's prompt names | 60/84 | 62/84 | 71/84 | 79/84 | 69/84 |
| Other catalog rules | 28/45 | 29/45 | 37/45 | 28/45 | 29/45 |

- **H6: supported**, by the smallest margin: A‴ passed one holdout run more than B (+0.8 points;
  "about the same" under the analysis rules), with 0 of 9 runs left with visible errors against
  B's 4 of 9.

**What changed per case** (holdout runs failed, of 3 agent runs, A / A″ / A‴ / B): synonyms
"study", "lounge" 3 / 2 / 0 / 0; staging asked about inside the permission 3 / 3 / 0 / 2; the order
question with two lines 3 / 3 / 1 / 0; six timers read out 3 / 3 / 1 / 3 (no other arm fixed it);
steps slower than 500 ms 1 / 1 / 0 / 0. Unchanged: amounts not read back 3 / 3 / 3 / 1, dimming the
whole house without asking 3 / 3 / 3 / 2; coverage cannot point at either, because the suite uses
those tools and values, only not on that branch. New: "kitchen lights to zero" failed in two A‴
runs and in no other arm.

**How the agents used it.** All nine A‴ runs ended with a **Proposed cases** section for a person
to add (for example a declined grant, the rooms kitchen and office, out-of-range amounts) and none
touched `suites/`. None called `hearsay_explain`, which the skill asks for per question; they
reviewed the code directly.

**Reading.** The narrowing was real and it was the tool's: with a suite and a green signal, agents
did what the suite covered and stopped (A and A″, whatever the goal). Reporting what the suite does
not cover, and telling the agent that green is not the end, closed the gap to the best prompt on
unseen cases (A‴ 83.7 %, B 82.9 %) and kept Hearsay's verification (0 of 9 runs with defects left,
against 4 of 9). A‴ was strongest on rules the prompt does not name (37/45 against 28/45) and
weaker on the ones it does (71/84 against 79/84). Coverage finds untested tools and values, not
untested branches of tested tools.

**Limits.** Three runs per arm, one model, and the holdouts were written by the author of the
flaws, who knew which defects were holdout-only. A‴ ran after the other arms (same model id); B was
not run again.

**Proposed wording for README, Devpost and the video** (the owner decides):

> We measured it. Agents with Hearsay never stopped on a defect they could see (0 of 36 runs, 11
> of 27 without it), but on unseen cases they did worse than agents with a good prompt (68–71 %
> against 83 %): they fixed what the suite covered and stopped at green. So Hearsay now reports
> what the suite doesn't cover, and its skill reviews beyond green. Measured again: 84 % on unseen
> cases, level with the prompt, and still no defects left behind. (Three runs per arm; the unseen
> cases were written by the author of the flaws.)

Short form for the video: "With a suite alone, agents fixed what it covered and stopped. So Hearsay
now shows what your suite doesn't cover. Next round: level with the best prompt on unseen cases,
and zero defects left behind."
