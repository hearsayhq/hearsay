#!/usr/bin/env node
/**
 * earshot CLI. Commands and exit codes: docs/04_ARCHITECTURE.md §CLI.
 *   validate <suite.yaml...>   parse suites against the schema             (works now)
 *   checks                     list checks and perturbations with status   (works now)
 *   run <suite.yaml...>        run suites, print findings, exit 1 on error (M1)
 *   lint <url>                 server-scope checks only, no utterances     (M2)
 *   serve                      engine API + live traces for the web UI     (M3)
 */
import { CHECKS, PERTURBATIONS, loadSuite } from '@earshot/engine';

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
      for (const c of CHECKS) console.log(`${c.status === 'implemented' ? '●' : '○'} ${c.id.padEnd(34)} ${c.severity.padEnd(5)} ${c.priority.padEnd(6)} ${c.summary}`);
      console.log('');
      for (const p of PERTURBATIONS) console.log(`${p.status === 'implemented' ? '●' : '○'} ${p.id.padEnd(34)} ${p.priority.padEnd(6)} ${p.example}`);
      return 0;
    }
    case 'run':
    case 'lint':
    case 'serve':
      console.error(`"earshot ${cmd}" is planned; see docs/07_IMPLEMENTATION_PLAN.md.`);
      return 2;
    default:
      return usage();
  }
}

function usage(): number {
  console.error('usage: earshot <validate|checks|run|lint|serve> [...]');
  return 2;
}

process.exitCode = await main();
