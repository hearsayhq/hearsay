// Live, one line per step, from `claude -p --output-format stream-json`: what the agent does.
import { createInterface } from 'node:readline';

const short = (v, n = 90) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s.length > n ? `${s.slice(0, n)}…` : s; };
const pending = new Map();

// Claude Code may hand the agent the structured result (JSON) rather than the text; show one line either way.
function verdictLine(parts) {
  for (const t of parts) {
    if (!t) continue;
    if (!t.trimStart().startsWith('{')) return t.split('\n')[0];
    try {
      const r = JSON.parse(t);
      if (r.summary) return `${r.suite}: ${String(r.verdict).toUpperCase()} · ${r.summary.errors} errors, ${r.summary.warnings} warnings · ${r.summary.cases} cases, ${r.summary.runs ?? r.summary.cases} runs`;
    } catch {}
  }
  return '';
}
for await (const line of createInterface({ input: process.stdin })) {
  let e;
  try { e = JSON.parse(line); } catch { continue; }
  if (e.type === 'assistant')
    for (const b of e.message.content ?? []) {
      if (b.type === 'tool_use') {
        pending.set(b.id, b.name);
        const name = b.name.replace('mcp__hearsay__', '');
        const arg = b.input.file_path ?? b.input.suitePath ?? b.input.checkId ?? b.input.skill ?? b.input.pattern ?? '';
        const extra = b.input.only ? ` only: ${short(b.input.only, 40)}` : '';
        console.log(`  → ${name} ${String(arg).replace(process.cwd() + '/', '')}${extra}`);
      } else if (b.type === 'text' && b.text.trim()) console.log(`  · ${short(b.text.trim().split('\n')[0], 110)}`);
    }
  if (e.type === 'user')
    for (const b of Array.isArray(e.message.content) ? e.message.content : []) {
      if (b.type !== 'tool_result' || pending.get(b.tool_use_id) !== 'mcp__hearsay__hearsay_run') continue;
      const parts = Array.isArray(b.content) ? b.content.map((c) => c.text ?? '') : [String(b.content)];
      console.log(`    ${verdictLine(parts)}`);
    }
  if (e.type === 'result') console.log(`  done: ${e.num_turns} turns, ${(e.duration_ms / 1000).toFixed(0)} s, $${e.total_cost_usd?.toFixed(2)}`);
}
