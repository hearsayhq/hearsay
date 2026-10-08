#!/usr/bin/env bash
# The agent loop, end to end (M2b gate, docs/07; clip m2b-agent-loop, docs/09).
# Builds a workspace holding only the flawed Smart Home add-on, its locked suite and the
# fix-hearsay-findings skill; runs a fresh headless Claude Code session with the Hearsay
# MCP server; then checks independently: green, and nothing under suites/ changed.
# With --ui the same session runs in Claude Code's own interface, for a screen recording (film
# v6): it starts with the same prompt and tools; exit it (/exit) when it is done, and the checks
# follow.
#
#   scripts/agent-loop.sh [--ui] [workspace-dir]       needs `claude` on PATH; costs one agent run
set -euo pipefail
UI=; if [[ "${1:-}" == --ui ]]; then UI=1; shift; fi
export GIT_PAGER=cat PAGER=cat
REPO=$(cd "$(dirname "$0")/.." && pwd)
W=${1:-$(mktemp -d)/smart-home-addon}
TSX="$REPO/node_modules/.bin/tsx"
hearsay() { "$TSX" "$REPO/packages/cli/src/index.ts" "$@"; }

rm -rf "$W" && mkdir -p "$W/src" "$W/suites" "$W/.claude/skills" "$W/node_modules/@hearsayhq"
cp "$REPO/servers/smart-home/src/devices.ts" "$W/src/devices.ts"
{ echo '/** Smart Home add-on: MCP server for scenes in every room. */'
  sed -e '1,4d' -e 's/createFlawedServer/createServer/' -e "s/0.1.0-flawed/0.1.0/" "$REPO/servers/smart-home/src/flawed.ts"; } > "$W/src/server.ts"
cat > "$W/src/index.ts" <<'TS'
import { serveMcp } from '@hearsayhq/kit';
import { Home } from './devices';
import { createServer } from './server';

const home = new Home();
const served = await serveMcp({ port: Number(process.env.PORT ?? 4122), create: (ctx) => createServer(home, ctx) });
console.error(`[smart-home-addon] listening on ${served.url}`);
TS
echo '{ "name": "smart-home-addon", "private": true, "type": "module" }' > "$W/package.json"
for p in kit mandate; do ln -s "$REPO/packages/$p" "$W/node_modules/@hearsayhq/$p"; done
ln -s "$REPO/node_modules/@modelcontextprotocol" "$W/node_modules/@modelcontextprotocol"
ln -s "$REPO/node_modules/zod" "$W/node_modules/zod"
sed -e 's#http://localhost:4102/mcp#http://localhost:4122/mcp#' \
    -e "s#start: npm run server:smart-home#start: cd $W \&\& PORT=4122 $TSX src/index.ts#" \
    "$REPO/suites/smart-home.yaml" > "$W/suites/smart-home.yaml"
cp -r "$REPO/skills/fix-hearsay-findings" "$W/.claude/skills/"
cat > "$W/mcp.json" <<JSON
{ "mcpServers": { "hearsay": { "command": "$TSX", "args": ["$REPO/packages/mcp/src/index.ts", "--cwd", "$W"] } } }
JSON
printf 'node_modules\nreports\nmcp.json\n' > "$W/.gitignore"
cd "$W"
hearsay lock suites/smart-home.yaml > /dev/null
git init -q && git add -A && git -c user.name=hearsay -c user.email=hearsay@localhost commit -qm "flawed add-on"

echo '$ hearsay run suites/smart-home.yaml          # before'
hearsay run suites/smart-home.yaml | grep -E 'errors ·' || true
echo
PROMPT="This repository is the MCP server of an Alexa+ add-on (src/). Make it pass its Hearsay suite, suites/smart-home.yaml. Use the fix-hearsay-findings skill and the hearsay tools."
TOOLS=(--mcp-config "$W/mcp.json" --strict-mcp-config --setting-sources project
  --allowedTools mcp__hearsay__hearsay_run mcp__hearsay__hearsay_lint mcp__hearsay__hearsay_explain Read Edit Write Glob Grep Skill
  --disallowedTools Bash --permission-mode acceptEdits)
if [[ -n "$UI" ]]; then
  echo '$ claude "Make it pass its Hearsay suite …"   # fresh session: Hearsay MCP + fix-hearsay-findings, no shell'
  claude "$PROMPT" "${TOOLS[@]}" || true
else
  echo '$ claude -p "Make it pass its Hearsay suite …"   # fresh session: Hearsay MCP + fix-hearsay-findings, no shell'
  claude -p "$PROMPT" "${TOOLS[@]}" --max-budget-usd 5 \
    --output-format stream-json --verbose | tee "$W/../agent-run.jsonl" | node "$REPO/scripts/agent-loop-pretty.mjs"
fi
echo
echo '$ hearsay run suites/smart-home.yaml          # after'
hearsay run suites/smart-home.yaml | grep -E 'errors ·|✓' ; code=${PIPESTATUS[0]}
echo
echo '$ git diff --stat'
git --no-pager diff --stat
if git diff --quiet -- suites; then echo 'suites/ and the lock: untouched'; else echo 'suites/ CHANGED'; code=1; fi
exit "$code"
