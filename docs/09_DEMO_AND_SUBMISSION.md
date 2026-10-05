# Demo and submission

## Video (English, public YouTube or Vimeo, under 3:00)

Film v4, the infomercial cut (approved by the owner, 3 Oct): 2:36, rendered at 3840×2160 and
60 fps with Remotion (`video/src/film4/`, composition `Film4`). One narrator explains; there are
no character voices and no B-roll. Voice: OpenAI gpt-4o-mini-tts, voice alloy, every line a
whole take (`video/voice/film-v4.json`); word timings from whisper (`video/voice/align.mjs`) put
captions and motion on the spoken word. One camera travels through one world. The real runs are
4K VHS tapes (`video/tapes/*-4k.tape`) at main `9b4acdd`, plus the recorded agent session.

| Time | Picture | Narration |
|---|---|---|
| 0:00 what it is | A drop of light lands and becomes the HEARSAY wordmark; starburst "NEW for Alexa+ MCP servers"; the real test case `misheard-amount` of `suites/household-orders.yaml`, its clean and misheard variants (`amountUsd: 15` / `50`); stamp "Build fails, exit 1" | This is Hearsay: preflight checks for voice add-ons. You write what your customers say. Hearsay plays it against your server, clean and misheard, and fails the build when it would go wrong out loud. |
| 0:12 the problem | A chat window ("looks fine") turns into a voice and cracks; four cards: a number heard wrong (fifteen → fifty), a reply that reads out JSON, a list too long to remember, a no that still places the order | In a chat window, add-ons look fine. Out loud, they break: a number heard wrong, a reply that reads out JSON, a list too long to remember, a no that still places the order. |
| 0:24 how it works | Four steps: speech → text, model picks a tool, your server, reply spoken; "Amazon" under three, "your code" under the server. Hearsay's frame over the first two (said/heard, the tool call `orders_stage_cart { amountUsd: 50 }`) and over the last ("Added." checked). Stamps: no microphone, no model, no API keys; three identical runs; `hearsay / voice` on every pull request | Here's how. When someone speaks, only one step is your code: the server. Hearsay plays the rest, straight from your test case: the words, the mishearings, and the tool call the model would make. Then it checks what your server answers. No microphone. No model. No API keys. The same result every time, so it runs on every pull request. |
| 0:45 the rules | Five tiles, each with the check that tests it, all sourced `amazon-fr`: ≤ 500 ms (`latency.tool`), < 30 s (`speak.length`), no JSON (`speak.no_structured_dump`), ≤ 5 options (`speak.lists`), what + how much (`consent.states_details`), with the fixed build's real question "Place the order: two cartons of milk, seven dollars and forty cents?" | Every answer is graded by the rules Amazon published for add-ons: half a second per tool, short replies, no JSON, five options at most, and no payment without naming what and how much. |
| 0:58 a real run | Tape `orders-flawed-4k`, uncut, real time: prompt with branch and SHA, `date`, `HEARSAY_FIXED=0 npm run server:orders &`, the run; the camera moves to `consent.misheard_amount`, `consent.decline_holds`, "20 errors · 16 warnings · 0 info · 8 of 10 runs failed", exit 1; stamps "Exit 1", "Build fails" | Here's a real run, on a grocery add-on. One take, no cuts. · Fifty instead of fifteen, taken without reading it back. A no that placed the order anyway. Twenty errors. Exit one. The build fails. |
| 1:16 fixed | The window flips to tape `orders-fixed-4k`: `HEARSAY_FIXED=1`, same suite; the fixed build's real reply to the misheard fifty ("That would go over the total budget you gave me. You can add less, or give me a bigger budget."); "0 errors · 9 warnings · 0 info · 0 of 10 runs failed", exit 0; chips BEFORE · 20 errors · exit 1 / AFTER · 0 errors · exit 0 | The fixed build, same tests. · The misheard fifty is refused, and the add-on says why. · Zero errors. |
| 1:27 in CI | Tape `ci-pr27-4k`: `gh run view` of pull request #27's `hearsay / voice`, red (failed step, "Process completed with exit code 1", run URL), the failing line `consent.misheard_amount`, then green after the fix commit (run URL); notes with the PR title and the one-line fix (57e680a); seal "As seen in CI" | And it guards every pull request. This change let fifty dollars of fruit skip the budget. · Hearsay caught it, and the check went red. · One fix, and it's green. |
| 1:44 coding agents | Starburst "But wait — there's more!"; the recorded Claude Code session (`scripts/agent-loop.sh`, 10×, labelled): RED · 11 errors → fixes in `src/server.ts` → GREEN, suites untouched | But wait, there's more. Hearsay is also an MCP server. Your coding agent runs it, fixes what it finds, and runs it again, until it's green. |
| 1:54 locked suite | Tape `cheat-4k`: an expectation in the locked Kitchen suite edited from 15 to 50 → `suite.integrity` error, exit 1; stamp "Nice try" | And it can't cheat: change a locked test, · and the run fails. |
| 2:03 measured | docs/15: a suite alone stopped agents at green (68 % against 83 % on unseen cases); a real coverage warning; 0 of 36 against 11 of 27 agent runs that ended with errors left; rules the prompt never named 37/45 against 28/45; fine print with the limits | We measured it with coding agents. A suite alone made them stop at green, so Hearsay now shows what your suite doesn't cover. The result: zero defects left behind, and better on the rules nobody told them about. |
| 2:15 try it | Price tag "$ ???" → "$0"; open source, MIT, no API keys, no account; tape `clone-4k`: fresh clone, install at 2× (labelled), the Kitchen run at real time, "0 errors · 1 warning · 0 info · 0 of 8 runs failed", exit 0; tagline; end card: github.com/hearsayhq/hearsay · `npx @hearsayhq/cli` · "Your coding agent is standing by." · seal "As seen in CI" | And the price? Zero. Hearsay is open source. No keys, no account. Clone it, install it, run it. · Hearsay. Hear it before your customers do. |

Fine print along the bottom of every scene names the tape, the commit and the limits; the first
and the last scene say "Unofficial. Not affiliated with or endorsed by Amazon." and "Narration is
AI-generated." CI is shown with `gh` in a recorded terminal: the Actions run of pull request #27,
its failing log line and both run URLs, so no browser login is needed.

Changes from v3 (owner, 2–3 Oct): no skit and no character voices; the film opens with what
Hearsay is; the problem is four situations, not a narrated example; whole takes only, so nothing
is cut inside a sentence; no B-roll; colored gradients and a technical layer (grid, chapter
labels, progress).

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
5. A README section "Demo: run what the video shows" lists the exact commands and the commit SHA
   for every scene (suites, flawed and fixed servers, seed), so a judge gets the same numbers.
6. Generated clips (B-roll) never show product output. Product scenes are real recordings only.
7. Before rendering, the numbers in the video (error counts, exit codes) are taken from the actual
   runs, not from the script. If "Twenty errors" no longer holds, the sentence changes, not the run.

Production notes: subtitles from second 0; the narration never says the wake word, "Alexa+" only
on screen. Music and effects are synthesised by `video/sound/make-sound.mjs` (no samples, nothing
to license) and duck under the voice; the final mix is −14 LUFS. Rebuild from `video/`:
`node sound/make-sound.mjs`, then `npx remotion render src/index.ts Film4 out/hearsay-v4-4k.mp4
--scale=2 --crf=14 --x264-preset=slow --jpeg-quality=100 --color-space=bt709`, then
`ffmpeg -i out/hearsay-v4-4k.mp4 -c:v copy -af "volume=2.8dB,alimiter=limit=0.85:level=disabled"
-c:a aac -b:a 256k out/hearsay-v4-4k-final.mp4`. The tapes go into `public/clips/v4/`
(see README → Demo).

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
- [ ] Repo public or reviewers invited (same day)
- [ ] Not implying Amazon endorsement anywhere ("for Alexa+", "unofficial")
