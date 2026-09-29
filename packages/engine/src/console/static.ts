/** The built console, served by `hearsay serve` next to the API (the published CLI ships it). */
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { Context } from 'hono';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export function staticFiles(dir: string) {
  const root = resolve(dir);
  return async (c: Context) => {
    const rel = decodeURIComponent(new URL(c.req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const file = resolve(root, rel);
    if (!file.startsWith(root + sep)) return c.notFound();
    for (const f of extname(rel) ? [file] : [file, resolve(root, 'index.html')]) {
      try {
        return c.body(await readFile(f), 200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
      } catch {
        /* next candidate */
      }
    }
    return c.notFound();
  };
}
