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

const grounded = enforcePreOutputQuality('ควรเลือกทางเลือก A ในขอบเขตที่อนุมัติ', {
  query: 'ควรเลือกแนวทางใด', evidence: [{ id: 'e-1', source: 'approved pilot record', content: 'ควรเลือกทางเลือก A ในขอบเขตที่อนุมัติ' }], conflictsCount: 0, missingInfoCount: 0,
});
expect(grounded.report.claimLedger.some((claim) => claim.kind === 'RECOMMENDATION' && claim.evidenceStatus === 'AVAILABLE' && claim.verificationStatus === 'PARTIALLY_VERIFIED'), 'Lexically grounded recommendation must remain partially verified without an explicit verification method');
expect(grounded.report.claimLedger.some((claim) => claim.kind === 'RECOMMENDATION' && claim.supportingEvidenceIds.includes('e-1')), 'Deterministic linker SUPPORTS relation must remain visible while verification stays partial');
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


const engineeringReview = enforcePreOutputQuality('ควรตรวจ logic และร่าง patch ก่อน โดยคำอธิบายอาจกล่าวถึง security incident ได้', {
  query: 'ควรตรวจ architecture และ trace code ใน repo อย่างไร', evidence: [], conflictsCount: 0, missingInfoCount: 1,
});
expect(engineeringReview.report.publicationStatus !== 'REVIEW_REQUIRED', 'Engineering inspection must not be classified as high-impact solely because evidence is incomplete');
expect(!engineeringReview.text.includes('ต้องให้ผู้เชี่ยวชาญเฉพาะทาง'), 'Engineering inspection must not require domain-expert approval');
expect(engineeringReview.report.decisionRequired === false, 'Ordinary engineering review must remain outside the decision workflow');
expect(engineeringReview.report.decisionRecord === undefined, 'Ordinary engineering review must not manufacture a Decision Record');

const outputCannotSelfTrigger = enforcePreOutputQuality('ควรตรวจโค้ดก่อน เพราะข้อความนี้กล่าวถึง security incident response ในเชิงอธิบาย', {
  query: 'ควรตรวจโค้ดส่วนนี้อย่างไร', evidence: [], conflictsCount: 0, missingInfoCount: 0,
});
expect(outputCannotSelfTrigger.report.publicationStatus !== 'REVIEW_REQUIRED', 'Model output must not self-trigger the high-impact gate');
expect(outputCannotSelfTrigger.report.decisionRequired === false, 'Output-only high-impact keywords must not create a decision request');
expect(outputCannotSelfTrigger.report.decisionRecord === undefined, 'Output-only high-impact keywords must not manufacture a Decision Record');


const analyticalRestaurantQuestion = enforcePreOutputQuality('สาเหตุที่เป็นไปได้มีหลายสมมติฐาน และควรตรวจสอบงบกำไรขาดทุนกับกำไรต่อช่องทางก่อนสรุป', {
  query: 'ทำไมร้านอาหารที่มีลูกค้าเยอะตลอด อาจยังขาดทุนได้ ทั้งที่ยอดขายเพิ่มขึ้นทุกเดือน? วิเคราะห์สาเหตุที่เป็นไปได้ แยกข้อเท็จจริง สมมติฐาน และข้อมูลที่ควรตรวจสอบเพิ่มเติมก่อนสรุป',
  evidence: [], conflictsCount: 0, missingInfoCount: 1,
});
expect(analyticalRestaurantQuestion.report.decisionRequired === false, 'Analytical question containing "ควรตรวจสอบ" must not be upgraded into a decision request');
expect(!analyticalRestaurantQuestion.text.includes('### Decision Record'), 'Ordinary analytical question must not receive enterprise Decision Record boilerplate');
expect(!analyticalRestaurantQuestion.text.includes('มนุษย์ผู้มีอำนาจตามนโยบายองค์กร'), 'Ordinary analytical question must not invent an organizational decision owner');

const ordinaryDecision = enforcePreOutputQuality('ควรเลือกทางเลือก A หลังตรวจข้อมูลที่ขาด', {
  query: 'ควรเลือกทางเลือก A หรือ B', evidence: [], conflictsCount: 0, missingInfoCount: 1,
});
expect(ordinaryDecision.report.decisionRequired === true, 'Explicit choice request must still be recognized as a decision request');
expect(ordinaryDecision.report.decisionRecord?.decisionOwner === 'ผู้ใช้หรือผู้รับผิดชอบการตัดสินใจ', 'Ordinary decision must use a context-neutral decision owner');
expect(!ordinaryDecision.report.decisionRecord?.conditionsThatChangeIt.includes('นโยบาย/กฎหมาย'), 'Ordinary decision must not inject unrelated policy/legal boilerplate');


const restaurantRegression = enforcePreOutputQuality(`## คำตอบสั้น

เพราะยอดขายเพิ่มกับมีกำไรเป็นคนละเรื่องกัน

## กลไกที่เป็นข้อเท็จจริง (ไม่ต้องรอข้อมูลร้านนี้)

## ข้อมูลที่ควรเก็บก่อนสรุป
ควรตรวจสอบงบกำไรขาดทุนรายเดือนก่อนสรุปสาเหตุ`, {
  query: 'ทำไมร้านอาหารที่มีลูกค้าเยอะตลอด อาจยังขาดทุนได้ ทั้งที่ยอดขายเพิ่มขึ้นทุกเดือน? วิเคราะห์สาเหตุที่เป็นไปได้ แยกข้อเท็จจริง สมมติฐาน และข้อมูลที่ควรตรวจสอบเพิ่มเติมก่อนสรุป',
  evidence: [], conflictsCount: 0, missingInfoCount: 1,
});
expect(restaurantRegression.report.decisionRequired === false, 'Restaurant causal analysis must remain non-decision');
expect(!restaurantRegression.text.includes('คำแนะนำแบบมีเงื่อนไข'), 'Evidence-gathering heading/text must not be rewritten as a conditional recommendation');
expect(!restaurantRegression.text.includes('### Decision Record'), 'Restaurant causal analysis must not receive a Decision Record');
expect(!restaurantRegression.report.claimLedger.some((claim) => claim.kind === 'RECOMMENDATION'), 'Evidence-gathering language must not be classified as a recommendation');
