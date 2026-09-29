import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSuite } from './suite';

const dir = join(import.meta.dirname, '../../../suites');

describe('bundled suites', async () => {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml'));

  it('exist', () => expect(files.length).toBeGreaterThanOrEqual(3));

  for (const f of files) {
    it(`${f} is valid`, async () => {
      const s = await loadSuite(join(dir, f));
      expect(s.cases.length).toBeGreaterThan(0);
      expect(s.budget.firstAudioMs).toBeGreaterThan(0);
    });
  }
});
