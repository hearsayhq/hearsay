#!/usr/bin/env node
/**
 * Build the publishable packages into build/npm (FR-060, docs/04 §Distribution): tsup bundles
 * the workspace code (engine, mandate, kit) into each package; third-party dependencies stay
 * external with the versions the workspace uses. The CLI ships the built console. Nothing is
 * published here: the owner published 0.1.0, later versions go out through
 * .github/workflows/release.yml when the tag v<VERSION> is pushed (docs/07 M7).
 *
 *   node scripts/pack.mjs
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'tsup';

const REPO = new URL('..', import.meta.url).pathname;
const OUT = join(REPO, 'build/npm');
const VERSION = '0.1.2';
/** npm shows a README outside the repo, so relative links and images point at main on GitHub. */
const forNpm = (md, dir = '') => {
  const abs = (p, base) => new URL(p, `${base}/${dir}`).href;
  const local = (p) => !/^([a-z]+:|#)/i.test(p);
  return md
    .replace(/(src=")([^"]+)"/g, (m, a, p) => (local(p) ? `${a}${abs(p, 'https://raw.githubusercontent.com/hearsayhq/hearsay/main')}"` : m))
    .replace(/(href=")([^"]+)"/g, (m, a, p) => (local(p) ? `${a}${abs(p, 'https://github.com/hearsayhq/hearsay/blob/main')}"` : m))
    .replace(/\]\(([^)\s]+)\)/g, (m, p) => (local(p) ? `](${abs(p, 'https://github.com/hearsayhq/hearsay/blob/main')})` : m));
};
const manifest = (p) => JSON.parse(readFileSync(join(REPO, 'packages', p, 'package.json'), 'utf8'));
const thirdParty = (...pkgs) => Object.fromEntries(pkgs.flatMap((p) => Object.entries(manifest(p).dependencies ?? {})).filter(([n]) => !n.startsWith('@hearsayhq/')).sort());
const common = { version: VERSION, type: 'module', license: 'MIT', engines: { node: '>=22' }, repository: { type: 'git', url: 'git+https://github.com/hearsayhq/hearsay.git' }, homepage: 'https://github.com/hearsayhq/hearsay#readme', publishConfig: { access: 'public' } };
const bundle = (entry, outDir, deps, extra = {}) =>
  build({ entry, outDir, format: 'esm', platform: 'node', target: 'node22', splitting: false, clean: true, silent: true, noExternal: [/^@hearsayhq\//], external: Object.keys(deps).map((d) => new RegExp(`^${d}(/|$)`)), ...extra });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execFileSync('npm', ['run', '-s', 'build', '-w', '@hearsayhq/web'], { cwd: REPO, stdio: 'inherit' });

const packages = [
  {
    dir: 'cli',
    deps: thirdParty('engine', 'mandate'),
    entry: { index: 'packages/cli/src/index.ts' },
    json: { name: '@hearsayhq/cli', description: 'Preflight checks for Alexa+ MCP servers: plays utterances, clean and misheard, and judges what a person would hear and agree to. Unofficial.', bin: { hearsay: 'dist/index.js' }, files: ['dist'] },
    after: (dir) => cpSync(join(REPO, 'packages/web/dist'), join(dir, 'dist/console'), { recursive: true }),
    readme: 'README.md',
  },
  {
    dir: 'mcp',
    deps: thirdParty('mcp', 'engine', 'kit', 'mandate'),
    entry: { index: 'packages/mcp/src/index.ts' },
    json: { name: '@hearsayhq/mcp', description: 'Hearsay as an MCP server for coding agents: run, lint and explain voice-readiness checks. Unofficial, for Alexa+.', bin: { 'hearsay-mcp': 'dist/index.js' }, files: ['dist', 'skills'] },
    after: (dir) => cpSync(join(REPO, 'skills'), join(dir, 'skills'), { recursive: true }),
    readme: 'README.md',
  },
  {
    dir: 'kit',
    deps: thirdParty('kit', 'mandate'),
    entry: { index: 'packages/kit/src/index.ts' },
    extra: { dts: { resolve: [/^@hearsayhq\//] } },
    json: { name: '@hearsayhq/kit', description: 'Building blocks for voice-ready MCP servers: speak, refuse, looseEnum, looseInt, confirm, withMandate, serveMcp.', exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }, types: 'dist/index.d.ts', files: ['dist'] },
    readme: 'packages/kit/README.md',
  },
];

for (const p of packages) {
  const dir = join(OUT, p.dir);
  await bundle(p.entry, join(dir, 'dist'), p.deps, p.extra);
  p.after?.(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ ...p.json, ...common, dependencies: p.deps }, null, 2) + '\n');
  cpSync(join(REPO, 'LICENSE'), join(dir, 'LICENSE'));
  writeFileSync(join(dir, 'README.md'), forNpm(readFileSync(join(REPO, p.readme), 'utf8'), p.readme.includes('/') ? p.readme.replace(/[^/]+$/, '') : ''));
  const file = execFileSync('npm', ['pack', '--silent', '--pack-destination', OUT], { cwd: dir, encoding: 'utf8' }).trim().split('\n').at(-1);
  console.log(`${p.json.name}@${VERSION}  →  build/npm/${file}`);
}
