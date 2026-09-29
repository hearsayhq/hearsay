---
name: fix-hearsay-findings
description: Fix an MCP add-on server until its Hearsay suite is green. Use when a Hearsay run (the hearsay_run tool) reports findings for the server you are working on, or when asked to make an add-on work behind a voice assistant such as Alexa+. Changes server code only; never edits suites or the suite lock.
---

# Fix Hearsay findings

The server you are working on is heard, not read: an assistant speaks its replies, a person may be
misheard, and money must only move on the person's yes. Hearsay tests exactly that. Your job is to
change the **server** until Hearsay has no errors.

## Loop

1. `hearsay_run` with the suite path (for example `suites/smart-home.yaml`).
2. Read the findings, errors first. Each has a check id, a message, a `fix` hint and the rule it
   comes from. If a finding is unclear, call `hearsay_explain` with its check id.
3. Change only the server's code. Prefer the `@hearsayhq/kit` block the hint names.
4. `hearsay_run` again with `only: "failed"`.
5. Repeat until there are no errors.
6. Finish with one full `hearsay_run` (no `only`) and report: errors and warnings left, and what
   you changed, in a few lines.

## Hard rules

- **Never change anything under `suites/`**: not the YAML, not `.hearsay-lock`. Never run
  `hearsay lock`. A changed suite turns the run red (`suite.integrity`) and does not count.
- **If a finding looks wrong, stop.** Say in the chat which finding, what the suite expects, and why
  you think it is wrong. Do not work around it.
- Do not remove or rename tools the suite uses, and do not special-case the suite's utterances.
  Hearsay also runs cases you cannot see.
- Confirm only when money moves or when an action falls outside what the person already allowed.
  Asking for everything is a finding too (`consent.over_confirmation`).

## Voice rules

- Replies are one or two sentences a person can listen to: no JSON, ids, URLs or tool names;
  numbers and money in words; at most five options, then offer more.
- Put data for programs into `structuredContent`, never into the spoken text.
- Errors are ordinary tool results with `isError` and one sentence that says what the person can
  do. Never let a schema validation error reach the person.
- Answer fast (under 500 ms). Do slow upstream work in the background.
- Read back what you understood when it could have been misheard ("Pasta timer set for fifty
  minutes").

## Kit cheat sheet (`@hearsayhq/kit`)

| Block | Use |
|---|---|
| `speak(text, structured?)` | A speakable tool result; throws on JSON, ids, URLs, snake_case, > 400 characters. |
| `words(n)`, `money(minor)`, `count(n, noun)`, `list(items)` | Numbers, money and short lists in words. |
| `refuse(sentence, code, details?)` | A refusal as `isError` with one sentence and a code. |
| `looseEnum(values, synonyms)` | Advertise an enum, accept any string, normalise it ("livingroom" → `living_room`). |
| `confirm(server, question, { commits, insideMandate })` | Ask the person through the host (elicitation) before a commit. Returns `accepted`, `declined`, `cancelled`, `unavailable` or `not-needed`. |
| `VerbalTokens`, `askVerbally` | Spoken confirmation with a bound, single-use token when the host has no elicitation. |
| `withMandate(mandate, call)` | Refuse anything outside what the person allowed, as a spoken result. |
