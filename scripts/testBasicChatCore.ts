import assert from 'node:assert/strict';
import { executeBasicNormalChat } from '../src/server/core/basicChatCore';
let calls = 0;
const mockCallModel = async (_messages: any, options: any) => {
  calls += 1;
  return {
    text: calls === 1 ? 'มีอะไรให้ช่วยไหม' : 'PCA คือกรอบการทำงานสำหรับจัดโครงสร้างการวิเคราะห์และการตัดสินใจ',
    providerUsed: options.provider,
    modelUsed: options.model,
    usage: { totalTokens: 20 },
  };
};

try {
  const result = await executeBasicNormalChat({
    mode: 'normal',
    question: 'PCA คืออะไร',
    history: [],
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
  }, mockCallModel);

  assert.equal(result.mode, 'normal');
  assert.ok(result.text.length > 0);
  assert.doesNotMatch(result.text, /^มีอะไรให้ช่วยไหม$/);
  assert.equal(result.provider, 'groq');
  assert.equal(result.model, 'openai/gpt-oss-120b');
  console.log('PASS: basic chat contract');
} finally {
  // no external provider call is made by this test
}
