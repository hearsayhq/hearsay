# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Script v3 (owner, 30 Sep), voice-first. Corrected against the runs where the draft differed from
what the builds do (rule 7 below: the script follows the runs). Voices: OpenAI gpt-4o-mini-tts,
directed per line (`video/voice/film.json`); rendered with Remotion in `video/`.

| Time | Picture | Sound |
|---|---|---|
| 0:00 cold open | Generated still (B-roll): warm evening kitchen, groceries, an unbranded speaker with a small front LED (no light ring), slow push-in. Overlays from a real run of the flawed build ($40 permission): heard "add fifty dollars of fruit"; "order placed · $50.00" | CUSTOMER: Add fifteen dollars of fruit. · ADD-ON: Are you sure? · CUSTOMER: Yes. · ADD-ON: Added. · CUSTOMER: Place the order. · ADD-ON: Are you sure? · CUSTOMER: No! · ADD-ON: Order placed: fifty dollars of fruit, fifty dollars. |
| 0:10 intro | Card, text builds line by line | NARRATOR: That add-on works perfectly in a chat window. Over twenty thousand people signed up for this hackathon. Somebody has to check all of that. That's you. So I built something for you. |
| 0:22 what | Card: "Hearsay: preflight checks for Alexa+ MCP servers" | NARRATOR: This is Hearsay. You write what your customers say. Hearsay plays it against your add-on, clean and misheard, and fails the build when it would go wrong out loud. |
| 0:33 red | Tape (real run, uncut): prompt with branch and short SHA, `date`, `HEARSAY_FIXED=0 npm run server:orders &`, `npm run hearsay -- run suites/household-orders.yaml` against the flawed build; output grouped by the four questions; exit 1. Corner: "real run · uncut · <sha> · <date>". Highlight `consent.misheard_amount`, `consent.decline_holds` (Amazon requirement). Then the rules: 500 ms per tool · replies under 30 s · no JSON read aloud · at most 5 options · no payment without a question that names what and how much. Then the real GitHub Actions log of pull request #27: `hearsay / voice`, "Process completed with exit code 1", run URL | NARRATOR: Same add-on, now under Hearsay. Fifty instead of fifteen, and nobody asked. A "no" that placed the order anyway. Every finding cites the rule it breaks, and most are Amazon's own requirements for add-ons. Twenty errors. The pull request fails. |
| 0:54 coding agent | The recorded Claude Code session (clip `m2b-agent-loop`, 4×, labelled): `hearsay_run` red → edits in `src/` → green. Tape: an expectation edited → `suite.integrity` error | NARRATOR: You don't even have to fix it yourself. Hearsay is also an MCP server. Your coding agent runs it, fixes what it finds, and checks again. And it can't cheat. The suite is locked, and some cases it never gets to see. |
| 1:12 green | Generated still: the same kitchen, calm daylight (≤3 s), then a Playwright recording of the console on the fixed build; host dialogs. Then the Actions log of the fix commit on pull request #27: `hearsay / voice` ✓, run URL | NARRATOR: Same tests, fixed build. · CUSTOMER: You can reorder groceries up to forty dollars today. · [dialog: Allow me to reorder milk, eggs, bread, fruit, and oat milk, up to forty dollars in total, for today? → Allow] · CUSTOMER: Add fifteen dollars of fruit. [heard: fifty] · ADD-ON: That would go over the total budget you gave me. You can add less, or give me a bigger budget. · CUSTOMER: Add two cartons of milk. · ADD-ON: Added two cartons of milk. Your cart is seven dollars and forty cents. · CUSTOMER: Place the order. · ADD-ON: Place the order: two cartons of milk, seven dollars and forty cents? · CUSTOMER: Not yet. · ADD-ON: Okay, I did not place the order. Your cart is still there. · NARRATOR: Grant once, act within the limit, and money only moves after a yes that names what and how much. |
| 1:58 how | Diagram: speech → [Amazon: speech recognition + the model] → your tool; Hearsay replaces the bracket with your test cases and their mishearings | NARRATOR: Hearsay stands in for the parts Amazon runs, speech recognition and the model, straight from your test cases. No microphone, no API keys, the same result every time. So it runs on every pull request. |
| 2:15 proof | Two bars (docs/15): runs that ended with visible errors, 0 of 36 with Hearsay · 11 of 27 without; unseen cases: level with a precise prompt (83.7 % against 82.9 %). Footnote: 3 runs per arm · unseen cases written by the author of the flaws · of the four Hearsay arms in the 36, three did worse on unseen cases than the precise prompt; only the current one (coverage and review) is level | NARRATOR: We measured it with coding agents. A suite alone made them stop at green, so Hearsay now shows what your suite doesn't cover. Now they leave zero defects behind, and do better on the rules nobody told them about. |
| 2:35 close | Tape (real run, one take): fresh clone → `npm ci` (2×, labelled) → `npm run hearsay -- run suites/kitchen.yaml` → "0 errors · 1 warning · 0 of 8 runs failed", exit 0. End card over an animated background: hearsayhq/hearsay · npx @hearsayhq/cli · "Unofficial. Not affiliated with or endorsed by Amazon." · "Voices and B-roll are AI-generated." · "Reproduce this video: see README → Demo" | NARRATOR: Everything you saw is a real run, and you can repeat it with one command. Hearsay is open source. Point it at your add-on, before your customers do. |

Corrections to the draft (30 Sep), all from runs: the flawed build answers "Are you sure?" before
adding, handles a "no" while adding correctly, and places the order after a "no" at checkout
("Order placed: fifty dollars of fruit, fifty dollars."), so the cold open shows that, with $50.00
rather than $57.40; the add-on's lines are its real, full sentences; commands are
`npm run hearsay -- …` in the repo (`npx hearsay` is an unrelated package, and `npx @hearsayhq/cli`
exists only after publishing); Kitchen ends with one coverage warning, not "no findings"; the
proof bars say what "defects" counts; the B-roll speaker has no light ring. Sora's API was shut
down on 24 Sep 2026, so the B-roll is stills from OpenAI's image model with a slow push-in.

### Proof of function (required for the video)

1. Every scene that shows Hearsay's results is a real run: no rebuilt terminal output, no mocked
   screenshots. VHS tapes really run their commands; the tapes live in the repo (`video/tapes/`).
2. At least one scene is uncut: command → red output → exit 1, with the commit SHA and the date
   visible in the terminal.
3. CI is shown for real: the GitHub Actions log of the actual pull request run, red (exit code 1)
   and green after the fix, with the run URL on screen. The pull request stays reachable after
   submission; its link goes into the Devpost description and the README.
4. Speed-ups only for installs and the agent loop, always labelled ("2×", "4×"). Results are never
   sped up or cut.
5. A README section "Demo: reproduce this video" lists the exact commands and the commit SHA for
   every scene (suites, flawed and fixed servers, seed).
6. Generated clips (B-roll) never show product output. Product scenes are real recordings only.
7. Before rendering, the numbers in the video (error counts, exit codes) are taken from the actual
   runs, not from the script. If "Twenty errors" no longer holds, the sentence changes, not the run.

Production notes: subtitles from second 0; the narration never says the wake word, "Alexa+" only
on screen; 21,798 is the whole hackathon's Devpost count on 30 Sep; no music or material without
rights (sound from the owner's Splice licence).

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
