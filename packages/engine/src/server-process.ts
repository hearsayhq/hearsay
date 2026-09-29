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
  } catch {
    return false;
  }
}

export interface RunningServer {
  /** True if Hearsay started the process. */
  started: boolean;
  stop(): Promise<void>;
}

export async function ensureServer(server: { url: string; start?: string }, timeoutMs = 30_000): Promise<RunningServer> {
  if (await answers(server.url)) return { started: false, stop: async () => undefined };
  if (!server.start) throw new ConnectError(`Nothing answers at ${server.url} and the suite has no server.start command.`);

  const child = spawn('sh', ['-c', server.start], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => void (stderr = (stderr + d.toString()).slice(-2000)));
  const stop = async () => {
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
