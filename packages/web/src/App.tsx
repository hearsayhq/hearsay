/**
 * Placeholder. The web UI is milestone M3 (docs/07_IMPLEMENTATION_PLAN.md):
 * connect panel, voice console (mic + spoken reply), per-turn trace timeline,
 * findings list. It renders Trace/Finding objects from @earshot/engine and adds
 * no logic of its own: every verdict comes from the engine (docs/04 §UI).
 */
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Earshot</h1>
      <p>Voice console and trace timeline land in M3. Until then, use the CLI: <code>npm run earshot -- run suites/kitchen.yaml</code></p>
    </main>
  );
}
