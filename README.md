# Earshot

**Test and trace engine for MCP servers behind voice assistants.**
Unofficial; built for Alexa+ add-on developers; not affiliated with Amazon.

Earshot runs utterances against a live MCP server, perturbs them the way speech recognition does,
measures where every millisecond of a spoken turn goes, judges replies as something a person has
to listen to, and checks that consequential actions only happen with the person's consent.
It gives you a trace to look at and a verdict CI can block on.

> Status: **M0 foundation.** Contracts, suite format, check catalog and the mandate policy are in
> place. The runner lands in M1. See [docs/07](docs/07_IMPLEMENTATION_PLAN.md).

## Quickstart (current)

```sh
npm install
npm run check
npm run earshot -- validate suites/*.yaml
npm run earshot -- checks
```

## Layout

```
packages/mandate   mandate policy (authorize, expiry, limits)
packages/engine    session, runner, orchestrators, perturbations, checks, report
packages/cli       earshot validate | checks | run | lint | serve
packages/web       local console: voice, timeline, findings
servers/           reference MCP servers: kitchen, smart-home, household-orders
suites/            YAML suites (+ cassettes for replay)
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
[Friction log](docs/FRICTION_LOG.md)

## License

MIT
