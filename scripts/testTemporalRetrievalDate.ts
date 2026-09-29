import assert from 'node:assert/strict';
import { isTemporallyRelevantSource } from '../src/server/services/temporalGrounding';
import { extractDateFromMetadata, resolveTargetDateFromQuery, verifyArticleDateMatch } from '../src/server/services/webAccess/dateResolver';
import { formatDeepWebEvidenceForModel } from '../src/server/services/webAccess/webAccessLayer';

const now = new Date('2026-09-29T01:00:00Z'); // 08:00 in Bangkok
assert.equal(resolveTargetDateFromQuery('ราคาทองวันนี้', now).targetDateISO, '2026-09-29');
assert.equal(resolveTargetDateFromQuery('ข่าวเมื่อวาน', now).targetDateISO, '2026-09-28');
assert.equal(resolveTargetDateFromQuery('ราคาทองวันนี้', new Date('2026-09-28T18:00:00Z')).targetDateISO, '2026-09-29');
assert.equal(resolveTargetDateFromQuery('ข่าวล่าสุด', now).temporalScope, 'CURRENT_STATUS');
assert.equal(isTemporallyRelevantSource(undefined, undefined, now), false);
assert.equal(isTemporallyRelevantSource('2025-09-29', undefined, now), false);
assert.equal(isTemporallyRelevantSource('2026-09-28T10:00:00Z', undefined, now), true);
assert.equal(isTemporallyRelevantSource('2026-09-28', '2026-09-29', now), false);
assert.equal(isTemporallyRelevantSource('2026-09-28T18:00:00Z', '2026-09-29', now), true);
assert.equal(verifyArticleDateMatch('2026-09-28', '2026-09-29').isMatch, false);
assert.equal(isTemporallyRelevantSource('2026-09-20', '2026-09-29', now), false);
assert.equal(verifyArticleDateMatch(undefined).isMatch, false);
assert.equal(extractDateFromMetadata({}, 'https://example.org/news', 'ข่าววันนี้ เหตุการณ์วันที่ 29/09/2026').publishedAt, undefined);
assert.equal(extractDateFromMetadata({ dateModified: '2026-09-29' }, 'https://example.org/news', '').publishedAt, undefined);
const formatted = formatDeepWebEvidenceForModel('ข่าวล่าสุด', undefined, [
  { title: 'Current article', publisher: 'Publisher', canonical_url: 'https://example.org/current', source_domain: 'example.org', body: 'Current body', summary_eligible: true, content_quality: 0.8, evidence_state: 'CONTENT_EXTRACTED' },
  { title: 'Old article', publisher: 'Publisher', canonical_url: 'https://example.org/old', source_domain: 'example.org', body: 'Old body', summary_eligible: false, content_quality: 0.8, evidence_state: 'DATE_MISMATCH' }
] as any, [], [], true, now.toISOString());
assert.match(formatted.evidenceModelText, /Current body/);
assert.doesNotMatch(formatted.evidenceModelText, /Old body|https:\/\/example.org\/old/);
console.log('Temporal publication date boundaries passed.');
