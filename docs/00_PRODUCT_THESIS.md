# Product thesis

Hearsay: preflight checks for Alexa+ MCP servers. Never act on hearsay.
Unofficial. Built for Alexa+ add-on developers; not affiliated with or endorsed by Amazon.

In law, hearsay is a second-hand statement that doesn't count as evidence. Hearsay makes sure
your server never moves money on what the assistant only thinks it heard.

## The problem

Lisa builds a shopping add-on for Alexa+. In a chat client everything works. Spoken, three things
go wrong:

- "Add fifteen dollars of fruit" is heard as "fifty", and fifty dollars of fruit are ordered.
- The reply is JSON, and it is read aloud.
- Two seconds of silence, because one tool is slow.

She finds out in certification or from one-star reviews. Amazon's functional requirements for
add-ons rule out all three: tool round trips under 500 ms, no JSON, ids or tool names in anything
the customer hears, explicit verbal confirmation before a payment (docs/14). Amazon's Local
Inspector checks what a server declares, behind a Developer Console login. Nothing checks what
happens when a person talks to it.

## What Hearsay is

A crash test for voice add-ons. Before an MCP server meets real people, Hearsay plays through what
happens when someone talks to it: with mishearings, with waiting, with money. Where it breaks, the
pull request goes red.

1. Test runner (CLI). A suite says what a person says and what should happen. The runner plays
   it against the live server, clean and misheard, prints red or green, and runs in CI without
   API keys.
2. Rule catalog. Amazon's functional requirements as executable checks, plus consent rules from
   the WebMCP Mandate Compiler. Every finding names its source.
3. Console. Talk to a server and watch the timeline and findings. For debugging and the demo.

1 and 2 are the product. The console and the reference servers are packaging.

## Built for coding agents too

Hearsay itself is an MCP server and a set of Agent Skills — the same form as Amazon's own
developer tools. A coding agent building an add-on (Claude Code, Kiro) calls `hearsay_run` on
its server, reads findings that name the rule and the `@hearsayhq/kit` building block that fixes
them, changes only server code, and reruns until green. It cannot make itself green by editing
the tests: suites are locked (`suite.integrity` turns the run red), legitimate suite changes go
through normal pull requests, and holdout cases the agent never sees decide whether the fix is
real. No step of this asks the developer for anything.

## Four questions

Every check answers one question a listener would ask. Catalog, report, console, README and video
are organised by them.

| Question | Checks |
|---|---|
| Did it hear me right? | Misheard numbers, homophones, split compounds; tool names, descriptions and enums a model can map speech onto. |
| Do I have to wait? | Tool round trip; modeled time to first audio. |
| Can I listen to this? | No JSON, ids or tool names; short replies; at most five options; refusals as one sentence that says what to do. |
| Did I agree? | Payments, deletions and cancellations only after a confirmation that states what and how much. |

Precondition, not a fifth question: Can it connect? (protocol version, transport).

The first and the last question together are what nobody else tests: a misheard word must never
lead to a payment nobody agreed to.

> **Consent is for your customers, not for you.** Grant once, act freely within the limit, confirm
> only when money moves.

## Positioning

The Inspector checks what your server declares. Hearsay tests what happens when a person talks
to it, in CI, without a login.

| Tool | What it does | Relation to Hearsay |
|---|---|---|
| Alexa+ Local Inspector (Amazon) | Tool definitions, payloads, errors, latency, widget rendering; certification verdict; Developer Console login | Complement: what is declared vs. what happens when someone speaks |
| MCP Inspector, MCP Conformance | Interactive debugging; protocol conformance | Protocol, not voice |
| MCPJam Inspector, mcp-evals | Evals across clients; LLM-graded | No mishearing, no consent |
| mcp-voice-simulator, alexa-skill-mcp-bridge | Talk to a server through a stand-in Alexa+ | No assertions; usable as Hearsay orchestrators |
| VoiceCheck (sujitnoronha/voicecheck) | Real audio through LiveKit, Daily, VAPI, Retell; evaluators for latency, tone, leaks | Tests the voice pipeline; Hearsay tests the MCP server behind the assistant |
| Hamming, Coval, Cekura | End-to-end phone-agent QA | Voice pipeline, not the tool server |

## What it is not

- Not an Alexa+ simulator. It uses a stand-in orchestrator and says so.
- Not a replacement for Amazon's certification or Local Inspector.
- Not affiliated with or endorsed by Amazon.

## One sentence for the judges

A server that passes Hearsay is one you can put behind a voice assistant without hearing JSON,
waiting in silence, or paying for something you didn't agree to.
