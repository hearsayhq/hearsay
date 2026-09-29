import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECKS, PERTURBATIONS, QUESTION_ORDER } from './catalog';

const doc = await readFile(join(import.meta.dirname, '../../../docs/05_CHECK_CATALOG.md'), 'utf8');

describe('check catalog', () => {
  it('ids are unique', () => expect(new Set(CHECKS.map((c) => c.id)).size).toBe(CHECKS.length));
  it.each(CHECKS.map((c) => c.id))('%s is documented in docs/05', (id) => expect(doc).toContain(`\`${id}\``));
  it.each(PERTURBATIONS.map((p) => p.id))('%s is documented in docs/05', (id) => expect(doc).toContain(`\`${id}\``));

  it('every question has at least one check', () =>
    expect(QUESTION_ORDER.filter((q) => !CHECKS.some((c) => c.question === q))).toEqual([]));

  it.each(CHECKS.map((c) => [c.id, c] as const))('%s has thresholds, each with a source', (_, c) => {
    expect(c.thresholds.length).toBeGreaterThan(0);
    for (const t of c.thresholds) {
      expect(t.source.ref.length).toBeGreaterThan(0);
      if (t.source.kind !== 'hearsay') expect(t.source.url).toMatch(/^https:\/\//);
    }
  });

  it('suites can only tune Hearsay thresholds, never Amazon or MCP ones (D-011)', () => {
    const tunable = CHECKS.flatMap((c) => c.thresholds).filter((t) => t.budgetKey);
    expect(tunable.length).toBeGreaterThan(0);
    for (const t of tunable) expect(t.source.kind).toBe('hearsay');
  });
});
