import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createConsoleApp } from './serve';

const { app } = createConsoleApp({ cwd: join(import.meta.dirname, '../../../..') });

describe('hearsay serve API', () => {
  it('serves the catalog grouped by question', async () => {
    const body = (await (await app.request('/api/catalog', { headers: { host: 'localhost:4100' } })).json()) as { questions: { id: string }[]; checks: { id: string }[] };
    expect(body.questions.map((q) => q.id)).toContain('agree');
    expect(body.checks.length).toBeGreaterThan(20);
  });

  it('lists suites without holdouts', async () => {
    const suites = (await (await app.request('/api/suites', { headers: { host: 'localhost:4100' } })).json()) as { path: string }[];
    expect(suites.map((s) => s.path)).toEqual(expect.arrayContaining(['suites/kitchen.yaml', 'suites/household-orders.yaml']));
    expect(suites.some((s) => s.path.includes('holdout'))).toBe(false);
  });

  it('serves a built console at / when given one, and never files outside it', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-console-'));
    await writeFile(join(dir, 'index.html'), '<!doctype html><title>Hearsay</title>');
    const { app: site } = createConsoleApp({ cwd: join(import.meta.dirname, '../../../..'), consoleDir: dir });
    expect(await (await site.request('/')).text()).toContain('<title>Hearsay</title>');
    expect(await (await site.request('/some/route')).text()).toContain('<title>Hearsay</title>');
    expect((await site.request('/%2e%2e/%2e%2e/package.json')).status).toBe(404);
    expect((await site.request('/api/catalog', { headers: { host: '127.0.0.1:4100' } })).headers.get('content-type')).toContain('application/json');
  });

  it('answers unknown sessions with 404', async () => {
    const r = await app.request('/api/say', { method: 'POST', body: JSON.stringify({ sessionId: 'nope', text: 'hi' }), headers: { 'content-type': 'application/json', host: 'localhost:4100' } });
    expect(r.status).toBe(404);
  });

  it('refuses cross-site requests, DNS rebinding and non-JSON posts (it runs server.start commands)', async () => {
    const post = (headers: Record<string, string>, body = JSON.stringify({ suitePath: 'suites/kitchen.yaml' })) => app.request('/api/run', { method: 'POST', body, headers });
    expect((await post({ host: 'localhost:4100', origin: 'https://evil.example', 'content-type': 'application/json' })).status).toBe(403);
    expect((await post({ host: 'evil.example:4100', 'content-type': 'application/json' })).status).toBe(403);
    expect((await post({ host: 'localhost:4100', 'content-type': 'text/plain' })).status).toBe(415);
  });

  it('only opens suites under suites/, never holdouts or other paths', async () => {
    for (const suitePath of ['/etc/passwd', '../suites/kitchen.yaml', 'suites/smart-home.holdout.yaml', 'suites/../package.json'])
      expect((await app.request('/api/connect', { method: 'POST', body: JSON.stringify({ suitePath }), headers: { 'content-type': 'application/json', host: 'localhost:4100' } })).status).toBe(400);
  });
});
