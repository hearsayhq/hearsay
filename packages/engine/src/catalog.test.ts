import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECKS, PERTURBATIONS } from './catalog';

const doc = await readFile(join(import.meta.dirname, '../../../docs/05_CHECK_CATALOG.md'), 'utf8');

describe('check catalog', () => {
  it('ids are unique', () => expect(new Set(CHECKS.map((c) => c.id)).size).toBe(CHECKS.length));
  it.each(CHECKS.map((c) => c.id))('%s is documented in docs/05', (id) => expect(doc).toContain(`\`${id}\``));
  it.each(PERTURBATIONS.map((p) => p.id))('%s is documented in docs/05', (id) => expect(doc).toContain(`\`${id}\``));
});
