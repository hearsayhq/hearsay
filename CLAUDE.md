# Hearsay — working notes for Claude Code

Preflight checks for Alexa+ MCP servers: a crash test for voice add-ons. Unofficial.
Entry for the Amazon Developer Hackathon, Alexa+ track. **Deadline Fri 23 Oct 2026, 21:00 CEST;
target Sun 18 Oct.** Repo `hearsayhq/hearsay`, private until submission.

## Read first

1. `docs/00_PRODUCT_THESIS.md` — what this is and is not; the four questions
2. `docs/07_IMPLEMENTATION_PLAN.md` — current milestone, its gate, the cut order
3. `docs/01_REQUIREMENTS.md` — FR ids you are implementing
4. `docs/05_CHECK_CATALOG.md` — exact semantics, thresholds and sources of every check
5. `docs/06_SECURITY_MODEL.md` — before touching anything consent- or mandate-related, and for
   how Hearsay protects its own suites (lock, consent for suite changes, holdouts)

## Commands

```sh
npm install
npm run check                              # typecheck + tests; must be green at every commit
npm run hearsay -- validate suites/*.yaml
npm run hearsay -- checks                  # catalog by question, with thresholds and sources
npm run server:kitchen                     # reference servers on :4101 / :4102 / :4103
npm run dev:web                            # console on :5180 (needs `hearsay serve` from M5)
```

## Rules

- **Spec first.** If a change contradicts a doc, update the doc in the same commit or stop and ask.
  Reference FR ids in commit messages (`FR-011: scripted orchestrator`).
- **Scope freeze.** New ideas go to `docs/ROADMAP.md`, not into the plan. Only the owner lifts it.
- **Gates.** Never start a milestone with a red gate. After each gate: record the clip
  (docs/09 §Clips per gate), then report in a few lines. If M3 lands more than one build day late,
  apply the cut order in docs/07 and report what was cut.
- **The engine decides, surfaces display.** CLI and web never compute verdicts.
- **A check is `implemented` only with a failing fixture** (docs/08). Flip `status` in
  `catalog.ts` in the same commit as the fixture.
- **Every finding names its source** (`amazon-fr`, `mcp-spec`, `hearsay`). Amazon thresholds are
  fixed; suites only tune Hearsay's own.
- **Determinism.** Unit tests never call a model, AWS or the internet. llm behaviour goes through
  replay cassettes, recorded mishearings through committed variants files. Seeded PRNG.
- **Consent invariant (D-005):** No tool commits on its own. A commit happens through an accepted
  elicitation, or, only when the client lacks elicitation, through a single-use token the server
  issued after speaking items and amount (graded warn). Never add a tool that edits limits or
  answers elicitations.
- **Mandate invariants (from webMCP):** a schema communicates authority, it never confers it;
  every scoped call goes through `authorize()`; mandates are bound to the principal, not the
  session; enums are advertised, and enforced only by `authorize()`.
- **Voice rules for reference servers:** replies are one or two sentences, no JSON, no ids, no tool
  names; errors say what the person can do; amounts and misheard values are read back.
- **Code:** TypeScript strict, ESM, zod 4 for runtime validation, English for code, docs and
  utterances (en-US). Small files, one concern each.
- **Suites are the owner's.** Change a suite only as spec work with the owner's OK; run
  `npm run hearsay -- lock` in the same commit. Holdout suites are never committed.
- **Friction:** anything confusing in Alexa+/MCP/AWS/Devpost tooling goes into
  `docs/FRICTION_LOG.md` immediately, with steps and a suggestion.
- **No Amazon branding or implied endorsement.** "for Alexa+", "unofficial".

## Context worth knowing

- Alexa+ MCP Toolkit, CLI and Web Simulator are partner-gated (hackathon FAQ). Amazon's Local
  Inspector checks declared surfaces behind a Developer Console login; Hearsay tests spoken
  behaviour in CI (docs/00 §Positioning).
- Amazon's functional requirements give the fixed thresholds: 500 ms tool round trip, replies
  under 30 s, at most 5 options, confirmation with key details before payment (docs/14).
- Alexa+ refreshes tools only on deployment, its example handshake declares no elicitation, and
  its sessions have no explicit id (friction log #2–4). Hence static tool lists, consent tiers and
  principal binding.
- Hosting is not required; judges run the repo locally. Judging 9–20 Nov 2026.
- Prizes: max one track prize + one mini challenge (AWS Builder or Open Source). Open Source =
  PR to AlSayedGamal/mcp-voice-simulator (docs/09).
- Hearsay itself becomes an MCP server (`@hearsayhq/mcp`) and Agent Skills in M2b (core, D-017),
  the form of Amazon's own developer tools. Do not install Amazon Devices Builder Tools (Fire TV/Vega focus,
  installs skills globally); do not add Strands, AgentCore or Kiro (freeze, D-016).
- npm: scope `@hearsayhq`; the unscoped `hearsay` is someone else's library, so always
  `npx @hearsayhq/cli`.
- `packages/mandate` is ported from github.com/HarzerHeribert/webMCP (`server/core/policy.ts`);
  disclose as existing work, adapted, with a before/after.
- MCP SDK 1.31.0: `LATEST_PROTOCOL_VERSION = '2025-11-25'`, `Server.elicitInput`,
  `sendToolListChanged` verified present. Input validation failures come back as `isError`
  results starting "MCP error -32602"; `destructiveHint` defaults to true.
