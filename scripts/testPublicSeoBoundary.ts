import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../src/components/LandingPage.tsx', import.meta.url), 'utf8');
assert.match(server, /const publicMeta:/, 'Public routes must provide distinct metadata');
for (const route of ['/guide', '/about', '/chat']) {
  assert.ok(server.includes("'" + route + "':"), route + ' must have crawlable fallback');
}
assert.match(server, /const renderedHtml = staticContent/, 'Server must serve route-specific body');
assert.match(server, /rel="canonical"/, 'Server must rewrite canonical URL');
assert.match(html, /href="\/chat"/, 'Non-JavaScript primary CTA must open chat');
assert.match(html, /ตัวอย่างผลวิเคราะห์ \(ข้อมูลสมมติ\)/, 'Example must be labeled illustrative');
assert.match(html, /ความโปร่งใสและการกำกับดูแล/, 'Crawlable trust disclosure must exist');
assert.match(landing, /ตัวอย่างรูปแบบผลวิเคราะห์/, 'Interactive landing must show an example');
assert.doesNotMatch(html, /High-Confidence Decisions, ISO 42001, NIST AI RMF/, 'Unverified certifications must not be advertised as keywords');
console.log('Public SEO source-contract checks passed (live crawler behavior not covered).');
