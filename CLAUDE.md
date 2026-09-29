# Earshot — working notes for Claude Code

Voice-readiness test and trace engine for MCP servers behind voice assistants (Alexa+).
Entry for the Amazon Developer Hackathon, Alexa+ track. **Deadline Fri 23 Oct 2026, 21:00 CEST.**
The repo is private until submission.

## Read first

1. `docs/00_PRODUCT_THESIS.md` — what this is and is not
2. `docs/07_IMPLEMENTATION_PLAN.md` — current milestone and its gate
3. `docs/01_REQUIREMENTS.md` — FR ids you are implementing
4. `docs/05_CHECK_CATALOG.md` — exact semantics of every check
5. `docs/06_SECURITY_MODEL.md` — before touching anything mandate-related

## Commands

```sh
npm install
npm run check                              # typecheck + tests; must be green at every commit
npm run earshot -- validate suites/*.yaml
npm run earshot -- checks                  # catalog with implemented/planned status
npm run server:kitchen                     # reference servers on :4101 / :4102 / :4103
npm run dev:web                            # console on :5180 (needs `earshot serve` from M5)
```

## Rules

- **Spec first.** If a change contradicts a doc, update the doc in the same commit or stop and ask.
  Reference FR ids in commit messages (`FR-011: scripted orchestrator`).
- **The engine decides, surfaces display.** CLI and web never compute verdicts.
- **A check is `implemented` only with a failing fixture** (docs/08). Flip `status` in
  `catalog.ts` in the same commit as the fixture.
- **Determinism.** Unit tests never call a model or the internet. llm behaviour in tests goes through
  replay cassettes. Seeded PRNG for perturbations.
- **Mandate invariants (from webMCP):** a schema communicates authority, it never confers it;
  every scoped call goes through `authorize()`; no tool ever commits a consequential action —
  only an accepted elicitation does; never add a tool that places orders, edits limits, or answers
  elicitations.
- **Voice rules for reference servers:** replies are one or two sentences, no JSON, no ids,
  errors say what the person can do.
- **Code:** TypeScript strict, ESM, zod 4 for runtime validation, English for code, docs and
  utterances (en-US). Small files, one concern each.
- **Friction:** anything confusing in Alexa+/MCP/AWS/Devpost tooling goes into
  `docs/FRICTION_LOG.md` immediately, with steps and a suggestion.
- **No Amazon branding or implied endorsement.** "for Alexa+", "unofficial".

## Context worth knowing

- Alexa+ MCP Toolkit, CLI and Web Simulator are partner-gated; participants build self-hosted MCP
  servers (spec 2025-11-25, Streamable HTTP) and may demo via their own simulator (hackathon FAQ).
- Hosting is not required; judges run the repo locally. Judging 9–20 Nov 2026.
- Prizes: max one track prize + one mini challenge (AWS Builder or Open Source). The Open Source
  mini needs an *additional* project or a contribution to a public repo (docs/09).
- `packages/mandate` is ported from github.com/HarzerHeribert/webMCP (`server/core/policy.ts`);
  disclose as existing work, adapted.
- MCP SDK 1.31.0: `LATEST_PROTOCOL_VERSION = '2025-11-25'`, `Server.elicitInput`,
  `sendToolListChanged` verified present.
