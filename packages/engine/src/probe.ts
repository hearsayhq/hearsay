/**
 * Raw Streamable HTTP probe that offers an older protocol version, the way Amazon's
 * example Alexa+ handshake does (2025-03-26, friction log #2). The SDK client always
 * offers the latest version, so this speaks JSON-RPC over fetch directly.
 */
export interface ProbeResult {
  ok: boolean;
  negotiated?: string;
  tools?: number;
  error?: string;
}

async function readMessage(res: Response): Promise<{ result?: Record<string, unknown>; error?: { message: string } }> {
  const type = res.headers.get('content-type') ?? '';
  const body = await res.text();
  if (type.includes('text/event-stream')) {
    const data = body
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .filter(Boolean)
      .at(-1);
    return data ? JSON.parse(data) : {};
  }
  return body ? JSON.parse(body) : {};
}

export async function probeProtocol(url: string, protocolVersion: string, principal: string): Promise<ProbeResult> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${principal}`,
  };
  try {
    const init = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion, capabilities: {}, clientInfo: { name: 'hearsay-probe', version: '0.1.0' } } }),
    });
    if (!init.ok) return { ok: false, error: `initialize answered HTTP ${init.status}` };
    const msg = await readMessage(init);
    if (msg.error || !msg.result) return { ok: false, error: `initialize failed: ${msg.error?.message ?? 'no result'}` };
    const negotiated = String(msg.result.protocolVersion);
    const sid = init.headers.get('mcp-session-id');
    const h2 = { ...headers, ...(sid ? { 'mcp-session-id': sid } : {}), 'mcp-protocol-version': negotiated };
    await fetch(url, { method: 'POST', headers: h2, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
    const list = await fetch(url, { method: 'POST', headers: h2, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) });
    const listed = await readMessage(list);
    if (sid) await fetch(url, { method: 'DELETE', headers: h2 }).catch(() => undefined);
    if (listed.error || !listed.result) return { ok: false, negotiated, error: `tools/list failed: ${listed.error?.message ?? `HTTP ${list.status}`}` };
    return { ok: true, negotiated, tools: Array.isArray(listed.result.tools) ? listed.result.tools.length : 0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
