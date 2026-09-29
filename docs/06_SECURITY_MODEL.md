# Security model

Carried over from the WebMCP Mandate Compiler and adapted to a voice host. The principle does not
change:

> **A schema communicates authority. It never confers it.**

Tool lists and enums narrowed to a mandate are a courtesy to a well-behaved model. The boundary
is `authorize()` in `@hearsayhq/mandate`, called by the server on every mandate-scoped call.

## Actors

- **Person** — speaks, grants and revokes, answers confirmations.
- **Host** (Alexa+ or the engine's stand-in) — renders elicitations to the person. Trusted to
  render them faithfully; that is the one trust assumption of the strong consent path.
- **Model** — picks tools and fills arguments. Untrusted: it can ignore schemas, mishear, follow
  injected text, or claim the person said yes.
- **Server** — enforces the mandate. The only place authority is decided.

## Principal (D-009)

A mandate belongs to a principal: the account behind the bearer token (Alexa+ requires account
linking), not the MCP session, whose lifetime Alexa+ does not specify (friction log #4). "Up to
fifty dollars today" must survive a new session of the same person and must be invisible to
anyone else (`mandate.principal_bound`). Reference servers map a bearer token to a principal
without an OAuth server of their own; in tests each case × variant is a new principal.

## Invariant

> No tool commits on its own. A commit happens through an accepted elicitation, or, only when the
> client lacks elicitation, through a single-use token the server issued after speaking items and
> amount (graded warn). Never add a tool that edits limits or answers elicitations.

## Consent tiers

| Tier | When | How it commits | `consent.path` |
|---|---|---|---|
| Strong | client declared elicitation | the server sends `elicitation/create` stating items and amount; only `accept` commits | pass |
| Verbal | client did not declare elicitation | the request tool returns a spoken question and a token bound to items and amount, ≤ 60 s, single-use; `confirmTool(token)` commits | warn |
| Fail closed | client has no elicitation, server has no verbal path | nothing commits; the server says so | info |
| None | — | anything commits without either | error |

Using the verbal path although the client can elicit is a warn: the server chose the weaker path.

Why verbal is only a warn: in the strong tier the *host* asks the person and the model never sees
the answer. In the verbal tier the model hears "yes" and calls `confirmTool` — and a model can
hallucinate a yes, mis-attribute one, or be talked into one by injected text. This is the WebMCP
lesson in a new form: there, an agent could press the page's Apply button and the page could not
tell. The token bounds the damage (exact items, exact amount, one use, one minute), and the
spoken question states both, but it cannot prove a person said yes.

Amazon's example handshake declares no elicitation capability (friction log #2). Until that is
settled, the reference server implements both tiers and Hearsay grades them honestly.

## Lifecycle

1. The person states intent. The model fills `mandate_propose` (resources, per-call and total
   limit, duration). Nothing is granted yet.
2. The server reads the compiled scope back through a confirmation (strong or verbal). The model
   cannot answer an elicitation; the host asks the person.
3. Accept → mandate ACTIVE, version 1. Decline → nothing happens.
4. Scoped calls pass `authorize()` in this order: exists → alive → same version (if the caller
   named one) → tool → resource → per-call limit → total limit. Ordering gives the most useful
   spoken error.
5. Every staged cart line is stamped with the mandate version it was authorized under. At commit,
   every line is authorized again against the current mandate; a stale line never commits.
6. Consequential actions (placing an order) are never a tool's effect. A tool may *request* them;
   the server confirms; only the person's yes commits (see Invariant).
7. Revoke, narrow and expiry bump or end the version.

## Tool surface

- **Static tool list.** Alexa+ refreshes tool information only on deployment (friction log #3).
  Reference servers list every tool always; a tool without authority refuses with a spoken
  sentence (Amazon: every listed tool must be invocable). `tools/list_changed` is sent when the
  surface changes but nothing relies on it.
- **Enums are advertised, not enforced by the schema.** The input schema shows the mandate's SKUs
  as an enum, but the server validates loosely and lets `authorize()` refuse. Otherwise the SDK's
  input validation answers first, the person hears "MCP error -32602: Input validation error…",
  and the refusal code is lost (`protocol.refusal_as_result`, `mandate.schema_ignoring_caller`).

## Hearsay applies its own consent rule to its tests

A coding agent fixing a server has one cheap way to turn red into green: change the test. Hearsay
treats that like any consequential action.

- **Locked suites.** `hearsay lock` records a hash per suite; `suite.integrity` fails any run
  whose suites changed since. The lock is committed, so changing it shows in review.
- **Consent for suite changes.** On the MCP server, `hearsay_propose_suite_change(path, diff,
  reason)` changes nothing itself. It asks the person by elicitation, showing the diff in plain
  text; only an accept writes the suite and the lock. A client without elicitation gets a refusal
  (fail closed). No other tool writes suites.
- **Holdouts.** Cases the agent never sees (`--holdout`) decide whether a fix generalises.
- **Honest limit.** The lock detects, it does not prevent: an agent with a shell can edit a suite
  and run `hearsay lock` itself. That is visible in the diff of the committed lock, and the
  experiment (docs/15) counts such attempts with hashes kept outside the agent's workspace.

## What voice changes compared to WebMCP

| WebMCP finding | Behind a voice host |
|---|---|
| A browser agent can press the page's Apply button; the page cannot tell. | With elicitation there is no button: the host asks the person. Without it, the verbal token is the button, and it is graded as such. |
| Chrome cannot unregister tools; stale schemas linger. | Alexa+ refreshes tools on deployment only; stale schemas linger here too. Enforcement is per call. |
| Errors are read by a model. | Errors are also read to a person, so each has a `spoken` sentence. |
| — | Speech recognition changes amounts. Limits are enforced on the server, and amounts are read back in the confirmation (`consent.misheard_amount`). |

## Honest limits

- **Voice is not identity.** Whoever is in the room can say "yes". Hearsay bounds *what* can
  happen, not *who* agreed. Voice ID is the host's job and out of scope.
- **Elicitation trusts the host.** If a host let the model answer elicitations, the strong tier
  would collapse into the verbal one. Hearsay tests the server; it cannot test Alexa+ itself.
- **The verbal tier trusts the model.** See Consent tiers.
- **The engine's person is simulated.** Tests prove the server refuses without consent; they do
  not prove a real person understood the question. `consent.states_details` checks that the
  question states amount and items, which is a proxy.
- **Prompt injection is contained, not prevented.** Injected text can still make a model *say*
  odd things; it cannot widen scope (`mandate.injection`).
