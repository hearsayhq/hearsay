# @hearsayhq/kit

Building blocks for MCP servers that are heard, not read: behind a voice assistant such as
Alexa+, a person listens to every reply, may be misheard, and must only be charged on their own
yes. Each block fixes findings of [Hearsay](https://github.com/hearsayhq/hearsay), and every
Hearsay finding names the block that fixes it. Unofficial; not affiliated with Amazon.

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { count, looseInt, refuse, serveMcp, speak } from '@hearsayhq/kit';

const MINUTES = looseInt(1, 240, 'Duration in whole minutes, 1 to 240.');

await serveMcp({
  port: 4101,
  create: () => {
    const server = new McpServer({ name: 'kitchen', version: '1.0.0' });
    server.registerTool(
      'timer_start',
      { description: 'Use when the person asks to set a timer.', inputSchema: { minutes: MINUTES.schema } },
      async ({ minutes: raw }) => {
        const minutes = MINUTES.parse(raw);
        if (minutes === undefined) return refuse('How many minutes should the timer run?', 'INVALID_MINUTES');
        return speak(`Timer set for ${count(minutes, 'minute')}.`, { minutes });
      },
    );
    return server;
  },
});
```

| Block | Use | Fixes |
|---|---|---|
| `speak(text, structured?)` | A reply a person can listen to; throws on JSON, ids, URLs, snake_case, over 400 characters. Data for programs goes into `structured`. | `speak.*`, `asr.robust` (read-back) |
| `words(n)`, `money(minor)`, `count(n, noun)`, `list(items)` | Numbers, money and short lists in words. | `speak.*` |
| `refuse(sentence, code, details?)` | A refusal as `isError` with one sentence that says what the person can do, and a code. | `lint.error_actionable`, `protocol.refusal_as_result` |
| `looseEnum(values, synonyms)` | Advertise an enum, accept any string, normalise it ("livingroom" → `living_room`). | `asr.robust`, `protocol.refusal_as_result` |
| `looseInt(min, max)` | Advertise integer bounds, let any value (or none) reach the handler, ask in words. | `lint.schema_constraints`, `protocol.refusal_as_result` |
| `confirm(server, question, { commits, insideMandate })` | Ask through the host (elicitation) before a commit, and only then. | `consent.*` |
| `VerbalTokens`, `askVerbally` | A spoken confirmation with a bound, single-use token when the host has no elicitation. | `consent.verbal_token` |
| `withMandate(mandate, call)` | Refuse anything outside what the person allowed, as a spoken result. | `mandate.*` |
| `serveMcp({ port, create })` | Streamable HTTP with one server per session and the principal from the bearer token. | `mandate.principal_bound` |

Consent is for your customers, not for you: grant once, act freely within the limit, confirm
only when money moves.
