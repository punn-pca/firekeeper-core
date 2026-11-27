import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-contract regression until MCP management routes can be tested with an injected database.
const source = readFileSync(new URL('../src/server/integrations/mcpManagement.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/components/McpServerManager.tsx', import.meta.url), 'utf8');

assert.match(source, /requireAuth, requireAdmin/, 'MCP management must require admin authentication');
assert.match(source, /validateOutboundBaseUrl\(url, 'mcpUrl'\)/, 'MCP URLs must be validated');
assert.match(source, /secureOutboundFetch\(/, 'MCP probe must use protected outbound requests');
assert.match(source, /enabled: false/, 'New and reported MCP configs must remain disabled');
assert.match(source, /MCP_EXECUTION_NOT_CONFIGURED/, 'Enabling MCP must be rejected until execution is governed');
assert.match(source, /NO_VALID_CHANGES/, 'Empty PATCH must be rejected');
assert.match(source, /INVALID_MCP_CONFIG/, 'Malformed PATCH must be rejected');
assert.match(source, /!req\.body \|\| typeof req\.body !== 'object' \|\| Array\.isArray\(req\.body\)/, 'PATCH must reject missing or array request bodies');
assert.match(source, /!\('enabled' in req\.body\) && !\('permissions' in req\.body\)/, 'PATCH must reject updates without recognized fields');
assert.match(source, /toolsAvailable: false/, 'Initialize probe must not claim tools are available');
assert.match(source, /authenticated: false/, 'Initialize probe must not claim authentication');
assert.match(ui, /ยังไม่พร้อมใช้งาน/, 'UI must communicate disabled status');
assert.match(ui, /ยังไม่อนุญาตให้ AI เรียกเครื่องมือ/, 'UI must distinguish saved permissions from execution');
console.log('MCP management source-contract checks passed (not an API integration test).');
