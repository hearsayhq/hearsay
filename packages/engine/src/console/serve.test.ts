import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createConsoleApp } from './serve';

const { app } = createConsoleApp({ cwd: join(import.meta.dirname, '../../../..') });

describe('hearsay serve API', () => {
  it('serves the catalog grouped by question', async () => {
    const body = (await (await app.request('/api/catalog')).json()) as { questions: { id: string }[]; checks: { id: string }[] };
    expect(body.questions.map((q) => q.id)).toContain('agree');
    expect(body.checks.length).toBeGreaterThan(20);
  });

  it('lists suites without holdouts', async () => {
    const suites = (await (await app.request('/api/suites')).json()) as { path: string }[];
    expect(suites.map((s) => s.path)).toEqual(expect.arrayContaining(['suites/kitchen.yaml', 'suites/household-orders.yaml']));
    expect(suites.some((s) => s.path.includes('holdout'))).toBe(false);
  });

  it('answers unknown sessions with 404', async () => {
    const r = await app.request('/api/say', { method: 'POST', body: JSON.stringify({ sessionId: 'nope', text: 'hi' }), headers: { 'content-type': 'application/json' } });
    expect(r.status).toBe(404);
  });
});
