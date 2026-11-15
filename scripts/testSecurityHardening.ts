import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const openclaw = read('../src/server/integrations/openclawGateway.ts');
const toolRegistry = read('../src/server/services/toolRegistry.ts');
const outbound = read('../src/server/security/outboundUrlPolicy.ts');
const httpFetcher = read('../src/server/services/webAccess/httpFetcher.ts');
const browserFetcher = read('../src/server/services/webAccess/browserFetcher.ts');
const mcp = read('../src/server/integrations/mcpManagement.ts');
const exportUtils = read('../src/utils/exportUtils.ts');
const formulaViewer = read('../src/components/FormulaViewer.tsx');

assert.match(openclaw, /return isLoopback \? 'allow' : 'not_configured'/);
assert.match(openclaw, /decision === 'not_configured'/);
assert.match(toolRegistry, /import \{ execFile \} from 'node:child_process'/);
assert.match(toolRegistry, /shell: false/);
assert.doesNotMatch(toolRegistry, /import \{ exec \} from ['"]child_process['"]/);
assert.match(outbound, /safeOutboundRedirectMode\(init\.redirect\)/);
assert.match(outbound, /connectAt\(index \+ 1\)/);
assert.match(httpFetcher, /redirect: 'manual'/);
assert.match(httpFetcher, /decodeResponseText\(bodyBytes, contentType\)/);
assert.match(browserFetcher, /rssRes\.ok && \(rssRes\.html\.includes\('<item'\) \|\| rssRes\.html\.includes\('<entry'\)\)/);
assert.match(browserFetcher, /normalizedItemUrl === requestedItemUrl/);
assert.doesNotMatch(browserFetcher, /itemLink\.includes\(url\)/);
assert.match(mcp, /if \(!snap\.exists\) return res\.status\(404\)\.json\(\{ error: 'NOT_FOUND' \}\)/);
assert.match(exportUtils, /serializeJsonForHtmlScript\(\{/);
assert.match(exportUtils, /integrityPayload: data\.metadata\.integrityPayload/);
assert.match(exportUtils, /expectedHash\.toLowerCase\(\) === \('SHA256-' \+ computedHashHex\)\.toLowerCase\(\)/);
assert.doesNotMatch(exportUtils, /expectedHash\.startsWith/);
assert.doesNotMatch(exportUtils, /Integrity Verified \(Fallback\)/);
assert.match(exportUtils, /Payload Hash Matches \(unsigned\)/);
assert.match(exportUtils, /const cleanTitle = \\$\{serializeJsonForHtmlScript\(data\.metadata\.title\)\}/);
assert.doesNotMatch(exportUtils, /const cleanTitle = '\\$\{data\.metadata\.title\}'/);
assert.match(formulaViewer, /trust: false/);
assert.doesNotMatch(formulaViewer, /replace\(\/\\\$\+\//);

console.log('Security hardening source-contract tests passed.');
