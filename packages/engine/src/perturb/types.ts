/** A case as heard (docs/03 §Variants). `edits` let the scripted planner carry the mishearing into arguments. */
export interface Edit {
  from: string;
  to: string;
}

export interface Variant {
  /** "clean" or "<perturbation>#<n>". */
  id: string;
  perturbation?: string;
  heard: string;
  edits: Edit[];
}

export const CLEAN = (utterance: string): Variant => ({ id: 'clean', heard: utterance, edits: [] });
