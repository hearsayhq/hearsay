/** The console only talks to `hearsay serve`; every verdict comes from there (docs/04). */
import type { CatalogResponse, ConnectResponse, RunResponse, SuiteSummary } from '@hearsayhq/engine/types';

async function call<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await r.json().catch(() => ({ error: `${r.status} ${r.statusText}` }))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `${r.status} ${r.statusText}`);
  return data;
}

export const api = {
  catalog: () => call<CatalogResponse>('/catalog'),
  suites: () => call<SuiteSummary[]>('/suites'),
  connect: (suitePath: string) => call<ConnectResponse>('/connect', { suitePath }),
  say: (sessionId: string, text: string) => call<{ accepted: true }>('/say', { sessionId, text }),
  answer: (sessionId: string, id: string, action: 'accept' | 'decline' | 'cancel') => call<{ ok: boolean }>(`/elicitation/${id}`, { sessionId, action }),
  run: (suitePath: string) => call<RunResponse>('/run', { suitePath }),
  disconnect: (sessionId: string) => call<{ ok: true }>('/disconnect', { sessionId }),
  /** On page close; fetch would be cancelled. */
  disconnectBeacon: (sessionId: string) => navigator.sendBeacon('/api/disconnect', new Blob([JSON.stringify({ sessionId })], { type: 'application/json' })),
};
