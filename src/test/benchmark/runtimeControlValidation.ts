import {
  calculateRuntimeResponseDepth,
  routeOrchestrationLanguage,
  getTaxonomyActivationPlan,
  filterMemoriesByRelevance,
  resolveRuleConflict,
  validateModelOutput,
  RuleConstraint
} from '../../server/services/pcaRuntimeController.js';

console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PCA v3.0 RUNTIME CONTROL & ORCHESTRATION ARCHITECTURE TEST SUITE');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESPONSE CONTROLLER & PROCESS DEPTH TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 1. Response Controller & Process Depth Scoring ---');
const greetingScore = calculateRuntimeResponseDepth('สวัสดีครับ');
assert(greetingScore.depth === 'L0_DIRECT' && greetingScore.totalScore <= 2, 'L0 Greeting score returns DIRECT mode');

const briefScore = calculateRuntimeResponseDepth('อธิบายสถาปัตยกรรม Kafka สั้นๆ 1 บรรทัด');
assert(briefScore.depth === 'L0_DIRECT', 'P2 Explicit brief constraint forces L0_DIRECT');

const analyticalScore = calculateRuntimeResponseDepth('อธิบายกลไกการทำงานของ Garbage Collection ใน V8');
assert(analyticalScore.depth === 'L1_ANALYTICAL', 'Technical how/why question routes to L1_ANALYTICAL');

const decisionScore = calculateRuntimeResponseDepth('ควรเลือกระหว่าง Cloud SQL หรือ Firestore สำหรับระบบการเงิน');
assert(decisionScore.depth === 'L2_STRUCTURED', 'Comparative trade-off query routes to L2_STRUCTURED');

const deepAuditScore = calculateRuntimeResponseDepth('ขอการวิเคราะห์แบบ full deep audit พร้อมแจกแจงสมมติฐาน ACH', { deepReasoning: true });
assert(deepAuditScore.depth === 'L3_DEEP_AUDIT', 'Deep reasoning + explicit deep request routes to L3_DEEP_AUDIT');

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORCHESTRATION LANGUAGE ROUTER TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Orchestration Language Router ---');
const defaultThai = routeOrchestrationLanguage('ช่วยอธิบายระบบให้ฟังหน่อย');
assert(defaultThai.targetLanguage === 'th', 'Default Thai user query stays in Thai');

const explicitEng = routeOrchestrationLanguage('Explain the architecture in English please');
assert(explicitEng.targetLanguage === 'en' && explicitEng.isExplicitUserRequest, 'Explicit English request routed to English (P2)');

const explicitEngThai = routeOrchestrationLanguage('ช่วยสรุปเป็นภาษาอังกฤษให้หน่อย');
assert(explicitEngThai.targetLanguage === 'en' && explicitEngThai.isExplicitUserRequest, 'Thai instruction requesting English output routed to English');

// ─────────────────────────────────────────────────────────────────────────────
// 3. SEMANTIC MEMORY FILTER & ISOLATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Semantic Memory Isolation & Filtering ---');
const mockMemories = [
  { id: 'm1', content: 'ผู้ใช้ชอบกาแฟดำไม่ใส่น้ำตาล', layer: 'Preference' },
  { id: 'm2', content: 'ระบบฐานข้อมูลหลักคือ Cloud SQL PostgreSQL', layer: 'Constraint' },
  { id: 'm3', content: 'ผู้ใช้เลี้ยงแมวชื่อชาบู', layer: 'Fact' },
  { id: 'm4', content: 'งบประมาณโครงการไอทีปีนี้จำกัดอยู่ที่ 500,000 บาท', layer: 'Constraint' }
];

const memFilterDb = filterMemoriesByRelevance('ระบบฐานข้อมูล PostgreSQL มีข้อจำกัดอะไรบ้าง', mockMemories, 0.25);
assert(memFilterDb.accepted.some(m => m.id === 'm2'), 'Relevant database memory accepted');
assert(!memFilterDb.accepted.some(m => m.id === 'm1' || m.id === 'm3'), 'Irrelevant personal memories isolated and rejected');

// ─────────────────────────────────────────────────────────────────────────────
// 4. DETERMINISTIC PRIORITY RESOLVER TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Deterministic Priority Resolver ---');
const p0Safety: RuleConstraint = { id: 'r1', name: 'Anti-Malware Safety', priority: 'P0', specific: false, version: 1, description: 'Block malicious execution' };
const p2UserReq: RuleConstraint = { id: 'r2', name: 'User Script Request', priority: 'P2', specific: true, version: 1, description: 'Run test script' };
const res1 = resolveRuleConflict(p0Safety, p2UserReq);
assert(res1.winner.id === 'r1', 'P0 Safety beats P2 User Request');

const p2General: RuleConstraint = { id: 'r3', name: 'General Tone Profile', priority: 'P2', specific: false, version: 1, description: 'Casual tone' };
const p2Specific: RuleConstraint = { id: 'r4', name: 'Technical Brief Format', priority: 'P2', specific: true, version: 1, description: 'Bullet format' };
const res2 = resolveRuleConflict(p2General, p2Specific);
assert(res2.winner.id === 'r4', 'Specific rule beats general rule at equal priority');

// ─────────────────────────────────────────────────────────────────────────────
// 5. DETERMINISTIC POST-OUTPUT VALIDATOR TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Deterministic Post-Output Validator Layer ---');
const rawWithPunnHallucination = 'PUNN เป็น AI โมเดลอัจฉริยะที่พัฒนาขึ้นมา';
const valIdentity = validateModelOutput(rawWithPunnHallucination, {
  query: 'PUNN คืออะไร',
  expectedDepth: 'L0_DIRECT',
  expectedLanguage: 'th',
  suppressTaxonomy: true
});
assert(valIdentity.repairedText?.includes('ผู้สร้าง') && !valIdentity.repairedText?.includes('PUNN เป็น AI'), 'PUNN identity hallucination corrected deterministically');

const rawWithTaxonomyInL0 = '[FACT] เมืองหลวงของญี่ปุ่นคือโตเกียวครับ';
const valL0 = validateModelOutput(rawWithTaxonomyInL0, {
  query: 'เมืองหลวงของญี่ปุ่นคืออะไร',
  expectedDepth: 'L0_DIRECT',
  expectedLanguage: 'th',
  suppressTaxonomy: true
});
assert(!valL0.repairedText?.includes('[FACT]'), 'Taxonomy markers stripped cleanly from L0 direct output');

const rawWithTaxonomyHeading = '### [INFERENCE] บทสรุปจุดยืน\nเนื้อหาบทวิเคราะห์';
const valHeading = validateModelOutput(rawWithTaxonomyHeading, {
  query: 'วิเคราะห์ทางเลือก',
  expectedDepth: 'L2_STRUCTURED',
  expectedLanguage: 'th',
  suppressTaxonomy: false
});
assert(valHeading.repairedText?.includes('### บทสรุปจุดยืน') && !valHeading.repairedText?.includes('### [INFERENCE]'), 'Taxonomy tags removed from markdown headings');

console.log('\n──────────────────────────────────────────────────────────────────────────────');
console.log(`Summary: ${passCount}/${passCount + failCount} tests passed (${failCount} failures)`);
console.log('──────────────────────────────────────────────────────────────────────────────\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL RUNTIME ORCHESTRATION & CONTROL TESTS PASSED PERFECTLY!');
}
