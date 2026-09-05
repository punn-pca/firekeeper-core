import { linkClaimEvidence } from '../src/utils/claimEvidenceLinker';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const result = linkClaimEvidence('ประเทศไทยมี GDP โต 5% ในปี 2026', [
  { id: 'support', source: 'official-a', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' },
  { id: 'context', source: 'official-b', content: 'รายงานเศรษฐกิจไทยและบริบทของปี 2026' },
  { id: 'neutral', source: 'other', content: 'ประกาศกิจกรรมทั่วไปของหน่วยงาน' }
]);

assert(result.method === 'CONSERVATIVE_STRUCTURED_LEXICAL', 'linker must identify itself as conservative structured lexical discovery');
assert(result.links.find((link) => link.evidenceId === 'support')?.relation === 'SUPPORTS', 'strong lexical and numeric/year match should produce SUPPORTS');
assert(result.links.find((link) => link.evidenceId === 'support') && result.scores.find((score) => score.evidenceId === 'support')?.numericConsistency === 'MATCH', 'matching numeric proposition must be recorded');
assert(result.links.find((link) => link.evidenceId === 'context')?.relation !== 'VERIFIED', 'linker must never produce VERIFIED');
assert(result.warnings.length > 0, 'linker must expose its epistemic limitation');

const contradiction = linkClaimEvidence('ประเทศไทยมี GDP โต 5% ในปี 2026', [
  { id: 'counter', source: 'official-c', content: 'ประเทศไทยมี GDP โต 4% ในปี 2026' }
]);
assert(contradiction.links[0]?.relation === 'CONTRADICTS', 'numeric mismatch on an otherwise matching proposition should produce CONTRADICTS');

const unrelated = linkClaimEvidence('ประเทศไทยมี GDP โต 5% ในปี 2026', [
  { id: 'authority-only', source: 'high-authority-official', content: 'ประกาศกิจกรรมทั่วไปของหน่วยงาน' }
]);
assert(unrelated.links[0]?.relation === 'NEUTRAL', 'source authority alone must remain NEUTRAL');

console.log('PASS: Claim evidence linker governance boundary.');
