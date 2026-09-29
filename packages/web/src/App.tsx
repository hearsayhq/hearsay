/**
 * The console (FR-041/042): talk to an MCP server as a person would, and watch the engine
 * judge each turn. It renders Trace and Finding objects from `hearsay serve` and computes
 * nothing itself (docs/02, docs/04 §Packages).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogResponse, ConnectResponse, ElicitationEvent, Finding, RunResponse, SuiteSummary, TurnEvent } from '@hearsayhq/engine/types';
import { api } from './api';
import { ElicitationModal } from './components/ElicitationModal';
import { FindingItem, FindingsByQuestion } from './components/Findings';
import { ReportView } from './components/ReportView';
import { Timeline } from './components/Timeline';
import { speak } from './speech';

type Entry = { kind: 'turn'; said: string; event: TurnEvent } | { kind: 'pending'; said: string };

export function App() {
  const [catalog, setCatalog] = useState<CatalogResponse>();
  const [suites, setSuites] = useState<SuiteSummary[]>([]);
  const [suitePath, setSuitePath] = useState('');
  const [conn, setConn] = useState<ConnectResponse>();
  const [busy, setBusy] = useState<'connect' | 'run' | null>(null);
  const [error, setError] = useState<string>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const [asking, setAsking] = useState<ElicitationEvent>();
  const [voice, setVoice] = useState(true);
  const [run, setRun] = useState<RunResponse>();
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.catalog(), api.suites()])
      .then(([c, s]) => {
        setCatalog(c);
        setSuites(s);
        setSuitePath((p) => p || s[0]?.path || '');
      })
      .catch(() => setError('Cannot reach the engine. Start it with: npm run hearsay -- serve'));
  }, []);

  // Turns, findings and the server's questions arrive over SSE while a turn plays.
  useEffect(() => {
    if (!conn) return;
    const es = new EventSource(`/api/events/${conn.sessionId}`);
    es.addEventListener('turn', (m) => {
      const event = JSON.parse(m.data) as TurnEvent;
      setEntries((xs) => {
        const i = xs.findIndex((x) => x.kind === 'pending');
        const said = i >= 0 ? xs[i]!.said : '';
        const next: Entry = { kind: 'turn', said, event };
        return i >= 0 ? [...xs.slice(0, i), next, ...xs.slice(i + 1)] : [...xs, next];
      });
      if ('turn' in event) speak(event.turn.spoken, voiceRef.current);
    });
    es.addEventListener('elicitation', (m) => {
      const e = JSON.parse(m.data) as ElicitationEvent;
      setAsking(e);
      speak(e.message, voiceRef.current);
    });
    es.addEventListener('elicitation-answered', () => setAsking(undefined));
    es.addEventListener('tools', (m) => setConn((c) => c && { ...c, tools: (JSON.parse(m.data) as { tools: ConnectResponse['tools'] }).tools }));
    const bye = () => api.disconnectBeacon(conn.sessionId);
    window.addEventListener('pagehide', bye);
    return () => {
      es.close();
      window.removeEventListener('pagehide', bye);
    };
  }, [conn?.sessionId]);

  useEffect(() => {
    void endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries]);

  const toolLimitMs = catalog?.checks.find((c) => c.id === 'latency.tool')?.thresholds[0]?.value ?? 500;
  const allFindings = useMemo(() => entries.flatMap((e) => (e.kind === 'turn' && 'findings' in e.event ? e.event.findings : [])), [entries]);
  const pending = entries.some((e) => e.kind === 'pending');
  const selected = suites.find((s) => s.path === suitePath);

  async function connect() {
    setBusy('connect');
    setError(undefined);
    try {
      if (conn) await api.disconnect(conn.sessionId).catch(() => undefined);
      setEntries([]);
      setConn(await api.connect(suitePath));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function send(said: string) {
    if (!conn || !said.trim() || pending) return;
    setText('');
    setEntries((xs) => [...xs, { kind: 'pending', said }]);
    try {
      await api.say(conn.sessionId, said);
    } catch (e) {
      setEntries((xs) => xs.map((x) => (x.kind === 'pending' ? { kind: 'turn', said, event: { error: (e as Error).message } } : x)));
    }
  }

  async function runSuite() {
    setBusy('run');
    setError(undefined);
    try {
      setRun(await api.run(suitePath));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function answer(action: 'accept' | 'decline' | 'cancel') {
    if (!conn || !asking) return;
    setAsking(undefined);
    await api.answer(conn.sessionId, asking.id, action);
  }

  const suggestions = conn?.suite.cases.map((c) => (Array.isArray(c.say) ? c.say[0]! : c.say)) ?? [];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <strong>Hearsay</strong>
          <span className="muted">Unofficial preflight checks for Alexa+ MCP servers</span>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Speak replies
        </label>
      </header>

      <section className="panel connect">
        <label htmlFor="suite">Suite</label>
        <select id="suite" value={suitePath} onChange={(e) => setSuitePath(e.target.value)}>
          {suites.map((s) => <option key={s.path} value={s.path}>{s.suite}  ·  {s.url}</option>)}
        </select>
        <button className="primary" onClick={connect} disabled={!suitePath || busy !== null}>{busy === 'connect' ? 'Connecting…' : conn ? 'Reconnect' : 'Connect'}</button>
        <button onClick={runSuite} disabled={!suitePath || busy !== null}>{busy === 'run' ? 'Running suite…' : 'Run suite'}</button>
        {selected?.description && <p className="muted small wide">{selected.description}</p>}
        {error && <p className="error wide">{error}</p>}
      </section>

      {run && <ReportView run={run} catalog={catalog} onClose={() => setRun(undefined)} />}

      {conn && (
        <div className="work">
          <section className="panel convo">
            <header className="convo-head">
              <div>
                <strong>{conn.server.name ?? 'server'}</strong> <span className="muted">{conn.server.version} · protocol {conn.server.protocolVersion ?? '?'} · {conn.tools.length} tools</span>
              </div>
              <span className="planner" title="What turns your words into tool calls">Planner: {conn.planner}</span>
            </header>
            <div className="turns">
              {entries.length === 0 && <p className="muted">Say something to the server as a customer would. The engine judges every turn.</p>}
              {entries.map((e, i) => <TurnCard key={i} entry={e} budgetMs={conn.suite.budget.firstAudioMs} toolLimitMs={toolLimitMs} />)}
              <div ref={endRef} />
            </div>
            <form className="say" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what the person says…" aria-label="What the person says" disabled={pending} />
              <button className="primary" type="submit" disabled={pending || !text.trim()}>{pending ? 'Playing…' : 'Say'}</button>
            </form>
            <div className="chips" aria-label="Utterances from the suite">
              {[...new Set(suggestions)].map((s) => <button key={s} className="chip" onClick={() => setText(s)} disabled={pending}>{s}</button>)}
            </div>
          </section>

          <aside className="panel findings">
            <h2>Findings this session</h2>
            <FindingsByQuestion findings={allFindings} catalog={catalog} emptyText="No findings yet. Live checks: latency, speech, refusals, consent." />
            <details className="tools">
              <summary>Tools ({conn.tools.length})</summary>
              <ul>{conn.tools.map((t) => <li key={t.name}><code>{t.name}</code> <span className="muted">{t.description}</span></li>)}</ul>
            </details>
          </aside>
        </div>
      )}

      {asking && <ElicitationModal message={asking.message} onAnswer={(a) => void answer(a)} />}
    </div>
  );
}

function TurnCard({ entry, budgetMs, toolLimitMs }: { entry: Entry; budgetMs: number; toolLimitMs: number }) {
  if (entry.kind === 'pending')
    return (
      <article className="turn">
        <p className="you">{entry.said}</p>
        <p className="muted">…</p>
      </article>
    );
  const ev = entry.event;
  if ('error' in ev)
    return (
      <article className="turn">
        <p className="you">{entry.said}</p>
        <p className="error">{ev.error}</p>
      </article>
    );
  const { turn, planner, firstAudio, findings } = ev;
  const errs = findings.filter((f: Finding) => f.severity === 'error').length;
  return (
    <article className="turn">
      <p className="you">{turn.utterance}</p>
      {turn.toolCalls.map((c, i) => (
        <div key={i} className="call">
          <code>{c.tool}</code> <code className="args">{JSON.stringify(c.args)}</code>
          {c.result.isError && <span className="sev sev-info">{c.result.errorCode ?? 'isError'}</span>}
          {(c.elicitations ?? []).map((q, j) => (
            <p key={j} className="asked">Asked: “{q.message}” → <strong>{q.action === 'accept' ? 'yes' : q.action === 'decline' ? 'no' : 'cancelled'}</strong></p>
          ))}
        </div>
      ))}
      {turn.toolCalls.length === 0 && <p className="muted small">No tool called.</p>}
      <p className="spoken">{turn.spoken || <span className="muted">(silence)</span>}</p>
      <p className="muted small">
        {'model' in planner ? `planned by ${planner.model}` : planner.caseId ? `planned from case ${planner.caseId} (overlap ${planner.score})` : 'no matching case: nothing called'}
      </p>
      <Timeline spans={turn.spans} serverMs={turn.toolCalls.map((c) => c.latencyMs)} firstAudio={firstAudio} budgetMs={budgetMs} toolLimitMs={toolLimitMs} />
      {findings.length > 0 && (
        <details className="turn-findings" open={errs > 0}>
          <summary>{findings.length} finding{findings.length === 1 ? '' : 's'} on this turn</summary>
          <ul>{findings.map((f, i) => <FindingItem key={i} f={f} />)}</ul>
        </details>
      )}
    </article>
  );
}
