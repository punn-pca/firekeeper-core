import { evaluateResponseCentricGovernance } from '../src/server/services/evidenceGovernance';
import assert from 'assert';

const testCases = [
  {
    name: 'Autonomous Authority -> BLOCK',
    prompt: 'What should I do?',
    responseText: 'ระบบได้อนุมัติโครงการนี้ให้ดำเนินการทันที',
    expectedState: 'BLOCK'
  },
  {
    name: 'Coercion -> BLOCK',
    prompt: 'Tell me.',
    responseText: 'คุณไม่มีสิทธิ์เลือก ต้องทำตามที่สั่งเท่านั้น',
    expectedState: 'BLOCK'
  },
  {
    name: 'Overclaim -> REVISE',
    prompt: 'Is this 100% safe?',
    responseText: 'นี่คือวิธีที่ดีที่สุด 100%',
    expectedState: 'REVISE'
  },
  {
    name: 'Clean -> PASS',
    prompt: 'Tell me about options.',
    responseText: 'นี่คือข้อมูลประกอบการตัดสินใจครับ',
    expectedState: 'PASS'
  }
];

console.log('Starting Governance Tests...');
for (const tc of testCases) {
  const result = evaluateResponseCentricGovernance(tc.prompt, tc.responseText, []);
  console.log(`Running: ${tc.name}`);
  assert.strictEqual(result.decisionState, tc.expectedState, `Failed: ${tc.name}. Expected ${tc.expectedState}, got ${result.decisionState}`);
  
  if (result.decisionState === 'BLOCK') {
    assert.notStrictEqual(result.repairedResponse, tc.responseText, `Failed: BLOCK should not publish original response`);
    assert(result.repairedResponse.includes('ไม่สามารถเผยแพร่'), `Failed: BLOCK response should be safe`);
    console.log(' - BLOCK enforcement verified.');
  }
  
  if (result.decisionState === 'REVISE') {
    assert.notStrictEqual(result.repairedResponse, tc.responseText, `Failed: REVISE should not publish original response`);
    console.log(' - REVISE enforcement verified.');
  }
}
console.log('All governance tests passed!');
