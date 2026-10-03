import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { suiteIntegrity } from './checks/integrity';
import { checkSuiteIntegrity, lockSuites } from './lock';

const ctx = (suitePath: string) => ({ url: '', tools: [], server: { url: '' }, newPrincipal: () => 'p', suitePath });

describe('suite lock and suite.integrity', () => {
  it('passes an intact suite and fails an edited one as error', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-lock-'));
    const suite = join(dir, 'kitchen.yaml');
    await writeFile(suite, 'expect:\n  spokenIncludes: [pasta]\n');
    await lockSuites([suite]);
    expect((await checkSuiteIntegrity(suite)).state).toBe('intact');
    expect(await suiteIntegrity.run(ctx(suite))).toEqual([]);

    await writeFile(suite, 'expect:\n  spokenIncludes: []\n'); // an agent "fixing" the test
    const [f] = await suiteIntegrity.run(ctx(suite));
    expect(f).toMatchObject({ checkId: 'suite.integrity', severity: 'error', question: 'connect', source: { kind: 'hearsay' } });
  });

  it('locks the recordings with the suite: a deleted variants file or a new cassette is red', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-lock-'));
    const suite = join(dir, 'kitchen.yaml');
    await writeFile(suite, 'suite: kitchen\n');
    await mkdir(join(dir, 'variants'));
    await writeFile(join(dir, 'variants', 'kitchen.json'), '{"cases":{}}\n');
    await lockSuites([suite]);
    expect(await suiteIntegrity.run(ctx(suite))).toEqual([]);

    await rm(join(dir, 'variants', 'kitchen.json'));
    expect((await suiteIntegrity.run(ctx(suite)))[0]?.message).toMatch(/variants\/kitchen\.json was removed/);
    await writeFile(join(dir, 'variants', 'kitchen.json'), '{"cases":{}}\n');
    await mkdir(join(dir, 'cassettes'));
    await writeFile(join(dir, 'cassettes', 'kitchen.json'), '{}\n');
    expect((await suiteIntegrity.run(ctx(suite)))[0]?.message).toMatch(/cassettes\/kitchen\.json was added/);
  });

  it('ignores suites that were never locked', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-lock-'));
    const suite = join(dir, 'new.yaml');
    await writeFile(suite, 'x: 1\n');
    expect(await suiteIntegrity.run(ctx(suite))).toEqual([]);
  });

  it('keeps other entries and sorts them', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-lock-'));
    for (const n of ['b.yaml', 'a.yaml']) await writeFile(join(dir, n), n);
    await lockSuites([join(dir, 'b.yaml')]);
    const path = await lockSuites([join(dir, 'a.yaml')]);
    expect(Object.keys(JSON.parse(await readFile(path, 'utf8')).suites)).toEqual(['a.yaml', 'b.yaml']);
  });
});
