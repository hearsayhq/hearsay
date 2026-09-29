# Risk register

| Id | Risk | L | I | Mitigation | Owner/when |
|---|---|---|---|---|---|
| R-01 | Judges read it as "not an Alexa+ experience". | M | H | Video opens with a voice interaction against a reference server; track rules allow the simulated path. | M7 |
| R-02 | Open Source mini challenge requires an *additional* project, not the submission itself. | H | M | Plan (a) or (b) from docs/09 early; ship it by M6. | Decide by M2 |
| R-03 | Elicitation behaves differently in the real Alexa+ orchestrator than in our stand-in. | M | M | Test once against the community bridge (KayLerch/alexa-skill-mcp-bridge claims elicitation). Document gaps in the friction log. | M4 |
| R-04 | Scope creep (personas, Polly, extra servers). | H | H | Cut order in docs/07. Gates before new work. | always |
| R-05 | Flaky latency verdicts on CI runners. | M | M | Fixtures far from thresholds; modeled asr/tts; tolerance in replay. | M1 |
| R-06 | Bedrock model access or quota not enabled in the account/region. | M | M | Request model access on day 1 of M3; DeepSeek/Anthropic adapters as fallback; replay for the demo. | M3 |
| R-07 | Name "Earshot" collides with an existing product. | M | L | Trademark and npm search before going public; rename is cheap now. | before M7 |
| R-08 | Someone ships a similar tool during the window. | M | M | Stay private until submission; differentiate on mandate + CI gate; cite others. | — |
| R-09 | Judges cannot run it. | L | H | FR-060 gate on a clean machine; no keys; one command. | M6 |
| R-10 | Implying Amazon endorsement. | L | M | "for Alexa+", "unofficial"; no Echo imagery. | M5, M7 |

L = likelihood, I = impact.

## Open questions

- Does the Alexa+ orchestrator pass `mandateVersion` through, or must the server bind the version
  to the session instead? (Design currently allows both: explicit arg, or server-side session
  binding with the arg optional.)
- Minimum duration for `mandate.expiry` probing that keeps suites fast (target ≤ 3 s).
