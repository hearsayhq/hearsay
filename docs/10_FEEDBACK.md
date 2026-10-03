# Product feedback (draft for Devpost)

Per tool: what it was used for, what worked, what needs work, onboarding, would we build with it
again. Friction with steps and suggestions is in [FRICTION_LOG.md](FRICTION_LOG.md); this page
summarises. AWS entries wait for access (D-020) and are filled in when the runs exist.

## MCP TypeScript SDK 1.31 (engine, reference servers, kit)

- **Used for:** the engine's client (Streamable HTTP, elicitation handler, `list_changed`), the
  reference servers and `@hearsayhq/kit` (`McpServer.registerTool`, `Server.elicitInput`).
- **Worked:** 2025-11-25 negotiated out of the box; elicitation and `sendToolListChanged` do
  what the spec says; `InMemoryTransport` made fast, deterministic tests easy.
- **Needs work:** input validation answers before the handler with "MCP error -32602: Input
  validation error…", which a voice host would read to the person; there is no hook to phrase it
  or skip it (friction #6). We advertise enums and bounds with `.meta()` on a loose schema
  (`looseEnum()`, `looseInt()`) to keep the handler in charge. `destructiveHint` defaulting to
  true is right but surprising.
- **Onboarding:** good; the README examples cover servers well, clients less.
- **Again:** yes.

## MCP TypeScript SDK 2.0 (the Open Source contribution)

- **Used for:** elicitation in AlSayedGamal/mcp-voice-simulator's client and a test server.
- **Worked:** one `setRequestHandler('elicitation/create', …)` also answers 2026-07-28
  `input_required` rounds; the docs explain the eras well.
- **Needs work:** the default `createMcpHandler` is stateless, so a 2025-11-25 server cannot
  elicit and says only "Client does not support form elicitation" although the client declared
  it (friction #7).
- **Again:** yes, once Alexa+ states which protocol revision it speaks.

## Alexa+ developer documentation (add-ons, MCP Toolkit)

- **Used for:** the functional requirements behind every `amazon-fr` threshold (500 ms per tool
  call, replies under 30 seconds, at most five options, no structured dumps, distinct intents,
  actionable errors) and the protocol requirement (2025-11-25, Streamable HTTP).
- **Worked:** the requirements are concrete enough to execute as checks; that is what the catalog
  does.
- **Needs work:** the toolkit is partner-gated without saying so on each setup page (friction #1);
  the example handshake contradicts the protocol requirement and leaves elicitation support open
  (#2); runtime `tools/list_changed` and session lifetime are undocumented (#3, #4).
- **Onboarding:** reading only; nothing could be run.
- **Again:** yes, and we would like to run Hearsay against the real orchestrator.

## Devpost resources

- **Used for:** rules, mini challenges, submission requirements.
- **Needs work:** the Open Source mini challenge has two definitions (friction #5, R-02).

## Amazon Bedrock (Converse)

- **Used for:** the llm orchestrator and replay cassettes. *Pending access (requested 1 Oct).*

## Amazon Polly and Amazon Transcribe Streaming

- **Used for:** `gen-variants`, recorded mishearings over a telephone-band channel.
- **Worked:** Transcribe Streaming took 8 kHz audio directly, with no S3 bucket and no setup
  beyond IAM; two recordings heard the same words.
- **Needs work:** Transcribe is Paid-Plan-only for new accounts, and the console only says the key
  'needs a subscription' (friction log #9).

## Claude Code (headless) as the coding agent in the loop

- **Used for:** the agent-loop gate (`scripts/agent-loop.sh`), the skill gate
  (`scripts/skill-draft.sh`) and the experiment harness.
- **Worked:** `--mcp-config --strict-mcp-config`, `--allowedTools`, `--max-budget-usd` and
  `stream-json` made runs reproducible and cheap ($0.22–0.44 per run).
- **Needs work:** the read-only command allowlist lets `cat` and `ls` through unless Bash is
  disallowed outright, which matters when an agent must not read files outside its workspace.
