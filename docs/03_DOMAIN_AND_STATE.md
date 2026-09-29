# Domain and state

Code is the source of truth for shapes: `packages/engine/src/{trace,report,suite,orchestrator,catalog}.ts`
and `packages/mandate/src/types.ts`. This file explains why they look the way they do.

## Suite → case → variant → trace

- A **suite** targets one server and sets budgets, the latency model and default checks.
- A **case** is one thing a person says (or several turns, llm and replay mode only), what should
  happen, how the simulated person answers confirmations, and what the client declares.
- A **variant** is the case as heard: `clean`, or one output of a perturbation
  (`asr.number_confusion#1`). Every case runs once per variant.
- A **trace** is one variant's run: server info, principal, client capabilities, and a list of
  **turns**, each with spans, tool calls, elicitations and the spoken reply.
- A **finding** is one check's verdict with severity, question, source, evidence and hint. A
  case × variant passes when it has no error findings.

## Session isolation and principal (D-003, D-009)

Each case × variant gets a fresh MCP session **and a fresh principal**: the engine sends
`Authorization: Bearer hs-test-<uuid>`. If the case declares `after: [a, b]`, those cases run
first, in order, in the same session and as the same principal. Setup turns are traced (visible in
the console) but their findings are attributed to the setup case, not re-reported. The case's
`client` setting applies to the whole session, including the `after` chain.

Consequence for servers: per-person state is keyed by principal, not by `Mcp-Session-Id`. Alexa+
derives its session from the customer's earlier conversations rather than an explicit id
(friction log #4) and requires account linking, so the authenticated principal is the stable key.
Reference servers map the bearer token to a principal without validating it (no OAuth server of
our own) and fall back to the session id when no token is sent.

## Expectations

`case.expect` judges these fields (docs/05):

| Field | Meaning |
|---|---|
| `tool` | Some call in the turn names this tool. |
| `args` | Subset match against the first call to `tool`, after normalisation (case, whitespace, number types). |
| `argsMustNotContain` | No call in the turn carries any of these argument values (e.g. `room: all`). |
| `noTool` | The assistant should ask back instead of acting. |
| `refusal` | The server refuses with this code (mandate or domain error): an `isError` tool result whose `structuredContent.code` equals it, with a spoken sentence as text (`@hearsayhq/kit` `refuse()`). |
| `confirm: required` | The person is asked (elicitation or verbal question) before anything commits. `forbidden`: no confirmation for this harmless action. |
| `spokenIncludes` | Case-insensitive substrings of the spoken reply. |

Findings take the question of the failed field: `tool`, `args`, `argsMustNotContain`, `noTool` →
*Did it hear me right?*; `refusal`, `confirm` → *Did I agree?*; `spokenIncludes` → *Can I listen
to this?*

The simulated person: `human.answer` (accept / decline / cancel, default accept) answers every
confirmation in the session, by elicitation or by voice. `client.elicitation: false` makes the
engine declare no elicitation capability.

## Variants (D-015)

- **Utterance level.** A perturbation rewrites what was heard. In llm and replay mode the model
  plans from the heard text, so this tests the tool surface and the model together.
- **Argument level.** The scripted planner is literal: it passes what it heard. The perturbation's
  word diff is applied to argument values ("fifteen" → "fifty" turns `amountUsd: 15` into `50`;
  "living room" → "livingroom" turns `living_room` into `livingroom`; a number word heard as a
  non-number drops the argument). A variant that touches no argument value is not generated in
  scripted mode (no fake variants). `asr.self_correction` tests the planner, so it runs in llm and
  replay only.
- **How variants are judged.** `case.expect` judges the clean variant. Variants are judged by
  `asr.robust` and `consent.misheard_amount` against the clean run, and by all turn checks
  (latency, speak, …). In llm and replay mode, `argsMustNotContain` also applies to every
  variant; in scripted mode it cannot, because the literal planner passes the misheard value by
  construction.

## Money

Tool arguments carry money in major units with the unit in the name (`amountUsd: 15`,
`totalLimitUsd: 50`), because that is how people say it and how a model fills it. The mandate
stores minor units (`spentMinor`, `perCallMinor`). Reference servers convert at the tool
boundary. Staging checks the cart total, not only the new line, against the remaining budget.

## Latency model (D-004)

`first_audio = asr + plan + Σ tool + elicitation(0 in budget) + speak_ttfb`.

- **tool**: measured wall clock of `tools/call`.
- **plan**: measured in llm mode; replayed from the cassette's recorded duration in replay; 0 in
  scripted. So in scripted mode `latency.first_audio` is a lower bound.
- **asr** and **speak_ttfb**: modeled constants from the suite's `latencyModel` (defaults 300 ms
  and 200 ms), marked `modeled` on the span. The engine runs no speech pipeline in CI.

Elicitation time is the person thinking; it is shown but excluded from the budget.

## Mandate

See docs/06. The engine never holds a mandate itself; it observes a server's behaviour through
its tools, `mandate_status`, refusals, confirmations and elicitations.
