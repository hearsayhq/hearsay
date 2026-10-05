# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Film v5.2, the use-case cut (approved by the owner, 5 Oct): 2:56, 3840×2160 at 60 fps with
Remotion (`video/src/film5/`, composition `Film5`). It replaces v4 (the infomercial cut, kept in
`video/src/film4/`) after blind reviews: a reviewer given only the video and the judging criteria
could not tell v4 was an Alexa+ entry, never heard the product, and found the measured results and
the jargon unconvincing; a second round on v5 asked for the story's ending to match its start, the
two MCP servers told apart, fewer scrolling walls, and the npm packages as the way to use it; a
third on v5.1 for fix lines that match the replies, the model mode that tests tool choice, the MCP
call itself, and cards and the end card held longer. v5.2
says in its first sentence what Hearsay is, then tells one example; it never says the wake word
("Amazon's voice assistant" in the narration; "Alexa+" large on screen and in a pill for the whole
film); the customer and the add-on speak with Amazon Polly, word for word from the real runs
(`video/voice/polly-v5.json`). Narration: OpenAI gpt-4o-mini-tts, voice alloy, whole takes only
(`video/voice/film-v5.json`); word timings from whisper (`video/voice/align.mjs`). Rules for the
cut: every caption and card stays at least 2.5 s, the camera zooms at most about 1.8× and moves
slowly, no card enters while the camera moves.

| Time | Picture | Narration / sound |
|---|---|---|
| 0:00 what it is, then an example | HEARSAY wordmark, "Preflight checks for Alexa+ add-ons", "a crash test, so they don't go wrong out loud"; then "AN EXAMPLE · A grocery add-on for Alexa+"; the add-on (groceries, up to $50 a day); speech bubbles; the cart with fruit at $50; "tested by typing: fine" | "This is Hearsay: a crash test for voice add-ons, so they don't go wrong out loud. Here's an example. You've built a grocery add-on for Amazon's voice assistant. A customer says:" 🔊 Polly, customer: "Add fifteen dollars of fruit." "Say the assistant hears fifty. Your add-on answers:" 🔊 Polly, the flawed build's real reply: "Added." "Fifty dollars of fruit, and nobody noticed. When you tested it by typing, this never came up." |
| 0:25 how Hearsay catches it | "An Alexa+ add-on is an MCP server you host · a small web service that gives the assistant tools, like 'add to cart' · MCP 2025-11-25 · Streamable HTTP · the part you write"; the said and misheard lanes; "checks every reply", "fails the build" | "Hearsay catches this. An add-on is an MCP server: a small web service that gives the assistant tools, like add to cart. It's the part you write. Hearsay plays what customers say against it, as said and misheard, checks every reply, and fails the build when something would go wrong out loud." |
| 0:42 how it works | Four steps (speech → text, model picks a tool, your server, answer spoken), "Alexa+" under three, "your code" under the server; Hearsay's frame over the first two and the last; the MCP call in the server (→ tools/call orders_stage_cart, ← "Added."); where the mishearings come from; "or a model picks the tool: from your tool descriptions (Bedrock); recorded once, then replayed without keys"; stamps: no microphone, no API keys, same result every time; "so it runs on every change" | "The assistant listens, picks a tool, calls your server, and answers from what it returns. Hearsay plays the assistant's part from your test: the words, the mishearings, and the tool call you expect, or lets a model pick it from your tool descriptions. Then it checks what your server says back. No microphone, no API keys, and the same result every time, so it can run on every change." |
| 1:06 the rules | Five cards: ≤ ½ s per tool call, < 30 s to read a reply aloud, no code read aloud, ≤ 5 options, what + how much before any payment; the fixed build's real question | "Replies are graded by the rules Amazon published for add-ons: half a second per tool call, short replies, no code read aloud, five options at most, and no payment without naming what and how much." |
| 1:19 a real run | Tape `orders-flawed-4k`, one take, real time from the run command on (the date and the flawed server's start already on screen), SHA in the prompt; when the output lands, the terminal dims under one card, "What Hearsay found · 3 of 20 errors": "Heard fifty. Added fifty. Never said the amount back." / "The customer said no. The order was placed anyway." / "Asked 'Are you sure?' without saying what or how much."; then the totals line and "Build fails · 20 errors" | "Here's a real run against our demo grocery add-on, built with these flaws on purpose. The customer allowed fifty dollars of groceries today. Fifty dollars of fruit, added without a word. A no that placed the order anyway. Twenty errors: the build fails." |
| 1:37 the fix | Tape `orders-fixed-4k`; two reply cards while the replies play; "Zero errors" | "The fixed add-on, same tests. When it adds, it says the amount back:" 🔊 Polly, the fixed build's real reply to fifteen: "Added fifteen dollars of fruit. Your cart is twenty-two dollars and forty cents." "And if it hears fifty, the cart would go over the fifty-dollar budget, so it refuses, and says why:" 🔊 its real reply to fifty: "That would go over the total budget you gave me. You can add less, or give me a bigger budget." "Zero errors." |
| 2:01 on every change | github.com, logged out, in a browser frame with the real address: pull request #27's commits (the change ✗ 0/2, the fix ✓ 2/2; the header of the closed demo pull request cropped out), "in your repo · one step in the workflow: `- run: npx -y @hearsayhq/cli run suites/*.yaml`", the failed job with ✗ on the Household Orders step, the green job | "Hearsay runs on every code change. On GitHub, this change skipped the budget for dollar amounts. Hearsay failed the check. One fix, and it passes." |
| 2:14 for coding agents | "Hearsay · also an MCP server + Agent Skills for coding agents (not Alexa skills)" → "your coding agent · here: Claude Code"; the recorded session on another demo add-on (smart home) at main 3cc07c5 (11×, labelled): 17 errors → RED → fixes in the add-on's code → GREEN, tests untouched | "Hearsay is also an MCP server, with Agent Skills for coding agents like Claude Code. Your agent runs your tests, fixes your add-on, and runs them again until they pass, without changing your tests." |
| 2:30 locked tests | Tape `cheat-4k` on a third demo add-on (kitchen timers), from the end of the edit on: a locked test edited from 15 to 50 → the integrity error → stamp "Run fails" | "And it can't cheat: your tests are locked. Change one, and the run fails." |
| 2:38 try it | Open source · MIT, on npm, no keys, no account; tape `npx-v5`: an add-on's project folder, its test, `npx -y @hearsayhq/cli run suites/kitchen.yaml` from npm, 0 errors (real time); the build step; tagline; end card: "Preflight checks for Alexa+ add-ons", github.com/hearsayhq/hearsay, `npx @hearsayhq/cli`, for coding agents `npx @hearsayhq/mcp` | "Hearsay is open source and on npm. No keys, no account: write what your customers say, run one command, and put it in your build. Hearsay. Hear it before your customers do." |

Fine print names the tape, page or session and the commit in every scene; the first and the last
say "Unofficial. Not affiliated with or endorsed by Amazon." and "Narration is AI-generated."

Changes from v4 (owner, 5 Oct, after the blind reviews): what Hearsay is in the first sentence,
then an example; Alexa+ and "an add-on is an MCP server" in the first 30 seconds; the customer and the add-on are heard; the budget is introduced before
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
   address in view), red on the change, the failed step, and green after the fix. GitHub shows the
   log itself only after a sign-in; `gh run view 36779993236 --log-failed` prints its failing line.
   The pull request stays reachable after submission; its link goes into the Devpost description
   and the README.
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
voice; every voice passes a de-esser (above 4.5 kHz, 3:1 from −24 dBFS: `video/voice/deess.mjs`); the
final mix is −14 LUFS. Rebuild from `video/`:

```sh
node sound/make-sound.mjs && npx tsx sound/make-bed-v5.ts
node --env-file=.env voice/make-dialogue.mjs voice/film-v5.json && node --env-file=.env voice/align.mjs voice/film-v5.json
AWS_PROFILE=<yours> node voice/make-polly.mjs voice/polly-v5.json
node voice/deess.mjs voice/film-v5.json voice/polly-v5.json      # de-essed copies the film plays
node record/ci-github.mjs                                   # github.com pages, logged out
HEARSAY_DIR=<a clone> ADDON_DIR=<a folder named kitchen-addon with suites/kitchen.yaml and suites/variants/kitchen.json> vhs tapes/npx-v5.tape
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
