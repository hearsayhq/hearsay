# Smart Home Scenes — the before/after

Role in the demo: **red → fix → green** in under a minute. Ships in two states behind a flag:
`EARSHOT_FIXED=0` (default, flawed) and `EARSHOT_FIXED=1`.

| Flaw (flawed mode) | Caught by | Fix (fixed mode) |
|---|---|---|
| `set_scene` returns the full device list as JSON | `speak.no_structured_dump`, `speak.length` | Return "Living room is off. 6 devices." |
| "Turn everything off" runs without asking | `lint.destructive_annotated`, expect `confirm: required` | `destructiveHint` + elicitation for whole-home scenes |
| `room` is a free string; "livingroom" / "living room" miss | `asr.robust` (`asr.compound_split`) | `room` enum + normalisation |
| `set_scene` and `apply_scene` both exist | `lint.tool_names` | One tool |
| Upstream hub call sleeps 1100 ms | `latency.tool`, `latency.first_audio` | Acknowledge fast, report state from cache |
