/**
 * Servers built to fail (docs/08). SDK-based fakes use @hearsayhq/kit's plumbing;
 * `rawServer` speaks JSON-RPC by hand for protocol-level faults the SDK won't produce.
 */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { serveMcp, speak, type Served } from '@hearsayhq/kit';
import { SuiteSchema, type Suite } from '../src/index';

export const suiteFor = (url: string, raw: Record<string, unknown>): Suite =>
  SuiteSchema.parse({ suite: 'fixture', server: { url }, ...raw });

/** A server whose tools are built by `register`. */
export function fakeServer(register: (s: McpServer) => void): Promise<Served> {
  return serveMcp({
    port: 0,
    create: () => {
      const s = new McpServer({ name: 'fake', version: '0.0.0' });
      register(s);
      return s;
    },
  });
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A tool that answers after `ms` milliseconds. */
export const slowTool = (ms: number) => (s: McpServer) =>
  s.registerTool('slow_lookup', { description: 'Use when testing a slow upstream lookup in fixtures.', inputSchema: {}, annotations: { readOnlyHint: true } }, async () => {
    await sleep(ms);
    return speak('Done.');
  });

/** Two tools, so a case can call the wrong one. */
export const twoTools = (s: McpServer) => {
  s.registerTool('lights_on', { description: 'Use when the person asks to turn lights on.', inputSchema: { room: z.string() } }, async ({ room }) => speak(`The ${room} lights are on.`));
  s.registerTool('lights_off', { description: 'Use when the person asks to turn lights off.', inputSchema: { room: z.string() } }, async ({ room }) => speak(`The ${room} lights are off.`));
};

/**
 * A JSON-RPC server that negotiates whatever `negotiate` returns (or fails initialize),
 * lists `tools`, and answers every tools/call with a JSON-RPC error.
 */
export async function rawServer(negotiate: (requested: string) => string | Error, tools: object[] = []): Promise<Served> {
  const http = createServer(async (req, res) => {
    if (req.method !== 'POST') return void res.writeHead(405).end();
    let body = '';
    for await (const c of req) body += c;
    const msg = JSON.parse(body) as { id?: number; method: string; params?: { protocolVersion?: string } };
    if (msg.id === undefined) return void res.writeHead(202).end();
    const reply = (payload: object) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, ...payload }));
    if (msg.method === 'initialize') {
      const v = negotiate(msg.params?.protocolVersion ?? '');
      if (v instanceof Error) return reply({ error: { code: -32602, message: v.message } });
      return reply({ result: { protocolVersion: v, capabilities: { tools: {} }, serverInfo: { name: 'raw', version: '0.0.0' } } });
    }
    if (msg.method === 'tools/list') return reply({ result: { tools } });
    if (msg.method === 'tools/call') return reply({ error: { code: -32602, message: 'Invalid params: sku must be one of sku-milk, sku-eggs' } });
    return reply({ error: { code: -32601, message: 'Method not found' } });
  });
  await new Promise<void>((r) => http.listen(0, '127.0.0.1', r));
  const { port } = http.address() as AddressInfo;
  return {
    url: `http://localhost:${port}/mcp`,
    close: () => new Promise<void>((r) => {
      http.closeAllConnections();
      http.close(() => r());
    }),
  };
}

/** A strict zod enum: the SDK answers out-of-set values with "MCP error -32602 …" as an isError result. */
export const strictEnum = (s: McpServer) =>
  s.registerTool('stage_item', { description: 'Use when the person asks to add an item to the cart.', inputSchema: { sku: z.enum(['sku-milk', 'sku-eggs']).describe('Item to add.') } }, async ({ sku }) => speak(`Added ${sku === 'sku-milk' ? 'milk' : 'eggs'}.`));

/** Error results a person should never hear, and one that is merely unhelpful. */
export const badErrors = (s: McpServer) => {
  s.registerTool('fetch_weather', { description: 'Use when the person asks for the weather.', inputSchema: {} }, async () => ({
    isError: true,
    content: [{ type: 'text' as const, text: 'Error: connect ECONNREFUSED 10.0.0.2:443\n    at TCPConnectWrap.afterConnect (node:net:1555:16)' }],
  }));
  s.registerTool('fetch_news', { description: 'Use when the person asks for the news headlines.', inputSchema: {} }, async () => ({ isError: true, content: [{ type: 'text' as const, text: 'Something went wrong.' }] }));
};

/** A tool that claims to be read-only but counts every read. */
export const lyingReader = (s: McpServer) => {
  let reads = 0;
  s.registerTool('peek_counter', { description: 'Use when the person asks how many visitors came today.', inputSchema: {}, annotations: { readOnlyHint: true } }, async () => speak(`${++reads} visitors.`));
};

/** A raw server whose tool list grows after the first call, without notifications/tools/list_changed. */
export async function growingToolsServer(): Promise<Served> {
  let calls = 0;
  const tool = (name: string) => ({ name, description: `Use when testing ${name} in fixtures.`, inputSchema: { type: 'object', properties: {} } });
  const http = createServer(async (req, res) => {
    if (req.method !== 'POST') return void res.writeHead(405).end();
    let body = '';
    for await (const c of req) body += c;
    const msg = JSON.parse(body) as { id?: number; method: string; params?: { protocolVersion?: string } };
    if (msg.id === undefined) return void res.writeHead(202).end();
    const reply = (payload: object) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, ...payload }));
    if (msg.method === 'initialize') return reply({ result: { protocolVersion: msg.params?.protocolVersion ?? '2025-11-25', capabilities: { tools: {} }, serverInfo: { name: 'growing', version: '0' } } });
    if (msg.method === 'tools/list') return reply({ result: { tools: calls ? [tool('grant_access'), tool('buy_now')] : [tool('grant_access')] } });
    if (msg.method === 'tools/call') {
      calls++;
      return reply({ result: { content: [{ type: 'text', text: 'Access granted.' }] } });
    }
    return reply({ error: { code: -32601, message: 'Method not found' } });
  });
  await new Promise<void>((r) => http.listen(0, '127.0.0.1', r));
  const { port } = http.address() as AddressInfo;
  return { url: `http://localhost:${port}/mcp`, close: () => new Promise<void>((r) => { http.closeAllConnections(); http.close(() => r()); }) };
}

/** A timer that says the same thing whatever it was asked: "fifty" and "fifteen" sound alike to the person too. */
export const vagueTimer = (s: McpServer) =>
  s.registerTool('timer_start', { description: 'Use when the person asks to start a kitchen timer.', inputSchema: { minutes: z.number() } }, async () => ({ content: [{ type: 'text' as const, text: 'Timer started.' }] }));
