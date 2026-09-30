import { describe, expect, it } from 'vitest';
import { spokenText } from './bedrock';

describe('spokenText (Nova output through Converse)', () => {
  it('drops <thinking> and unwraps <response>', () => {
    expect(spokenText('<thinking>The tool timer_start worked.</thinking>\n<response>Pasta timer set for fifteen minutes.</response>')).toBe('Pasta timer set for fifteen minutes.');
    expect(spokenText('<thinking> I should inform the user. </thinking> Egg timer set for seven minutes.')).toBe('Egg timer set for seven minutes.');
  });

  it('drops an unclosed <thinking> and leaves plain text alone', () => {
    expect(spokenText('<thinking>cut off by max tokens')).toBe('');
    expect(spokenText('Which timer, pasta or egg?')).toBe('Which timer, pasta or egg?');
  });
});
