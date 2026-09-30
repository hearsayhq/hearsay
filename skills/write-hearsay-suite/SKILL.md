---
name: write-hearsay-suite
description: Draft a Hearsay test suite for an MCP add-on server from its tool list. Use when a server has no suite yet, or when asked to test how an MCP server behaves behind a voice assistant such as Alexa+. Writes one new file under suites/; never edits an existing suite or the suite lock.
---

# Write a Hearsay suite

A suite says what a customer says and what should happen. You draft one for a server that has
none. The owner reviews it in a pull request and locks it; from then on it is theirs.

## Steps

1. Make sure the server runs, then call `hearsay_lint` with its URL (for example
   `http://localhost:4101/mcp`). Besides findings it returns `tools`: every tool's name,
   parameters (`?` marks optional, enums are listed) and annotations.
2. Pick a file name: `suites/<server-name>.yaml`. **If that file exists, stop** and say so in the
   chat. You never edit an existing suite.
3. Draft the suite (format below):
   - at least one case per tool, in the words a customer would use (en-US, spoken, no ids);
   - confirmation follows one rule: confirm only when money moves or when something matters
     and cannot be undone. `confirm: required` when the tool spends money, places or cancels an
     order or booking, deletes what the person cannot get back, or reaches far beyond what was
     said (the whole house instead of one room). Add a second case with
     `human: { answer: decline }`, and the checks `consent.path`, `consent.decline_holds` and
     `consent.states_details`;
   - a small, reversible action the person asked for by name (cancel the pasta timer, turn off
     one light, read a step) needs no confirmation: `confirm: forbidden`. With a spending limit,
     add `consent.over_confirmation` so asking too often is caught;
   - `fuzz` where speech recognition can hurt: numbers (`asr.number_confusion`), words that
     sound alike or rooms and names (`asr.homophones`), compounds such as "living room"
     (`asr.compound_split`); add `checks: [asr.robust]` to those cases;
   - `argsMustNotContain` where a mishearing would be dangerous (`{ room: all }`);
   - `after` for cases that need earlier state (listing timers after starting two).
4. Call `hearsay_run` on the new file. If it says the suite is not valid, fix the suite and run
   again until it loads.
5. Read the `coverage.*` warnings: tools no case reaches, enum values no case uses, bounds no case
   crosses, confirmations nobody declines, amounts never taken over the limit. Add cases to your
   draft until they are gone, or say in the report why a gap stays (a tool a test must not call,
   say). Run again after adding. A suite an agent will fix against is only as good as what it
   reaches.
6. Report in the chat: the file, the cases in one line each, the coverage gaps left and why, and
   the run's findings as they are.

## Hard rules

- **Expectations describe what a customer expects, not what the server does today.** Never adjust
  an expectation so a run turns green. A red first run is a normal result; report it.
- Never edit an existing file under `suites/`, never touch `suites/.hearsay-lock`, never run
  `hearsay lock`. Locking is the owner's step after review.
- Do not invent tools or arguments the tool list does not have. If you cannot tell what a tool
  does, say so in the chat instead of guessing.
- Holdout files (`*.holdout.yaml`) are not yours to write or read.

## Format

```yaml
suite: kitchen
description: One line on what this server is.
server:
  url: http://localhost:4101/mcp
  start: npm run server:kitchen        # optional; Hearsay starts the server if nothing answers
orchestrator: scripted                  # scripted: the suite names the call; no model needed
checks:                                 # run for every case (server-scope ones once per suite)
  - protocol.version
  - protocol.refusal_as_result
  - lint.tool_names
  - lint.descriptions
  - lint.schema_constraints
  - lint.destructive_annotated
  - lint.error_actionable
  - latency.tool
  - latency.first_audio
  - speak.length
  - speak.no_structured_dump
cases:
  - id: start-pasta-timer               # kebab-case, unique
    say: set a pasta timer for fifteen minutes   # one utterance per case in scripted mode
    expect:
      tool: timer_start                 # the tool that should be called
      args: { minutes: 15, label: pasta }        # subset match
      spokenIncludes: [pasta, fifteen]  # words the reply must contain
    fuzz: [asr.number_confusion]
    checks: [asr.robust]

  - id: cancel-ambiguous
    say: cancel the timer
    after: [start-pasta-timer]          # runs first, in the same session
    call: { tool: timer_cancel, args: {} }   # what the stand-in planner calls, when it differs from expect
    expect:
      tool: timer_cancel
      spokenIncludes: [which]
```

Other expectation fields: `noTool: true` (the assistant should ask back), `refusal: CODE` (an
`isError` result with that code), `confirm: required | forbidden`, `argsMustNotContain`.
Case fields: `human: { answer: accept | decline | cancel }`, `client: { elicitation: false }`
(a host without elicitation), `injectedCall` (a compromised model's extra call).

Checks by question (`hearsay_explain <id>` gives the rule and its source):

- Precondition, can it connect? `protocol.version`, `protocol.list_changed` (`suite.integrity` always runs)
- Did it hear me right? `asr.robust`, `lint.tool_names`, `lint.descriptions`, `lint.schema_constraints`
- Do I have to wait? `latency.tool`, `latency.first_audio`
- Can I listen to this? `speak.length`, `speak.no_structured_dump`, `speak.lists`, `lint.error_actionable`,
  `protocol.refusal_as_result`
- Did I agree? `consent.path`, `consent.decline_holds`, `consent.states_details`,
  `consent.verbal_token`, `consent.misheard_amount`, `consent.over_confirmation`,
  `lint.destructive_annotated`, and for servers with spending limits `mandate.schema_ignoring_caller`,
  `mandate.version_race`, `mandate.expiry`, `mandate.injection`, `mandate.principal_bound`

Perturbations for `fuzz`: `asr.number_confusion`, `asr.homophones`, `asr.compound_split`,
`asr.self_correction` (llm mode only), `asr.roundtrip` (recorded mishearings).
