/**
 * `hearsay serve` (FR-040): the engine behind the console, on localhost. HTTP for actions,
 * Server-Sent Events for turns, findings and elicitations. Verdicts come only from here.
 */
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { serve as serveNode } from '@hono/node-server';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { CHECKS, QUESTIONS, QUESTION_ORDER } from '../catalog';
import { ensureServer, type RunningServer } from '../server-process';
import { runSuite } from '../runner';
import { writeReport } from '../report-file';
import { loadSuite } from '../suite';
import { ConsoleSession, type ConsoleEvent } from './session-hub';

export interface ServeOptions {
  port?: number;
  /** Project root: suites/ and reports/ live here. */
  cwd?: string;
}

export function createConsoleApp(opts: ServeOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const sessions = new Map<string, ConsoleSession>();
  // Servers the console started: shared by sessions and suite runs, stopped when serve stops.
  const started: RunningServer[] = [];
  const ensure = async (server: { url: string; start?: string }) => {
    const running = await ensureServer(server, { cwd });
    if (running.started) started.push(running);
    return running;
  };
  const app = new Hono().basePath('/api');

  app.get('/health', (c) => c.json({ ok: true }));
  app.get('/catalog', (c) => c.json({ questions: QUESTION_ORDER.map((q) => ({ id: q, text: QUESTIONS[q] })), checks: CHECKS }));
  app.get('/suites', async (c) => {
    const files = (await readdir(join(cwd, 'suites'))).filter((f) => f.endsWith('.yaml') && !f.endsWith('.holdout.yaml'));
    const suites = await Promise.all(files.map(async (f) => {
      const s = await loadSuite(join(cwd, 'suites', f));
      return { path: `suites/${f}`, suite: s.suite, url: s.server.url, description: s.description ?? '', cases: s.cases.map((x) => ({ id: x.id, say: Array.isArray(x.say) ? x.say.join(' / ') : x.say })) };
    }));
    return c.json(suites);
  });

  app.post('/connect', async (c) => {
    const { suitePath } = await c.req.json<{ suitePath: string }>();
    const suite = await loadSuite(resolve(cwd, suitePath));
    const running = await ensure(suite.server).catch((e: Error) => e);
    if (running instanceof Error) return c.json({ error: running.message }, 502);
    const cs = await ConsoleSession.open(suite.server.url, suite);
    sessions.set(cs.id, cs);
    return c.json({ sessionId: cs.id, server: cs.session.serverInfo(), tools: cs.session.tools, planner: cs.planner, suite: { suite: suite.suite, budget: suite.budget, latencyModel: suite.latencyModel, cases: suite.cases.map((x) => ({ id: x.id, say: x.say })) } });
  });

  app.post('/say', async (c) => {
    const { sessionId, text } = await c.req.json<{ sessionId: string; text: string }>();
    const cs = sessions.get(sessionId);
    if (!cs) return c.json({ error: 'no such session' }, 404);
    // Answer immediately; the turn arrives over SSE (it may wait for the person's yes).
    void cs.say(text).catch((e: Error) => cs.emit('event', { type: 'turn', data: { error: e.message } } satisfies ConsoleEvent));
    return c.json({ accepted: true });
  });

  app.post('/elicitation/:id', async (c) => {
    const { sessionId, action } = await c.req.json<{ sessionId: string; action: 'accept' | 'decline' | 'cancel' }>();
    const ok = sessions.get(sessionId)?.answer(c.req.param('id'), action) ?? false;
    return c.json({ ok }, ok ? 200 : 404);
  });

  app.get('/events/:sessionId', (c) => {
    const cs = sessions.get(c.req.param('sessionId'));
    if (!cs) return c.json({ error: 'no such session' }, 404);
    return streamSSE(c, async (stream) => {
      const onEvent = (e: ConsoleEvent) => void stream.writeSSE({ event: e.type, data: JSON.stringify(e.data) });
      cs.on('event', onEvent);
      await stream.writeSSE({ event: 'ready', data: JSON.stringify({ planner: cs.planner }) });
      while (!stream.aborted) await stream.sleep(15_000).then(() => stream.writeSSE({ event: 'ping', data: '{}' }));
      cs.off('event', onEvent);
    });
  });

  app.post('/disconnect', async (c) => {
    const { sessionId } = await c.req.json<{ sessionId: string }>();
    await sessions.get(sessionId)?.close();
    sessions.delete(sessionId);
    return c.json({ ok: true });
  });

  app.post('/run', async (c) => {
    const { suitePath } = await c.req.json<{ suitePath: string }>();
    const abs = resolve(cwd, suitePath);
    const suite = await loadSuite(abs);
    const running = await ensure(suite.server).catch((e: Error) => e);
    if (running instanceof Error) return c.json({ error: running.message }, 502);
    const report = await runSuite(suite, { suitePath: abs });
    const path = await writeReport(report, join(cwd, 'reports'));
    return c.json({ report, reportPath: `reports/${basename(path)}` });
  });

  app.get('/reports/:name', async (c) => {
    const name = basename(c.req.param('name'));
    try {
      return c.json(JSON.parse(await readFile(join(cwd, 'reports', name), 'utf8')));
    } catch {
      return c.json({ error: 'no such report' }, 404);
    }
  });

  return {
    app,
    async closeAll() {
      for (const cs of sessions.values()) await cs.close();
      for (const running of started) await running.stop();
    },
  };
}

export function serveConsole(opts: ServeOptions = {}): Promise<{ url: string; close(): Promise<void> }> {
  const { app, closeAll } = createConsoleApp(opts);
  return new Promise((resolveUrl) => {
    const server = serveNode({ fetch: app.fetch, port: opts.port ?? 4100, hostname: '127.0.0.1' }, (info) =>
      resolveUrl({
        url: `http://localhost:${info.port}/api`,
        close: async () => {
          await closeAll();
          await new Promise<void>((r) => server.close(() => r()));
        },
      }),
    );
  });
}
