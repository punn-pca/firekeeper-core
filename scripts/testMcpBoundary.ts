import assert from 'node:assert/strict';
import { handleMcpRequest } from '../src/server/integrations/mcpGateway';

const init = handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
assert.equal(init.status, 200);
assert.equal((init.body as any).result.serverInfo.name, 'firekeeper-core');
const listed = handleMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
assert.equal((listed.body as any).result.tools.length, 1);
const called = handleMcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'firekeeper_capabilities', arguments: {} } });
assert.equal((called.body as any).result.content[0].type, 'text');
assert.equal(handleMcpRequest({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'unknown' } }).status, 200);
assert.equal(handleMcpRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }).status, 202);
assert.equal(handleMcpRequest({}).status, 400);
console.log('MCP protocol boundary tests passed');
