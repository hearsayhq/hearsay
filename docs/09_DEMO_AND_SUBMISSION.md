# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Judges may stop at 3:00. Best material first. M7 only cuts: every shot comes from a gate clip
(§Clips per gate).

| Time | Shot | Line |
|---|---|---|
| 0:00 | Console, Household Orders: "add fifteen dollars of fruit" heard as "fifty" → `LIMIT_EXCEEDED`, spoken | "Speech recognition changes numbers. Hearsay makes sure that never turns into a payment nobody agreed to." |
| 0:20 | Four questions on screen; Local Inspector comparison line | "Amazon's Local Inspector checks what your server declares. Hearsay tests what happens when a person talks to it." |
| 0:35 | Smart Home flawed: JSON read aloud, "livingroom" misheard, whole house off without asking, 1.1 s tool | "This one works fine in a chat client. Spoken, it's broken. Every finding cites the rule it breaks." |
| 1:05 | Fix flag, rerun, green; CLI exit code; the PR check turns green | "Same suite in CI, deterministic, no API keys." |
| 1:25 | "place the order" → elicitation modal → decline → nothing committed | "No tool can buy anything. Only the person's yes, asked by the host, can." |
| 1:50 | Same with a client without elicitation: spoken question, token, warn | "Without elicitation, a model could hallucinate that yes. Hearsay says so." |
| 2:15 | `gen-variants`: Polly → phone line → Transcribe, the heard text in the suite | "Real mishearings, recorded once, replayed forever." |
| 2:35 | The agent loop (clip `m2b-agent-loop`), then the experiment's one sentence; catalog, repo, license | "Hearsay itself is an MCP server and Agent Skills: your coding agent runs it, fixes what it finds, and can't cheat by editing the tests. Open source, for Alexa+, unofficial." |

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
| M2b | `m2b-agent-loop` | a fresh Claude Code session with the Hearsay MCP server and `fix-hearsay-findings`: `hearsay_run` on Smart Home flawed, fixes in server code only, reruns `only: "failed"`, full run green; `git diff suites/` empty |
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
