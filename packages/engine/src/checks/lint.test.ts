/** Unit fixtures for tool-list lint on hand-written tool lists (no network). */
import { describe, expect, it } from 'vitest';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { lintDescriptions, lintDestructiveAnnotated, lintSchemaConstraints, lintToolNames } from './lint';
import { listItems, speakLists } from './speak';
import { SuiteSchema } from '../suite';
import type { Trace, Turn } from '../trace';

const tool = (name: string, extra: Partial<Tool> = {}): Tool => ({ name, description: 'Use when the person asks for this particular thing.', inputSchema: { type: 'object', properties: {} }, ...extra });
const ctx = (tools: Tool[]) => ({ tools, url: 'http://localhost:1/mcp', server: { url: '' }, newPrincipal: () => 'p' });
const sev = (fs: Array<{ checkId: string; severity: string }>) => fs.map((f) => `${f.checkId}:${f.severity}`);

describe('lint.tool_names', () => {
  it('warns on synonyms for one intent and on invalid names', async () => {
    expect(sev(await lintToolNames.run(ctx([tool('set_scene'), tool('apply_scene'), tool('set scene!')])))).toEqual(['lint.tool_names:warn', 'lint.tool_names:warn']);
  });
  it('keeps different intents apart', async () => {
    expect(await lintToolNames.run(ctx([tool('timer_start'), tool('timer_list'), tool('timer_cancel'), tool('set_scene'), tool('get_scene')]))).toEqual([]);
  });
});

describe('lint.descriptions', () => {
  it('warns on short descriptions and undescribed parameters', async () => {
    const t = tool('timer_start', { description: 'Starts timer', inputSchema: { type: 'object', properties: { minutes: { type: 'number' } } } });
    expect(sev(await lintDescriptions.run(ctx([t])))).toEqual(['lint.descriptions:warn', 'lint.descriptions:warn']);
  });
});

describe('lint.schema_constraints', () => {
  it('errors on undeclared required parameters, warns on missing bounds and enums', async () => {
    const t = tool('set_scene', { inputSchema: { type: 'object', properties: { room: { type: 'string', description: 'Room' }, brightness: { type: 'number', description: 'Percent' } }, required: ['room', 'scene'] } });
    expect(sev(await lintSchemaConstraints.run(ctx([t])))).toEqual(['lint.schema_constraints:error', 'lint.schema_constraints:warn', 'lint.schema_constraints:warn']);
  });
  it('passes bounded numbers and advertised enums', async () => {
    const t = tool('set_scene', { inputSchema: { type: 'object', properties: { room: { type: 'string', enum: ['kitchen'] }, brightness: { type: 'integer', minimum: 0, maximum: 100 } } } });
    expect(await lintSchemaConstraints.run(ctx([t]))).toEqual([]);
  });
});

describe('lint.destructive_annotated', () => {
  it('warns on mutating names without explicit annotations', async () => {
    const tools = [tool('set_scene'), tool('timer_cancel', { annotations: { destructiveHint: true } }), tool('weather_today')];
    expect(sev(await lintDestructiveAnnotated.run(ctx(tools)))).toEqual(['lint.destructive_annotated:warn']);
  });
});

describe('speak.lists', () => {
  const suite = SuiteSchema.parse({ suite: 'u', server: { url: 'http://localhost:1/mcp' }, cases: [{ id: 'c', say: 'x', expect: { noTool: true } }] });
  const turn = (spoken: string) => ({ id: 't', utterance: '', heard: '', spans: [], toolCalls: [], elicitations: [], spoken, toolListRevision: 0 }) as Turn;
  const run = (spoken: string) => sev(speakLists.run({ suite, case: suite.cases[0]!, trace: {} as Trace, turns: [turn(spoken)], tools: [] }));

  it.each([
    ['pasta, egg, and rice', 3], ['a, b and c', 3], ['one, two, three, four, five, or six', 6], ['- a\n- b\n- c\n- d', 4], ['Okay, I left everything as it was.', 0],
  ])('counts %j as %i items', (s, n) => expect(listItems(s)).toBe(n));
  it('errors over five options (Amazon)', () => expect(run('We have milk, eggs, bread, butter, cheese, and apples.')).toEqual(['speak.lists:error']));
  it('warns over three without an offer', () => expect(run('We have milk, eggs, bread, and butter.')).toEqual(['speak.lists:warn']));
  it('passes four with an offer to hear more', () => expect(run('We have milk, eggs, bread, and butter. Want to hear more?')).toEqual([]));
});
