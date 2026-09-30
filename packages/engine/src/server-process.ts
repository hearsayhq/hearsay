/**
 * Start the server under test from the suite's `server.start` when nothing answers
 * at its URL, and stop it afterwards (docs/04: CI starts the server itself).
 */
import { spawn } from 'node:child_process';
import { ConnectError } from './session';

async function answers(url: string): Promise<boolean> {
  try {
    await fetch(url, { method: 'GET', signal: AbortSignal.timeout(1000) });
    return true;
  } catch (e) {
    // fetch refuses some ports outright (WHATWG Fetch "bad port", e.g. 4190); waiting would only time out.
    if ((e as { cause?: { message?: string } }).cause?.message === 'bad port') {
      throw new ConnectError(`fetch refuses port ${new URL(url).port} (a "bad port" in the Fetch standard), so ${url} cannot be reached. Pick another port for the server.`);
    }
    return false;
  }
}

export interface RunningServer {
  /** True if Hearsay started the process. */
  started: boolean;
  stop(): Promise<void>;
}

export async function ensureServer(server: { url: string; start?: string }, opts: { cwd?: string; timeoutMs?: number } = {}): Promise<RunningServer> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  if (await answers(server.url)) return { started: false, stop: async () => undefined };
  if (!server.start) throw new ConnectError(`Nothing answers at ${server.url} and the suite has no server.start command.`);

  // The URL decides the port. Without this, a PORT inherited from Hearsay's own host (hearsay serve) would win.
  const port = new URL(server.url).port;
  const env = { ...process.env, ...(port ? { PORT: port } : {}) };
  const child = spawn('sh', ['-c', server.start], { detached: true, env, stdio: ['ignore', 'ignore', 'pipe'], ...(opts.cwd ? { cwd: opts.cwd } : {}) });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => void (stderr = (stderr + d.toString()).slice(-2000)));
  // Never leave a server behind when Hearsay exits, however it exits.
  const killGroup = () => {
    try {
      if (child.pid && child.exitCode === null) process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  };
  process.once('exit', killGroup);
  const stop = async () => {
    process.off('exit', killGroup);
    if (child.exitCode !== null || !child.pid) return;
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
    await new Promise((r) => setTimeout(r, 100));
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new ConnectError(`"${server.start}" exited with ${child.exitCode}:\n${stderr.trim()}`);
    if (await answers(server.url)) return { started: true, stop };
    await new Promise((r) => setTimeout(r, 250));
  }
  await stop();
  throw new ConnectError(`"${server.start}" did not answer at ${server.url} within ${timeoutMs / 1000} s:\n${stderr.trim()}`);
}
