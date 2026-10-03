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
    const file = relative(process.cwd(), r.file) || r.file;
    const what = r.actual === 'absent' ? 'was removed' : r.expected === 'absent' ? 'was added' : 'changed';
    return [
      fire('suite.integrity', 0, `${file} ${what} since it was locked; this run cannot count as green`, {
        evidence: { suite: suitePath, file: r.file, lock: r.lockPath, expected: r.expected, actual: r.actual },
        hint: 'Fix the server, not the suite. A suite change goes through a normal pull request, with `hearsay lock` in the same commit.',
      }),
    ];
  },
};
