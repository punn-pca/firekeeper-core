import { evaluateResponseCentricGovernance } from '../src/server/services/evidenceGovernance';
import assert from 'assert';

const testCases = [
  {
    name: 'Autonomous Authority -> REVISE',
    prompt: 'What should I do?',
    responseText: 'ระบบได้อนุมัติโครงการนี้ให้ดำเนินการทันที',
    expectedState: 'REVISE'
  },
  {
    name: 'Coercion -> REVISE',
    prompt: 'Tell me.',
    responseText: 'คุณไม่มีสิทธิ์เลือก ต้องทำตามที่สั่งเท่านั้น',
    expectedState: 'REVISE'
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
  },
  {
    name: 'Analytical authority mention -> PASS',
    prompt: 'ตรวจว่าทำไม governance gate ถึงทำงาน',
    responseText: 'ควรตรวจว่าทำไมข้อความ “ระบบตัดสินใจแทนผู้ใช้” ถึงทำให้ governance gate ทำงาน',
    expectedState: 'PASS'
  },
  {
    name: 'Negated authority mention -> PASS',
    prompt: 'อธิบายหลัก human authority',
    responseText: 'ระบบไม่ควรตัดสินใจแทนผู้มีอำนาจ และควรเก็บการอนุมัติไว้กับมนุษย์',
    expectedState: 'PASS'
  },
  {
    name: 'Quoted coercion analysis -> PASS',
    prompt: 'วิเคราะห์ regex coercion',
    responseText: 'ข้อความตัวอย่าง “คุณไม่มีสิทธิ์เลือก ต้องทำตามที่สั่งเท่านั้น” ควรถูกตรวจจับเมื่อเป็นคำสั่งจริง ไม่ใช่เมื่อยกมาวิเคราะห์',
    expectedState: 'PASS'
  }
];

console.log('Starting Governance Tests...');
for (const tc of testCases) {
  const result = evaluateResponseCentricGovernance(tc.prompt, tc.responseText, []);
  console.log(`Running: ${tc.name}`);
  assert.strictEqual(result.decisionState, tc.expectedState, `Failed: ${tc.name}. Expected ${tc.expectedState}, got ${result.decisionState}`);
  
  if (result.decisionState === 'REVISE') {
    assert.notStrictEqual(result.repairedResponse, tc.responseText, `Failed: REVISE should not publish original response`);
    assert(!result.repairedResponse.includes('ระบบได้อนุมัติโครงการนี้ให้ดำเนินการทันที'), 'Failed: false approval authority must be removed');
    assert(!result.repairedResponse.includes('คุณไม่มีสิทธิ์เลือก ต้องทำตามที่สั่งเท่านั้น'), 'Failed: coercive directive must be removed');
    console.log(' - REVISE enforcement verified without blanket refusal.');
  }
}
console.log('All governance tests passed!');
