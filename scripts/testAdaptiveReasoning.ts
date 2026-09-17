
import { classifyIntent } from '../src/server/services/intentClassifier';

async function testAdaptiveReasoning() {
  console.log('--- FIRE KEEPER Adaptive Reasoning Regression Tests ---');

  const testCases = [
    { input: 'สวัสดี', expected: 'GREETING' },
    { input: 'ขอบคุณครับ', expected: 'GREETING' },
    { input: 'ok', expected: 'GREETING' },
    { input: 'iOS vs Android', expected: 'DECISION_SUPPORT' },
    { input: 'ควรซื้อ iPhone หรือ Android ดี', expected: 'DECISION_SUPPORT' },
    { input: 'ช่วยประเมินความเสี่ยงของการลงทุนในคริปโต', expected: 'COMPLEX' },
    { input: 'สถาปัตยกรรมของ Firekeeper เป็นอย่างไร', expected: 'COMPLEX' },
    { input: 'ใครคือผู้สร้าง PUNN', expected: 'SIMPLE_QUERY' },
    { input: 'ประวัติศาสตร์อยุธยา', expected: 'NORMAL_QUERY' },
    { input: 'ตรวจสอบ trace ของตัวเองว่ามีอะไรผิด', expected: 'META_INQUIRY' },
    { input: 'Audit your own runtime trace.', expected: 'META_INQUIRY' },
    { input: 'วิเคราะห์ว่าระบบของคุณตอบผิดตรงไหน', expected: 'META_INQUIRY' },
    { input: 'เอกสารนี้มีความขัดแย้งอะไรไหม', expected: 'DOCUMENT_ANALYSIS' },
    { input: 'เปรียบเทียบเอกสารสองฉบับนี้', expected: 'DOCUMENT_ANALYSIS' }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const classification = classifyIntent(tc.input);
    const success = classification.type === tc.expected;
    if (success) passed++;
    
    console.log(`[${success ? 'PASS' : 'FAIL'}] Input: "${tc.input}"`);
    console.log(`      -> Intent: ${classification.type} (Expected: ${tc.expected})`);
    console.log(`      -> Reason: ${classification.reason}`);
  }

  console.log(`\nResults: ${passed}/${testCases.length} tests passed.`);
  
  if (passed === testCases.length) {
    console.log('✅ ALL ADAPTIVE REASONING TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

testAdaptiveReasoning().catch(err => {
  console.error(err);
  process.exit(1);
});
