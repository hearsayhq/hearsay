/**
 * The README banner: film v4's wordmark, gradient and light, as one still.
 *   npx remotion still src/index.ts Banner ../docs/assets/banner.jpg --image-format=jpeg --jpeg-quality=90
 * An illustration of the idea (said, heard, the check that fails), not product output.
 */
import { AbsoluteFill } from 'remotion';
import { C, GLASS, GRAD, mono, sans } from '../film4/kit';

export const BANNER = { width: 2400, height: 800 } as const;

const LIGHT: Array<[number, number, number, string]> = [
  [260, 80, 900, '255,178,63'],
  [2050, 700, 1000, '139,107,255'],
  [1350, 820, 760, '255,94,138'],
];

const Row = ({ label, children, tint }: { label: string; children: string; tint: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
    <div style={{ width: 120, fontFamily: mono, fontSize: 30, color: C.muted, textTransform: 'uppercase', letterSpacing: 3 }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 40, color: tint }}>{children}</div>
  </div>
);

export function Banner() {
  return (
    <AbsoluteFill style={{ background: '#05060C', overflow: 'hidden' }}>
      {LIGHT.map(([x, y, r, rgb]) => (
        <div key={rgb} style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', mixBlendMode: 'screen', background: `radial-gradient(circle, rgba(${rgb},0.55) 0%, rgba(${rgb},0.19) 38%, transparent 68%)` }} />
      ))}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.22) 1.6px, transparent 2px), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '400px 400px, 80px 80px, 80px 80px',
        backgroundPosition: '-200px -200px, 0 0, 0 0',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
      }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45))' }} />

      <div style={{ position: 'absolute', left: 170, top: 170 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ fontFamily: sans, fontSize: 228, fontWeight: 900, letterSpacing: -6, lineHeight: 1, color: C.text }}>HEARSAY</div>
          <div style={{ position: 'absolute', left: 6, right: 6, bottom: -30, height: 20, borderRadius: 10, background: GRAD, boxShadow: '0 0 60px rgba(255,94,138,0.55)' }} />
        </div>
        <div style={{ marginTop: 84, fontFamily: sans, fontSize: 58, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Preflight checks for Alexa+ MCP servers</div>
        <div style={{ marginTop: 16, fontFamily: sans, fontSize: 44, fontWeight: 500, color: C.muted }}>Hear it before your customers do.</div>
      </div>

      <div style={{ ...GLASS, position: 'absolute', right: 150, top: 190, width: 800, borderRadius: 28, padding: '48px 52px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <Row label="said" tint={C.text}>add fifteen dollars</Row>
        <Row label="heard" tint={C.amber}>add fifty dollars</Row>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '6px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.red, color: C.ink0, fontFamily: sans, fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
          <div style={{ fontFamily: mono, fontSize: 40, color: C.text }}>consent.misheard_amount</div>
        </div>
        <div style={{ fontFamily: sans, fontSize: 32, color: C.muted, lineHeight: 1.35 }}>Took the misheard amount without reading it back. The pull request turns red.</div>
      </div>

      <div style={{ position: 'absolute', left: 170, bottom: 56, fontFamily: sans, fontSize: 26, color: 'rgba(244,246,250,0.55)' }}>Unofficial. Not affiliated with or endorsed by Amazon.</div>
    </AbsoluteFill>
  );
}
