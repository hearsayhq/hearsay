/**
 * Kitchen reference server (port 4101). Spec: servers/kitchen/README.md.
 * Milestone M2 (docs/07). Transport: MCP Streamable HTTP at http://localhost:4101/mcp,
 * protocol 2025-11-25, via @modelcontextprotocol/sdk McpServer + StreamableHTTPServerTransport.
 */
export const PORT = Number(process.env.PORT ?? 4101);

console.error('[kitchen] not implemented yet — see servers/kitchen/README.md');
process.exitCode = 2;
