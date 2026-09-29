/** protocol.list_changed (docs/05 §Can it connect?): a tool list that changes is announced. */
import { fire, type TurnCheck } from './types';

export const protocolListChanged: TurnCheck = {
  id: 'protocol.list_changed',
  run({ trace, turns }) {
    const d = trace.toolListDrift;
    if (!d) return [];
    return [
      fire('protocol.list_changed', 0, `the tool list changed during the session without notifications/tools/list_changed${d.declared ? '' : ' (tools.listChanged not declared)'}: +${d.added.join(', ') || '—'} −${d.removed.join(', ') || '—'}`, {
        turnId: turns.at(-1)?.id,
        evidence: d,
        hint: 'Keep the tool list static (Alexa+ refreshes tools only on deployment) and refuse in words; if it must change, declare tools.listChanged and send the notification.',
      }),
    ];
  },
};
