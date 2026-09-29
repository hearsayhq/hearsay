# Risk register

| Id | Risk | L | I | Mitigation | Owner/when |
|---|---|---|---|---|---|
| R-01 | Judges read it as "not an Alexa+ experience". | M | H | Video opens with a spoken interaction against a reference server; checks cite Amazon's own requirements; track rules allow the simulated path. | M7 |
| R-02 | Open Source mini challenge requires an *additional* project or contribution. | H | M | Decided: PR to AlSayedGamal/mcp-voice-simulator, issue first; plan B voicecheck (docs/09). | M1 issue, M6 PR |
| R-03 | Elicitation behaves differently in the real Alexa+ orchestrator; Amazon's example handshake declares none (friction log #2). | H | M | Consent tiers with a graded verbal fallback (D-010). Test once through KayLerch/alexa-skill-mcp-bridge if the AWS setup stays under 2 h. | M4 |
| R-04 | Scope creep. | H | H | Scope freeze (D-013), ROADMAP, cut order and the automatic cut rule in docs/07. | always |
| R-05 | Flaky latency verdicts on CI runners. | M | M | Fixtures far from thresholds; modeled asr/tts; tolerance in replay; runner pinned to ubuntu-24.04. | M1 |
| R-06 | Bedrock, Polly or Transcribe access or quota not enabled in the account/region. | M | M | Request credits and model access on 1 Oct; replay and curated tables work without AWS; Anthropic/DeepSeek adapters only as a last fallback. | M3 |
| R-07 | Name "Hearsay": the HEARSAY SOCIAL mark (Hearsay Systems, a different field) and several transcription tools called hearsay make the project hard to find; the unscoped npm name is taken. | M | L | Scoped packages, "for Alexa+" in every title; re-evaluate after the hackathon. | after M7 |
| R-08 | Someone ships a similar tool during the window. | M | M | Stay private until submission; differentiate on consent + mishearing + CI gate; cite others (docs/00). | — |
| R-09 | Judges cannot run it. | L | H | FR-060 gate on a clean machine; no keys; one command. | M6 |
| R-10 | Implying Amazon endorsement. | L | M | "for Alexa+", "unofficial"; no Echo imagery. | M5, M7 |
| R-11 | Judges see Hearsay as duplicating Amazon's Local Inspector. | M | M | Positioning line and table in docs/00; show a finding the Inspector cannot produce (a misheard amount) in the first 20 seconds of the video. | M7 |
| R-12 | Thirteen build days do not fit before Sun 18 Oct. | M | H | Automatic cut rule after M3 (docs/07); five days of buffer to the deadline. | M3 |

L = likelihood, I = impact.

## Open questions

- Does the Alexa+ client declare elicitation today, and in which modes? (friction log #2)
- Minimum mandate duration for `mandate.expiry` that keeps suites fast (target ≤ 3 s).
- Does an opened PR count as a contribution for the Open Source mini challenge, or must it be
  merged? Ask in the Devpost discussion if the issue gets no answer.
