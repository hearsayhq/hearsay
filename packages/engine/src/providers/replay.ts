/**
 * Record and replay (FR-013, NFR-1): llm runs are recorded as cassettes and replayed
 * without network. A request that was never recorded is a hard error naming the first
 * message that differs from the closest recording, never a silent live call.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Cassette, CassetteEntry, ModelProvider, ModelRequest, ModelResponse } from '../orchestrator';

const canonical = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(v);

export const hashRequest = (req: ModelRequest) => createHash('sha256').update(canonical(req)).digest('hex');
export const cassettePathFor = (suitePath: string, suiteName: string) => join(dirname(suitePath), 'cassettes', `${suiteName}.json`);

/** Every recorded call, in recording order per request. */
export const cassetteEntries = (c: Cassette): CassetteEntry[] => Object.values(c.entries).flat();

export class ReplayMismatch extends Error {
  override name = 'ReplayMismatch';
}

export class RecordingProvider implements ModelProvider {
  readonly id: string;
  constructor(private inner: ModelProvider, readonly cassette: Cassette) {
    this.id = inner.id;
  }
  async converse(req: ModelRequest): Promise<ModelResponse & { durationMs: number }> {
    // Snapshot before the call: orchestrators keep appending to the same messages array.
    const request = structuredClone(req);
    const started = performance.now();
    const response = await this.inner.converse(req);
    const durationMs = Math.round(performance.now() - started);
    // A model may answer the same request differently each time; keep every answer so replay stays in step.
    const key = hashRequest(request);
    const entry = { request, response: structuredClone(response), durationMs };
    const seen = this.cassette.entries[key];
    this.cassette.entries[key] = seen === undefined ? entry : [...(Array.isArray(seen) ? seen : [seen]), entry];
    return { ...response, durationMs };
  }
}

export class ReplayProvider implements ModelProvider {
  readonly id: string;
  private asked = new Map<string, number>();
  constructor(readonly cassette: Cassette) {
    this.id = `replay:${cassette.provider}`;
  }
  async converse(req: ModelRequest): Promise<ModelResponse & { durationMs: number }> {
    const key = hashRequest(req);
    const found = this.cassette.entries[key];
    if (!found) throw new ReplayMismatch(describeMiss(req, cassetteEntries(this.cassette).map((e) => e.request)));
    const answers = Array.isArray(found) ? found : [found];
    const n = this.asked.get(key) ?? 0;
    this.asked.set(key, n + 1);
    const hit = answers[Math.min(n, answers.length - 1)]!;
    return { ...hit.response, durationMs: hit.durationMs };
  }
}

function describeMiss(req: ModelRequest, recorded: ModelRequest[]): string {
  if (!recorded.length) return 'Replay: the cassette is empty; record it with --record in llm mode.';
  let best = { common: -1, other: recorded[0]! };
  for (const r of recorded) {
    let i = 0;
    while (i < req.messages.length && i < r.messages.length && canonical(req.messages[i]) === canonical(r.messages[i])) i++;
    if (i > best.common) best = { common: i, other: r };
  }
  if (canonical(req.tools) !== canonical(best.other.tools)) return 'Replay: the tool list differs from the recording (a tool or its schema changed); re-record with --record.';
  if (req.system !== best.other.system) return 'Replay: the system prompt differs from the recording; re-record with --record.';
  const i = best.common;
  const got = JSON.stringify(req.messages[i] ?? null).slice(0, 160);
  const want = JSON.stringify(best.other.messages[i] ?? null).slice(0, 160);
  return `Replay: message ${i} differs from the closest recording.\n  now:      ${got}\n  recorded: ${want}\nThe server's replies changed since recording; re-record with --record.`;
}

export async function loadCassette(path: string): Promise<Cassette> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Cassette;
  } catch {
    throw new ReplayMismatch(`Replay: no cassette at ${path}; record one with --orchestrator llm --record.`);
  }
}

export async function saveCassette(path: string, cassette: Cassette): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const entries = Object.fromEntries(Object.entries(cassette.entries).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(path, JSON.stringify({ ...cassette, entries }, null, 2) + '\n');
}
