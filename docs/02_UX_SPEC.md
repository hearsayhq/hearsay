# UX spec

Two surfaces, one data model (Trace, Finding). Neither computes a verdict of its own.

## CLI (primary for CI and judges)

```
$ npm run earshot -- run suites/smart-home.yaml
smart-home · 3 cases · 9 variants · scripted
✗ living-room-off            clean      speak.no_structured_dump  reply contains JSON (412 chars)
✗ living-room-off            asr.compound_split#1  asr.robust  "livingroom" → room=null, expected living_room
✗ whole-home-off-needs-conf  clean      lint.destructive_annotated  set_scene has side effects but no destructiveHint
…
3 errors · 2 warnings · report: reports/smart-home-2026-10-06T19-04.json
```

One line per finding: case, variant, check id, what happened. `--verbose` prints the timeline.

## Web console (primary for the video)

Layout, left to right:

1. **Connect** — server URL, protocol and capabilities badge, live tool list with revision
   counter (it ticks when `list_changed` arrives; that tick is a demo moment for the mandate).
2. **Voice** — push-to-talk (Web Speech API), a text field as equal alternative, the spoken reply
   as text and audio. An Echo-Show-like frame is decoration only; it must not imply an Amazon
   product.
3. **Timeline** — one row per turn: asr · plan · tool · elicitation · speak as bars on a shared
   ms scale with the budget as a dashed line. Click a tool span → args and raw result.
4. **Findings** — grouped by severity, each with check id, message, hint, link to the turn.

Elicitation is shown as a modal the *person* answers ("Place the order: milk and eggs, $7.40?"
Accept / Decline), styled as host chrome, never as part of the assistant's reply.
