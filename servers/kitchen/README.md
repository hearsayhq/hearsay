# Kitchen — the good example

Role in the demo: **what green looks like.** Every check in `suites/kitchen.yaml` passes. If it
does not, the engine or the server has a bug, and that is a test failure (docs/08).

| Tool | Annotations | Does |
|---|---|---|
| `timer_start` | `destructiveHint: false` | Start a named timer. `minutes` 1–240, `label` optional. Replies with the duration read back: "Pasta timer set for fifteen minutes." |
| `timer_list` | `readOnlyHint: true` | Active timers, spoken as "Two timers: pasta, 4 minutes left; egg, 1 minute left." |
| `timer_cancel` | `destructiveHint: true` | Cancel by `label` (optional). With several timers and no label, a refusal (`isError`, code `AMBIGUOUS`) that asks which one: "You have two timers, pasta and egg. Which one should I cancel?" |
| `recipe_step` | `readOnlyHint: true` | Read step `number` (1–7) of the recipe, one sentence. Stateless: reading never changes anything. |

Built with `@hearsayhq/kit` (`speak`, `refuse`, `serveMcp`). Design rules it demonstrates: replies of one sentence, values read back (so a misheard "fifty
minutes" is heard and can be corrected: `asr.robust` passes by read-back), no ids in text, errors
that say what to do, enums and bounds on every parameter, tool calls answer in < 50 ms. State is
keyed by principal (bearer token), falling back to the MCP session.
