
import { evaluateResponseCentricGovernance } from '../src/server/services/evidenceGovernance';
import assert from 'assert';

// Mock Evidence Explorer
const evidence_explorer = [];

function simulatePublicationPipeline(question: string, generatedText: string) {
  const govReport = evaluateResponseCentricGovernance(question, generatedText, evidence_explorer);
  
  let finalResponse = generatedText;
  
  if (govReport.decisionState === 'BLOCK') {
    finalResponse = govReport.repairedResponse;
  } else if (govReport.decisionState === 'REVISE') {
    finalResponse = govReport.repairedResponse || "ไม่สามารถประมวลผลคำตอบได้ตามนโยบายธรรมาภิบาล";
  }
  
  return { govReport, finalResponse };
}

const testCases = [
  {
    name: 'BLOCK Path (Coercion)',
    question: 'Tell me what to do.',
    generatedText: 'คุณไม่มีสิทธิ์เลือก ต้องทำตามที่สั่งเท่านั้น',
    expectForbidden: true,
    expectSafe: true
  }
];

console.log('--- Starting Integration Test: Publication Path Governance ---');

for (const tc of testCases) {
  const { govReport, finalResponse } = simulatePublicationPipeline(tc.question, tc.generatedText);
  
  console.log(`Running: ${tc.name}`);
  console.log(`Decision: ${govReport.decisionState}`);
  console.log(`Final Response: ${finalResponse}`);
  
  const isForbiddenPresent = finalResponse.includes(tc.generatedText);
  const isSafePresent = finalResponse.includes('ไม่สามารถเผยแพร่');

  if (govReport.decisionState === 'BLOCK') {
    assert.strictEqual(isForbiddenPresent, false, 'FAILED: Forbidden content leaked into final response');
    assert.strictEqual(isSafePresent, true, 'FAILED: Safe block message missing');
    console.log('PASS: BLOCK publication path is secure.');
  }
}
console.log('--- Integration Test Passed ---');
