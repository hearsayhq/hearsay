/**
 * Bedrock Converse adapter (FR-012, D-008): the provider-neutral request is shaped like
 * Converse, so this is a thin mapping. Needs AWS credentials and HEARSAY_BEDROCK_MODEL_ID.
 */
import { BedrockRuntimeClient, ConverseCommand, type ContentBlock, type Message } from '@aws-sdk/client-bedrock-runtime';
import type { ModelContent, ModelProvider, ModelRequest, ModelResponse } from '../orchestrator';

const toBedrock = (c: ModelContent): ContentBlock => {
  if (c.type === 'text') return { text: c.text };
  if (c.type === 'tool_use') return { toolUse: { toolUseId: c.id, name: c.name, input: c.input as never } };
  return { toolResult: { toolUseId: c.toolUseId, content: [{ text: c.text || '(empty)' }], status: c.isError ? 'error' : 'success' } };
};

const fromBedrock = (b: ContentBlock): ModelContent[] => {
  if (b.text !== undefined) return [{ type: 'text', text: b.text }];
  if (b.toolUse) return [{ type: 'tool_use', id: b.toolUse.toolUseId!, name: b.toolUse.name!, input: (b.toolUse.input ?? {}) as Record<string, unknown> }];
  return [];
};

export class BedrockProvider implements ModelProvider {
  readonly id: string;
  private client: BedrockRuntimeClient;

  constructor(private modelId: string, region = process.env.AWS_REGION ?? 'us-east-1') {
    this.id = `bedrock:${modelId}`;
    this.client = new BedrockRuntimeClient({ region });
  }

  async converse(req: ModelRequest): Promise<ModelResponse> {
    const out = await this.client.send(
      new ConverseCommand({
        modelId: this.modelId,
        system: [{ text: req.system }],
        messages: req.messages.map((m): Message => ({ role: m.role, content: m.content.map(toBedrock) })),
        ...(req.tools.length ? { toolConfig: { tools: req.tools.map((t) => ({ toolSpec: { name: t.name, description: t.description || t.name, inputSchema: { json: t.inputSchema as never } } })) } } : {}),
        inferenceConfig: { maxTokens: req.maxTokens },
      }),
    );
    const content = (out.output?.message?.content ?? []).flatMap(fromBedrock);
    const stop = out.stopReason === 'tool_use' || out.stopReason === 'end_turn' || out.stopReason === 'max_tokens' ? out.stopReason : 'other';
    return { content, stopReason: stop, ...(out.usage ? { usage: { inputTokens: out.usage.inputTokens ?? 0, outputTokens: out.usage.outputTokens ?? 0 } } : {}) };
  }
}

export function providerFromEnv(): ModelProvider {
  const model = process.env.HEARSAY_BEDROCK_MODEL_ID;
  if (!model) throw new Error('llm mode needs HEARSAY_BEDROCK_MODEL_ID and AWS credentials (docs/04 §Model providers). CI and judges use scripted or replay mode.');
  return new BedrockProvider(model);
}
