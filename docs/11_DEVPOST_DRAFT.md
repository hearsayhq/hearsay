# Devpost text (draft)

Draft for M7; the owner edits and submits. Facts only from the repo; numbers as of 30 Sep 2026.

## Name and tagline

**Hearsay** — Preflight checks for Alexa+ MCP servers. Never act on hearsay.
Unofficial; built for Alexa+ add-on developers; not affiliated with or endorsed by Amazon.

## What it does

An Alexa+ add-on is an MCP server. In a chat client it may work fine; spoken, it breaks in
ways nobody sees until customers do: "fifteen dollars" is heard as "fifty", a reply of JSON is
read aloud, a slow tool leaves two seconds of silence, an order goes through on a yes nobody
said. Hearsay plays through what happens when a person talks to the server — clean and
misheard — and turns the pull request red where it breaks. Every check answers one of four
questions: Did it hear me right? Do I have to wait? Can I listen to this? Did I agree?

The Inspector checks what your server declares. Hearsay tests what happens when a person talks
to it, in CI, without a login.

## How it works

- **Suites** (YAML) say what a person says and what should happen. The runner connects over
  Streamable HTTP (MCP 2025-11-25), plays each case, and perturbs what was heard with seeded
  mishearings (number confusion, homophones, split compounds); a literal stand-in planner
  carries the misheard words into the tool arguments, so no model is needed in CI.
- **The catalog** turns Amazon's functional requirements for add-ons into executable checks
  (500 ms per tool call, replies a person can listen to, at most five options, actionable
  errors) and adds consent rules from the WebMCP Mandate Compiler. Every finding cites its
  source: Amazon, the MCP spec, or Hearsay's own rule.
- **Consent tiers:** a confirmation through MCP elicitation passes; a spoken question with a
  single-use token is graded weaker (warn); a server that fails closed without elicitation is
  informational; committing without asking is an error. A misheard amount must never commit.
- **For coding agents:** Hearsay is itself an MCP server with two Agent Skills
  (`write-hearsay-suite`, `fix-hearsay-findings`). A fresh Claude Code session with no shell
  turned the flawed Smart Home server green in about a minute for $0.35–0.44, changing server
  code only. It can't cheat: suites are locked (`suite.integrity`), and holdout cases live
  outside the repo.
- **`@hearsayhq/kit`:** the blocks every finding's fix names — `speak`, `refuse`, `looseEnum`,
  `looseInt`, `confirm`, `VerbalTokens`, `withMandate`, `serveMcp`.
- **Console:** talk to a server in the browser, hear the reply, answer its confirmation in a
  host dialog, and watch the timeline and findings per turn.
- **AWS:** Amazon Bedrock (Converse) drives the llm orchestrator and records replay cassettes;
  Amazon Polly and Amazon Transcribe record real mishearings over a telephone-band channel
  (`gen-variants`). *(Fill in once the recordings exist.)*

## How we built it

TypeScript throughout (MCP TypeScript SDK 1.31, zod 4, Hono, Vite + React), spec first: a docs pack
with requirement ids, a decision log and a risk register. A check counts as implemented only
with a fixture built to fail it. Three reference servers: Kitchen (what green looks like),
Smart Home (flawed by default; the kit applied makes it green) and Household Orders (a spending
permission behind a voice assistant).

## Challenges

- Whether Alexa+ supports elicitation is not documented, and Amazon's example handshake declares
  none, so consent had to be graded instead of assumed (friction log #2).
- The MCP SDK answers invalid input with "MCP error -32602" before the handler runs — which a
  person would hear. The kit advertises enums and bounds on a loose schema and refuses in words.
- Hearsay's own skill found two such bugs in our reference Kitchen server on its first draft.

## What we learned

The visible suite is not enough: agent-fixed servers passed their suite and still failed a
holdout case (the unknown-room reply did not say what it heard).

## What's next

See docs/ROADMAP.md: MCP 2026-07-28 `input_required` for the kit's `confirm()`, persona-driven
multi-turn goals, a composite GitHub Action.

## Existing work (disclosure)

The mandate model and `authorize()` are adapted from the author's WebMCP Mandate Compiler
(github.com/HarzerHeribert/webMCP, winner of the OpenAI WebMCP Challenge 2026), significantly
updated in the submission window:

| Before (WebMCP) | After (Hearsay) |
|---|---|
| Records × fields in a web form | Tools × resources × spending limits behind a voice assistant |
| Refusals for a UI | Refusals as one spoken sentence with a code |
| Version required | Version optional; stamped on each cart line and re-authorized at commit |
| Session-bound | Bound to the principal (bearer token), not the MCP session |
| One consent path | Consent tiers: elicitation, verbal token (warn), fail closed |

Everything else — engine, catalog, perturbations, console, kit, reference servers, MCP server
and skills — is new in the submission window.

## Open Source mini challenge

*(Pending R-02 and the owner's OK to post.)* A contribution to AlSayedGamal/mcp-voice-simulator:
opt-in form elicitation answered as a spoken confirmation that fails closed.
