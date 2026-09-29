#!/usr/bin/env node
/**
 * hearsay-mcp: stdio by default (Claude Code, Kiro); `--http [--port 4199]` for Streamable HTTP.
 * stdout belongs to the protocol in stdio mode; logs go to stderr.
 */
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { serveMcp } from '@hearsayhq/kit';
import { createHearsayServer } from './server';

const { values } = parseArgs({ options: { http: { type: 'boolean' }, port: { type: 'string' }, cwd: { type: 'string' } } });
const opts = values.cwd ? { cwd: values.cwd } : {};

if (values.http) {
  const served = await serveMcp({ port: Number(values.port ?? 4199), create: () => createHearsayServer(opts) });
  console.error(`[hearsay-mcp] Streamable HTTP on ${served.url}`);
} else {
  await createHearsayServer(opts).connect(new StdioServerTransport());
  console.error('[hearsay-mcp] ready on stdio');
}
