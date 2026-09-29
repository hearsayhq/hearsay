import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * A tool result a person can listen to. The text is what the assistant says;
 * anything a program needs goes into `structured`, never into the text.
 * Fixes: speak.no_structured_dump, speak.length, speak.lists, asr.robust (read-back).
 */
export const MAX_SPOKEN_CHARS = 400; // Amazon: under 30 seconds (docs/05)
export const MAX_OPTIONS = 5; // Amazon: at most five options

const UNSPEAKABLE: Array<[RegExp, string]> = [
  [/[{}[\]]/, 'JSON or brackets'],
  [/https?:\/\//i, 'a URL'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, 'a UUID'],
  [/\b[a-z][a-z0-9]*_[a-z0-9_]+\b/, 'a snake_case identifier'],
  [/^\s*#{1,6}\s|\|\s*-{3,}/m, 'markdown'],
];

/** Throws if a text would not survive being read aloud. */
export function assertSpeakable(text: string): void {
  for (const [re, what] of UNSPEAKABLE)
    if (re.test(text)) throw new Error(`Not speakable: contains ${what}: "${text.slice(0, 80)}"`);
  if (text.length > MAX_SPOKEN_CHARS) throw new Error(`Not speakable: ${text.length} characters (max ${MAX_SPOKEN_CHARS})`);
}

export function speak(text: string, structured?: Record<string, unknown>): CallToolResult {
  assertSpeakable(text);
  return { content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) };
}

/**
 * A short spoken list: at most `max` items, then an offer to continue.
 * ["pasta", "egg"] → "pasta and egg".
 */
export function list(items: string[], opts: { max?: number; more?: string } = {}): string {
  const max = Math.min(opts.max ?? 3, MAX_OPTIONS);
  const shown = items.slice(0, max);
  const joined = shown.length <= 2 ? shown.join(' and ') : `${shown.slice(0, -1).join(', ')}, and ${shown.at(-1)}`;
  return items.length > max ? `${joined}. ${opts.more ?? 'Want to hear more?'}` : joined;
}
