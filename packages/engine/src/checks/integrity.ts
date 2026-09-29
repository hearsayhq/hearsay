/** suite.integrity (docs/05 §Can it connect?): a locked suite must be the one that was locked. */
import { relative } from 'node:path';
import { checkSuiteIntegrity } from '../lock';
import { fire, type ServerCheck } from './types';

export const suiteIntegrity: ServerCheck = {
  id: 'suite.integrity',
  async run({ suitePath }) {
    if (!suitePath) return [];
    const r = await checkSuiteIntegrity(suitePath);
    if (r.state !== 'changed') return [];
    return [
      fire('suite.integrity', 0, `${relative(process.cwd(), suitePath) || suitePath} changed since it was locked; this run cannot count as green`, {
        evidence: { suite: suitePath, lock: r.lockPath, expected: r.expected, actual: r.actual },
        hint: 'Fix the server, not the suite. A suite change goes through a normal pull request, with `hearsay lock` in the same commit.',
      }),
    ];
  },
};
