import { enforcePreOutputQuality } from '../src/server/services/preOutputQualityGate';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const noEvidence = enforcePreOutputQuality('ควรเลือกทางเลือก A ทันที', {
  query: 'ควรเลือกอะไรสำหรับการลงทุน', evidence: [], conflictsCount: 0, missingInfoCount: 1,
});
expect(noEvidence.report.publicationStatus === 'REVIEW_REQUIRED', 'Ungrounded high-impact recommendation must require review');
expect(noEvidence.text.includes('Decision Record'), 'Decision request must receive a Decision Record');
expect(noEvidence.text.includes('ต้องให้ผู้เชี่ยวชาญเฉพาะทาง'), 'High-impact recommendation must require domain expert review');
expect(noEvidence.text.includes('คำแนะนำแบบมีเงื่อนไข'), 'Ungrounded recommendation must be made conditional');

const grounded = enforcePreOutputQuality('ควรทดลองทางเลือก A ในขอบเขตที่อนุมัติ', {
  query: 'ควรเลือกแนวทางใด', evidence: [{ id: 'e-1', content: 'ควรทดลองทางเลือก A ในขอบเขตที่อนุมัติ' }], conflictsCount: 0, missingInfoCount: 0,
});
expect(grounded.report.claimLedger.some((claim) => claim.kind === 'RECOMMENDATION' && claim.evidenceStatus === 'AVAILABLE'), 'Recommendation evidence must be represented in ledger');
expect(grounded.report.claimLedger.some((claim) => claim.supportingEvidenceIds.includes('e-1')), 'Claim ledger must retain supporting evidence IDs');
expect(grounded.report.recommendationConsistency.status === 'PASS', 'Grounded recommendation must pass consistency check');

const inconsistent = enforcePreOutputQuality('ห้ามดำเนินการในทันที แต่ให้ดำเนินการทันที', {
  query: 'ควรดำเนินการอย่างไร', evidence: [], conflictsCount: 1, missingInfoCount: 1,
});
expect(inconsistent.report.recommendationConsistency.status === 'WARNING', 'Inconsistent guidance must be flagged');
expect(inconsistent.report.violations.some((item) => item.includes('mutually inconsistent')), 'Consistency violation must be audit-visible');

const causal = enforcePreOutputQuality('ควรเลือก A เพราะทำให้ความเสี่ยงลดลงแน่นอน', {
  query: 'ควรเลือกอะไร', evidence: [], conflictsCount: 0, missingInfoCount: 0,
});
expect(causal.report.violations.some((item) => item.includes('Causal recommendation')), 'Self-audit must flag unsupported causal claims');
expect(causal.report.violations.some((item) => item.includes('Comparative or absolute')), 'Self-audit must flag unsupported absolute claims');

const corrupted = enforcePreOutputQuality('ข้อมูล\u0000ปกติ', { query: 'สรุป', evidence: [] });
expect(!corrupted.text.includes('\u0000'), 'Control characters must be removed');

console.log('P0 pre-output quality gate tests passed.');