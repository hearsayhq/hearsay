import { describe, expect, it } from 'vitest';
import { ensureServer } from './server-process';

describe('ensureServer', () => {
  it('names a port fetch refuses instead of waiting for it', async () => {
    const started = Date.now();
    // 4190 is on the Fetch standard's bad-port list; fetch fails before any connection is made.
    await expect(ensureServer({ url: 'http://localhost:4190/mcp', start: 'sleep 60' })).rejects.toThrow(/refuses port 4190/);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
