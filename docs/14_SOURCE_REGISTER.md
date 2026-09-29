# Source register

Checked 29–30 Sep 2026. Amazon pages are cited by `catalog.ts` as `amazon-fr` sources.

| Source | Used for |
|---|---|
| Devpost resources page — amazonappdev2026.devpost.com/resources | Open Source guidance that partly contradicts the rules (R-02, friction log #5) |
| Amazon Devices Builder Tools | Reference for the form only (developer tools shipped as MCP servers plus Agent Skills). Not installed: Fire TV / Vega focus, installs skills globally. |
| Hackathon overview, rules, FAQ — amazonappdev2026.devpost.com | Track rules (2025-11-25, Streamable HTTP, simulated path), Open Source mini challenge, friction-log bonus, existing-work rule, reviewer handles, hosting not required |
| Alexa+ add-on functional requirements — developer.amazon.com/docs/alexaplus/add-ons/functional-requirements.html | 3 s search with interim message; responses under 30 s; at most 5 options; explicit confirmation before payment, cancellation, deletion; no API codes, tool names, JSON or ids; actionable errors; every listed tool invocable; clear descriptions, synonyms in enums; context and expiry |
| MCP Toolkit quickstart — …/add-ons/mcp-toolkit-quickstart.html | 500 ms round trip; 2025-11-25 over Streamable HTTP; tools refreshed only on deployment |
| MCP Toolkit client lifecycle — …/add-ons/mcp-toolkit-client-lifecycle.html | Example handshake (2025-03-26, no elicitation capability); session derived from earlier conversations |
| MCP Toolkit account linking — …/add-ons/mcp-toolkit-account-linking.html | OAuth 2.1 with PKCE required; principal binding |
| Alexa+ Local Inspector — …/add-ons/mcp-toolkit-local-inspector.html | Positioning: checks tool definitions, payloads, errors, latency, widgets; certification verdict; Developer Console login |
| MCP add-on design guides — …/add-ons/mcp-addon-conversation-surface.html, …/mcp-addon-tools-schema-data-design.html | Alexa composes the spoken reply from tool data; declare only what you honour |
| MCP specification 2025-11-25 — modelcontextprotocol.io/specification/2025-11-25 | Elicitation (capability declaration, form and url modes), lifecycle (use negotiated capabilities), tools (names, annotations, list_changed, errors as results) |
| @modelcontextprotocol/sdk 1.31.0 | Verified: LATEST_PROTOCOL_VERSION = 2025-11-25, `elicitInput`, `sendToolListChanged`; input validation failures become `isError` results starting "MCP error -32602"; `destructiveHint` defaults to true |
| github.com/AlSayedGamal/mcp-voice-simulator | Community simulator; `Brain.turn` extension point; no elicitation; Open Source target |
| github.com/KayLerch/alexa-skill-mcp-bridge | Community bridge; form elicitation spoken field by field; R-03 test |
| github.com/sujitnoronha/voicecheck | End-to-end voice-agent testing (real audio through LiveKit, Daily, VAPI, Retell); positioning; ideas adopted: recorded mishearings, forbidden args, leak detection, suite drafting |
| MCP Inspector, MCP Conformance (github.com/modelcontextprotocol), MCPJam Inspector, mcp-evals | Positioning |
| Hamming, Coval, Cekura voice-agent testing guides | Positioning against end-to-end voice testing |
| github.com/HarzerHeribert/webMCP | Mandate model, policy ordering, field notes on consent |
| USPTO TSDR, npm registry, GitHub | Name checks (R-07, D-014) |
