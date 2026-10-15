import assert from 'node:assert/strict';
import { evaluateLightGovernance } from '../src/server/services/lightGovernance';
const providers = ['deepseek', 'openai', 'anthropic', 'gemini', 'groq', 'openrouter', 'mistral', 'perplexity', 'ollama', 'custom', 'deepseek_vision'];
for (const provider of providers) {
  const clean = evaluateLightGovernance({ question: 'สวัสดี', response: 'สวัสดีครับ', provider, model: 'test-model' });
  assert.equal(clean.mode, 'light');
  assert.equal(clean.provider, provider);
  assert.deepEqual(clean.flags, []);
  assert.equal(clean.recommendGovernance, false);
  const empty = evaluateLightGovernance({ question: 'hello', response: '  ', provider, model: 'test-model' });
  assert.ok(empty.flags.includes('EMPTY_RESPONSE'));
  const secret = evaluateLightGovernance({ question: 'hello', response: 'api_key=abcdefghijklmnop', provider, model: 'test-model' });
  assert.ok(secret.flags.includes('POTENTIAL_SECRET_EXPOSURE'));
  const risky = evaluateLightGovernance({ question: 'ควรลงทุนอะไรดี', response: 'โปรดประเมินความเสี่ยง', provider, model: 'test-model' });
  assert.equal(risky.recommendGovernance, true);
}
console.log('PASS: Light governance works uniformly for all supported provider routes.');
