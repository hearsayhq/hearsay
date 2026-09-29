/** FR-018: holdout cases run only with --holdout, are counted apart, and never reach agents. */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { exitCodeFor, loadSuite, runSuite } from '../src/index';
import { fakeServer, twoTools } from './fakes';

let served: Served;
let suitePath: string;
beforeAll(async () => {
  served = await fakeServer(twoTools);
  const dir = await mkdtemp(join(tmpdir(), 'hearsay-holdout-'));
  suitePath = join(dir, 'lights.yaml');
  await writeFile(suitePath, `suite: lights\nserver: { url: ${served.url} }\ncases:\n  - id: off\n    say: turn off the kitchen lights\n    expect: { tool: lights_off, args: { room: kitchen } }\n`);
  await writeFile(join(dir, 'lights.holdout.yaml'), `cases:\n  - id: hidden-on\n    say: turn on the hall lights\n    call: { tool: lights_on, args: { room: hall } }\n    expect: { tool: lights_on, spokenIncludes: [bedroom] }\n`);
});
afterAll(() => served.close());

describe('holdout', () => {
  it('is not run without --holdout', async () => {
    const r = await runSuite(await loadSuite(suitePath), { suitePath });
    expect(r.cases.map((c) => c.caseId)).toEqual(['off']);
    expect(r.holdout).toBeUndefined();
  });
  it('runs with --holdout, marked and counted apart, and fails the gate', async () => {
    const r = await runSuite(await loadSuite(suitePath), { suitePath, holdout: true });
    expect(r.cases.map((c) => [c.caseId, c.holdout ?? false])).toEqual([['off', false], ['hidden-on', true]]);
    expect(r.summary).toMatchObject({ cases: 1, errors: 0 });
    expect(r.holdout).toMatchObject({ cases: 1, failed: 1, errors: 1 });
    expect(exitCodeFor(r)).toBe(1);
  });
  it('is never loaded by the MCP server (no holdout option there)', async () => {
    const src = await readFile(join(import.meta.dirname, '../../mcp/src/server.ts'), 'utf8');
    expect(src).not.toMatch(/holdout:\s*true/);
  });
});
