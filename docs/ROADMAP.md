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

## Not adopted from voicecheck

- Personas, load and soak testing, barge-in, a results dashboard.

## Later

- Host profiles beyond Alexa+ (budgets and confirmation rules per assistant).
- Real Polly → Transcribe round trip inside runs, measuring asr and speak instead of modeling them.
- Interim-message check for tools slower than 3 s (Amazon's search requirement) once the MCP
  mechanism for it is clear.
