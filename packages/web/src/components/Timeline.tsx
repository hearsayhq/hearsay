/**
 * One turn's spans on a millisecond axis. Hatched spans are modeled constants (asr, speak),
 * not measurements. Each tool row marks the per-call limit; the meter below shows first
 * audio against the budget, without the time the person spent answering.
 */
import type { FirstAudio, Span } from '@hearsayhq/engine/types';

const LABEL: Record<Span['kind'], string> = { asr: 'speech to text', plan: 'plan', tool: 'tool', elicitation: 'person answering', speak: 'text to speech' };
const ms = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`);

/** Where a tool call's server time reaches the limit: the person's answering time does not count. */
function limitPosition(tool: Span, asked: Span[], limitMs: number): number {
  let at = tool.startMs + limitMs;
  for (const e of asked.filter((x) => x.startMs >= tool.startMs && x.endMs <= tool.endMs).sort((a, b) => a.startMs - b.startMs))
    if (e.startMs < at) at += e.endMs - e.startMs;
  return at;
}

export function Timeline({ spans, serverMs, firstAudio, budgetMs, toolLimitMs }: { spans: Span[]; serverMs: number[]; firstAudio: FirstAudio; budgetMs: number; toolLimitMs: number }) {
  const asked = spans.filter((s) => s.kind === 'elicitation');
  let toolIndex = 0;
  const end = Math.max(...spans.map((s) => s.endMs), budgetMs) * 1.04;
  const pct = (n: number) => `${(n / end) * 100}%`;
  const meterEnd = Math.max(firstAudio.totalMs, budgetMs) * 1.04;
  const mpct = (n: number) => `${(n / meterEnd) * 100}%`;
  const over = firstAudio.totalMs > budgetMs;
  let x = 0;
  const segments = (['asrMs', 'planMs', 'toolMs', 'speakMs'] as const).map((k) => {
    const seg = { k, left: x, width: firstAudio[k] };
    x += firstAudio[k];
    return seg;
  });
  return (
    <div className="timeline">
      {spans
        .filter((s) => !(s.kind === 'plan' && s.endMs === s.startMs))
        .map((s, i) => {
          const dur = s.endMs - s.startMs;
          const limitAt = s.kind === 'tool' ? limitPosition(s, asked, toolLimitMs) : 0;
          const server = s.kind === 'tool' ? serverMs[toolIndex++] : undefined;
          return (
            <div className="tl-row" key={i}>
              <span className="tl-label">
                {s.kind === 'tool' ? <code>{s.name}</code> : LABEL[s.kind]}
                {s.modeled && <span className="muted"> · modeled</span>}
              </span>
              <span className="tl-track">
                <span className={`tl-bar k-${s.kind}${s.modeled ? ' modeled' : ''}`} style={{ left: pct(s.startMs), width: `max(2px, ${pct(dur)})` }} />
                {s.kind === 'tool' && asked.filter((e) => e.startMs >= s.startMs && e.endMs <= s.endMs).map((e, j) => <span key={j} className="tl-bar k-waiting" style={{ left: pct(e.startMs), width: pct(e.endMs - e.startMs) }} />)}
                {s.kind === 'tool' && limitAt < end && <span className="tl-limit" style={{ left: pct(limitAt) }} title={`${toolLimitMs} ms of server time per tool call`} />}
              </span>
              <span className={`tl-ms${server !== undefined && server > toolLimitMs ? ' over' : ''}`} title={server !== undefined ? 'server time' : undefined}>{ms(server ?? dur)}</span>
            </div>
          );
        })}
      <div className="meter" aria-label={`first audio ${ms(firstAudio.totalMs)}, budget ${ms(budgetMs)}`}>
        <span className="tl-label">first audio</span>
        <span className="tl-track">
          {segments.map((s) => s.width > 0 && <span key={s.k} className={`tl-bar m-${s.k}${s.k === 'asrMs' || s.k === 'speakMs' ? ' modeled' : ''}`} style={{ left: mpct(s.left), width: mpct(s.width) }} />)}
          <span className="tl-budget" style={{ left: mpct(budgetMs) }} />
        </span>
        <span className={`tl-ms${over ? ' over' : ''}`}>{ms(firstAudio.totalMs)}</span>
      </div>
      <p className="tl-note muted">
        Budget {ms(budgetMs)} to first audio · dashed line: {toolLimitMs} ms of server time per tool call · hatched: modeled
        {firstAudio.elicitationMs > 0 && <> · {ms(firstAudio.elicitationMs)} of the person answering not counted</>}
      </p>
    </div>
  );
}
