# Kitchen — the good example

Role in the demo: **what green looks like.** Every check in `suites/kitchen.yaml` passes. If it
does not, the engine or the server has a bug, and that is a test failure (docs/08).

| Tool | Annotations | Does |
|---|---|---|
| `timer_start` | — | Start a named timer. `minutes` 1–240, `label` optional. |
| `timer_list` | readOnly | Active timers, spoken as "two timers: pasta, 4 minutes left; eggs, 1 minute left". |
| `timer_cancel` | destructive | Cancel by label. Ambiguous label → error that asks which one. |
| `recipe_next_step` | readOnly | Next step of the active recipe, one sentence. |

Design rules it demonstrates: replies ≤ 1 sentence, no ids in text, errors that say what to do,
enums/bounds on every parameter, tool calls answer in < 50 ms.
