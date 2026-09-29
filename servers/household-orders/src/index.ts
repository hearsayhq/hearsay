/**
 * Household Orders reference server (port 4103). Spec: servers/household-orders/README.md.
 * Milestone M2 (docs/07). Transport: MCP Streamable HTTP at http://localhost:4103/mcp,
 * protocol 2025-11-25, via @modelcontextprotocol/sdk McpServer + StreamableHTTPServerTransport.
 */
export const PORT = Number(process.env.PORT ?? 4103);

console.error('[household-orders] not implemented yet — see servers/household-orders/README.md');
process.exitCode = 2;
