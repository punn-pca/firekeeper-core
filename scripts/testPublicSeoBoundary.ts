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
assert.match(server, /html\.slice\(0, rootStart\) \+ fallback \+ html\.slice\(scriptStart\)/, 'Crawler fallback must replace the entire nested root');
assert.doesNotMatch(server, /html\.replace\(\/\(\<div id="root"\>\)/, 'Do not use a nested-div regex to replace root');
assert.match(server, /rel="canonical"/, 'Server must rewrite canonical URL');
assert.equal((server.match(/jsonLd\.replace\(\/</g) || []).length, 2, 'Both JSON-LD script sinks must escape < to prevent script breakout');
assert.match(html, /href="\/chat"/, 'Non-JavaScript primary CTA must open chat');
assert.match(html, /ตัวอย่างผลวิเคราะห์ \(ข้อมูลสมมติ\)/, 'Example must be labeled illustrative');
assert.match(html, /ความโปร่งใสและการกำกับดูแล/, 'Crawlable trust disclosure must exist');
assert.match(landing, /ILLUSTRATIVE DECISION RECORD/, 'Interactive landing must show an illustrative decision record');
assert.match(landing, /ตัวอย่างประกอบ · ไม่ใช่ผลวิเคราะห์จริง/, 'Interactive example must clearly disclose that it is not a real analysis');
assert.match(landing, /id="decision-record"/, 'Interactive example must retain its decision-record anchor');
assert.match(landing, /ความโปร่งใสและการจัดการข้อมูล/, 'Interactive landing must disclose trust and data handling');
assert.doesNotMatch(html, /High-Confidence Decisions, ISO 42001, NIST AI RMF/, 'Unverified certifications must not be advertised as keywords');
console.log('Public SEO source-contract checks passed (live crawler behavior not covered).');
