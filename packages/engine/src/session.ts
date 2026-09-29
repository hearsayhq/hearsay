/**
 * One MCP session as one person (FR-001–004): Streamable HTTP, a bearer principal,
 * elicitation answered by the simulated person (or not declared at all), and a
 * tool-list revision that ticks on tools/list_changed.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ElicitRequestSchema, McpError, ToolListChangedNotificationSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ElicitationRecord, ServerInfo, ToolResult } from './trace';

export interface Human {
  answer: 'accept' | 'decline' | 'cancel';
  content?: Record<string, unknown>;
  /**
   * The person knows what they meant: a confirmation that states one of these misheard values
   * is declined, whatever `answer` says (consent.misheard_amount).
   */
  rejectIfMentions?: string[];
}

/** Does a question state one of these values (as a word or in digits)? */
export function mentions(question: string, values: string[]): boolean {
  const q = question.toLowerCase();
  return values.some((v) => new RegExp(`\\b${v.toLowerCase()}\\b`).test(q));
}

export interface SessionOptions {
  url: string;
  principal: string;
  elicitation: boolean;
}

export interface TimedCall {
  result: ToolResult;
  latencyMs: number;
  /** Elicitations the server sent while handling this call, with their offsets in ms from call start. */
  elicitations: Array<ElicitationRecord & { startMs: number; endMs: number }>;
}

export class ConnectError extends Error {
  override name = 'ConnectError';
}

export class McpSession {
  revision = 0;
  tools: Tool[] = [];
  human: Human = { answer: 'accept' };
  private pending: TimedCall['elicitations'] = [];
  private callStart = 0;

  private constructor(
    private client: Client,
    private transport: StreamableHTTPClientTransport,
    readonly options: SessionOptions,
  ) {}

  static async open(options: SessionOptions): Promise<McpSession> {
    const client = new Client(
      { name: 'hearsay', version: '0.1.0' },
      { capabilities: options.elicitation ? { elicitation: { form: {} } } : {} },
    );
    const transport = new StreamableHTTPClientTransport(new URL(options.url), {
      requestInit: { headers: { Authorization: `Bearer ${options.principal}` } },
    });
    const session = new McpSession(client, transport, options);
    if (options.elicitation) client.setRequestHandler(ElicitRequestSchema, async (req) => session.elicit(req.params));
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      session.revision++;
    });
    try {
      await client.connect(transport);
    } catch (e) {
      throw new ConnectError(`Cannot connect to ${options.url}: ${(e as Error).message}`);
    }
    await session.refreshTools();
    return session;
  }

  private elicit(params: { message: string; requestedSchema?: unknown }) {
    const startMs = performance.now() - this.callStart;
    const { content } = this.human;
    const answer = this.human.rejectIfMentions && mentions(params.message, this.human.rejectIfMentions) ? 'decline' : this.human.answer;
    const reply = answer === 'accept' ? { action: answer, content: content ?? {} } : { action: answer };
    this.pending.push({ message: params.message, requestedSchema: params.requestedSchema, action: answer, content: answer === 'accept' ? (content ?? {}) : undefined, startMs, endMs: performance.now() - this.callStart });
    return reply;
  }

  async refreshTools(): Promise<Tool[]> {
    const tools: Tool[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.client.listTools(cursor ? { cursor } : undefined);
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    this.tools = tools;
    return tools;
  }

  /** The tool list as the server has it now, without adopting it. */
  async peekTools(): Promise<Tool[]> {
    const tools: Tool[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.client.listTools(cursor ? { cursor } : undefined);
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    return tools;
  }

  serverInfo(): ServerInfo {
    const v = this.client.getServerVersion();
    return {
      url: this.options.url,
      name: v?.name,
      version: v?.version,
      protocolVersion: this.transport.protocolVersion,
      capabilities: this.client.getServerCapabilities() as Record<string, unknown> | undefined,
    };
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<TimedCall> {
    this.pending = [];
    this.callStart = performance.now();
    let result: ToolResult;
    try {
      const r = await this.client.callTool({ name, arguments: args });
      const content = Array.isArray(r.content) ? r.content : [];
      const text = content.flatMap((b) => (b && typeof b === 'object' && b.type === 'text' ? [String(b.text)] : [])).join(' ');
      const structured = r.structuredContent as Record<string, unknown> | undefined;
      const isError = r.isError === true;
      result = {
        isError,
        text,
        ...(structured !== undefined ? { structuredContent: structured } : {}),
        ...(isError && typeof structured?.code === 'string' ? { errorCode: structured.code } : {}),
      };
    } catch (e) {
      const code = e instanceof McpError ? e.code : -32603;
      const message = (e as Error).message;
      result = { isError: true, text: message, protocolError: { code, message } };
    }
    const latencyMs = performance.now() - this.callStart;
    return { result, latencyMs, elicitations: this.pending };
  }

  async close(): Promise<void> {
    await this.transport.terminateSession().catch(() => undefined);
    await this.client.close().catch(() => undefined);
  }
}
