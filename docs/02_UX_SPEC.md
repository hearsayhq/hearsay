# UX spec

Two surfaces, one data model (Trace, Finding). Neither computes a verdict of its own. Both are
organised by the four questions (docs/00), with the precondition shown first and labelled
"Precondition: Can it connect?", never as a fifth question.

Counting is the same everywhere: a **case** is one entry in the suite, a **run** is a case with
one variant (clean or misheard), so a case with one misheard variant is one case and two runs.
Holdout cases and runs are counted apart and never added to the visible ones.

## CLI (primary for CI and judges)

```
$ npm run hearsay -- run suites/smart-home.yaml
smart-home · 3 cases · 5 runs with variants · scripted · seed 1

Did it hear me right?
✗ living-room-off  asr.compound_split#1  asr.robust        error  "livingroom" matched no room, reply said "Done."
Do I have to wait?
✗ living-room-off  clean                 latency.tool      error  set_scene took 1104 ms (Amazon: < 500 ms)
Can I listen to this?
✗ living-room-off  clean                 speak.no_structured_dump  error  reply contains JSON (412 chars)
Did I agree?
✗ whole-home-off…  clean                 consent.path      error  whole house turned off without a confirmation

4 errors · 3 warnings · 0 info · 5 of 5 runs failed · 2 skipped (planned)
report: reports/smart-home-2026-10-06T19-04.json
```

One line per finding: case, variant, check id, severity, what happened. The source is in the
JSON report and in `--verbose`, which also prints the timeline.

## Web console (primary for the video)

Layout, left to right:

1. **Connect** — server URL, protocol and capabilities badge, tool list.
2. **Talk** — a text field; the reply as text and through the browser's speech synthesis. An
   Echo-Show-like frame is decoration only; it must not imply an Amazon product.
3. **Timeline** — one row per turn: asr · plan · tool · elicitation · speak as bars on a shared
   ms scale, with the 500 ms tool line and the first-audio budget dashed. Modeled spans are
   hatched. Click a tool span → args and raw result.
4. **Findings** — grouped by the four questions, each with check id, severity, message, hint,
   source link and a link to the turn.

Elicitation is shown as a modal the *person* answers ("Place the order: two cartons of milk,
$7.40?" Accept / Decline), styled as host chrome, never as part of the assistant's reply.
