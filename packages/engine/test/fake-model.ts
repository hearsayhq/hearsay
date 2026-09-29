/**
 * A deterministic stand-in model for tests (no network): plans Smart Home calls from
 * the words it hears, literally, and speaks the tool's reply back.
 */
import type { ModelProvider, ModelRequest, ModelResponse } from '../src/index';

export class FakeHomeModel implements ModelProvider {
  readonly id = 'fake:home';
  calls = 0;
  async converse(req: ModelRequest): Promise<ModelResponse> {
    this.calls++;
    const last = req.messages.at(-1)!;
    const result = last.content.find((c) => c.type === 'tool_result');
    if (result && result.type === 'tool_result') return { content: [{ type: 'text', text: result.text }], stopReason: 'end_turn' };
    const said = last.content.map((c) => (c.type === 'text' ? c.text : '')).join(' ').toLowerCase();
    const room = said.match(/whole house/) ? 'all' : (said.match(/living ?room|bed ?room|kitchen|office/)?.[0] ?? '').replace(' ', '_').replace('bed_room', 'bedroom');
    const pct = said.match(/(\w+) percent/)?.[1];
    const words: Record<string, number> = { thirty: 30, thirteen: 13, fifteen: 15, fifty: 50 };
    const input: Record<string, unknown> = { room: room || 'unknown' };
    if (pct) input.brightness = words[pct] ?? Number(pct);
    else input.state = said.includes(' on') ? 'on' : 'off';
    return { content: [{ type: 'tool_use', id: `tu-${req.messages.length}`, name: 'set_scene', input }], stopReason: 'tool_use' };
  }
}
