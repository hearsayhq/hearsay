/** Registry of implemented checks. A check is here only together with its failing fixture (docs/08). */
import { asrRobust } from './asr';
import { coverageDecline, coverageLimits, coverageTools, coverageValues } from './coverage';
import { caseExpect } from './case';
import { protocolListChanged } from './list-changed';
import { consentDeclineHolds, consentMisheardAmount, consentOverConfirmation, consentPath, consentStatesDetails } from './consent';
import { mandateExpiry, mandateInjection, mandatePrincipalBound, mandateSchemaIgnoringCaller, mandateVersionRace } from './mandate';
import { consentVerbalToken } from './verbal';
import { suiteIntegrity } from './integrity';
import { lintErrorActionable, protocolRefusalAsResult } from './errors';
import { latencyFirstAudio, latencyTool } from './latency';
import { lintDescriptions, lintDestructiveAnnotated, lintSchemaConstraints, lintToolNames } from './lint';
import { protocolVersion } from './protocol';
import { speakLength, speakLists, speakNoStructuredDump } from './speak';
import type { ServerCheck, SuiteCheck, TurnCheck } from './types';

export const TURN_CHECKS: ReadonlyMap<string, TurnCheck> = new Map(
  [caseExpect, asrRobust, latencyTool, latencyFirstAudio, speakLength, speakNoStructuredDump, speakLists, lintErrorActionable, protocolRefusalAsResult, consentPath, consentDeclineHolds, consentStatesDetails, consentMisheardAmount, consentOverConfirmation, mandateInjection, protocolListChanged].map((c) => [c.id, c]),
);

export const SERVER_CHECKS: ReadonlyMap<string, ServerCheck> = new Map([suiteIntegrity, protocolVersion, lintToolNames, lintDescriptions, lintSchemaConstraints, lintDestructiveAnnotated, consentVerbalToken, mandateSchemaIgnoringCaller, mandateVersionRace, mandateExpiry, mandatePrincipalBound].map((c) => [c.id, c]));

/** After all cases: over the visible suite and its traces (coverage.*, FR-067). */
export const SUITE_CHECKS: ReadonlyMap<string, SuiteCheck> = new Map([coverageTools, coverageValues, coverageDecline, coverageLimits].map((c) => [c.id, c]));

export const IMPLEMENTED = new Set([...TURN_CHECKS.keys(), ...SERVER_CHECKS.keys(), ...SUITE_CHECKS.keys()]);

/** Server checks that need nothing but a URL: what `hearsay lint` runs (FR-031). */
export const LINT_CHECKS = ['protocol.version', 'lint.tool_names', 'lint.descriptions', 'lint.schema_constraints', 'lint.destructive_annotated'] as const;
