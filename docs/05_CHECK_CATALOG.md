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
  every turn of every case × variant. Case-level `checks` add turn checks; they never replace the
  suite's (D-015).
- **Planned checks** a suite asks for are listed as `skipped` in the summary and the report,
  never counted as passed (FR-024).
- **Profile.** `mandate.*` checks run only against servers that expose the mandate profile
  (§Mandate profile). `consent.*` checks run against any server.

## Can it connect?

- `protocol.version` — The engine initializes offering `2025-11-25` over Streamable HTTP; if the
  server cannot negotiate it: **error** (MCP Toolkit quickstart; hackathon rules). A second
  session offers `2025-03-26`, as Amazon's example handshake does (friction log #2); if initialize
  or `tools/list` then fails: **warn**.
- `protocol.list_changed` — If the tool list differs between two turns of one session, the
  server declared `tools.listChanged` and a notification arrived before the second list; else
  **warn**. Alexa+ refreshes tool information only on deployment (friction log #3), so servers
  should not rely on dynamic tool lists; enforcement never does (docs/06).

## Did it hear me right?

- `asr.robust` — Per variant, compared with the clean run of the same case:
  same effect → pass; a question back or an actionable refusal → pass; a different effect whose
  spoken reply states the heard value (read back: "Pasta timer set for fifty minutes") → pass.
  A different effect without read-back, or a success reply with no effect → **error**, evidence
  is the heard text, the calls and the effect diff. In scripted mode the stand-in planner is
  literal: it passes what it heard as argument values (docs/03 §Variants). Money is judged by
  `consent.misheard_amount`, where read-back is not enough.
- `lint.tool_names` — Name outside `[A-Za-z0-9_.-]{1,128}`: **warn** (MCP tools). Two tools
  within edit distance 2, or sharing verb and noun after synonym folding (set/apply/update,
  get/list/show): **warn** (Amazon: each tool maps to a distinct intent).
- `lint.descriptions` — A tool description missing or under 20 characters, or a parameter
  without a description: **warn** (Amazon: clear, unambiguous descriptions; synonyms in
  parameter descriptions).
- `lint.schema_constraints` — `inputSchema` not valid JSON Schema, or a required parameter not
  in `required`: **error** (Amazon). Numeric parameters without min/max, closed sets without
  `enum`: **warn**.
- `case.expect` — Always on. Judges the case's `expect` block (docs/03 §Expectations) on the
  clean variant; in llm and replay mode also `argsMustNotContain` on every variant. Any unmet
  field: **error**, with the field as evidence.

## Do I have to wait?

- `latency.tool` — Any single `tools/call` round trip over 500 ms: **error** (MCP Toolkit
  quickstart).
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
- `speak.lists` — More than 5 enumerated options: **error** (Amazon). More than
  `budget.listItems` (default 3) without an offer to continue: **warn**.
- `lint.error_actionable` — Tool results with `isError`: a stack trace, an error code or an
  internal id in the text: **error** (Amazon: no API codes). Over 200 characters, or no
  actionable phrase (can, try, say, allowed, which, want): **warn** (Amazon: an actionable next
  step for every error).
- `protocol.refusal_as_result` — A `tools/call` answered with a JSON-RPC error instead of a
  result, or a result whose text starts `MCP error -32602` (the TypeScript SDK 1.31 wraps input
  validation failures that way): **error** (Amazon: every listed tool must be invocable; MCP:
  tool errors are results with `isError`). Refusals are one spoken sentence.

## Did I agree?

A **consequential action** is one the suite marks `confirm: required`, or one of the mandate
profile's commit paths. `write-hearsay-suite` proposes these cases for every destructive tool.

- `consent.path` — How a consequential action committed:
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
- `consent.states_details` — The confirmation (elicitation message or verbal question) does not
  state the amount and the items: **error** (Amazon: confirmation with key details).
- `consent.verbal_token` — Active probe, only when the verbal path was observed: confirm with
  the token after changing the cart; confirm twice; confirm after `expiresInSeconds`; confirm
  with a token for other items or another amount. Any commit: **error**. A declared
  `expiresInSeconds` over 60: **error**. Expiry is waited out only when it is ≤ 5 s (reference
  servers use 3 s in test mode); otherwise the report says it was checked as declared only.
- `consent.misheard_amount` — For every variant that changes an amount: nothing commits unless
  the person could hear the misheard amount and decline. Pass: refused (e.g. `LIMIT_EXCEEDED`),
  or the confirmation states the heard amount and the simulated person, who knows the intended
  amount from the clean case, declines. A perturbed amount that commits: **error**.
- `lint.destructive_annotated` — A tool declaring `readOnlyHint: true` whose call is followed by
  a changed read (the engine snapshots zero-argument read-only tools around each call): **error**.
  A tool observed to change state, or named with a mutating verb, without explicit
  `readOnlyHint`/`destructiveHint`: **warn**. Per the MCP spec an unannotated tool already counts
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
servers/household-orders/README.md):

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
