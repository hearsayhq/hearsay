import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSuite } from './suite';

const dir = join(import.meta.dirname, '../../../suites');

describe('bundled suites', async () => {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml') && !f.endsWith('.holdout.yaml'));

  it('exist', () => expect(files.length).toBeGreaterThanOrEqual(3));

  for (const f of files) {
    it(`${f} is valid`, async () => {
      const s = await loadSuite(join(dir, f));
      expect(s.cases.length).toBeGreaterThan(0);
      expect(s.budget.firstAudioMs).toBeGreaterThan(0);
    });
  }
});

describe('suite semantics', () => {
  const base = { suite: 's', server: { url: 'http://localhost:1/mcp' } };
  it('adds case checks to suite checks (D-015)', async () => {
    const { SuiteSchema, turnChecksFor } = await import('./suite');
    const s = SuiteSchema.parse({ ...base, checks: ['speak.length', 'protocol.version'], cases: [{ id: 'a', say: 'x', expect: { noTool: true }, checks: ['speak.lists'] }] });
    expect(turnChecksFor(s, s.cases[0]!)).toEqual(['case.expect', 'speak.length', 'speak.lists']);
  });
  it('rejects server-scope checks on a case', async () => {
    const { SuiteSchema } = await import('./suite');
    expect(SuiteSchema.safeParse({ ...base, cases: [{ id: 'a', say: 'x', expect: { noTool: true }, checks: ['protocol.version'] }] }).success).toBe(false);
  });
  it('plays one utterance per case in scripted mode', async () => {
    const { SuiteSchema } = await import('./suite');
    expect(SuiteSchema.safeParse({ ...base, cases: [{ id: 'a', say: ['x', 'y'], expect: { noTool: true } }] }).success).toBe(false);
  });
  it('expands after chains depth first, each case once', async () => {
    const { SuiteSchema } = await import('./suite');
    const { setupChain } = await import('./runner');
    const s = SuiteSchema.parse({ ...base, cases: [
      { id: 'grant', say: 'x', expect: { noTool: true } },
      { id: 'stage', say: 'x', after: ['grant'], expect: { noTool: true } },
      { id: 'other', say: 'x', after: ['grant'], expect: { noTool: true } },
      { id: 'checkout', say: 'x', after: ['stage', 'other'], expect: { noTool: true } },
    ] });
    expect(setupChain(s, s.cases[3]!).map((c) => c.id)).toEqual(['grant', 'stage', 'other']);
  });
});
