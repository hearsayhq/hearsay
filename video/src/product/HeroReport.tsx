/**
 * Product-first frame: the real console report (ReportView from packages/web) of a real flawed
 * Smart Home run, in a window floating in 3D, the camera pushing in, the glass lens gliding onto
 * one finding.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { CatalogResponse, RunResponse } from '@hearsayhq/engine/types';
import { ReportView } from '../../../packages/web/src/components/ReportView';
import catalog from '../data/catalog.json';
import report from '../data/smart-home-flawed.json';
import { GlassLens } from '../glass/GlassLens';
import { AppWindow } from './AppWindow';
import { Stage } from './Stage';

const WIN_W = 1360;
const WIN_H = 820;
const TARGET = 'speak.no_structured_dump';

export function HeroReport() {
  const f = useCurrentFrame();
  const content = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [handle] = useState(() => delayRender('measure the finding under the lens'));
  useLayoutEffect(() => {
    const code = [...(content.current?.querySelectorAll('.finding code') ?? [])].find((e) => e.textContent === TARGET);
    const li = code?.closest('li');
    if (li instanceof HTMLElement && content.current) {
      // Layout offsets, not screen rects: the window is transformed in 3D.
      let top = 0;
      let left = 0;
      for (let e: HTMLElement | null = li; e && e !== content.current; e = e.offsetParent as HTMLElement | null) {
        top += e.offsetTop;
        left += e.offsetLeft;
      }
      setTarget({ top, left, width: li.offsetWidth, height: li.offsetHeight });
    }
    continueRender(handle);
  }, [handle]);

  const ease = Easing.bezier(0.22, 1, 0.36, 1);
  const t = interpolate(f, [0, 170], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
  const scroll = target ? interpolate(f, [30, 130], [0, Math.max(target.top - 300, 0)], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const lensIn = interpolate(f, [90, 140], [0, 1], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <Stage>
      <div style={{ position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '50% 40%' }}>
        <div
          style={{
            position: 'absolute', left: (1920 - WIN_W) / 2, top: 120,
            transform: `translateZ(${interpolate(t, [0, 1], [-420, -60])}px) rotateX(${interpolate(t, [0, 1], [14, 5])}deg) rotateY(${interpolate(t, [0, 1], [-18, -6])}deg) rotateZ(${interpolate(t, [0, 1], [2, 0.5])}deg)`,
          }}
        >
          <AppWindow width={WIN_W} height={WIN_H} title="localhost:5180 — Hearsay console">
            <div ref={content} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4000, transform: `translateY(${-scroll}px)` }}>
              <div style={{ padding: 20, display: 'grid', gap: 16 }}>
                <ConsoleBody />
              </div>
              {target && (
                <GlassLens
                  x={interpolate(lensIn, [0, 1], [-target.width - 80, target.left - 20])}
                  y={target.top - 14}
                  width={target.width + 40}
                  height={target.height + 28}
                  canvas={{ width: WIN_W, height: 4000 }}
                  background="var(--bg)"
                >
                  <div style={{ padding: 20, display: 'grid', gap: 16 }}>
                    <ConsoleBody />
                  </div>
                </GlassLens>
              )}
            </div>
          </AppWindow>
        </div>
      </div>
    </Stage>
  );
}

function ConsoleBody() {
  return (
    <>
                <div className="top">
                  <div className="brand"><strong>Hearsay</strong><span className="muted">Unofficial preflight checks for Alexa+ MCP servers</span></div>
                </div>
                <section className="panel connect">
                  <label>Suite</label>
                  <select defaultValue="s"><option value="s">smart-home · http://localhost:4102/mcp</option></select>
                  <button className="primary">Connect</button>
                  <button>Run suite</button>
                </section>
                <ReportView run={{ report, reportPath: 'reports/smart-home-2026-09-30T19-20-09.json' } as unknown as RunResponse} catalog={catalog as unknown as CatalogResponse} onClose={() => undefined} />
    </>
  );
}
