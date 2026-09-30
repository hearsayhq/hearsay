/**
 * Server-scope lint (docs/05): names, descriptions, schemas, annotations.
 * Reads the tool list; lint.destructive_annotated also probes read-only tools.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { McpSession } from '../session';
import { fire, type ServerCheck } from './types';

const FOLD: Record<string, string> = {
  set: 'set', apply: 'set', update: 'set', change: 'set', put: 'set', configure: 'set',
  get: 'get', list: 'get', show: 'get', read: 'get', fetch: 'get', find: 'get', lookup: 'get', view: 'get', review: 'get',
  start: 'start', begin: 'start', create: 'start', add: 'start', make: 'start', new: 'start',
  stop: 'stop', cancel: 'stop', end: 'stop', remove: 'stop', delete: 'stop', clear: 'stop',
  turn: 'turn', switch: 'turn', toggle: 'turn',
};
const tokens = (name: string) => name.toLowerCase().split(/[_.-]+/).filter(Boolean);
const folded = (name: string) => tokens(name).map((t) => FOLD[t] ?? t.replace(/s$/, '')).sort().join(' ');

export const lintToolNames: ServerCheck = {
  id: 'lint.tool_names',
  async run({ tools }) {
    const out = [];
    for (const t of tools)
      if (!/^[A-Za-z0-9_.-]{1,128}$/.test(t.name))
        out.push(fire('lint.tool_names', 0, `tool name "${t.name}" is outside [A-Za-z0-9_.-]{1,128}`, { evidence: { tool: t.name }, hint: 'Use lowercase words joined by underscores, such as timer_start.' }));
    for (let i = 0; i < tools.length; i++)
      for (let j = i + 1; j < tools.length; j++) {
        const a = tools[i]!.name;
        const b = tools[j]!.name;
        if (folded(a) === folded(b))
          out.push(fire('lint.tool_names', 1, `${a} and ${b} name the same intent`, { evidence: { tools: [a, b], folded: folded(a) }, hint: 'Keep one tool per intent; a model choosing between synonyms by voice will guess.' }));
      }
    return out;
  },
};

export const lintDescriptions: ServerCheck = {
  id: 'lint.descriptions',
  async run({ tools }) {
    const out = [];
    for (const t of tools) {
      if ((t.description ?? '').trim().length < 20)
        out.push(fire('lint.descriptions', 0, `${t.name} has ${t.description ? 'a description under 20 characters' : 'no description'}`, { evidence: { tool: t.name, description: t.description ?? null }, hint: 'Say when to use the tool, in the words a person would say.' }));
      const props = (t.inputSchema.properties ?? {}) as Record<string, { description?: string }>;
      const bare = Object.entries(props).filter(([, p]) => !p?.description?.trim()).map(([k]) => k);
      if (bare.length)
        out.push(fire('lint.descriptions', 0, `${t.name}: parameter${bare.length > 1 ? 's' : ''} ${bare.join(', ')} without description`, { evidence: { tool: t.name, parameters: bare }, hint: 'Describe each parameter, with synonyms and alternate spellings.' }));
    }
    return out;
  },
};

/** Parameter names whose values usually come from a closed set. */
const CLOSED = new Set(['state', 'mode', 'room', 'unit', 'status', 'type', 'kind', 'level', 'scene', 'color', 'colour', 'direction', 'size', 'currency', 'day', 'weekday']);

export const lintSchemaConstraints: ServerCheck = {
  id: 'lint.schema_constraints',
  async run({ tools }) {
    const out = [];
    for (const t of tools) {
      const s = t.inputSchema as { type?: string; properties?: Record<string, Record<string, unknown>>; required?: unknown };
      const props = s.properties ?? {};
      const required = Array.isArray(s.required) ? (s.required as string[]) : [];
      const missing = required.filter((k) => !(k in props));
      if (s.type !== 'object' || (s.required !== undefined && !Array.isArray(s.required)) || missing.length)
        out.push(fire('lint.schema_constraints', 0, `${t.name}: inputSchema is not a valid object schema${missing.length ? ` (required but undeclared: ${missing.join(', ')})` : ''}`, { evidence: { tool: t.name, inputSchema: s } }));
      for (const [k, p] of Object.entries(props)) {
        const type = p.type;
        if ((type === 'number' || type === 'integer') && (p.minimum === undefined || p.maximum === undefined) && p.exclusiveMinimum === undefined && p.exclusiveMaximum === undefined)
          out.push(fire('lint.schema_constraints', 1, `${t.name}.${k} is a number without bounds`, { evidence: { tool: t.name, parameter: k }, hint: 'Add minimum and maximum; a misheard "fifty" should hit a bound, not a surprise. looseInt() from @hearsayhq/kit advertises the bounds and refuses out-of-range values in words.' }));
        if (type === 'string' && !p.enum && CLOSED.has(k.toLowerCase()))
          out.push(fire('lint.schema_constraints', 1, `${t.name}.${k} looks like a closed set but has no enum`, { evidence: { tool: t.name, parameter: k }, hint: 'Advertise the values as an enum; looseEnum() from @hearsayhq/kit keeps validation forgiving.' }));
      }
    }
    return out;
  },
};

const MUTATING = new Set(['set', 'apply', 'update', 'change', 'put', 'delete', 'remove', 'cancel', 'start', 'stop', 'add', 'place', 'order', 'turn', 'create', 'send', 'pay', 'buy', 'checkout', 'book', 'reserve', 'dim', 'lock', 'unlock', 'enable', 'disable', 'reset', 'clear', 'move', 'rename', 'write', 'post', 'submit', 'confirm', 'grant', 'revoke', 'stage', 'propose']);

const explicit = (t: Tool) => t.annotations?.readOnlyHint !== undefined || t.annotations?.destructiveHint !== undefined;

export const lintDestructiveAnnotated: ServerCheck = {
  id: 'lint.destructive_annotated',
  async run({ tools, url, newPrincipal, callTools = true }) {
    const out = [];
    for (const t of tools)
      if (!explicit(t) && tokens(t.name).some((w) => MUTATING.has(w)))
        out.push(fire('lint.destructive_annotated', 1, `${t.name} sounds like it changes state but declares neither readOnlyHint nor destructiveHint`, { evidence: { tool: t.name }, hint: 'Set annotations explicitly: destructiveHint: true for anything a person should confirm.' }));

    // Probe: a read-only tool with no required arguments must read the same twice in a row.
    const probes = tools.filter((t) => t.annotations?.readOnlyHint === true && !((t.inputSchema.required as string[] | undefined)?.length));
    if (!probes.length || !callTools) return out;
    const session = await McpSession.open({ url, principal: newPrincipal(), elicitation: false });
    try {
      for (const t of probes) {
        const a = await session.callTool(t.name, {});
        const b = await session.callTool(t.name, {});
        if (!a.result.isError && a.result.text !== b.result.text)
          out.push(fire('lint.destructive_annotated', 0, `${t.name} declares readOnlyHint: true but two identical reads differ`, { evidence: { tool: t.name, first: a.result.text.slice(0, 120), second: b.result.text.slice(0, 120) }, hint: 'Either make the read side-effect free or drop readOnlyHint; hosts skip confirmation for read-only tools.' }));
      }
    } finally {
      await session.close();
    }
    return out;
  },
};
