/** Timers per principal. In memory; a reference server needs nothing more. */
export interface Timer {
  label: string;
  minutes: number;
  endsAt: number;
}

export class TimerStore {
  private byPrincipal = new Map<string, Map<string, Timer>>();

  constructor(private now: () => number = Date.now) {}

  private of(principal: string): Map<string, Timer> {
    let m = this.byPrincipal.get(principal);
    if (!m) this.byPrincipal.set(principal, (m = new Map()));
    return m;
  }

  start(principal: string, label: string, minutes: number): { timer: Timer; restarted: boolean } {
    const m = this.of(principal);
    const restarted = m.has(label);
    const timer = { label, minutes, endsAt: this.now() + minutes * 60_000 };
    m.set(label, timer);
    return { timer, restarted };
  }

  list(principal: string): Array<Timer & { minutesLeft: number }> {
    const now = this.now();
    return [...this.of(principal).values()]
      .filter((t) => t.endsAt > now)
      .sort((a, b) => a.endsAt - b.endsAt)
      .map((t) => ({ ...t, minutesLeft: Math.ceil((t.endsAt - now) / 60_000) }));
  }

  cancel(principal: string, label: string): boolean {
    return this.of(principal).delete(label);
  }
}
