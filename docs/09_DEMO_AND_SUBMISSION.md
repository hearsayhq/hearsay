# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

The owner's script (30 Sep), checked against the servers: two lines changed to what the builds
really say (marked ¹). Judges may stop at 3:00. Narration: Kokoro-82M, voice `am_michael`, run
locally and mastered (build/voice); rendered with Remotion in `video/` (outside the workspaces).
Every product shot is the real product: recorded clips, or the console's own components rendering
data from real runs.

| Time | Picture | Narration |
|---|---|---|
| 0:00 | Title card "Hearsay", cut to the terminal: `hearsay run` goes red | "Twenty thousand people are building for Amazon's new assistant right now. Somebody has to check all of that. That's you. So I built something for you." (on screen: "Alexa+") |
| 0:12 | Logo and tagline: "Preflight checks for Alexa+ MCP servers. Never act on hearsay." | "This is Hearsay. It tests what happens when a real person talks to your add-on." |
| 0:20 | Console, Household Orders flawed build: said "add fifteen dollars of fruit", on screen "heard: fifty"; the add-on answers "Added."; later a "no" to the order, and the order goes through | "Here's a grocery add-on. The customer says fifteen. The assistant hears fifty. The add-on says 'Added.' Fifty dollars of fruit, and nobody heard the amount. Then the customer says no to the order, and it goes through anyway. In a chat window you'd see it. Out loud, your customer never does."¹ |
| 0:40 | CLI report grouped by the four questions, the `amazon-fr` sources highlighted, exit 1 | "Hearsay catches both. Every finding answers one of four questions a listener would ask: Did it hear me right? Do I have to wait? Can I listen to this? Did I agree? And each one cites the rule it breaks: Amazon's add-on requirements, or the MCP spec." |
| 0:55 | Claude Code calls `hearsay_run`, all red → edits in `src/` → `hearsay_run` again → green | "And you don't even have to run it yourself. Hearsay ships its own MCP server, so your coding agent can test your add-on, fix what it finds, and check again until it's green." |
| 1:15 | An expectation in the suite is edited → `suite.integrity` red | "It can't cheat. Your suite is locked, and Hearsay keeps test cases your agent never sees." |
| 1:25 | Two plain bars, "unseen cases" and "defects left behind"; caption "3 runs per arm · unseen cases written by the author of the flaws" | "We measured it. A suite alone made agents stop at green. So Hearsay now shows what your suite doesn't cover. Result: as good as a precise prompt on unseen cases, better on the rules nobody told the agent about, and zero defects left behind." (word for word from docs/15; numbers on screen only) |
| 1:45 | Console, Household Orders fixed (built with the kit) | "Consent is for your customers, not for you. Grant once, act freely within the limit, confirm only when money moves." |
| | "you can reorder groceries up to forty dollars today" → host dialog → Yes; "add fifteen dollars of fruit" → heard "fifty" → the add-on: "That would go over the total budget you gave me. You can add less, or give me a bigger budget."¹ | "Misheard fifty? Over the limit. Refused, out loud, in one sentence." |
| | "add two cartons of milk" → "Added two cartons of milk. Your cart is seven dollars and forty cents."; "place the order" → dialog "Place the order: two cartons of milk, seven dollars and forty cents?" → Decline | "Placing an order isn't something a tool can do. It only happens after the customer says yes to a question that names what and how much. Say no, and nothing moves." |
| 2:30 | GitHub pull request with the red check `hearsay / voice` → after the fix green; then the terminal: `npx @hearsayhq/cli run` | "It runs in CI, without API keys, and fails the pull request before your customers ever hear it. Hearsay is open source. Point it at your server." |
| 2:50 | End card: `hearsayhq/hearsay` · `npx @hearsayhq/cli` · "Unofficial. Not affiliated with or endorsed by Amazon." | |

¹ Changed from the draft: the flawed Household Orders never reads JSON (Smart Home's flawed build
does); it answers "Added." without the amount, ignores the limit and places the order on a "no".
The refusal is the mandate's own sentence (`packages/mandate/src/policy.ts`).

Production notes:
- Subtitles from second 0, burned in (many watch without sound).
- Wake word: the narration never says "Alexa"; "Alexa+" appears only on screen.
- The participant count comes from Devpost on the day of recording (30 Sep: 21,798, all tracks;
  check the wording if the count is not for the Alexa+ track alone). From 25,000 say "twenty-five
  thousand".
- Terminal shots are recorded in a fresh clone named `hearsay`, so paths and titles match the repo.
- Experiment numbers only on screen; the narration says the short form.
- No music or material without rights: sound effects and music from the owner's Splice licence.

Clips for this script:

| # | Clip | Status |
|---|---|---|
| 1 | Terminal: Household Orders flawed, red, grouped by question, exit 1 (0:00, 0:40) | to record (`m2-smart-home-red-green` exists for Smart Home) |
| 2 | Console: Household Orders flawed, "fifteen" heard "fifty", "Added.", order placed on a "no" (0:20) | to record |
| 3 | Claude Code fix loop, red → green (0:55) | exists: `m2b-agent-loop` |
| 4 | Suite edited → `suite.integrity` red (1:15) | exists: `m2b-cheat` |
| 5 | Experiment bars (1:25) | rendered in `video/` from docs/15 |
| 6 | Console: Household Orders fixed, grant, misheard fifty refused, milk, decline (1:45) | to record (`m5-console` is stale) |
| 7 | GitHub pull request, check `hearsay / voice` red → green (2:30) | to record: needs the workflow and a pull request that breaks a server, then fixes it |

## Clips per gate

Record right after each gate, while it is green. Terminal clips with `asciinema rec --headless`
(asciinema 3; works without a terminal, so the agent can record them); browser clips as a screen recording at 1080p. Keep each under
60 seconds, English, no personal data, no API keys on screen. Save to `clips/` (gitignored) as
`m<N>-<slug>.cast` or `.mp4`, and add one line to `clips/INDEX.md`: file, gate, what it shows,
which video line it serves.

| Gate | Clip | Shows |
|---|---|---|
| M1 | `m1-kitchen-green` | `npm run server:kitchen` in one pane, `hearsay run suites/kitchen.yaml` in the other: green, skipped checks listed, report path |
| M2 | `m2-smart-home-red-green` | flawed run red with findings by question → `HEARSAY_FIXED=1` → green, exit codes shown |
| M2b | `m2b-cheat` | an edit to an expectation in `suites/smart-home.yaml` after `hearsay lock` → `suite.integrity` error, run red |
| M2b | `m2b-agent-loop` | `scripts/agent-loop.sh`: a fresh Claude Code session (no shell) with the Hearsay MCP server and `fix-hearsay-findings` turns Smart Home flawed green, fixes in server code only, reruns `only: "failed"`, full run green; `suites/` untouched |
| M3 | `m3-hearing` | "livingroom" `asr.robust` red → fixed green; replay run twice with the network off; `gen-variants` writing the variants file |
| M4 | `m4-consent` | fifteen → fifty refused; decline → nothing committed; verbal path graded warn |
| M5 | `m5-console` | browser: Kitchen timer spoken, Household Orders elicitation modal, timeline and findings updating |
| M6 | `m6-fresh-clone` | fresh clone → `npm ci` → first green run, sped up, clock visible |
| M6 | `m6-experiment` | the experiment table from docs/15 |

## Devpost fields

- **Track:** Alexa+ (the simulated-experience path is explicitly allowed; the repo contains MCP
  servers on spec 2025-11-25 over Streamable HTTP and an MCP client that calls them).
- **Mini challenges:** enter both; only one can be won.
  - *AWS Builder:* Bedrock Converse powers the llm orchestrator; Polly and Transcribe power
    `gen-variants`. Describe both in the feedback answer.
  - *Open Source* (definition pending clarification, R-02): a contribution to an existing public
    repository, made in the window: a PR to
    AlSayedGamal/mcp-voice-simulator adding form elicitation as a spoken confirmation that fails
    closed (issue first; trace export optional). Plan B: an MCP transport for
    sujitnoronha/voicecheck so `tool_called` sees MCP calls. Fields: contribution URL, repo URL,
    GitHub username, what it does, how it works, why it matters.
- **Description:** what it does, how it works, the four questions, the catalog, the consent tiers.
  Hearsay itself is an MCP server and an Agent Skill, the same form as Amazon's own developer
  tools, so a coding agent can check the add-on it is building.
- **Existing work:** the mandate model and `authorize()` are adapted from the author's WebMCP
  Mandate Compiler (winner, OpenAI WebMCP Challenge 2026). The rules require pre-existing work to
  be significantly updated in the window with a before/after: show records × fields → tools ×
  resources × spending limits, spoken refusals, optional version with cart-line stamps, principal
  binding, consent tiers. Everything else is new in the submission window. Say this plainly.
- **Product feedback:** per tool used (MCP SDK, Bedrock, Polly, Transcribe, Alexa+ docs, Devpost
  resources): used for, worked, needs work, onboarding, would build again.
- **Feature requests:** optional; take them from the friction log.
- **Friction log:** docs/FRICTION_LOG.md, up to 10 % judging bonus.

## Repository at submission

The repo is `hearsayhq/hearsay`. Either public with the MIT LICENSE, or private and shared with
`chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar` and `testing@devpost.com`.
Invitations expire after 7 days: add them on submission day, not before.

## Checklist

- [ ] Video < 3:00, English, public, no third-party music or footage
- [ ] Repo runs from a fresh clone per README, no keys
- [ ] Track and both mini challenges selected, Open Source fields filled
- [ ] Existing-work disclosure with before/after
- [ ] Product feedback for every tool
- [ ] Friction log linked
- [ ] Repo public or reviewers invited (same day)
- [ ] Not implying Amazon endorsement anywhere ("for Alexa+", "unofficial")
