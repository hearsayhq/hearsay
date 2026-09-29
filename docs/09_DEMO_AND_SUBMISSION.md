# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Judges may stop at 3:00. Best material first.

| Time | Shot | Line |
|---|---|---|
| 0:00 | Console, Kitchen connected, speak "set a pasta timer for twelve minutes" | "Alexa+ runs your MCP server by voice. Its simulator is partner-only. So how do you know your server works when nobody sees the screen?" |
| 0:15 | Timeline bars, budget line | "Earshot measures every millisecond of the spoken turn and judges the reply as something a person has to listen to." |
| 0:30 | Smart Home flawed: JSON read aloud, "livingroom" misheard, whole-house off without asking | "This one works fine in a chat client. Spoken, it's broken. Five findings, each with a fix." |
| 1:05 | Fix flag, rerun, green; CLI exit code 0; PR check | "Same suite runs in CI, deterministic, no API keys." |
| 1:25 | Household Orders: "reorder groceries up to fifty dollars today" → elicitation modal → tool list ticks | "Authority comes from a mandate the person grants, compiled into the tool surface and enforced on the server." |
| 1:50 | "add fifteen dollars of fruit" heard as fifty → LIMIT_EXCEEDED spoken; wine → out of scope; injected gift card ignored | "Speech recognition changes numbers. The mandate doesn't care what was heard." |
| 2:15 | "place the order" → elicitation → decline → nothing committed | "No tool can buy anything. Only the person's yes, rendered by the host, can." |
| 2:35 | Check catalog, repo, license | "Open source. Point it at your server." |

## Devpost fields

- **Track:** Alexa+ (simulated-experience path is explicitly allowed; the repo contains MCP
  servers on spec 2025-11-25 over Streamable HTTP and an MCP client that calls them).
- **Mini challenges:** enter both; only one can be won.
  - *AWS Builder:* Bedrock Converse API powers the llm orchestrator; describe it in the feedback
    answer. Polly if FR-043 lands.
  - *Open Source:* the rules ask for a **new, additional** open-source project or a contribution
    to a public repository, alongside the primary submission. Earshot itself may not count on its
    own. Plan one of: (a) publish `@earshot/mandate` as its own repo and package, (b) a PR to a
    community Alexa+ simulator or bridge that exports Earshot-compatible traces or runs as an
    Earshot orchestrator. Required fields: contribution URL, repo URL, GitHub username, what it
    does and why it matters.
- **Description:** what it does, how it works, the check catalog, the mandate model.
- **Existing work:** the mandate model and `authorize()` are adapted from the author's WebMCP
  Mandate Compiler (winner, OpenAI WebMCP Challenge 2026). Everything else is new in the
  submission window. Say this plainly.
- **Product feedback:** per tool used (MCP SDK, Bedrock, Alexa+ docs, Devpost resources): used for,
  worked, needs work, onboarding, would build again.
- **Feature requests:** optional; take them from the friction log.
- **Friction log:** docs/FRICTION_LOG.md, up to 10 % judging bonus.

## Repository at submission

Either public with the MIT LICENSE (already in the repo), or private and shared with
`chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar` and `testing@devpost.com`.
Invitations expire after 7 days: add them on submission day, not before.

## Checklist

- [ ] Video < 3:00, English, public, no third-party music or footage
- [ ] Repo runs from a fresh clone per README, no keys
- [ ] Track and both mini challenges selected, Open Source fields filled
- [ ] Existing-work disclosure
- [ ] Product feedback for every tool
- [ ] Friction log linked
- [ ] Repo public or reviewers invited (same day)
- [ ] Not implying Amazon endorsement anywhere ("for Alexa+", "unofficial")
