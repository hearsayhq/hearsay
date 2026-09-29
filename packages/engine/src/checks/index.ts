/** Registry of implemented checks. A check is here only together with its failing fixture (docs/08). */
import { caseExpect } from './case';
import { latencyFirstAudio, latencyTool } from './latency';
import { protocolVersion } from './protocol';
import { speakLength, speakNoStructuredDump } from './speak';
import type { ServerCheck, TurnCheck } from './types';

export const TURN_CHECKS: ReadonlyMap<string, TurnCheck> = new Map(
  [caseExpect, latencyTool, latencyFirstAudio, speakLength, speakNoStructuredDump].map((c) => [c.id, c]),
);

export const SERVER_CHECKS: ReadonlyMap<string, ServerCheck> = new Map([protocolVersion].map((c) => [c.id, c]));

export const IMPLEMENTED = new Set([...TURN_CHECKS.keys(), ...SERVER_CHECKS.keys()]);
