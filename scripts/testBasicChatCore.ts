import assert from 'node:assert/strict';
import { executeBasicChat } from '../src/server/core/basicChatCore';
import { callUnifiedLlmContent } from '../src/server/services/unifiedLlm';

const original = callUnifiedLlmContent;

try {
  let calls = 0;
  (globalThis as any).__firekeeperBasicChatMock = async (messages: any, options: any) => {
    calls += 1;
    return {
      text: calls === 1 ? 'มีอะไรให้ช่วยไหม' : 'PCA คือกรอบการทำงานสำหรับจัดโครงสร้างการวิเคราะห์และการตัดสินใจ',
      providerUsed: options.provider,
      modelUsed: options.model,
      usage: { totalTokens: 20 },
    };
  };

  // The core uses the real imported function, so this test only validates the
  // public contract without changing production imports.
  const result = await executeBasicChat({
    mode: 'normal',
    question: 'PCA คืออะไร',
    history: [],
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
  });

  assert.equal(result.mode, 'normal');
  assert.ok(result.text.length > 0);
  assert.doesNotMatch(result.text, /^มีอะไรให้ช่วยไหม$/);
  assert.equal(result.provider, 'groq');
  assert.equal(result.model, 'openai/gpt-oss-120b');
  console.log('PASS: basic chat contract');
} finally {
  (globalThis as any).__firekeeperBasicChatMock = undefined;
}
