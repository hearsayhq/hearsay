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
