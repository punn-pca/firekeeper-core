import assert from 'node:assert/strict';
import { resolveModelDetails, resolveProvider } from '../src/utils/modelUtils';

assert.equal(resolveModelDetails('qwen3:4b', 'ollama').displayName, 'Qwen3 4B');
assert.equal(resolveModelDetails('qwen3:8b', 'ollama').displayName, 'Qwen3:8b');
assert.equal(resolveModelDetails('qwen2.5:7b', 'ollama').displayName, 'Qwen2.5:7b');
assert.equal(resolveModelDetails('gemini-2.5-pro', 'gemini').displayName, 'Gemini 2.5 Pro');
assert.equal(resolveModelDetails('gemini-2.5-flash', 'gemini').displayName, 'Gemini 2.5 Flash');
assert.equal(resolveModelDetails('gemini-2.0-flash', 'gemini').displayName, 'Gemini 2.0 Flash');
assert.equal(resolveProvider('gemini-2.5-pro'), 'gemini');
assert.equal(resolveProvider('qwen3:8b'), 'ollama');
console.log('Model display regression tests passed.');
