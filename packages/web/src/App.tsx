/**
 * Placeholder. The console is milestone M5 (docs/07_IMPLEMENTATION_PLAN.md):
 * connect panel, text input with a spoken reply, per-turn timeline, findings
 * grouped by the four questions. It renders Trace/Finding objects from
 * @hearsayhq/engine and adds no logic of its own: every verdict comes from the
 * engine (docs/02, docs/04 §Packages).
 */
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Hearsay</h1>
      <p>Unofficial preflight checks for Alexa+ MCP servers. The console lands in M5. Until then, use the CLI: <code>npm run hearsay -- run suites/kitchen.yaml</code></p>
    </main>
  );
}
