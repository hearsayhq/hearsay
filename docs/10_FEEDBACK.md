# Product feedback (draft for Devpost)

Per tool: what it was used for, what worked, what needs work, onboarding, would we build with it
again. Friction with steps and suggestions is in [FRICTION_LOG.md](FRICTION_LOG.md); this page
summarises.

**AWS services used (AWS Builder mini challenge):** Amazon Bedrock (Converse, Amazon Nova 2 Lite)
plans tool calls from what was heard in Hearsay's llm mode and records replay cassettes; Amazon
Polly and Amazon Transcribe Streaming record real mishearings for `hearsay gen-variants`. CI and
judges replay both offline, without AWS. Details per service below.

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
- **Onboarding:** quick: the simulator already used 2.0, and the docs on the protocol eras
  answered what we needed.
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
- **Worked:** the rules answer the important questions directly: the simulated path, and that an
  Open Source pull request does not need to be merged.
- **Needs work:** the resources page describes the Open Source mini challenge differently from
  the rules (friction #5); one definition in one place would save a day of doubt.
- **Onboarding:** clear; the submission checklist mapped one to one onto our docs.
- **Again:** yes.

## Amazon Bedrock (Converse)

- **Used for:** Hearsay's llm orchestrator: a model plans the tool calls from the words that were
  heard, as an assistant would, through the Converse API with tool use; `--record` writes the
  calls to a cassette that CI replays offline. Model: Amazon Nova 2 Lite
  (`us.amazon.nova-2-lite-v1:0`, us-east-1).
- **Worked:** Converse's tool definitions map one to one onto MCP tools. The first Kitchen
  recording took 26 model calls for about a cent, and replays without credentials gave identical
  findings. With real mishearings the model found failures the scripted mode cannot: twice a
  timer label was dropped without a word, and once six tool calls ended in silence.
- **Needs work:** Nova Lite (v1) put its reasoning into the reply text and skipped a call
  (friction #8). On Smart Home and Household Orders, Nova 2 Lite's own planning dominated (it said
  "added $50" without a call, and widened a spending limit), so only Kitchen's recording is
  committed. Claude models on Bedrock need an AWS Marketplace subscription that a least-privilege
  IAM user cannot make.
- **Onboarding:** `aws login` to a profile, an IAM policy with `bedrock:InvokeModel`, and the
  first Converse call worked the same day.
- **Again:** yes, for recordings and an optional live mode; pull requests stay on replay.

## Amazon Polly and Amazon Transcribe Streaming

- **Used for:** `gen-variants`, recorded mishearings over a telephone-band channel.
- **Worked:** Transcribe Streaming took 8 kHz audio directly, with no S3 bucket and no setup
  beyond IAM; two recordings heard the same words.
- **Worked (Polly):** four voices (Joanna, Matthew, Amy, Kajal) gave the variety; the British
  and Indian English voices produced most of the mishearings.
- **What we learned:** in 240 transcriptions over a noisy phone line, Transcribe never confused a
  number. It dropped verbs ("dim the bedroom" → "In the bedroom", 14 of 16) and swapped nouns
  (sauce → "source", pasta → "faster"). That told us what to record and what to keep curated.
- **Needs work:** Transcribe is Paid-Plan-only for new accounts, and the console only says the key
  'needs a subscription' (friction log #9). At least 15 seconds are billed per request, so short
  sentences cost more than they last (about $2.80 for the 240).
- **Onboarding:** Polly worked at once; Transcribe waited for the Paid Plan (three days).
- **Again:** yes; `gen-variants` now speaks only new or changed sentences, about 7 cents each.

## Claude Code (headless) as the coding agent in the loop

- **Used for:** the agent-loop gate (`scripts/agent-loop.sh`), the skill gate
  (`scripts/skill-draft.sh`) and the experiment harness.
- **Worked:** `--mcp-config --strict-mcp-config`, `--allowedTools`, `--max-budget-usd` and
  `stream-json` made runs reproducible and cheap ($0.22–0.44 per run).
- **Needs work:** the read-only command allowlist lets `cat` and `ls` through unless Bash is
  disallowed outright, which matters when an agent must not read files outside its workspace.
- **Onboarding:** the headless flags are documented; `stream-json` needed a small formatter for
  readable logs (`scripts/agent-loop-pretty.mjs`).
- **Again:** yes.
