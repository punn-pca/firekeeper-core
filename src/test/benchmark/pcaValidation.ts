import { evaluateResponseDepth, PCA_CORE_INVARIANTS, PCA_PRIORITY_HIERARCHY, PCA_PRESENTATION_POLICY } from '../../server/services/pcaGovernance.js';
import { cleanAiResponseStyle } from '../../server/services/promptOptimizer.js';

interface TestCase {
  id: string;
  category: string;
  prompt: string;
  options?: {
    deepReasoning?: boolean;
    hasConflicts?: boolean;
  };
  expectedLevel: 'L0' | 'L1' | 'L2' | 'L3';
  description: string;
}

const TEST_CASES: TestCase[] = [
  // L0: Direct Factual Queries & Casual Greetings (Low complexity, low uncertainty)
  { id: 'T01', category: 'Greeting', prompt: 'สวัสดีครับ', expectedLevel: 'L0', description: 'Basic Thai greeting' },
  { id: 'T02', category: 'Greeting', prompt: 'สวัสดีจ้า เป็นไงบ้าง', expectedLevel: 'L0', description: 'Informal Thai greeting' },
  { id: 'T03', category: 'Greeting', prompt: 'Hello there!', expectedLevel: 'L0', description: 'English greeting' },
  { id: 'T04', category: 'Greeting', prompt: 'สบายดีไหมวันนี้', expectedLevel: 'L0', description: 'Small talk question' },
  { id: 'T05', category: 'Greeting', prompt: 'หวัดดี', expectedLevel: 'L0', description: 'Short Thai greeting' },
  { id: 'T06', category: 'Greeting', prompt: 'Good morning Firekeeper', expectedLevel: 'L0', description: 'Time-based greeting' },
  { id: 'T07', category: 'Greeting', prompt: 'ขอบคุณมากครับ', expectedLevel: 'L0', description: 'Thank you message' },
  { id: 'T08', category: 'Greeting', prompt: 'ขอบใจนะ', expectedLevel: 'L0', description: 'Informal thanks' },
  { id: 'T09', category: 'Factual', prompt: '1+1 เท่ากับเท่าไหร่', expectedLevel: 'L0', description: 'Basic arithmetic (L0 Direct)' },
  { id: 'T10', category: 'Factual', prompt: 'เมืองหลวงของญี่ปุ่นคืออะไร', expectedLevel: 'L0', description: 'Simple trivia (L0 Direct)' },
  { id: 'T11', category: 'Factual', prompt: 'HTTP status 404 หมายถึงอะไร', expectedLevel: 'L0', description: 'Standard technical definition (L0 Direct)' },
  { id: 'T12', category: 'Factual', prompt: 'สูตรคำนวณพื้นที่วงกลมคืออะไร', expectedLevel: 'L0', description: 'Mathematical formula (L0 Direct)' },
  { id: 'T13', category: 'Factual', prompt: 'Python กับ TypeScript ต่างกันอย่างไร สรุปสั้นๆ 1 ประโยค', expectedLevel: 'L0', description: 'Explicit short summary request (L0 Direct)' },
  { id: 'T14', category: 'Factual', prompt: 'แปลง 100 USD เป็น THB ตอนนี้', expectedLevel: 'L0', description: 'Direct conversion query (L0 Direct)' },
  { id: 'T15', category: 'Factual', prompt: 'DNS ย่อมาจากอะไร', expectedLevel: 'L0', description: 'Acronym definition (L0 Direct)' },
  { id: 'T16', category: 'Factual', prompt: 'วันที่ปัจจุบันคือวันที่เท่าไหร่', expectedLevel: 'L0', description: 'Current date query (L0 Direct)' },

  // L1: Analytical Explanation (Requires reasoning or conceptual explanation)
  { id: 'T17', category: 'Analytical', prompt: 'อธิบายว่าคำสั่ง git commit ทำงานอย่างไร', expectedLevel: 'L1', description: 'Git commit explanation' },
  { id: 'T18', category: 'Analytical', prompt: 'วิเคราะห์กลยุทธ์การขยายธุรกิจ SaaS ในตลาดเอเชียตะวันออกเฉียงใต้', expectedLevel: 'L1', description: 'Strategic business analysis' },
  { id: 'T19', category: 'Analytical', prompt: 'อธิบายกลไกการทำงานของ Garbage Collection ใน V8', expectedLevel: 'L1', description: 'V8 Garbage collection mechanism' },
  { id: 'T20', category: 'Analytical', prompt: 'ทำไม Node.js ถึงเป็น Single Threaded Event Loop', expectedLevel: 'L1', description: 'Why-question technical reasoning' },
  { id: 'T21', category: 'Analytical', prompt: 'วิเคราะห์ผลกระทบของ PDPA ต่อการเก็บ Log ในระบบคลาวด์', expectedLevel: 'L1', description: 'Regulatory analysis' },
  { id: 'T22', category: 'Analytical', prompt: 'อธิบายสถาปัตยกรรมของ Kafka Event Streaming', expectedLevel: 'L1', description: 'Architecture explanation' },
  { id: 'T23', category: 'Analytical', prompt: 'วิเคราะห์สาเหตุที่เป็นไปได้ของ Memory Leak ในแอปพลิเคชัน', expectedLevel: 'L1', description: 'Diagnostic analysis' },

  // L2: Structured Synthesis / Strategic Decision (Trade-offs, options, alternatives)
  { id: 'T24', category: 'Decision', prompt: 'ควรเลือกระหว่าง Cloud SQL หรือ Firestore ในโครงการระดับองค์กร', expectedLevel: 'L2', description: 'Architectural trade-off decision' },
  { id: 'T25', category: 'Decision', prompt: 'เปรียบเทียบข้อดีข้อเสียระหว่าง Docker Swarm กับ Kubernetes', expectedLevel: 'L2', description: 'Technology stack comparison' },
  { id: 'T26', category: 'Decision', prompt: 'ควรเลือก Monolith หรือ Microservices สำหรับสตาร์ทอัพที่เพิ่งเริ่มต้น', expectedLevel: 'L2', description: 'Systems migration trade-off analysis' },
  { id: 'T27', category: 'Decision', prompt: 'อันไหนดีกว่ากันระหว่าง REST API กับ GraphQL', expectedLevel: 'L2', description: 'API architecture comparison' },
  { id: 'T28', category: 'Decision', prompt: 'ช่วยเลือกเทคโนโลยีสำหรับ Real-time Notification System', expectedLevel: 'L2', description: 'Decision support query' },

  // L3: Deep Reasoning / Consequential Audit / Explicit High Stakes
  { id: 'T29', category: 'DeepAudit', prompt: 'วิเคราะห์สถาปัตยกรรมการเงิน', options: { deepReasoning: true }, expectedLevel: 'L3', description: 'User toggled deepReasoning' },
  { id: 'T30', category: 'DeepAudit', prompt: 'มีข้อมูลสองแหล่งที่ขัดแย้งกันอย่างรุนแรงเรื่องผลประกอบการ', options: { hasConflicts: true }, expectedLevel: 'L3', description: 'High conflicting evidence present' },
  { id: 'T31', category: 'DeepAudit', prompt: 'ขอการวิเคราะห์เชิงลึกแบบ full deep audit พร้อมแจกแจงสมมติฐาน ACH', expectedLevel: 'L3', description: 'Explicit request for deep audit' },
  { id: 'T32', category: 'DeepAudit', prompt: 'ประเมินความเสี่ยงระดับวิกฤตของความปลอดภัยไซเบอร์แบบครบ 12 ขั้นตอน', expectedLevel: 'L3', description: 'Explicit 12-stage audit request' },
  { id: 'T33', category: 'DeepAudit', prompt: 'วางแผนสถาปัตยกรรม Zero Trust และทำ counterfactual audit', options: { deepReasoning: true }, expectedLevel: 'L3', description: 'Zero Trust architecture with deep reasoning' },
  { id: 'T34', category: 'DeepAudit', prompt: 'ขอการวิเคราะห์แบบลึกซึ้งที่สุด ตรวจสอบความเปราะบางทุกจุด', expectedLevel: 'L3', description: 'Maximum depth request' },
  { id: 'T35', category: 'DeepAudit', prompt: 'ตรวจสอบความถูกต้องของรายงานการเงินที่มีตัวเลขขัดแย้งกัน', options: { hasConflicts: true }, expectedLevel: 'L3', description: 'Conflicting data verification' }
];

console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PCA v3.0 RUNTIME CONTROLLER VALIDATION TEST SUITE (35 PROMPT SCENARIOS)');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

let passedCount = 0;
let failedCount = 0;

for (const tc of TEST_CASES) {
  const result = evaluateResponseDepth(tc.prompt, tc.options);
  const isMatch = result.depth.startsWith(tc.expectedLevel);
  if (isMatch) {
    passedCount++;
    console.log(`✅ [PASS] ${tc.id} (${tc.category}): "${tc.prompt.slice(0, 35)}..." -> ${result.depth}`);
  } else {
    failedCount++;
    console.error(`❌ [FAIL] ${tc.id} (${tc.category}): "${tc.prompt.slice(0, 35)}..." Expected: ${tc.expectedLevel}, Got: ${result.depth}`);
  }
}

console.log('\n──────────────────────────────────────────────────────────────────────────────');
console.log(`Summary: ${passedCount}/${TEST_CASES.length} tests passed (${failedCount} failures)`);
console.log('──────────────────────────────────────────────────────────────────────────────\n');

// Additional Invariant Validations
console.log('🔍 Testing Style & Language Post-Processing Cleaner:');
const sampleArchicText = 'ข้าพเจ้าขอเรียนท่านว่า ระบบได้เตรียมการไว้แล้วขอรับ';
const cleaned = cleanAiResponseStyle(sampleArchicText, true, 'สอบถามระบบ');
const hasArchaic = /ข้าพเจ้า|ท่าน|ขอรับ/i.test(cleaned);
console.log(`- Archaic terms removed: ${!hasArchaic ? '✅ PASS' : '❌ FAIL'} (Result: "${cleaned}")`);

const naturalHeadingsRule = PCA_PRESENTATION_POLICY.includes('Do not use epistemic labels as section headings');
console.log(`- Display Policy specifies natural headings only: ${naturalHeadingsRule ? '✅ PASS' : '❌ FAIL'}`);

const has6Invariants = PCA_CORE_INVARIANTS.includes('1. Human Agency') && PCA_CORE_INVARIANTS.includes('6. Consistency');
console.log(`- Core Invariants defined (1-6): ${has6Invariants ? '✅ PASS' : '❌ FAIL'}`);

const hasP0P6 = PCA_PRIORITY_HIERARCHY.includes('P0 — Safety') && PCA_PRIORITY_HIERARCHY.includes('P6 — Default Behavior');
console.log(`- Priority Hierarchy defined (P0-P6): ${hasP0P6 ? '✅ PASS' : '❌ FAIL'}`);

if (failedCount === 0 && !hasArchaic && naturalHeadingsRule && has6Invariants && hasP0P6) {
  console.log('\n🎉 ALL PCA v3.0 VALIDATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME VALIDATION CHECKS FAILED');
  process.exit(1);
}
