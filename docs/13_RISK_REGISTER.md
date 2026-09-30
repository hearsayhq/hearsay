# Risk register

| Id | Risk | L | I | Mitigation | Owner/when |
|---|---|---|---|---|---|
| R-01 | Judges read it as "not an Alexa+ experience". | M | H | Video opens with a spoken interaction against a reference server; checks cite Amazon's own requirements; track rules allow the simulated path. | M7 |
| R-02 | Open Source mini challenge: the rules ask for a new, additional project or a contribution to an existing public repo; the Devpost resources page says public repos and popular package directories work and speaks of adding something to the project you already built (friction log #5). | H | M | Owner clarifies in office hours or on Discord. Until then the PR to AlSayedGamal/mcp-voice-simulator stays in the plan (issue first); plan B voicecheck (docs/09). | M1 issue, M6 PR |
| R-03 | Elicitation behaves differently in the real Alexa+ orchestrator; Amazon's example handshake declares none (friction log #2). | H | M | Consent tiers with a graded verbal fallback (D-010). Test once through KayLerch/alexa-skill-mcp-bridge if the AWS setup stays under 2 h. | M4 |
| R-04 | Scope creep. | H | H | Scope freeze (D-013), ROADMAP, cut order and the automatic cut rule in docs/07. | always |
| R-05 | Flaky latency verdicts on CI runners. | M | M | Fixtures far from thresholds; modeled asr/tts; tolerance in replay; runner pinned to ubuntu-24.04. | M1 |
| R-06 | Bedrock, Polly or Transcribe access or quota not enabled in the account/region. | M | M | Request credits and model access on 1 Oct; replay and curated tables work without AWS; Anthropic/DeepSeek adapters only as a last fallback. | M3 |
| R-07 | Name "Hearsay": the HEARSAY SOCIAL mark (Hearsay Systems, a different field) and several transcription tools called hearsay make the project hard to find; the unscoped npm name is taken. | M | L | Scoped packages, "for Alexa+" in every title; re-evaluate after the hackathon. | after M7 |
| R-08 | Someone ships a similar tool during the window. | M | M | Stay private until submission; differentiate on consent + mishearing + CI gate; cite others (docs/00). | — |
| R-09 | Judges cannot run it. | L | H | FR-060 gate on a clean machine; no keys; one command. | M6 |
| R-10 | Implying Amazon endorsement. | L | M | "for Alexa+", "unofficial"; no Echo imagery. | M5, M7 |
| R-11 | Judges see Hearsay as duplicating Amazon's Local Inspector. | M | M | Positioning line and table in docs/00; show a finding the Inspector cannot produce (a misheard amount) in the first 20 seconds of the video. | M7 |
| R-12 | Sixteen build days do not fit before Sun 18 Oct. | M | H | Automatic cut rule after M3 (docs/07); blocked-by-access rule (D-020); five days of buffer to the deadline. | M3 |
| R-13 | A coding agent makes itself green by editing the tests. | H | H | Lock and `suite.integrity`, holdouts, normal PR review with optional CODEOWNERS (docs/03); honest that the lock detects rather than prevents. | M2b |
| R-14 | *Closed (D-021):* no suite-change tool, so client elicitation support in coding agents does not matter. | — | — | — | — |
| R-15 | The agent-loop experiment costs more than planned. | M | L | Estimate first (docs/15), owner approves before any run; the pair can be cut (docs/07). | M6 |
| R-16 | MCP 2026-07-28 replaces push elicitation with `input_required` results; the kit's `confirm()` and the engine (SDK 1.31, 2025-11-25) only speak push elicitation. If Alexa+ moves, consent detection and the kit need the new shape. | L | M | Alexa+ requires 2025-11-25 and SDK 2.0 still defaults to it; ROADMAP item for `input_required` in `confirm()` and the session; friction log #7. | after M7 |

L = likelihood, I = impact.

## Open questions

- Does the Alexa+ client declare elicitation today, and in which modes? (friction log #2)
- Minimum mandate duration for `mandate.expiry` that keeps suites fast (target ≤ 3 s).
- What counts for the Open Source mini challenge: a separate project or contribution only, or also
  something added to the submission and published to a package directory (R-02)? Does an opened
  PR count, or must it be merged? Owner asks in office hours or on Discord.
