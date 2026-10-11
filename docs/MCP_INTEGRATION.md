# Firekeeper MCP integration (initial guarded implementation)

## Server
POST /api/mcp with an authenticated Firekeeper bearer token. JSON-RPC 2.0 supports initialize, ping, tools/list and tools/call. Only firekeeper_capabilities is exposed (public metadata, read-only). Stateless JSON responses only; no SSE sessions, resources, prompts or remote write operations. This is a deliberately limited MCP implementation, not a complete MCP server.

## Client
POST /api/admin/mcp/client with authenticated administrator credentials and JSON body {"url":"https://trusted.example/mcp","method":"initialize"} or method "tools/list". HTTPS and public IP enforcement, DNS pinning, redirect blocking, ten-second timeout and response-size limits are applied. No arbitrary remote tool invocation is enabled yet.

## Security / next steps
Do not expose /api/mcp to anonymous callers. Before enabling production remote tools, implement per-user server allowlists, encrypted credentials, explicit Human Approval Gate for writes, per-tool authorization, origin validation, audit logging, proper Streamable HTTP session handling, SSE response parsing and MCP protocol negotiation. Do not pass MCP responses to the model as trusted instructions.

Run: node --import tsx scripts/testMcpBoundary.ts
