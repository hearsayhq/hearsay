/**
 * Streamable HTTP plumbing for reference servers: one McpServer per MCP session,
 * each bound to the principal behind the bearer token (D-009). Falls back to the
 * session id when no token is sent. No OAuth server of our own.
 */
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export interface SessionContext {
  /** Who is speaking: the bearer token's subject, or the session id. */
  principal: string;
  sessionId: string;
}

export interface ServeOptions {
  port: number;
  host?: string;
  path?: string;
  create: (ctx: SessionContext) => McpServer;
}

export interface Served {
  url: string;
  close(): Promise<void>;
}

const bearer = (req: IncomingMessage): string | undefined => {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7).trim() || undefined : undefined;
};

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : undefined;
}

export async function serveMcp(opts: ServeOptions): Promise<Served> {
  const path = opts.path ?? '/mcp';
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  const http = createServer(async (req, res) => {
    try {
      if (!req.url?.startsWith(path)) {
        res.writeHead(404).end();
        return;
      }
      const sid = req.headers['mcp-session-id'];
      const existing = typeof sid === 'string' ? sessions.get(sid) : undefined;
      const body = req.method === 'POST' ? await readJson(req) : undefined;
      if (existing) {
        await existing.handleRequest(req, res, body);
        return;
      }
      if (typeof sid === 'string') {
        res.writeHead(404, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
        return;
      }
      const token = bearer(req);
      const sessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (id) => void sessions.set(id, transport),
        onsessionclosed: (id) => void sessions.delete(id),
      });
      const server = opts.create({ principal: token ?? `session:${sessionId}`, sessionId });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (e) {
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: (e as Error).message }, id: null }));
    }
  });

  await new Promise<void>((resolve) => http.listen(opts.port, opts.host ?? '127.0.0.1', resolve));
  const { port } = http.address() as AddressInfo;
  return {
    url: `http://localhost:${port}${path}`,
    close: async () => {
      await Promise.all([...sessions.values()].map((t) => t.close().catch(() => undefined)));
      http.closeAllConnections();
      await new Promise<void>((resolve) => http.close(() => resolve()));
    },
  };
}
