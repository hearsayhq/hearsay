/**
 * What `hearsay serve` sends to the console (FR-040). Types only, no Node imports, so the
 * browser can use them through `@hearsayhq/engine/types`.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { CheckSpec, Question } from '../catalog';
import type { FirstAudio } from '../latency';
import type { Finding, Report } from '../report';
import type { ServerInfo, Turn } from '../trace';

export interface SuiteSummary {
  path: string;
  suite: string;
  url: string;
  description: string;
  cases: { id: string; say: string }[];
}

export interface ConnectResponse {
  sessionId: string;
  server: ServerInfo;
  tools: Tool[];
  /** Which planner turns typed text into tool calls; the console shows it. */
  planner: string;
  suite: { suite: string; budget: { firstAudioMs: number; spokenChars: number; listItems: number }; latencyModel: { asrMs: number; speakTtfbMs: number }; cases: { id: string; say: string | string[] }[] };
}

export type PlannerInfo = { caseId: string | null; score?: number } | { model: string };

export type TurnEvent = { turn: Turn; planner: PlannerInfo; firstAudio: FirstAudio; findings: Finding[] } | { error: string };
export interface ElicitationEvent {
  id: string;
  message: string;
}
export interface ElicitationAnsweredEvent {
  id: string;
  action: 'accept' | 'decline' | 'cancel';
}
export interface ToolsEvent {
  revision: number;
  tools: Tool[];
}

export interface CatalogResponse {
  questions: { id: Question; text: string }[];
  checks: CheckSpec[];
}

export interface RunResponse {
  report: Report;
  reportPath: string;
}
