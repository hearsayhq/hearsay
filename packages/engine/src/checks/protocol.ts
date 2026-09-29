/** protocol.version (docs/05 §Can it connect?): 2025-11-25 is required; 2025-03-26 should still work. */
import { probeProtocol } from '../probe';
import { fire, type ServerCheck } from './types';

const REQUIRED = '2025-11-25';
const OLD = '2025-03-26';

export const protocolVersion: ServerCheck = {
  id: 'protocol.version',
  async run({ url, server, newPrincipal }) {
    const out = [];
    if (server.protocolVersion !== REQUIRED)
      out.push(fire('protocol.version', 0, `negotiated ${server.protocolVersion ?? 'nothing'} when offered ${REQUIRED}`, {
        evidence: { offered: REQUIRED, negotiated: server.protocolVersion },
        hint: 'Upgrade @modelcontextprotocol/sdk (1.31+ negotiates 2025-11-25) and serve Streamable HTTP.',
      }));
    const old = await probeProtocol(url, OLD, newPrincipal());
    if (!old.ok)
      out.push(fire('protocol.version', 1, `a client offering ${OLD} cannot use the server: ${old.error}`, {
        evidence: { offered: OLD, ...old },
        hint: `Keep ${OLD} in the supported versions; Amazon's example Alexa+ handshake offers it.`,
      }));
    return out;
  },
};
