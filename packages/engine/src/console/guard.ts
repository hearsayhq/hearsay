/**
 * The console API runs commands from suites (`server.start`), so only the console may call it:
 * a web page elsewhere must not reach it by a cross-site request or by DNS rebinding.
 * - Host must be localhost or 127.0.0.1 (any port: Vite proxies from :5180).
 * - Origin, when a browser sends one, must be such a host too.
 * - POST bodies must be JSON, which a cross-site form or a no-cors fetch cannot send.
 */
import type { MiddlewareHandler } from 'hono';

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export const localOnly: MiddlewareHandler = async (c, next) => {
  const host = c.req.header('host') ?? '';
  if (!LOCAL.test(host)) return c.json({ error: 'hearsay serve answers on localhost only' }, 403);
  const origin = c.req.header('origin');
  if (origin && !LOCAL.test(new URL(origin).host)) return c.json({ error: 'cross-site requests are refused' }, 403);
  if (c.req.method === 'POST' && !(c.req.header('content-type') ?? '').startsWith('application/json')) return c.json({ error: 'send JSON' }, 415);
  await next();
};

/** A suite path the console may use: a YAML file under suites/, not a holdout. */
export function suitePathOk(path: unknown): path is string {
  return typeof path === 'string' && /^suites\/[A-Za-z0-9._-]+\.ya?ml$/.test(path) && !path.includes('..') && !/\.holdout\.ya?ml$/.test(path);
}
