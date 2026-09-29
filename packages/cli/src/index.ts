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
import { CHECKS, PERTURBATIONS, QUESTIONS, QUESTION_ORDER, loadSuite } from '@hearsayhq/engine';

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
          console.log(`  ${c.status === 'implemented' ? '●' : '○'} ${c.id.padEnd(32)} ${tags.padEnd(22)} ${c.summary}`);
          for (const t of c.thresholds) console.log(`      ${t.severity.padEnd(5)} ${t.when}  [${t.source.kind}]`);
        }
      }
      console.log('\nPerturbations');
      for (const p of PERTURBATIONS)
        console.log(`  ${p.status === 'implemented' ? '●' : '○'} ${p.id.padEnd(32)} ${p.priority.padEnd(6)} ${p.scripted ? 'scripted+llm' : 'llm only   '}  ${p.example}`);
      return 0;
    }
    case 'run':
    case 'lint':
    case 'gen-variants':
    case 'serve':
      console.error(`"hearsay ${cmd}" is planned; see docs/07_IMPLEMENTATION_PLAN.md.`);
      return 2;
    default:
      return usage();
  }
}

function usage(): number {
  console.error('usage: hearsay <validate|checks|run|lint|gen-variants|serve> [...]');
  return 2;
}

process.exitCode = await main();
