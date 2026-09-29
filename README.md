# Hearsay

**Preflight checks for Alexa+ MCP servers. Never act on hearsay.**
Unofficial; built for Alexa+ add-on developers; not affiliated with or endorsed by Amazon.

In law, hearsay is a second-hand statement that doesn't count as evidence. Hearsay makes sure
your server never moves money on what the assistant only thinks it heard.

A crash test for voice add-ons: Hearsay plays through what happens when someone talks to your MCP
server — with mishearings, with waiting, with money — and turns the pull request red where it
breaks. Every check answers one of four questions:

- **Did it hear me right?** Misheard numbers and words; tool names and enums a model can map speech onto.
- **Do I have to wait?** Tool round trips under 500 ms; modeled time to first audio.
- **Can I listen to this?** No JSON, ids or tool names; short replies; at most five options.
- **Did I agree?** Payments, deletions and cancellations only after a confirmation that states what and how much.

Every finding cites its source: Amazon's functional requirements for add-ons, the MCP
specification, or Hearsay's own rule.

> Status: **M1 runner.** `hearsay run` plays suites against a live server (Kitchen passes); six
> checks are implemented, the rest are listed as skipped. See [docs/07](docs/07_IMPLEMENTATION_PLAN.md).

## Quickstart (current)

```sh
npm install
npm run check
npm run hearsay -- validate suites/*.yaml
npm run hearsay -- checks
npm run hearsay -- run suites/kitchen.yaml   # starts the Kitchen server itself
```

Once published: `npx @hearsayhq/cli run suites/kitchen.yaml` (the unscoped npm name `hearsay` is
an unrelated library).

## Layout

```
packages/mandate   mandate policy (authorize, expiry, limits)
packages/engine    session, runner, orchestrators, perturbations, checks, report
packages/kit       building blocks for voice-ready servers: speak, refuse, serveMcp
packages/cli       hearsay validate | checks | run | lint | gen-variants | serve
packages/web       local console: talk, timeline, findings
packages/mcp       Hearsay as an MCP server for coding agents (M6)
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
[Decisions](docs/12_DECISIONS.md) ·
[Risks](docs/13_RISK_REGISTER.md) ·
[Sources](docs/14_SOURCE_REGISTER.md) ·
[Experiment](docs/15_EXPERIMENT.md) ·
[Roadmap](docs/ROADMAP.md) ·
[Friction log](docs/FRICTION_LOG.md)

## License

MIT
