#!/usr/bin/env bash
# The write-hearsay-suite skill, end to end (M6 gate, FR-033). Builds a workspace holding only
# the Kitchen add-on and no suite; starts the server; runs a fresh headless Claude Code session
# with the Hearsay MCP server and the skill; then checks independently that the drafted suite
# is valid and runs.
#
#   scripts/skill-draft.sh [workspace-dir]       needs `claude` on PATH; costs one agent run
set -euo pipefail
export GIT_PAGER=cat PAGER=cat
REPO=$(cd "$(dirname "$0")/.." && pwd)
W=${1:-$(mktemp -d)/kitchen-addon}
TSX="$REPO/node_modules/.bin/tsx"
PORT=4131
hearsay() { "$TSX" "$REPO/packages/cli/src/index.ts" "$@"; }

rm -rf "$W" && mkdir -p "$W/src" "$W/suites" "$W/.claude/skills" "$W/node_modules/@hearsayhq"
cp "$REPO"/servers/kitchen/src/{server,timers,recipe,index}.ts "$W/src/"
echo '{ "name": "kitchen-addon", "private": true, "type": "module" }' > "$W/package.json"
for p in kit mandate; do ln -s "$REPO/packages/$p" "$W/node_modules/@hearsayhq/$p"; done
ln -s "$REPO/node_modules/@modelcontextprotocol" "$W/node_modules/@modelcontextprotocol"
ln -s "$REPO/node_modules/zod" "$W/node_modules/zod"
cp -r "$REPO/skills/write-hearsay-suite" "$W/.claude/skills/"
cat > "$W/mcp.json" <<JSON
{ "mcpServers": { "hearsay": { "command": "$TSX", "args": ["$REPO/packages/mcp/src/index.ts", "--cwd", "$W"] } } }
JSON
printf 'node_modules\nreports\nmcp.json\n' > "$W/.gitignore"
cd "$W"
git init -q && git add -A && git -c user.name=hearsay -c user.email=hearsay@localhost commit -qm "kitchen add-on, no suite"

PORT=$PORT "$TSX" src/index.ts 2>/dev/null &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
until curl -s -o /dev/null "http://localhost:$PORT/mcp"; do sleep 0.2; done

echo "\$ claude -p \"Write a Hearsay suite for this add-on …\"   # fresh session: Hearsay MCP + write-hearsay-suite, no shell"
claude -p "This repository is the MCP server of an Alexa+ add-on (src/). It runs at http://localhost:$PORT/mcp; start command: PORT=$PORT $TSX src/index.ts. It has no Hearsay suite yet. Write one with the write-hearsay-suite skill and the hearsay tools." \
  --mcp-config "$W/mcp.json" --strict-mcp-config --setting-sources project \
  --allowedTools mcp__hearsay__hearsay_run mcp__hearsay__hearsay_lint mcp__hearsay__hearsay_explain Read Write Edit Glob Grep Skill \
  --disallowedTools Bash --permission-mode acceptEdits --max-budget-usd 2 \
  --output-format stream-json --verbose | tee "$W/../agent-run.jsonl" | node "$REPO/scripts/agent-loop-pretty.mjs"
echo
echo '$ hearsay validate suites/*.yaml'
code=0
hearsay validate suites/*.yaml || code=$?
echo
for f in suites/*.yaml; do
  echo "\$ hearsay run $f"
  hearsay run --no-start "$f" | tail -3 || true
done
echo
echo '$ git status --short'
git status --short
if git diff --quiet -- src; then echo 'src/: untouched'; else echo 'src/ CHANGED'; code=1; fi
exit "$code"
