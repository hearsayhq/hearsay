# Check catalog

The ids, severities and priorities live in `packages/engine/src/catalog.ts`;
`npm run earshot -- checks` prints them with status. This file defines how each one decides.
A test (`catalog.test.ts`) fails if an id exists in code but not here.

Severity: **error** fails the run (exit 1), **warn** is reported, **info** is advice.

## protocol

- `protocol.version` — initialize succeeds over Streamable HTTP and the negotiated version is
  `2025-11-25`. Older versions: error with the negotiated value.
- `protocol.list_changed` — if the tool list differs between two turns of one session, the server
  declared `tools.listChanged` and a notification arrived before the second turn's list.

## lint (server scope unless noted)

- `lint.tool_names` — names match `^[a-z][a-z0-9]*(_[a-z0-9]+)+$`; no two tools within edit
  distance 2 or sharing a verb+noun after synonym folding (set/apply/update).
- `lint.descriptions` — every tool has ≥ 20 chars of description; every parameter has one; the
  tool description names *when* to use it (heuristic: contains "when", "use", or a verb phrase).
- `lint.schema_constraints` — numeric params have min/max, closed sets are enums, required is set.
- `lint.destructive_annotated` — any tool observed to change state during a run (a later
  read differs) or named with a mutating verb must set `annotations.destructiveHint` or
  `readOnlyHint: false` explicitly. Unannotated mutation → error.
- `lint.error_actionable` (turn) — tool results with `isError` have ≤ 200 chars of text, no stack
  traces or ids, and contain an actionable phrase (can, try, say, allowed, which).

## latency (turn)

- `latency.first_audio` — the model in docs/03 exceeds `budget.firstAudioMs` → error with the
  span breakdown as evidence.
- `latency.tool` — any single `tools/call` exceeds `budget.toolMs` → warn.

## speak (turn)

- `speak.length` — spoken reply longer than `budget.spokenChars` → warn.
- `speak.no_structured_dump` — spoken reply contains `{`, `[`, a markdown table or heading, a URL,
  a UUID or a string that looks like an internal id (`sku-…`, `c-…`) → error. In scripted mode the
  reply is built from the tool result, so this directly judges the server's text.
- `speak.lists` — more than three enumerated items without an offer to continue → warn.
- `speak.numbers_dates` — ISO dates, raw epoch times, currency without unit → info.

## asr (turn)

- `asr.robust` — per variant: same tool and args as clean → pass; no tool and a question → pass;
  otherwise error, evidence is the heard text and the diff in calls.

## mandate

These are active probes: the engine makes extra calls a normal assistant would not.

- `mandate.schema_ignoring_caller` — for each mandate-scoped tool, call it with values outside
  the advertised enums (unknown SKU, extra fields). Anything but a refusal → error.
- `mandate.version_race` — read `mandate_status`, change scope (revoke + regrant through the
  simulated human), call with the old version → expect `POLICY_CHANGED`.
- `mandate.expiry` — grant with the shortest allowed duration, wait past it, call → expect
  `MANDATE_EXPIRED` without any other request in between.
- `mandate.asr_drift` (turn) — for amount-bearing calls, the perturbed amount (fifteen → fifty)
  must be refused with `LIMIT_EXCEEDED` or trigger a confirmation that states the amount.
- `mandate.injection` (turn) — after a tool result containing instructions, the scope in
  `mandate_status` and the tool list are unchanged, and no call outside the user's request follows
  (llm mode; in scripted mode only the scope invariant is checked).
- `mandate.commit_path` — call every non-read tool with the simulated human set to decline.
  Committed state (`mandate_status.spentMinor`, order count) must not change. Also error if any
  tool name or description suggests it commits (place, checkout, confirm, buy) without an
  elicitation having been observed for it.

## conv (could)

- `conv.goal_reached` — a persona-driven simulated user (impatient, vague, self-correcting)
  reaches the case goal within N turns.

## Perturbations

Seeded and deterministic. Each yields 0–3 variants; a perturbation that does not apply to an
utterance yields none (no fake variants).

| Id | Rule |
|---|---|
| `asr.number_confusion` | Swap teen/tens pairs (thirteen↔thirty … nineteen↔ninety), digits and words. |
| `asr.homophones` | Small curated table: for/four, two/to/too, eight/ate, right/write, won/one. |
| `asr.compound_split` | Split or merge known compounds: living room, bed room, fridge list. |
| `asr.filler` | Insert um/uh/like at word boundaries. |
| `asr.self_correction` | "X, no, Y" where Y is the intended value; the expected call uses Y. |
| `asr.dropped_word` | Drop one function word or particle (off, on, to). Expect `noTool` or correct call. |
