/**
 * Hearsay as an MCP server (FR-034): a thin wrapper around the engine for coding
 * agents. No logic of its own; no tool writes suites (D-021); holdouts are never
 * loaded here (D-018).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CHECKS, QUESTIONS, ensureServer, lintServer, loadSuite, runSuite, writeReport, type Report } from '@hearsayhq/engine';
import { refuse } from '@hearsayhq/kit';
import { EXAMPLES } from './examples';
import { summarize } from './format';

export interface HearsayServerOptions {
  /** Project root: suite paths and reports/ resolve against it. Default: process.cwd(). */
  cwd?: string;
}

const text = (t: string, structured?: Record<string, unknown>) => ({ content: [{ type: 'text' as const, text: t }], ...(structured ? { structuredContent: structured } : {}) });

export function createHearsayServer(opts: HearsayServerOptions = {}): McpServer {
  const cwd = opts.cwd ?? process.cwd();
  const reportsDir = join(cwd, 'reports');
  const lastRuns = new Map<string, Report>();
  const server = new McpServer({ name: 'hearsay', version: '0.1.0' });

  async function lastReport(suiteName: string, abs: string): Promise<Report | undefined> {
    const mem = lastRuns.get(abs);
    if (mem) return mem;
    try {
      const prefix = suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const files = (await readdir(reportsDir)).filter((f) => f.startsWith(`${prefix}-`) && f.endsWith('.json')).sort();
      const latest = files.at(-1);
      return latest ? (JSON.parse(await readFile(join(reportsDir, latest), 'utf8')) as Report) : undefined;
    } catch {
      return undefined;
    }
  }

  server.registerTool(
    'hearsay_run',
    {
      title: 'Run a Hearsay suite',
      description:
        'Use when you need to know whether the add-on server works for people who talk to it. Plays the suite against the server (starting it from the suite if nothing answers) and returns every finding with its rule, source and fix. Pass only: "failed" to rerun the cases that failed last time. Fix the server, never the suite.',
      inputSchema: {
        suitePath: z.string().min(1).describe('Path of the suite file, relative to the project root, such as suites/smart-home.yaml.'),
        only: z.union([z.array(z.string()), z.literal('failed')]).optional().describe('Case ids to run, or "failed" for the cases that failed in the last run of this suite.'),
        verbose: z.boolean().optional().describe('Also return what was heard, called and spoken in every turn.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ suitePath, only, verbose }) => {
      const abs = resolve(cwd, suitePath);
      let suite;
      try {
        suite = await loadSuite(abs);
      } catch (e) {
        return refuse(`That suite could not be loaded. Check the path and the file: ${(e as Error).message.split('\n')[0]!.slice(0, 120)}`.replace(/[{}[\]]/g, ''), 'SUITE_INVALID');
      }
      let ids: string[] | undefined;
      let rerun: string[] | undefined;
      if (only === 'failed') {
        const last = await lastReport(suite.suite, abs);
        const failed = [...new Set(last?.cases.filter((c) => c.verdict === 'fail').map((c) => c.caseId) ?? [])];
        if (failed.length) ids = rerun = failed;
      } else if (only) ids = only;

      const started = await ensureServer(suite.server, { cwd }).catch((e: Error) => e);
      if (started instanceof Error) return text(`Cannot reach the server: ${started.message}`, { verdict: 'error', error: started.message });
      try {
        const report = await runSuite(suite, { ...(ids ? { only: ids } : {}), suitePath: abs });
        if (!ids) lastRuns.set(abs, report);
        else {
          // keep the full picture for the next "failed": merge rerun cases into the last full run
          const prev = lastRuns.get(abs);
          if (prev) lastRuns.set(abs, { ...prev, cases: [...prev.cases.filter((c) => !ids!.includes(c.caseId)), ...report.cases] });
        }
        const path = await writeReport(report, reportsDir);
        const { text: t, structured } = summarize(report, relative(cwd, path), { verbose, ...(rerun ? { rerun } : {}) });
        return text(t, structured);
      } catch (e) {
        return text(`The run failed: ${(e as Error).message}`, { verdict: 'error', error: (e as Error).message });
      } finally {
        await started.stop();
      }
    },
  );

  server.registerTool(
    'hearsay_lint',
    {
      title: 'Lint an MCP server for voice',
      description: 'Use when you want a quick check of an MCP server without a suite: protocol version, tool names, descriptions, schemas and annotations. Needs the server to be running at the URL.',
      inputSchema: { url: z.string().url().describe('Streamable HTTP URL of the MCP server, such as http://localhost:4102/mcp.') },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url }) => {
      try {
        const report = await lintServer(url);
        const path = await writeReport(report, reportsDir);
        const { text: t, structured } = summarize(report, relative(cwd, path));
        return text(t, structured);
      } catch (e) {
        return text(`Cannot lint ${url}: ${(e as Error).message}`, { verdict: 'error', error: (e as Error).message });
      }
    },
  );

  server.registerTool(
    'hearsay_explain',
    {
      title: 'Explain a Hearsay check',
      description: 'Use when a finding is unclear: returns the rule behind a check id, its thresholds and sources, the kit block that fixes it, and a short before and after.',
      inputSchema: { checkId: z.string().min(1).describe('Check id from a finding, such as speak.no_structured_dump.') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ checkId }) => {
      const c = CHECKS.find((x) => x.id === checkId);
      if (!c) return refuse(`There is no check called ${checkId.replace(/[_{}[\]]/g, ' ')}. Use the check id exactly as a finding names it.`, 'UNKNOWN_CHECK');
      const ex = EXAMPLES[c.id];
      const lines = [
        `${c.id} — ${QUESTIONS[c.question]} ${c.summary}`,
        ...c.thresholds.map((t) => `  ${t.severity}: ${t.when}${t.value !== undefined ? ` (${t.value}${t.budgetKey ? `, suite budget.${t.budgetKey}` : ''})` : ''} — [${t.source.kind}] ${t.source.ref}${t.source.url ? ` ${t.source.url}` : ''}`),
        ...(c.kit ? [`fix with: ${c.kit}() from @hearsayhq/kit`] : []),
        ...(ex ? [`before: ${ex.before}`, `after: ${ex.after}`] : []),
        `status: ${c.status}${c.profile ? `, only for servers with the ${c.profile} profile` : ''}`,
      ];
      return text(lines.join('\n'), { check: c, example: ex ?? null });
    },
  );

  return server;
}
