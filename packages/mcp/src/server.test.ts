/** The Hearsay MCP server: dogfood (it passes its own checks) and the agent-facing tools. */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { lintServer, lockSuites } from '@hearsayhq/engine';
import { serveMcp, type Served } from '@hearsayhq/kit';
import { startSmartHome } from '@hearsayhq/server-smart-home';
import { createHearsayServer } from './server';

let home: Served;
let dir: string;
let client: Client;

const call = async (name: string, args: Record<string, unknown>) => {
  const r = await client.callTool({ name, arguments: args });
  return { text: (r.content as Array<{ text: string }>)[0]!.text, structured: r.structuredContent as Record<string, any>, isError: r.isError };
};

beforeAll(async () => {
  home = await startSmartHome(0, false);
  dir = await mkdtemp(join(tmpdir(), 'hearsay-mcp-'));
  const suite = (await readFile(join(import.meta.dirname, '../../../suites/smart-home.yaml'), 'utf8')).replace('http://localhost:4102/mcp', home.url).replace(/\n  start: .*\n/, '\n');
  await writeFile(join(dir, 'smart-home.yaml'), suite);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createHearsayServer({ cwd: dir }).connect(a);
  client = new Client({ name: 'agent', version: '0' });
  await client.connect(b);
});
afterAll(() => home.close());

describe('dogfood (FR-034)', () => {
  it('passes its own protocol and lint checks', async () => {
    const served = await serveMcp({ port: 0, create: () => createHearsayServer({ cwd: dir }) });
    try {
      expect((await lintServer(served.url)).serverFindings).toEqual([]);
    } finally {
      await served.close();
    }
  });
});

describe('hearsay_run', () => {
  it('returns compact findings with rule, source and a kit fix', async () => {
    const r = await call('hearsay_run', { suitePath: 'smart-home.yaml' });
    expect(r.structured.verdict).toBe('red');
    const dump = r.structured.findings.find((f: any) => f.checkId === 'speak.no_structured_dump');
    expect(dump).toMatchObject({ severity: 'error', caseId: 'living-room-off', variant: 'clean', source: { kind: 'amazon-fr' } });
    expect(dump.hint).toContain('speak()');
    expect(r.text).toMatch(/^smart-home: RED/);
    expect(r.structured.traces).toBeUndefined();
  }, 30_000);

  it('reruns only the failed cases', async () => {
    const r = await call('hearsay_run', { suitePath: 'smart-home.yaml', only: 'failed' });
    expect(r.text).toContain('rerun of failed: living-room-off, whole-home-off-needs-confirmation, dim-bedroom');
  }, 30_000);

  it('turns red when a locked suite was edited (suite.integrity)', async () => {
    const path = join(dir, 'smart-home.yaml');
    await lockSuites([path]);
    await writeFile(path, (await readFile(path, 'utf8')).replace('spokenIncludes: [okay]', 'spokenIncludes: []'));
    const r = await call('hearsay_run', { suitePath: 'smart-home.yaml', only: ['dim-bedroom'] });
    expect(r.structured.findings[0]).toMatchObject({ checkId: 'suite.integrity', severity: 'error' });
  }, 30_000);
});

describe('hearsay_explain', () => {
  it('explains a check with source, kit block and before/after', async () => {
    const r = await call('hearsay_explain', { checkId: 'speak.no_structured_dump' });
    expect(r.text).toContain('fix with: speak() from @hearsayhq/kit');
    expect(r.text).toContain('before: {"ok":true');
  });
  it('refuses an unknown id in words', async () => {
    const r = await call('hearsay_explain', { checkId: 'speak.everything' });
    expect(r.isError).toBe(true);
  });
});
