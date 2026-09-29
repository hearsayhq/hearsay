# Security model

Carried over from the WebMCP Mandate Compiler and adapted to a voice host. The principle does not
change:

> **A schema communicates authority. It never confers it.**

Tool lists and enums narrowed to a mandate are a courtesy to a well-behaved model. The boundary
is `authorize()` in `@earshot/mandate`, called by the server on every mandate-scoped call.

## Actors

- **Person** — speaks, grants and revokes, answers elicitations.
- **Host** (Alexa+ or the engine's stand-in) — renders elicitations to the person. Trusted to
  render them faithfully; that is the one trust assumption we make.
- **Model** — picks tools. Untrusted: it can ignore schemas, misread, or follow injected text.
- **Server** — enforces the mandate. The only place authority is decided.

## Lifecycle

1. The person states intent. `mandate_propose` compiles it into tools, resources, limits and an
   expiry. Nothing is granted yet.
2. The server confirms the compiled scope through `elicitation/create`. The model cannot answer an
   elicitation; the host asks the person.
3. Accept → mandate ACTIVE, version 1, `tools/list_changed`. Decline → nothing happens.
4. Scoped calls pass `authorize()` in this order: exists → alive → same version → tool → resource
   → per-call limit → total limit. Ordering gives the most useful spoken error.
5. Consequential actions (placing an order) are never a tool's effect. A tool may *request* them;
   the server elicits; only an accepted elicitation commits.
6. Revoke, narrow and expiry bump or end the version. In-flight calls get `POLICY_CHANGED`.

## What voice changes compared to WebMCP

| WebMCP finding | Behind a voice host |
|---|---|
| A browser agent can press the page's Apply button; the page cannot tell. | There is no button. Commit happens only through an elicitation the host renders. |
| Chrome cannot unregister tools; stale schemas linger. | `notifications/tools/list_changed` withdraws them. Enforcement still does not rely on it. |
| Errors are read by a model. | Errors are also read to a person, so each has a `spoken` sentence. |
| — | Speech recognition can change amounts. Limits are enforced on the server, and amounts are read back in the confirmation. |

## Honest limits

- **Voice is not identity.** Whoever is in the room can say "yes". Earshot bounds *what* can
  happen, not *who* agreed. Voice ID is the host's job and out of scope.
- **Elicitation trusts the host.** If a host let the model answer elicitations, the commit path
  would collapse. `mandate.commit_path` tests the server; it cannot test Alexa+ itself.
- **The engine's human is simulated.** Tests prove the server refuses without consent; they do not
  prove a real person understood the question. Confirmation texts are checked for stating amount
  and items (`mandate.asr_drift`), which is a proxy.
- **Prompt injection is contained, not prevented.** Injected text can still make a model *say*
  odd things; it cannot widen scope.
