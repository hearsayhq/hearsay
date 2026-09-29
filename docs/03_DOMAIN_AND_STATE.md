# Domain and state

Code is the source of truth for shapes: `packages/engine/src/{trace,report,suite,orchestrator}.ts`
and `packages/mandate/src/types.ts`. This file explains why they look the way they do.

## Suite → case → variant → trace

- A **suite** targets one server and sets budgets and default checks.
- A **case** is one thing a person says (or several turns), what should happen, and how the
  simulated human answers elicitations.
- A **variant** is the case as heard: `clean`, or one output of a perturbation
  (`asr.number_confusion#1`). Every case runs once per variant.
- A **trace** is one variant's run: server info, and a list of **turns**, each with spans,
  tool calls, elicitations and the spoken reply.
- A **finding** is one check's verdict with evidence and a hint. A case×variant passes when it
  has no error findings.

## Session isolation (D-003)

Each case×variant gets a fresh MCP session. If the case declares `after: [grant-mandate]`, that
chain runs first in the same session. Setup turns are traced (visible in the console) but their
findings are attributed to the setup case, not re-reported. Consequence for servers: state must
be keyed by `Mcp-Session-Id`. All reference servers do this.

## Expectations

| Field | Meaning |
|---|---|
| `tool` + `args` | The first non-read tool call names this tool; `args` is a subset match after normalisation (case, whitespace, number types). |
| `noTool` | The assistant should ask back instead of acting (e.g. ambiguous or perturbed beyond recovery). |
| `refusal` | The server refuses with this code (mandate or domain error). |
| `confirm: required` | An elicitation happens before any consequential state change. `forbidden`: no elicitation for this harmless action. |
| `spokenIncludes` | Case-insensitive substrings of the spoken reply. |

`asr.robust` compares each variant to the clean run: same tool and args → pass; `noTool` with a
clarifying question → pass; a different tool or wrong args → error. "Asking back" is a pass
because it is the correct voice behaviour when hearing is uncertain.

## Latency model (D-004)

`first_audio = asr + plan + Σ tool + elicitation(0 in budget) + speak_ttfb`.

- **tool**: measured wall clock of `tools/call`.
- **plan**: measured in `llm` mode; replayed from the cassette's recorded duration in `replay`;
  `0` in `scripted`.
- **asr** and **speak_ttfb**: modeled constants (defaults 300 ms and 200 ms, suite-configurable),
  because the engine does not run a real speech pipeline in CI. The console measures the real
  ones when a microphone is used and shows both.

Elicitation time is the person thinking; it is shown but excluded from the budget.

## Mandate

See docs/06. The engine never holds a mandate itself; it observes a server's behaviour through
its tools, `mandate_status`, errors and elicitations.
