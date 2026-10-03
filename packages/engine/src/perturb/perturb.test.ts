import { describe, expect, it } from 'vitest';
import { applyEdits, variantsFor, wordEdits } from './index';
import { parseNumber } from './numbers';

describe('numbers', () => {
  it.each([['fifteen', 15], ['fifty', 50], ['forty-two', 42], ['15', 15], ['to', undefined]])('%s → %s', (w, n) => expect(parseNumber(w)).toBe(n));
});

describe('applyEdits (the literal planner)', () => {
  it('carries a teen/tens confusion into a number', () => expect(applyEdits({ sku: 'sku-fruit', amountUsd: 15 }, [{ from: 'fifteen', to: 'fifty' }])).toEqual({ args: { sku: 'sku-fruit', amountUsd: 50 }, changed: true }));
  it('carries a split compound into a string', () => expect(applyEdits({ room: 'living_room', state: 'off' }, [{ from: 'living room', to: 'livingroom' }])).toEqual({ args: { room: 'livingroom', state: 'off' }, changed: true }));
  it('drops a number heard as a word', () => expect(applyEdits({ sku: 'sku-milk', quantity: 2 }, [{ from: 'two', to: 'to' }])).toEqual({ args: { sku: 'sku-milk' }, changed: true }));
  it('leaves unrelated arguments alone', () => expect(applyEdits({ minutes: 12, label: 'pasta' }, [{ from: 'for', to: 'four' }]).changed).toBe(false));
  it('keeps a number heard as digits', () => expect(applyEdits({ minutes: 7, label: 'egg' }, [{ from: 'seven', to: '7' }])).toEqual({ args: { minutes: 7, label: 'egg' }, changed: false }));
});

describe('variantsFor', () => {
  const opts = { seed: 1, mode: 'scripted' as const };
  it('always starts with the clean variant', () => expect(variantsFor('c', 'hello', [], opts).map((v) => v.id)).toEqual(['clean']));
  it('hears fifteen as fifty', () => {
    const vs = variantsFor('c', 'add fifteen dollars of fruit', ['asr.number_confusion'], { ...opts, args: { amountUsd: 15 } });
    expect(vs.map((v) => [v.id, v.heard])).toEqual([['clean', 'add fifteen dollars of fruit'], ['asr.number_confusion#1', 'add fifty dollars of fruit']]);
  });
  it('makes no fake variants: nothing applies, nothing is generated', () =>
    expect(variantsFor('c', 'set a timer for twelve minutes', ['asr.number_confusion'], { ...opts, args: { minutes: 12 } })).toHaveLength(1));
  it('drops variants that do not reach the arguments in scripted mode', () =>
    expect(variantsFor('c', 'set a pasta timer for fifteen minutes', ['asr.homophones'], { ...opts, args: { minutes: 15, label: 'pasta' } })).toHaveLength(1));
  it('keeps them for a model to hear in llm mode', () =>
    expect(variantsFor('c', 'set a pasta timer for fifteen minutes', ['asr.homophones'], { seed: 1, mode: 'llm' }).map((v) => v.heard)).toEqual(['set a pasta timer for fifteen minutes', 'set a pasta timer four fifteen minutes']));
  it('self-corrects only for a model', () => {
    expect(variantsFor('c', 'add two cartons of milk', ['asr.self_correction'], { ...opts, args: { quantity: 2 } })).toHaveLength(1);
    expect(variantsFor('c', 'add two cartons of milk', ['asr.self_correction'], { seed: 1, mode: 'llm' })[1]!.heard).toBe('add three, no, two cartons of milk');
  });
  it('is deterministic for a seed', () => {
    const run = () => variantsFor('c', 'thirty or forty or fifty or sixty', ['asr.number_confusion'], { seed: 7, mode: 'llm' }).map((v) => v.heard);
    expect(run()).toEqual(run());
    expect(run()).toHaveLength(4);
  });
  it('uses recorded mishearings with their word edits', () => {
    const vs = variantsFor('c', 'turn off everything in the living room', ['asr.roundtrip'], { ...opts, args: { room: 'living_room' }, recorded: [{ heard: 'turn off everything in the livingroom' }] });
    expect(vs[1]).toMatchObject({ id: 'asr.roundtrip#1', edits: [{ from: 'living room', to: 'livingroom' }] });
  });
});

describe('wordEdits', () => {
  it('finds the misheard words', () => expect(wordEdits('add fifteen dollars of fruit', 'add fifty dollars of fruit')).toEqual([{ from: 'fifteen', to: 'fifty' }]));
  it('ignores numbers that are only written as digits', () =>
    expect(wordEdits('start a sauce timer for eight minutes', 'Start us off timer for 8 minutes.')).toEqual([{ from: 'a sauce', to: 'us off' }]));
  it('drops a recorded variant that only writes the number as digits (scripted)', () =>
    expect(variantsFor('c', 'set an egg timer for seven minutes', ['asr.roundtrip'], { seed: 1, mode: 'scripted', args: { minutes: 7, label: 'egg' }, recorded: [{ heard: 'Set an egg timer for 7 minutes.' }] })).toHaveLength(1));
});
