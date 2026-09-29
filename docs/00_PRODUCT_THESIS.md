# Product thesis

Alexa+ runs third-party MCP servers by voice. The model picks the tool, a person hears the
answer, and nobody sees the JSON. Most servers are written and tested for chat clients, where a
2-second tool call, a 14-item list or an unconfirmed "turn everything off" are merely awkward.
Spoken aloud, they are broken.

Developers outside Amazon's partner program cannot test against Alexa+ at all: the MCP Toolkit,
CLI and Web Simulator are partner-gated (hackathon FAQ). Community simulators exist and let you
*talk* to a server. None of them tells you whether the server is *fit for voice*, reproducibly,
in CI.

**Earshot is the test and trace engine for MCP servers behind a voice assistant.** It runs
utterances against a live server, perturbs them the way speech recognition does, measures where
every millisecond of a spoken turn goes, judges the reply as something a person has to listen to,
and checks that consequential actions only happen with the person's consent. The result is a
trace you can look at and a verdict CI can block on.

## What it is

- A deterministic engine: suites in YAML, scripted and replayed runs that need no API keys.
- A catalog of voice-specific checks with stable ids (docs/05).
- A mandate model, ported from the WebMCP Mandate Compiler, as both a library and a check family.
- A local web console to speak to a server and watch the trace.
- Three reference servers that exist to pass and to fail.

## What it is not

- Not an Alexa+ simulator. It uses a stand-in orchestrator and says so. Community simulators and
  bridges can be plugged in as orchestrators later.
- Not an end-to-end phone-agent testing platform (Hamming, Coval, Cekura). It tests the tool
  server, not the voice pipeline.
- Not affiliated with or endorsed by Amazon.

## One sentence for the judges

*A server that passes Earshot is one you can put behind a voice assistant without hearing JSON,
waiting in silence, or buying something you didn't agree to.*
