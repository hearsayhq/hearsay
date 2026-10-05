# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Film v5, the use-case cut (approved by the owner, 5 Oct): 2:35, 3840×2160 at 60 fps with
Remotion (`video/src/film5/`, composition `Film5`). It replaces v4 (the infomercial cut, kept in
`video/src/film4/`) after two blind reviews of v4: a reviewer given only the video and the judging
criteria could not tell it was an Alexa+ entry, never heard the product, and found the measured
results and the jargon unconvincing. v5 pitches one concrete use case, never says the wake word
("Amazon's voice assistant" in the narration, "Alexa+" large on screen), and lets the customer and
the add-on speak with Amazon Polly, word for word from the real runs (`video/voice/polly-v5.json`).
Narration: OpenAI gpt-4o-mini-tts, voice alloy, whole takes only (`video/voice/film-v5.json`); word
timings from whisper (`video/voice/align.mjs`).

| Time | Picture | Narration / sound |
|---|---|---|
| 0:00 a use case | "Your grocery add-on for Alexa+"; the add-on (groceries, up to $50 a day); speech bubbles; the cart with fruit at $50; "tested by typing: fine" | "You've built a grocery add-on for Amazon's voice assistant. A customer says:" 🔊 Polly, customer: "Add fifteen dollars of fruit." "Say the assistant hears fifty. Your add-on answers:" 🔊 Polly, the flawed build's real reply: "Added." "Fifty dollars of fruit, and nobody noticed. When you tested it by typing, this never came up." |
| 0:19 what it is | HEARSAY wordmark; "Preflight checks for Alexa+ add-ons"; "An Alexa+ add-on is an MCP server you host · MCP 2025-11-25 · Streamable HTTP · the part you write"; the said and misheard lanes; "checks every reply", "fails the build" | "This is Hearsay. An add-on is an MCP server: the part you write. Hearsay plays what customers say against it, as said and misheard, checks every reply, and fails the build before it goes wrong out loud." |
| 0:32 how it works | Four steps (speech → text, model picks a tool, your server, reply spoken), "Alexa+" under three, "your code" under the server; Hearsay's frame over the first two and the last; where the mishearings come from; stamps: no microphone, no API keys, same result every time | "The assistant listens, picks a tool, calls your server, and speaks the reply. Hearsay plays the assistant's part from your test: the words, the mishearings, and the tool call you expect. Then it checks what your server says back. No microphone, no API keys, the same result every time." |
| 0:51 the rules | Five cards: ≤ ½ s per tool call, < 30 s to read a reply aloud, no code read aloud, ≤ 5 options, what + how much before any payment; the fixed build's real question | "Replies are graded by the rules Amazon published for add-ons: half a second per tool call, short replies, no code read aloud, five options at most, and no payment without naming what and how much." |
| 1:04 a real run | Tape `orders-flawed-4k`, uncut, real time, SHA and date in the prompt; plain captions over the findings ("Heard fifty. Added fifty. Never said the amount back." / "The customer said no. The order was placed anyway." / "Asked 'Are you sure?' without saying what or how much."); stamp "Build fails · 20 problems found" | "Here's a real run against our demo grocery add-on, built with these flaws on purpose. The customer allowed fifty dollars of groceries today. Fifty dollars of fruit, added without a word. A no that placed the order anyway. Twenty problems: the build fails." |
| 1:24 the fix | Tape `orders-fixed-4k`; the reply card while the reply plays; "Zero errors" | "The fixed add-on, same tests. It checks every amount against that budget, and says why it won't:" 🔊 Polly, the fixed build's real reply: "That would go over the total budget you gave me. You can add less, or give me a bigger budget." "Zero errors." |
| 1:37 on every change | github.com, logged out, in a browser frame with the real address: pull request #27's commits (the change ✗ 0/2, the fix ✓ 2/2), the failed job with ✗ on the Household Orders step, the failing log line (read with gh from tape `ci-pr27-4k`, since GitHub shows logs only after a sign-in), the green job | "Hearsay runs on every code change. On GitHub, this change let fifty dollars of fruit slip past the budget. Hearsay failed the check. One fix, and it passes." |
| 1:52 for coding agents | "Hearsay · an MCP server + two Agent Skills" → "your coding agent"; the recorded Claude Code session at main 3cc07c5 (10×, labelled): 17 errors → RED → fixes in the add-on's code → GREEN, tests untouched | "Hearsay is an MCP server itself, with two Agent Skills. Your coding agent uses them to draft tests for you to review, run them, fix your code, and run them again until they pass, without changing your tests." |
| 2:07 locked tests | Tape `cheat-4k`: a locked test edited from 15 to 50 → the integrity error → stamp "Run fails" | "And it can't cheat: your tests are locked. Change one, and the run fails." |
| 2:17 try it | Open source · MIT, no API keys, no account; tape `clone-v5` (fresh clone at main 3cc07c5, install at 2×, labelled, the run at real time: 0 errors, exit 0); tagline; end card: "Preflight checks for Alexa+ add-ons", github.com/hearsayhq/hearsay, `npx @hearsayhq/cli` | "Hearsay is open source. No keys, no account. Clone it, and your first run takes a minute. Hearsay. Hear it before your customers do." |

Fine print names the tape, page or session and the commit in every scene; the first and the last
say "Unofficial. Not affiliated with or endorsed by Amazon." and "Narration is AI-generated."

Changes from v4 (owner, 5 Oct, after the blind reviews): Alexa+ and "an add-on is an MCP server"
in the first 30 seconds; the customer and the add-on are heard; the budget is introduced before
the fix relies on it; the measurement scene is dropped (it stays in the README, Devpost and
docs/15 with its context); no "But wait, there's more" and no price gag; plain words ("problems",
"passes", "every code change") instead of exit codes, suites and pull requests; the old agent
session (which still listed four planned checks) and the clone tape (a garbled prompt) recorded
again.

### Proof of function (required for the video)

1. Every scene that shows Hearsay's results is a real run: no rebuilt terminal output, no mocked
   screenshots. VHS tapes really run their commands; the tapes live in the repo (`video/tapes/`).
2. At least one scene is uncut: command → red output → exit 1, with the commit SHA and the date
   visible in the terminal.
3. CI is shown for real: pull request #27's pages on github.com as anyone sees them (logged out, the
   address in view), red on the change and green after the fix, and the failing log line, read with
   gh because GitHub shows logs only after a sign-in. The pull request stays reachable after
   submission; its link goes into the Devpost description and the README.
4. Speed-ups only for installs and the agent loop, always labelled ("2×", "4×"). Results are never
   sped up or cut.
5. A README section "Demo: run what the video shows" lists the exact commands and the commit SHA
   for every scene (suites, flawed and fixed servers, seed), so a judge gets the same numbers.
6. Generated clips (B-roll) never show product output. Product scenes are real recordings only.
7. Before rendering, the numbers in the video (error counts, exit codes) are taken from the actual
   runs, not from the script. If "Twenty errors" no longer holds, the sentence changes, not the run.

Production notes: subtitles from second 0, for every voice; the narration never says the wake
word, "Alexa+" only on screen. Music (`video/sound/make-bed-v5.ts`) and effects
(`video/sound/make-sound.mjs`) are synthesised, so there is nothing to license, and duck under every
voice; the final mix is −14 LUFS. Rebuild from `video/`:

```sh
node sound/make-sound.mjs && npx tsx sound/make-bed-v5.ts
node --env-file=.env voice/make-dialogue.mjs voice/film-v5.json && node --env-file=.env voice/align.mjs voice/film-v5.json
AWS_PROFILE=<yours> node voice/make-polly.mjs voice/polly-v5.json
node record/ci-github.mjs                                   # github.com pages, logged out
CLONE_PARENT=<an empty folder named fresh> vhs tapes/clone-v5.tape
asciinema rec --headless --window-size 140x45 -c "../scripts/agent-loop.sh <workspace>" out/tapes/agent-loop-v5.cast   # one agent run
npx remotion render src/index.ts Film5 out/hearsay-v5-4k.mp4 --scale=2 --crf=14 --x264-preset=slow --jpeg-quality=100 --color-space=bt709
```

The agent cast has the home folder replaced by `~/hearsay` before `agg` turns it into
`public/clips/v5/agent-loop.mp4`; the v4 tapes go into `public/clips/v4/` (see README → Demo).

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
    GitHub username, what it does, how it works, why it matters. Contribution URL:
    https://github.com/AlSayedGamal/mcp-voice-simulator/pull/9 (issue #8 first, 30 Sep).
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
- [x] Repo public or reviewers invited (public since 5 Oct 2026)
- [ ] Not implying Amazon endorsement anywhere ("for Alexa+", "unofficial")
