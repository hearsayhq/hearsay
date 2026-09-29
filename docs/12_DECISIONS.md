# Decisions

| Id | Decision | Why | Revisit if |
|---|---|---|---|
| D-001 | TypeScript for everything; npm workspaces; tsx for dev, tsc for typecheck. | Reference MCP SDK, shared trace types between engine and browser, npx/Action distribution. | A dependency only exists in Python. |
| D-002 | Scripted and replay are the default orchestrators; llm is opt-in. | CI and judges need determinism and no keys (NFR-1, FR-060). | — |
| D-003 | Fresh MCP session per case × variant; `after` chains replayed as setup. | Variants must not contaminate each other; mandate state is per session. | Suites get slow (> 60 s); then share sessions for read-only cases. |
| D-004 | Modeled ASR and TTS latency in CI; measured in the console. | No speech pipeline in CI; the server's share is what developers can fix. | We add a real Polly → Transcribe round trip. |
| D-005 | Consequential actions commit only through an accepted elicitation, never a tool. | The WebMCP finding: agents press buttons; only host-rendered consent is a boundary. | MCP adds a stronger consent primitive. |
| D-006 | Utterances and spoken replies in en-US. | Alexa+ add-ons and the judges are US English; ASR perturbation tables are language-specific. | — |
| D-007 | Earshot is not a simulator and does not imitate Alexa branding. | Community simulators exist; trademark and endorsement risk. | — |
| D-008 | Model provider interface shaped like Bedrock Converse. | Bedrock is the default and counts for AWS Builder; other adapters map onto it. | — |
