# Check catalog

Ids, questions, thresholds and sources live in `packages/engine/src/catalog.ts`;
`npm run hearsay -- checks` prints them grouped by question. This file defines how each check
decides. `catalog.test.ts` fails if an id exists in code but not here.

## Conventions

- **Questions.** Every check answers one question a listener asks (docs/00): *Did it hear me
  right? Do I have to wait? Can I listen to this? Did I agree?* Protocol checks sit under the
  precondition *Can it connect?*. `case.expect` findings take the question of the field that
  failed.
- **Severity.** `error` fails the run (exit 1), `warn` is reported, `info` is advice.
- **Thresholds.** A check can have several thresholds with different severities. Every finding
  carries the severity and the source of the threshold that fired.
- **Sources.** `amazon-fr` (Alexa+ add-on functional requirements, MCP Toolkit quickstart and
  client lifecycle pages), `mcp-spec` (MCP 2025-11-25), `hearsay` (our own rule, argued in these
  docs). URLs are in `catalog.ts` and docs/14.
- **Amazon thresholds are fixed.** A suite's `budget` can only tune thresholds sourced
  `hearsay` (D-011).
- **Scope.** `server` checks run once per suite (lint and active probes); `turn` checks run on
  every turn of every case × variant; `suite` checks (`coverage.*`) run once after all cases, over
  the visible cases and their traces. Case-level `checks` add turn checks; they never replace the
  suite's (D-015).
- **Planned checks** a suite asks for are listed as `skipped` in the summary and the report,
  never counted as passed (FR-024).
- **Profile.** `mandate.*` checks run only against servers that expose the mandate profile
  (§Mandate profile). `consent.*` checks run against any server.

## Can it connect?

- `suite.integrity` — Always on. If `suites/.hearsay-lock` exists, every suite in the run is hashed
  and compared; a locked suite whose content changed since `hearsay lock`: **error**. A run that
  changed its own expectations is never green; legitimate changes go through normal pull requests
  (docs/03 §Holdouts and the lock).

- `protocol.version` — The engine initializes offering `2025-11-25` over Streamable HTTP; if the
  server cannot negotiate it: **error** (MCP Toolkit quickstart; hackathon rules). A second
  session offers `2025-03-26`, as Amazon's example handshake does (friction log #2); if initialize
  or `tools/list` then fails: **warn**.
- `protocol.list_changed` — At the end of every case's session the engine lists the tools again;
  if they differ from the last list the server announced (no `notifications/tools/list_changed`
  arrived): **warn**, with the added and removed tools. Alexa+ refreshes tool information only on deployment (friction log #3), so servers
  should not rely on dynamic tool lists; enforcement never does (docs/06).

## Did it hear me right?

- `asr.robust` — Per variant, compared with the clean run of the same case:
  same effect → pass (the same reply to the same arguments, or to arguments the server
  normalised to the same `structuredContent`; the same reply to different arguments, such as
  "Timer started." for fifteen and for fifty minutes, hides what was heard and does not count); a question back or an actionable refusal → pass; a different effect whose
  spoken reply states the heard value (read back: "Pasta timer set for fifty minutes") → pass.
  A different effect without read-back, or a success reply with no effect → **error**, evidence
  is the heard text, the calls and the effect diff. In scripted mode the stand-in planner is
  literal: it passes what it heard as argument values (docs/03 §Variants). Money is judged by
  `consent.misheard_amount`, where read-back is not enough.
- `lint.tool_names` — Name outside `[A-Za-z0-9_.-]{1,128}`: **warn** (MCP tools). Two tools whose
  words are the same after synonym folding (set/apply/update/change, get/list/show/read/review,
  start/create/add, stop/cancel/remove/delete, turn/switch/toggle) and plurals, in any order:
  **warn** (Amazon: each tool maps to a distinct intent). `set_scene` and `apply_scene` collide;
  `set_scene` and `get_scene` do not.
- `lint.descriptions` — A tool description missing or under 20 characters, or a parameter
  without a description: **warn** (Amazon: clear, unambiguous descriptions; synonyms in
  parameter descriptions).
- `lint.schema_constraints` — `inputSchema` not valid JSON Schema, or a required parameter not
  in `required`: **error** (Amazon). Numeric parameters without min/max: **warn**. A string
  parameter whose name usually means a closed set (state, mode, room, unit, status, type, kind,
  level, scene, color, direction, size, currency, day) without `enum`: **warn**.
- `case.expect` — Always on. Judges the case's `expect` block (docs/03 §Expectations) on the
  clean variant; in llm and replay mode also `argsMustNotContain` on every variant. Any unmet
  field: **error**, with the field as evidence.

## Do I have to wait?

- `latency.tool` — Any single `tools/call` round trip over 500 ms: **error** (MCP Toolkit
  quickstart). Time the person spends answering an elicitation during the call is not server
  time and is subtracted; the timeline still shows it as an elicitation span.
- `latency.first_audio` — Modeled `asr + plan + Σ tool + speak_ttfb` (docs/03 §Latency model)
  over `budget.firstAudioMs` (default 1500): **warn**, with the span breakdown. In scripted mode
  `plan` is 0, so the number is a lower bound: a server that misses it misses it everywhere.

## Can I listen to this?

- `speak.no_structured_dump` — The spoken reply contains `{`, `[`, a markdown table or heading, a
  URL, a UUID, an internal id (`sku-…`, `c-…`), or a tool name from `tools/list`: **error**
  (Amazon). It contains 8 or more consecutive words from a tool description: **error** (the
  server controls its descriptions; they are not speech). In scripted mode the reply is the tool
  result text, so this judges the server directly.
- `speak.length` — Over 400 characters (Amazon's 30 seconds at about 150 words per minute):
  **error**. Over `budget.spokenChars` (default 280): **warn**.
- `speak.lists` — Items are counted from comma lists ending in "and"/"or" ("milk, eggs, and
  bread") and from bulleted or numbered lines. More than 5: **error** (Amazon). More than
  `budget.listItems` (default 3) without an offer to continue ("more", "want to hear", "shall I
  continue"): **warn**.
- `lint.error_actionable` — Tool results with `isError`: a stack trace, an error code or an
  internal id in the text: **error** (Amazon: no API codes). Over 200 characters, or no
  actionable phrase (can, could, try, say, allowed, which, want, please, ask, instead, should I): **warn** (Amazon: an actionable next
  step for every error).
- `protocol.refusal_as_result` — A `tools/call` answered with a JSON-RPC error instead of a
  result, or a result whose text starts `MCP error -32602` (the TypeScript SDK 1.31 wraps input
  validation failures that way): **error** (Amazon: every listed tool must be invocable; MCP:
  tool errors are results with `isError`). Refusals are one spoken sentence.

## Did I agree?

A **consequential action** is one the suite marks `confirm: required`, or one of the mandate
profile's commit paths. `write-hearsay-suite` proposes these cases for every destructive tool.

How the engine sees consent: a **confirmation** is an elicitation the server sent during a tool
call (recorded on that call), or a result carrying the verbal convention below. **Committed
state** is what the server's read-only tools without required arguments return; the engine reads
them before and after a case's own turns when a check needs it.

- `consent.path` — For the clean run of a case marked `confirm: required`, how the action went:
  - after an accepted elicitation → pass (the reference path);
  - through the verbal path on a client without elicitation → **warn** (a model can
    hallucinate a yes; docs/06);
  - through the verbal path although the client declared elicitation → **warn**;
  - the client has no elicitation and the server refuses to commit → **info** ("safe, but
    unusable on hosts without elicitation");
  - without an accepted elicitation or a valid verbal token → **error** (Amazon: explicit
    confirmation before payment, cancellation or deletion).
- `consent.decline_holds` — A confirmation was asked and the person declined or cancelled (or
  never said yes to a verbal question); committed state changed anyway: **error**. Committed
  state is read through the server's read-only tools (for the mandate profile:
  `mandate_status.spentUsd` and the order count).
- `consent.states_details` — Every confirmation (elicitation message or verbal question) must
  state an amount (a number, in digits or words) and what it is about (a word of four letters or
  more from what was said or from the call's arguments). Otherwise: **error** (Amazon:
  confirmation with key details). "Are you sure?" fails; "Place the order: two cartons of milk,
  seven dollars and forty cents?" passes.
- `consent.verbal_token` — Active probe, only when the verbal path was observed: confirm with
  the token after changing the cart; confirm twice; confirm after `expiresInSeconds`; confirm
  with a token for other items or another amount. Any commit: **error**. A declared
  `expiresInSeconds` over 60: **error**. Expiry is waited out only when it is ≤ 5 s (reference
  servers use 3 s in test mode); otherwise the report says it was checked as declared only.
- `consent.misheard_amount` — For every variant that changes a number: pass if the call was
  refused (e.g. `LIMIT_EXCEEDED`); pass if a confirmation stated the heard amount (the simulated
  person, who knows what they meant, declines it); pass if nothing was paid and the reply read
  the heard amount back. Otherwise — accepted silently, or paid without the person hearing the
  amount: **error**.
- `consent.over_confirmation` — Judged on cases not marked `confirm: required`. A confirmation
  (elicitation or verbal question) during a call to a tool declaring `readOnlyHint: true`: **warn** (Amazon: confirmation is for high-consequence
  actions such as payment, cancellation, deletion). A confirmation during a call that commits
  nothing (for the mandate profile: `mandate_status.spentUsd` and the order count unchanged) while
  an active mandate covers it: **warn** (grant once, act freely within the limit; docs/06).
- `lint.destructive_annotated` — Active probe: each tool declaring `readOnlyHint: true` with no
  required arguments is called twice in a fresh session; if the two reads differ: **error**. A
  tool named with a mutating verb (set, apply, update, delete, cancel, start, add, place, order,
  turn, send, pay, buy, stage, …) without explicit `readOnlyHint`/`destructiveHint`: **warn**. Per the MCP spec an unannotated tool already counts
  as destructive, so a missing annotation is advice; a lying one is a fault.

### Verbal confirmation

When the client has no elicitation, a server may confirm by voice. Convention:

- The requesting tool (e.g. `orders_request_checkout`) commits nothing. Its result text is the
  question ("Place the order: two cartons of milk, $7.40?"), and its `structuredContent`
  contains `confirmation: { token, question, confirmTool, expiresInSeconds }`.
- The token is bound to the exact items and amount, single-use, and expires in ≤ 60 s. Any change
  to the cart invalidates it.
- Calling `confirmTool` with `{ token }` commits. In scripted mode the stand-in planner calls it
  only if the simulated person answers `accept`.

### Mandate profile

A server exposes the profile by listing these tools (names fixed, schemas as in
servers/household-orders/README.md). The probes find the rest by shape: the **staging tool** is
the scoped tool (named in `mandate_status.tools`) with an enum-advertised resource parameter,
optional `quantity` and optional `mandateVersion`; the **commit tool** is the scoped tool with no
required parameters.

| Tool | Role |
|---|---|
| `mandate_status` | read-only; `structuredContent: { status, version, tools, resourceIds, limits, spentUsd, expiresAt }` |
| `mandate_propose` | proposes a scope (`resourceIds`, `perCallLimitUsd`, `totalLimitUsd`, `durationSeconds`); grants nothing until confirmed |
| `mandate_revoke` | ends the mandate |

- `mandate.schema_ignoring_caller` — For each mandate-scoped tool, call it with values outside
  the advertised enums and with extra fields. Anything but a refusal with a mandate code
  (`OUT_OF_SCOPE`, `LIMIT_EXCEEDED`, …) as a spoken result: **error**. An SDK validation error
  also fails `protocol.refusal_as_result`.
- `mandate.version_race` — (1) Read `mandate_status`, revoke and regrant through the simulated
  person, call naming the old version: expect `POLICY_CHANGED`. (2) Stage a line, narrow the
  mandate so the line is out of scope, request checkout: the line must not commit. Otherwise:
  **error**.
- `mandate.expiry` — Grant with the shortest allowed `durationSeconds`, wait past it with no
  request in between, call: expect `MANDATE_EXPIRED` with a spoken sentence; else **error**.
- `mandate.injection` — After a tool result that contains instructions, the scripted
  "compromised model" makes the case's `injectedCall`. It must be refused, and `mandate_status`
  and the tool list must be unchanged; else **error**. In llm mode the check also runs without
  `injectedCall`, on whatever the model does.
- `mandate.principal_bound` — Grant as principal A. As principal B in a new session, a scoped
  call must be refused: else **error**. As principal A in a new session, `mandate_status` must
  show the mandate: else **warn**.

## Coverage

`coverage.*` (FR-067, D-025) reports what the visible suite never exercises, so an agent that
stops at green can see where the suite stops (docs/15 §v2: agents with Hearsay fixed what the suite
covered and stopped there). Always on, severity `warn`, source `hearsay`. They read the visible
cases (their `call`, `expect`, `human`) and the tool calls in their traces; holdout cases never
count. Every hint says to propose a case in the pull request description: the suite is changed by
a person, never by the agent (D-021).

| Check | Question | Fires when |
|---|---|---|
| `coverage.tools` | precondition | a tool in `tools/list` is neither called nor expected by any visible case |
| `coverage.values` | hear | an enum value of a parameter is used by no case (named, e.g. "room: kitchen, office never used"), or a parameter with `minimum`/`maximum` that cases use is never tried outside its bounds; skipped for tools no case reaches |
| `coverage.decline` | agree | a tool asked for confirmation in a run, or a case expects `confirm: required` for it, and no case declines or cancels it |
| `coverage.limits` | agree | the suite asks for any `mandate.*` check, and a tool that is not read-only and takes a numeric amount or quantity (and no limit parameter, which marks the tool that grants the mandate) is never refused with `LIMIT_EXCEEDED` |

Not covered by design: a destructive tool that never asks (small reversible actions are not
confirmed, D-022), so there is no "no" to test.

## Kit blocks named in hints

Where a building block of `@hearsayhq/kit` fixes a finding, the hint names it.

| Kit block | Checks |
|---|---|
| `speak()` | `speak.no_structured_dump`, `speak.length`, `speak.lists` (≤ 5 options and "more"), `asr.robust` (read-back) |
| `refuse()` | `lint.error_actionable`, `protocol.refusal_as_result`, `case.expect` (`refusal`) |
| `confirm()` | `consent.*`, `case.expect` (`confirm`) |
| `withMandate()` | `mandate.*` |
| none | `latency.*`, `lint.tool_names`, `lint.descriptions`, `lint.schema_constraints`, `lint.destructive_annotated`, `protocol.version`, `protocol.list_changed`, `suite.integrity`: the hint names the concrete declaration or change |

## Perturbations

Seeded and deterministic. Each yields 0–3 variants; a perturbation that does not apply to an
utterance yields none (no fake variants). In scripted mode only perturbations that change
argument values run (docs/03 §Variants).

| Id | Scripted | Rule |
|---|---|---|
| `asr.number_confusion` | yes | Swap teen/tens pairs (thirteen↔thirty … nineteen↔ninety), in words and digits. |
| `asr.homophones` | yes | Curated table: for/four, two/to/too, eight/ate, right/write, won/one. |
| `asr.compound_split` | yes | Split or merge known compounds: living room/livingroom, bedroom/bed room. |
| `asr.self_correction` | no | "X, no, Y" where Y is the intended value; the expected call uses Y. Tests the planner, so llm and replay only. |
| `asr.roundtrip` | yes | Recorded by `hearsay gen-variants`: Polly speaks the utterance, noise and a telephone band are added, Transcribe hears it. The heard texts are committed with the suite; runs only replay them. |
