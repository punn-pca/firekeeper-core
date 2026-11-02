import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../src/components/LandingPage.tsx', import.meta.url), 'utf8');
assert.match(server, /const publicMeta:/, 'Public routes must provide distinct metadata');
assert.match(server, /'\/': '<h1>ก่อนเลือกทาง เห็นเหตุผลให้ครบ<\/h1>[\s\S]*?id="sample-report"[\s\S]*?ILLUSTRATIVE · UNVERIFIED/, 'Crawler fallback for the public landing page must include the illustrative sample report and disclosure');
for (const route of ['/guide', '/about', '/chat']) {
  assert.ok(server.includes("'" + route + "':"), route + ' must have crawlable fallback');
}
assert.match(server, /const renderedHtml = staticContent/, 'Server must serve route-specific body');
assert.match(server, /html\.slice\(0, rootStart\) \+ fallback \+ html\.slice\(scriptStart\)/, 'Crawler fallback must replace the entire nested root');
assert.doesNotMatch(server, /html\.replace\(\/\(\<div id="root"\>\)/, 'Do not use a nested-div regex to replace root');
assert.match(server, /rel="canonical"/, 'Server must rewrite canonical URL');
assert.match(html, /href="\/chat"/, 'Non-JavaScript primary CTA must open chat');
assert.match(html, /ตัวอย่างผลวิเคราะห์ \(ข้อมูลสมมติ\)/, 'Example must be labeled illustrative');
assert.match(html, /ความโปร่งใสและการกำกับดูแล/, 'Crawlable trust disclosure must exist');
assert.match(landing, /ILLUSTRATIVE DECISION RECORD/, 'Interactive landing must show an illustrative decision record');
assert.match(landing, /ตัวอย่างประกอบ · ไม่ใช่ผลวิเคราะห์จริง/, 'Interactive example must clearly disclose that it is not a real analysis');
assert.match(landing, /id="decision-record"/, 'Interactive example must retain its decision-record anchor');
assert.match(landing, /href="#sample-report"/, 'Landing CTA must link to the sample decision report');
assert.match(landing, /id="sample-report"/, 'Landing page must include the sample decision report');
assert.match(landing, /ตัวอย่างรายงานวิเคราะห์เพื่อการตัดสินใจ/, 'Sample report heading must be present');
assert.match(landing, /ILLUSTRATIVE · UNVERIFIED/, 'Sample report must disclose its illustrative and unverified status');
assert.match(landing, /ความโปร่งใสและการจัดการข้อมูล/, 'Interactive landing must disclose trust and data handling');
assert.doesNotMatch(html, /High-Confidence Decisions, ISO 42001, NIST AI RMF/, 'Unverified certifications must not be advertised as keywords');
for (const [pattern, label] of [
  [/<title>/g, 'document title'],
  [/name="description"/g, 'meta description'],
  [/rel="canonical"/g, 'canonical URL'],
  [/property="og:title"/g, 'Open Graph title'],
  [/property="og:description"/g, 'Open Graph description'],
  [/name="twitter:title"/g, 'Twitter title'],
  [/name="twitter:description"/g, 'Twitter description'],
] as const) {
  assert.equal([...html.matchAll(pattern)].length, 1, 'Public HTML must define exactly one ' + label);
}
assert.doesNotMatch(html, /Level-3 Hard Stop Decision Gate|Punn Parameth Punkalrachote|enterprise executive decision intelligence/i,
  'Public SEO metadata must not contain outdated identity or unsupported enterprise-level claims');

assert.match(server, /knownSpaRoutes/, 'Server must explicitly allow known SPA routes');
assert.match(server, /res\\.status\\(404\\)/, 'Unknown public paths must return an actual HTTP 404');
assert.match(server, /noindex,follow/, '404 response must not be indexed');
assert.match(server, /routeCanonical/, 'Valid SPA routes must receive route-specific canonical URLs');
const manifest = readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8');
assert.doesNotThrow(() => JSON.parse(manifest), 'Compatibility manifest endpoint must contain valid JSON');
assert.match(html, /href="\\/site\\.webmanifest"/, 'HTML must link to the existing web manifest');
assert.match(server, /application\\/manifest\\+json|manifest\\.json/, 'Server source must account for manifest delivery');

console.log('Public SEO source-contract checks passed (live crawler behavior not covered).');
