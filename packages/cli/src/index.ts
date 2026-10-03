#!/usr/bin/env node
/**
 * hearsay CLI. Commands and exit codes: docs/04_ARCHITECTURE.md §CLI contract.
 *   validate <suite.yaml...>   parse suites against the schema                  (works now)
 *   checks                     catalog by question, with thresholds and sources (works now)
 *   run <suite.yaml...>        run suites, print findings, exit 1 on error      (M1)
 *   lint <url>                 server-scope checks only, no utterances          (M2)
 *   gen-variants <suite.yaml>  record real mishearings via TTS → noise → STT    (M3)
 *   lock [suite.yaml...]       hash suites into suites/.hearsay-lock            (works now)
 *   serve                      engine API + live traces for the console         (M5)
 */
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { CHECKS, ConnectError, DEFAULT_VOICES, IMPLEMENTED, readRecorded, staleCases, PollyTts, serveConsole, TranscribeStt, genVariants, loadHoldout, PERTURBATIONS, QUESTIONS, QUESTION_ORDER, RecordingProvider, ReplayProvider, cassetteEntries, cassettePathFor, ensureServer, exitCodeFor, lintServer, loadCassette, loadSuite, lockSuites, providerFromEnv, runSuite, saveCassette, writeReport, type Cassette, type ModelProvider } from '@hearsayhq/engine';
import { printReport } from './print';

const [cmd, ...args] = process.argv.slice(2);

const HELP: Record<string, string> = {
  validate: 'validate <suite...>                 check suite files',
  checks: 'checks                              the catalog by question, with thresholds and sources',
  run: 'run <suite...> [--only id] [--holdout] [--orchestrator scripted|llm|replay] [--record] [--seed n] [--no-start] [-v]',
  lint: 'lint <url> [-v]                     lint a running MCP server',
  lock: 'lock [suite...]                     lock suites and their recordings into suites/.hearsay-lock',
  'gen-variants': 'gen-variants <suite...> [--all]     record mishearings (Polly → phone line → Transcribe; AWS); new or changed sentences only',
  serve: 'serve [--port 4100]                 the console',
};

/** Recordings made for a sentence the case no longer says; runs skip them. */
async function warnStale(file: string, suite: Awaited<ReturnType<typeof loadSuite>>): Promise<void> {
  const stale = staleCases(await readRecorded(file, suite.suite), suite);
  if (stale.length) console.error(`note ${file}: recorded mishearings for ${stale.join(', ')} belong to an earlier sentence and are skipped; run hearsay gen-variants ${file}`);
}

async function main(): Promise<number> {
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h' || args.includes('--help') || args.includes('-h')) {
    const lines = HELP[cmd ?? ''] ? [HELP[cmd!]!] : Object.values(HELP);
    console.log(lines.map((l) => `hearsay ${l}`).join('\n'));
    return cmd && !HELP[cmd] && !['help', '--help', '-h'].includes(cmd) ? 2 : 0;
  }
  switch (cmd) {
    case 'validate': {
      if (!args.length) return usage();
      let bad = 0;
      for (const f of args) {
        try {
          if (f.endsWith('.holdout.yaml')) {
            const suitePath = f.replace(/\.holdout\.yaml$/, '.yaml');
            const cases = await loadHoldout(suitePath, await loadSuite(suitePath));
            console.log(`ok   ${f}  (holdout: ${cases.length} cases)`);
            continue;
          }
          const s = await loadSuite(f);
          console.log(`ok   ${f}  (${s.suite}: ${s.cases.length} cases, ${s.orchestrator})`);
          await warnStale(f, s);
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
      return lint(args);
    case 'lock':
      return lock(args);
    case 'gen-variants':
      return genVariantsCmd(args);
    case 'serve': {
      const { values } = parseArgs({ args, options: { port: { type: 'string' } } });
      // The published CLI ships the built console next to itself; in the repo, Vite serves it.
      const consoleDir = fileURLToPath(new URL('./console/', import.meta.url));
      const bundled = existsSync(consoleDir);
      const served = await serveConsole({ port: Number(values.port ?? 4100), ...(bundled ? { consoleDir } : {}) });
      console.log(bundled ? `hearsay serve: console on ${served.url}` : `hearsay serve: engine API on ${served.url}/api (console: npm run dev:web → http://localhost:5180)`);
      const stop = () => void served.close().then(() => process.exit(0));
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
      return new Promise<number>(() => undefined);
    }
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
      holdout: { type: 'boolean' },
      seed: { type: 'string' },
      record: { type: 'boolean' },
    },
  });
  if (!positionals.length) return usage();
  const orchestrator = values.orchestrator as 'scripted' | 'llm' | 'replay' | undefined;
  if (orchestrator && !['scripted', 'llm', 'replay'].includes(orchestrator)) return usage();
  if (values.record && orchestrator !== 'llm') {
    console.error('--record needs --orchestrator llm.');
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
    const mode = orchestrator ?? suite.orchestrator;
    let provider: ModelProvider | undefined;
    let cassette: Cassette | undefined;
    try {
      if (mode === 'replay') provider = new ReplayProvider(await loadCassette(cassettePathFor(file, suite.suite)));
      if (mode === 'llm') {
        provider = providerFromEnv();
        if (values.record) provider = new RecordingProvider(provider, (cassette = { provider: provider.id, model: provider.id, recordedAt: new Date().toISOString(), entries: {} }));
      }
    } catch (e) {
      await server.stop();
      console.error((e as Error).message);
      return 2;
    }
    try {
      const report = await runSuite(suite, { only: values.only, orchestrator, suitePath: file, holdout: values.holdout, ...(provider ? { provider } : {}), ...(values.seed ? { seed: Number(values.seed) } : {}) });
      if (cassette) {
        const path = cassettePathFor(file, suite.suite);
        await saveCassette(path, cassette);
        console.error(`recorded ${cassetteEntries(cassette).length} model calls to ${path}; the recording is locked with the suite: review it, then run hearsay lock`);
      }
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

async function lock(argv: string[]): Promise<number> {
  const files = argv.length ? argv : (await readdir('suites')).filter((f) => f.endsWith('.yaml') && !f.endsWith('.holdout.yaml')).map((f) => join('suites', f));
  for (const f of files) await warnStale(f, await loadSuite(f)); // never lock an invalid suite
  const path = await lockSuites(files);
  console.log(`locked ${files.length} suite${files.length === 1 ? '' : 's'} in ${path}`);
  return 0;
}

async function genVariantsCmd(argv: string[]): Promise<number> {
  const { values, positionals: files } = parseArgs({ args: argv, allowPositionals: true, options: { all: { type: 'boolean' } } });
  if (!files.length) return usage();
  const voices = (process.env.HEARSAY_POLLY_VOICES ?? DEFAULT_VOICES.join(',')).split(',').map((v) => new PollyTts(v.trim()));
  const stt = new TranscribeStt();
  for (const f of files) {
    const suite = await loadSuite(f);
    try {
      const out = await genVariants(suite, f, voices, stt, { all: values.all ?? false });
      if (!out) {
        console.log(`${suite.suite}: no case lists asr.roundtrip in fuzz; nothing to record`);
        continue;
      }
      const { path, file, recorded } = out;
      const n = Object.values(file.cases).reduce((s, v) => s + v.length, 0);
      const kept = Object.keys(file.cases).length - recorded.length;
      console.log(`${suite.suite}: ${n} mishearings for ${Object.keys(file.cases).length} cases → ${path} (spoken: ${recorded.length}, kept: ${kept})`);
      if (recorded.length) console.log(`  the recordings are locked with the suite: review the file, then run hearsay lock`);
    } catch (e) {
      console.error(`gen-variants needs AWS credentials with Polly and Transcribe access (docs/04): ${(e as Error).message}`);
      return 2;
    }
  }
  return 0;
}

async function lint(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { verbose: { type: 'boolean', short: 'v' } } });
  const [url] = positionals;
  if (!url || positionals.length > 1) return usage();
  try {
    const report = await lintServer(url);
    const path = await writeReport(report);
    printReport(report, path, values.verbose);
    return exitCodeFor(report);
  } catch (e) {
    console.error(e instanceof ConnectError ? e.message : (e as Error).stack);
    return 2;
  }
}

function usage(): number {
  console.error(`usage: hearsay ${HELP[cmd!] ?? '<validate|checks|run|lint|lock|gen-variants|serve> [...]  (hearsay --help)'}`);
  return 2;
}

process.exitCode = await main().catch((e: Error & { code?: string }) => {
  if (e.code !== 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && e.code !== 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE') throw e;
  console.error(`${e.message.split('.')[0]}.\nhearsay ${HELP[cmd!] ?? Object.values(HELP).join('\nhearsay ')}`);
  return 2;
});
