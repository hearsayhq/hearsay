# Smart Home Scenes — the before/after

Role in the demo: **red → fix → green** in under a minute. Ships in two states behind a flag:
`HEARSAY_FIXED=0` (default, flawed) and `HEARSAY_FIXED=1`.

| Flaw (flawed mode) | Caught by (check, severity) | Fix (fixed mode) |
|---|---|---|
| `set_scene` returns the full device list as JSON | `speak.no_structured_dump` error, `speak.length` error | Return "Living room is off. Six devices." |
| "Turn off the whole house" runs without asking | `consent.path` error, `case.expect` error (`confirm: required`) | Elicitation stating the scope for whole-home scenes; decline leaves everything on |
| `set_scene` and `apply_scene` mutate without annotations | `lint.destructive_annotated` warn | `destructiveHint` set explicitly |
| `room` is a free string; "livingroom" matches nothing and the reply is "Done." | `asr.robust` error (`asr.compound_split`) | `room` enum with synonyms and normalisation; unknown rooms ask back |
| `set_scene` and `apply_scene` both exist | `lint.tool_names` warn | One tool |
| Upstream hub call sleeps 1100 ms | `latency.tool` error, `latency.first_audio` warn | Acknowledge fast, report state from cache |

**Gate (FR-051):** in flawed mode the set of distinct (check, severity) pairs in the report equals
this table exactly; in fixed mode the run has no findings and exits 0. `asr.robust` joins the gate
in M3 (perturbations), `consent.path` in M4 (consent checks). Fixed mode is flawed mode with
`@hearsayhq/kit` applied: `looseEnum`, `speak`, `refuse`, `confirm`.

## v2 build (`HEARSAY_FIXED=v2`)

For experiment v2 only (docs/15 §v2), fixed before its first run. `src/flawed-v2.ts`: the fixed
server with six defects that each pass a one-sentence smoke test.

| Defect | Found by | Where |
|---|---|---|
| The whole-house question does not say how many devices ("Turn off everything in the whole house?") | `consent.states_details` error | suite |
| Brightness below 20 percent is not read back ("Bedroom dimmed.") | `asr.robust` error ("thirty" heard as "thirteen") | suite |
| Dimming the whole house skips the confirmation | `consent.path`, `case.expect` errors | holdout |
| Unknown rooms get "Unknown room garage (UNKNOWN_ROOM)." with no rooms to choose from | `speak.no_structured_dump`, `case.expect` errors | holdout |
| "study" and "lounge" are no longer synonyms of office and living room | `case.expect`, `speak.no_structured_dump` errors | holdout |
| Whole-house changes wait 600 ms before answering | `latency.tool` error | holdout |
