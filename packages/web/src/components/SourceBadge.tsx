import type { Source } from '@hearsayhq/engine/types';

const LABEL: Record<Source['kind'], string> = { 'amazon-fr': 'Amazon requirement', 'mcp-spec': 'MCP spec', hearsay: 'Hearsay' };

export function SourceBadge({ source }: { source: Source }) {
  const body = <span className={`source source-${source.kind}`} title={source.ref}>{LABEL[source.kind]}</span>;
  return source.url ? <a href={source.url} target="_blank" rel="noreferrer">{body}</a> : body;
}
