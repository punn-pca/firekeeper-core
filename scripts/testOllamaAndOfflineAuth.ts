import assert from 'assert';
import {
  isOllamaModel,
  normalizeOllamaModel,
  buildOllamaMessages,
  checkOllamaStatus,
} from '../src/server/services/ollama';
import {
  verifyFirebaseIdToken,
  OFFLINE_USER_UID,
  OFFLINE_USER_EMAIL,
} from '../src/server/middleware/auth';

async function runTests() {
  console.log('🧪 Starting Ollama & Offline Auth Integration Verification...');

  // 1. Test offline auth token verification
  console.log('  Testing offline-local-token authentication bypass...');
  const offlineUser = await verifyFirebaseIdToken('offline-local-token');
  assert.ok(offlineUser, 'offlineUser should not be null');
  assert.strictEqual(offlineUser.uid, OFFLINE_USER_UID, 'UID must match OFFLINE_USER_UID');
  assert.strictEqual(offlineUser.email, OFFLINE_USER_EMAIL, 'Email must match OFFLINE_USER_EMAIL');
  assert.strictEqual(offlineUser.role, 'admin', 'Offline user must have admin privileges');
  console.log('  ✅ Offline token verified successfully as Admin!');

  // 2. Test model identification
  console.log('  Testing Ollama model identification & normalization...');
  assert.strictEqual(isOllamaModel('ollama:qwen3:4b'), true, 'ollama:qwen3:4b should be Ollama model');
  assert.strictEqual(isOllamaModel('ollama:qwen2.5:3b'), true, 'ollama:qwen2.5:3b should be Ollama model');
  assert.strictEqual(isOllamaModel('qwen3:4b'), true, 'qwen3:4b should be Ollama model');
  assert.strictEqual(isOllamaModel('deepseek-chat'), false, 'deepseek-chat is not Ollama model');
  assert.strictEqual(isOllamaModel('deepseek-reasoner'), false, 'deepseek-reasoner is not Ollama model');

  assert.strictEqual(normalizeOllamaModel('ollama:qwen3:4b'), 'qwen3:4b');
  assert.strictEqual(normalizeOllamaModel('ollama:custom-model:latest'), 'custom-model:latest');
  assert.strictEqual(normalizeOllamaModel('qwen3:4b'), 'qwen3:4b');
  console.log('  ✅ Model detection & normalization works correctly!');

  // 3. Test Ollama message translation with system instruction
  console.log('  Testing Ollama message structure generation...');
  const sampleContents = [
    {
      role: 'user',
      parts: [
        { text: 'Previous conversation context' },
        { text: 'What is the capital of Thailand?' },
      ],
    },
    {
      role: 'model',
      parts: [
        { text: 'The capital of Thailand is Bangkok.' },
      ],
    },
  ];

  const messages = buildOllamaMessages(sampleContents, 'You are Fire Keeper PCA Engine.');
  assert.strictEqual(messages.length, 3, 'Should generate system, user, and assistant messages');
  assert.strictEqual(messages[0].role, 'system', 'First message should be system');
  assert.ok(messages[0].content.includes('Fire Keeper PCA Engine'));
  assert.strictEqual(messages[1].role, 'user', 'Second message should be user');
  assert.ok(messages[1].content.includes('What is the capital of Thailand?'));
  assert.strictEqual(messages[2].role, 'assistant', 'Third message should be assistant');
  assert.strictEqual(messages[2].content, 'The capital of Thailand is Bangkok.');
  console.log('  ✅ Message translation works correctly!');

  // 4. Test Ollama status check (daemon probe)
  console.log('  Testing Ollama status check (graceful probe without crashing)...');
  const status = await checkOllamaStatus('http://127.0.0.1:11434');
  console.log(`  Ollama status response: online=${status.online}, models=[${status.models.join(', ')}]`);
  assert.strictEqual(typeof status.online, 'boolean', 'status.online should be boolean');
  assert.ok(Array.isArray(status.models), 'status.models should be an array');
  console.log('  ✅ Ollama daemon probe handled cleanly without crashing!');

  console.log('\n🎉 ALL OLLAMA & OFFLINE AUTH TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
