import assert from 'node:assert/strict';
import { evaluateLightGovernance } from '../src/server/services/lightGovernance';
const providers = ['deepseek', 'openai', 'anthropic', 'gemini', 'groq', 'openrouter', 'mistral', 'perplexity', 'ollama', 'custom', 'deepseek_vision'];
for (const provider of providers) {
  const clean = evaluateLightGovernance({ question: 'สวัสดี', response: 'สวัสดีครับ', provider, model: 'test-model' });
  assert.equal(clean.mode, 'light');
  assert.equal(clean.provider, provider);
  assert.deepEqual(clean.flags, []);
  assert.equal(clean.recommendGovernance, false);
  assert.equal(clean.action, 'ALLOW');
  const empty = evaluateLightGovernance({ question: 'hello', response: '  ', provider, model: 'test-model' });
  assert.ok(empty.flags.includes('EMPTY_RESPONSE'));
  assert.equal(empty.action, 'BLOCK');
  const secret = evaluateLightGovernance({ question: 'hello', response: 'api_key=abcdefghijklmnop', provider, model: 'test-model' });
  assert.ok(secret.flags.includes('POTENTIAL_SECRET_EXPOSURE'));
  assert.equal(secret.action, 'BLOCK');
  const risky = evaluateLightGovernance({ question: 'ควรลงทุนอะไรดี', response: 'โปรดประเมินความเสี่ยง', provider, model: 'test-model' });
  assert.equal(risky.recommendGovernance, true);
  assert.equal(risky.action, 'REVIEW');
}
console.log('PASS: Light governance works uniformly for all supported provider routes.');
