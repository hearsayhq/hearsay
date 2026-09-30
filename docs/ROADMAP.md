# Roadmap

Ideas that are out of scope for the hackathon (scope freeze, D-013). Adding a line here is how a
new idea is recorded; moving one into docs/07 needs the owner.

## Cut from the plan

- `conv.goal_reached`: persona-driven simulated users that must reach a goal within N turns.
- `speak.numbers_dates`: ISO dates, epoch times, currency without unit in spoken replies.
- `asr.filler`, `asr.dropped_word` perturbations.
- Amazon Polly as the console's reply voice; microphone input in the console.
- Composite GitHub Action (the README has a workflow snippet).
- Anthropic and OpenAI-compatible model adapters (kept only as an R-06 fallback).

## Later

- MCP 2026-07-28: `confirm()` returns `input_required` and the engine session answers it (SDK 2.x),
  so consent checks work on both protocol eras (R-16).

## Replaced or declined

- Scan of public MCP servers (FR-062): replaced by the agent-loop experiment (D-017), then back in the plan for evidence only (D-024).
- Watch mode, PR comments, a `hearsay fix` command (declined by the owner).

## Not adopted from voicecheck

- Personas, load and soak testing, barge-in, a results dashboard.

## Later

- llm orchestrator via a Strands agent (as the KayLerch bridge does). Not built during the freeze;
  Bedrock Converse stays the AWS Builder story.

- Host profiles beyond Alexa+ (budgets and confirmation rules per assistant).
- Real Polly → Transcribe round trip inside runs, measuring asr and speak instead of modeling them.
- `speak.lists` counts an enumeration only when "and" or "or" comes before the last item; "a, b, c,
  d, e, f." read without it goes uncounted (found building experiment v2, 30 Sep). Needs a rule
  that does not also count ordinary sentences with several commas, and a fixture.
- `consent.states_details` takes any number as "how much": a checkout question with quantities
  but no total ("Place the order: three cartons of milk and two dozen eggs?") passes (found
  building experiment v2, 30 Sep). A question before payment should name the total.
- `asr.robust` reads only the reply, not the confirmation question: a server that asked "Add fifty
  dollars of fruit?" and was told no still counts as not saying what it heard.
- Experiment v2 (docs/15): agents with Hearsay fix what the suite reports and stop at green.
  Ideas, after the freeze: `fix-hearsay-findings` ends with a pass over the code paths no case
  exercised, and `write-hearsay-suite` aims at covering every tool and branch, so the suite
  (the thing an agent stops at) reaches further.
- Interim-message check for tools slower than 3 s (Amazon's search requirement) once the MCP
  mechanism for it is clear.
