/**
 * Smart Home reference server (port 4102). Spec: servers/smart-home/README.md.
 * Milestone M2 (docs/07). Transport: MCP Streamable HTTP at http://localhost:4102/mcp,
 * protocol 2025-11-25, via @modelcontextprotocol/sdk McpServer + StreamableHTTPServerTransport.
 */
export const PORT = Number(process.env.PORT ?? 4102);

console.error('[smart-home] not implemented yet — see servers/smart-home/README.md');
process.exitCode = 2;
