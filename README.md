# Hearsay

**Preflight checks for Alexa+ MCP servers. Never act on hearsay.**
Unofficial; built for Alexa+ add-on developers; not affiliated with or endorsed by Amazon.

In law, hearsay is a second-hand statement that doesn't count as evidence. Hearsay makes sure
your server never moves money on what the assistant only thinks it heard.

A crash test for voice add-ons: Hearsay plays through what happens when someone talks to your MCP
server — with mishearings, with waiting, with money — and turns the pull request red where it
breaks. Every check answers one of four questions, once the precondition holds.

**Precondition: Can it connect?** MCP 2025-11-25 over Streamable HTTP, and the suite is the one
that was locked.

- **Did it hear me right?** Misheard numbers and words; tool names and enums a model can map speech onto.
- **Do I have to wait?** Tool round trips under 500 ms; modeled time to first audio.
- **Can I listen to this?** No JSON, ids or tool names; short replies; at most five options.
- **Did I agree?** Payments, deletions and cancellations only after a confirmation that states what and how much.

Every finding cites its source: Amazon's functional requirements for add-ons, the MCP
specification, or Hearsay's own rule.

> Status: **M6 ship, in progress.** Every check in the catalog is implemented, each with a
> fixture built to fail it. `hearsay run` (scripted, llm, replay, `--holdout`), `hearsay lint`,
> `hearsay lock`, `hearsay gen-variants` and `hearsay serve` work; coding agents can use Hearsay
> over MCP with two Agent Skills; the web console plays turns live and a person answers the
> server's confirmations. Mishearings reach the server through its arguments, so `asr.robust`
> runs without a model. Waiting on access: Bedrock and Polly/Transcribe recordings.
> See [docs/07](docs/07_IMPLEMENTATION_PLAN.md).

**Does it help a coding agent?** We measured it. Without Hearsay, 11 of 27 agent runs ended with
defects the suite would have caught; with it, 0 of 36. But a suite alone made agents stop at
green: on unseen cases they did worse than agents given a precise prompt (68–71 % vs 83 %). So
Hearsay now reports what your suite doesn't cover, and its skill reviews beyond green. Measured
again: level with the precise prompt on unseen cases (84 % vs 83 %), clearly ahead on rules the
prompt never mentioned (37/45 vs 28/45), and still zero defects left behind. (Three runs per arm;
the unseen cases were written by the author of the flaws.) Details:
[docs/15](docs/15_EXPERIMENT.md).

## Quickstart

From a clone (no API keys; about a minute on a fresh machine):

```sh
npm install
npm run check
npm run hearsay -- validate suites/*.yaml
npm run hearsay -- checks
npm run hearsay -- run suites/kitchen.yaml   # starts the Kitchen server itself
npm run hearsay -- run suites/smart-home.yaml                    # flawed: red
HEARSAY_FIXED=1 npm run hearsay -- run suites/smart-home.yaml    # kit applied: green
```

Console: `npm run hearsay -- serve` in one terminal, `npm run dev:web` in another, then open
http://localhost:5180. Pick a suite, connect (the server starts itself), and type what a customer
would say. Replies are spoken by the browser; confirmations appear as a dialog you answer. Without
a model the console plans from the nearest suite case and says so (D-023).

## In your project

Hearsay is packaged as `@hearsayhq/cli`, `@hearsayhq/mcp` and `@hearsayhq/kit` (not on npm yet;
`npm run pack` builds the packages into `build/npm/`). The unscoped npm name `hearsay` belongs to
an unrelated library.

```sh
npx @hearsayhq/cli run suites/*.yaml     # exit 1 on any error finding
npx @hearsayhq/cli lint http://localhost:4101/mcp
npx @hearsayhq/cli serve                 # the console on http://localhost:4100
npx @hearsayhq/cli lock                  # protect your suites (below)
```

In CI (GitHub Actions), on every pull request:

```yaml
name: hearsay
on: pull_request
jobs:
  voice:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx -y @hearsayhq/cli run suites/*.yaml      # starts your server from server.start
      # Cases your coding agent never sees: keep them in a secret, not in the repo.
      - if: env.HOLDOUT != ''
        env: { HOLDOUT: '${{ secrets.HEARSAY_HOLDOUT }}' }
        run: printf '%s' "$HOLDOUT" > suites/app.holdout.yaml && npx -y @hearsayhq/cli run suites/app.yaml --holdout
```

## For coding agents

Hearsay itself is an MCP server and Agent Skills, so the agent building your add-on can run it,
fix what it finds, and rerun, without anyone in the loop.

**Claude Code**

```sh
claude mcp add hearsay -- npx -y @hearsayhq/mcp          # once published
claude mcp add hearsay -- npx tsx /path/to/hearsay/packages/mcp/src/index.ts   # from a clone
mkdir -p .claude/skills && cp -r /path/to/hearsay/skills/{write-hearsay-suite,fix-hearsay-findings} .claude/skills/
```

**Kiro** (`.kiro/settings/mcp.json`)

```json
{ "mcpServers": { "hearsay": { "command": "npx", "args": ["-y", "@hearsayhq/mcp"] } } }
```

Tools: `hearsay_run(suitePath, only?)` (`only: "failed"` reruns what failed), `hearsay_lint(url)`
(findings and the server's tool list), `hearsay_explain(checkId)`. No tool writes suites.

Skills: `write-hearsay-suite` drafts a new suite from the tool list, with expectations a customer
would have, never what the server happens to do; the owner reviews and locks it.
`fix-hearsay-findings` changes server code until the suite is green and never touches suites.

**Protect your suites.** `npm run hearsay -- lock` hashes them into `suites/.hearsay-lock`; commit
it. A run whose suites changed since is red (`suite.integrity`), so an agent cannot make itself
green by editing expectations. Suite changes go through normal pull requests; optionally make them
need review:

```
# .github/CODEOWNERS
/suites/ @your-team
```

## Layout

```
packages/mandate   mandate policy (authorize, expiry, limits)
packages/engine    session, runner, orchestrators, perturbations, checks, report
packages/kit       building blocks for voice-ready servers: speak, refuse, looseEnum, looseInt,
                   confirm, VerbalTokens, withMandate, serveMcp
packages/cli       hearsay validate | checks | run | lint | gen-variants | serve
packages/web       local console: talk, timeline, findings
packages/mcp       Hearsay as an MCP server for coding agents: run, lint, explain
skills/            Agent Skills: write-hearsay-suite, fix-hearsay-findings
servers/           reference MCP servers: kitchen, smart-home, household-orders
suites/            YAML suites (+ cassettes and recorded variants for replay)
docs/              spec pack
```

## Docs

[Thesis](docs/00_PRODUCT_THESIS.md) ·
[Requirements](docs/01_REQUIREMENTS.md) ·
[UX](docs/02_UX_SPEC.md) ·
[Domain](docs/03_DOMAIN_AND_STATE.md) ·
[Architecture](docs/04_ARCHITECTURE.md) ·
[Checks](docs/05_CHECK_CATALOG.md) ·
[Security](docs/06_SECURITY_MODEL.md) ·
[Plan](docs/07_IMPLEMENTATION_PLAN.md) ·
[Eval](docs/08_EVAL_AND_TEST_PLAN.md) ·
[Submission](docs/09_DEMO_AND_SUBMISSION.md) ·
[Feedback](docs/10_FEEDBACK.md) ·
[Devpost draft](docs/11_DEVPOST_DRAFT.md) ·
[Decisions](docs/12_DECISIONS.md) ·
[Risks](docs/13_RISK_REGISTER.md) ·
[Sources](docs/14_SOURCE_REGISTER.md) ·
[Experiment](docs/15_EXPERIMENT.md) ·
[Roadmap](docs/ROADMAP.md) ·
[Friction log](docs/FRICTION_LOG.md)

## License

MIT
