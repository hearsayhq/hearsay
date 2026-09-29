#!/usr/bin/env node
/**
 * hearsay CLI. Commands and exit codes: docs/04_ARCHITECTURE.md §CLI contract.
 *   validate <suite.yaml...>   parse suites against the schema                  (works now)
 *   checks                     catalog by question, with thresholds and sources (works now)
 *   run <suite.yaml...>        run suites, print findings, exit 1 on error      (M1)
 *   lint <url>                 server-scope checks only, no utterances          (M2)
 *   gen-variants <suite.yaml>  record real mishearings via TTS → noise → STT    (M3)
 *   serve                      engine API + live traces for the console         (M5)
 */
import { parseArgs } from 'node:util';
import { CHECKS, ConnectError, IMPLEMENTED, PERTURBATIONS, QUESTIONS, QUESTION_ORDER, ensureServer, exitCodeFor, loadSuite, runSuite, writeReport } from '@hearsayhq/engine';
import { printReport } from './print';

const [cmd, ...args] = process.argv.slice(2);

async function main(): Promise<number> {
  switch (cmd) {
    case 'validate': {
      if (!args.length) return usage();
      let bad = 0;
      for (const f of args) {
        try {
          const s = await loadSuite(f);
          console.log(`ok   ${f}  (${s.suite}: ${s.cases.length} cases, ${s.orchestrator})`);
        } catch (e) {
          bad++;
          console.error(`FAIL ${(e as Error).message}`);
        }
      }
      return bad ? 1 : 0;
    }
    case 'checks': {
      for (const q of QUESTION_ORDER) {
        console.log(`\n${QUESTIONS[q]}`);
        for (const c of CHECKS.filter((x) => x.question === q)) {
          const tags = [c.priority, c.profile && `profile:${c.profile}`, c.alwaysOn && 'always-on'].filter(Boolean).join(' ');
          console.log(`  ${IMPLEMENTED.has(c.id) ? '●' : '○'} ${c.id.padEnd(32)} ${tags.padEnd(22)} ${c.summary}`);
          for (const t of c.thresholds) console.log(`      ${t.severity.padEnd(5)} ${t.when}  [${t.source.kind}]`);
        }
      }
      console.log('\nPerturbations');
      for (const p of PERTURBATIONS)
        console.log(`  ${p.status === 'implemented' ? '●' : '○'} ${p.id.padEnd(32)} ${p.priority.padEnd(6)} ${p.scripted ? 'scripted+llm' : 'llm only   '}  ${p.example}`);
      return 0;
    }
    case 'run':
      return run(args);
    case 'lint':
    case 'gen-variants':
    case 'serve':
      console.error(`"hearsay ${cmd}" is planned; see docs/07_IMPLEMENTATION_PLAN.md.`);
      return 2;
    default:
      return usage();
  }
}

async function run(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      only: { type: 'string', multiple: true },
      orchestrator: { type: 'string' },
      verbose: { type: 'boolean', short: 'v' },
      'no-start': { type: 'boolean' },
    },
  });
  if (!positionals.length) return usage();
  const orchestrator = values.orchestrator as 'scripted' | 'llm' | 'replay' | undefined;
  if (orchestrator && orchestrator !== 'scripted') {
    console.error(`orchestrator "${orchestrator}" is planned for M3; see docs/07.`);
    return 2;
  }
  let exit: 0 | 1 = 0;
  for (const file of positionals) {
    let suite;
    try {
      suite = await loadSuite(file);
    } catch (e) {
      console.error((e as Error).message);
      return 2;
    }
    const server = values['no-start'] ? { started: false, stop: async () => undefined } : await ensureServer(suite.server).catch((e) => e as Error);
    if (server instanceof Error) {
      console.error(server.message);
      return 2;
    }
    try {
      const report = await runSuite(suite, { only: values.only, orchestrator });
      const path = await writeReport(report);
      printReport(report, path, values.verbose);
      if (exitCodeFor(report)) exit = 1;
    } catch (e) {
      console.error(e instanceof ConnectError ? e.message : (e as Error).stack);
      return 2;
    } finally {
      await server.stop();
    }
  }
  return exit;
}

function usage(): number {
  console.error('usage: hearsay <validate|checks|run|lint|gen-variants|serve> [...]');
  return 2;
}

process.exitCode = await main();
