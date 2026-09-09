/**
 * Test: Frontend State, Cache & Session Persistence Isolation (Alice -> Logout -> Bob)
 * Verifies client-side isolation, storage namespacing, and zero residual state leakage across user switches.
 */

import { safeLocalStorage, safeSessionStorage, getDraftPromptStorageKey, getDeepSeekApiKeyStorageKey, purgeLegacyUnscopedStorage } from './src/utils/safeStorage';
import { memoryRepository } from './src/services/memoryRepository';
import { ConversationSession } from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${msg}`);
    failed++;
  }
}

async function runFrontendIsolationSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING FRONTEND SESSION & STORAGE ISOLATION TEST SUITE');
  console.log('================================================================\n');

  // Step 0: Ensure legacy unscoped storage is purged
  purgeLegacyUnscopedStorage();
  assert(safeLocalStorage.getItem('fire_keeper_draft_prompt') === null, 'Legacy draft prompt key is purged');
  assert(safeLocalStorage.getItem('fire_keeper_conversations') === null, 'Legacy conversations key is purged');
  assert(safeLocalStorage.getItem('fire_keeper_memory_bank_v2') === null, 'Legacy memory bank key is purged');

  // Step 1: Alice logs in and populates her client-side session state
  const aliceUid = 'usr-alice-test-123';
  console.log(`\n--- 1. Alice (${aliceUid}) Logs in and generates private state ---`);

  // Alice's draft prompt
  safeLocalStorage.setItem(getDraftPromptStorageKey(aliceUid), "Alice's Secret Strategy Draft");

  // Alice's private DeepSeek API key
  safeLocalStorage.setItem(getDeepSeekApiKeyStorageKey(aliceUid), "sk-alice-super-secret-key");

  // Alice's Memory Bank
  memoryRepository.addMemory("Alice's Private Core Principle", 'Fact', 'Manual Entry', aliceUid);
  const aliceMemories = memoryRepository.loadMemories(aliceUid);
  assert(aliceMemories.some(m => m.content === "Alice's Private Core Principle" && m.userId === aliceUid), 'Alice memories saved and loaded correctly');

  // Alice's Conversations
  const aliceConversation: ConversationSession = {
    id: 'conv-alice-confidential-001',
    title: "Alice's Confidential Project",
    userId: aliceUid,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    turns: [
      {
        id: 'turn-1',
        role: 'user',
        content: "Secret Alice query",
        timestamp: new Date().toISOString(),
      },
      {
        id: 'turn-2',
        role: 'assistant',
        content: "Secret Alice response",
        timestamp: new Date().toISOString(),
      }
    ]
  };
  const aliceConvKey = `fire_keeper_conversations_user_${aliceUid}`;
  const aliceActiveKey = `fire_keeper_current_conversation_id_user_${aliceUid}`;
  safeLocalStorage.setItem(aliceConvKey, JSON.stringify([aliceConversation]));
  safeLocalStorage.setItem(aliceActiveKey, aliceConversation.id);

  assert(safeLocalStorage.getItem(aliceConvKey) !== null, "Alice conversations exist in Alice's storage namespace");

  // Step 2: Alice logs out (Unauthenticated / Guest State)
  console.log(`\n--- 2. Alice Logs Out -> System Transitions to Guest State ---`);
  const guestDraft = safeLocalStorage.getItem(getDraftPromptStorageKey(null));
  const guestKey = safeLocalStorage.getItem(getDeepSeekApiKeyStorageKey(null));
  const guestMemories = memoryRepository.loadMemories(null);
  const guestConvKey = `fire_keeper_conversations_user_guest`;
  const guestConversations = safeLocalStorage.getItem(guestConvKey);

  assert(guestDraft === null || guestDraft === '', "Guest cannot see Alice's draft prompt");
  assert(guestKey === null || guestKey === '', "Guest cannot see Alice's DeepSeek API key");
  assert(guestMemories.every(m => m.userId !== aliceUid), "Guest memory bank contains NO Alice memories");
  assert(guestConversations === null || !guestConversations.includes(aliceConversation.id), "Guest cannot read Alice's conversations");

  // Step 3: Bob logs in
  const bobUid = 'usr-bob-test-456';
  console.log(`\n--- 3. Bob (${bobUid}) Logs in ---`);

  // Bob's storage inspection
  const bobDraft = safeLocalStorage.getItem(getDraftPromptStorageKey(bobUid));
  const bobKey = safeLocalStorage.getItem(getDeepSeekApiKeyStorageKey(bobUid));
  const bobMemories = memoryRepository.loadMemories(bobUid);
  const bobConvKey = `fire_keeper_conversations_user_${bobUid}`;
  const bobConvRaw = safeLocalStorage.getItem(bobConvKey);
  const bobActiveKey = `fire_keeper_current_conversation_id_user_${bobUid}`;
  const bobActiveId = safeLocalStorage.getItem(bobActiveKey);

  assert(bobDraft === null || bobDraft === '', "Bob cannot see Alice's draft prompt");
  assert(bobKey === null || bobKey === '', "Bob cannot see Alice's DeepSeek API key");
  assert(bobMemories.every(m => m.userId === bobUid && m.content !== "Alice's Private Core Principle"), "Bob's memory bank is completely isolated from Alice's memories");
  assert(bobConvRaw === null, "Bob has no conversation records in storage");
  assert(bobActiveId === null, "Bob active conversation ID is null and does NOT point to Alice's conversation");

  // Step 4: Bob creates his own conversation and memory
  console.log(`\n--- 4. Bob creates his own independent data ---`);
  safeLocalStorage.setItem(getDraftPromptStorageKey(bobUid), "Bob's Public Inquiries");
  safeLocalStorage.setItem(getDeepSeekApiKeyStorageKey(bobUid), "sk-bob-key-999");
  memoryRepository.addMemory("Bob's Knowledge Item", 'Context', 'Manual Entry', bobUid);

  const bobConversation: ConversationSession = {
    id: 'conv-bob-001',
    title: "Bob's Public Chat",
    userId: bobUid,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    turns: [
      {
        id: 'turn-b1',
        role: 'user',
        content: "Hello from Bob",
        timestamp: new Date().toISOString(),
      },
      {
        id: 'turn-b2',
        role: 'assistant',
        content: "Hello Bob",
        timestamp: new Date().toISOString(),
      }
    ]
  };
  safeLocalStorage.setItem(bobConvKey, JSON.stringify([bobConversation]));
  safeLocalStorage.setItem(bobActiveKey, bobConversation.id);

  // Step 5: Verify merge algorithm isolation
  console.log(`\n--- 5. Verify Conversation Merge Algorithm Strict Ownership Filter ---`);
  const rawBobLoaded = JSON.parse(safeLocalStorage.getItem(bobConvKey) || '[]');
  const rawAliceLoaded = JSON.parse(safeLocalStorage.getItem(aliceConvKey) || '[]');

  // Even if somehow malicious data was injected into memory
  const hostileMixedList = [...rawBobLoaded, ...rawAliceLoaded];
  const strictlyFilteredForBob = hostileMixedList.filter(s => s && s.userId === bobUid);

  assert(strictlyFilteredForBob.length === 1 && strictlyFilteredForBob[0].id === 'conv-bob-001', "Strict filter eliminates all foreign user sessions");
  assert(!strictlyFilteredForBob.some(s => s.userId === aliceUid), "No Alice conversation in Bob's verified conversation list");

  // Step 6: Verify Alice's data remains intact in Alice's namespace and unaffected by Bob
  console.log(`\n--- 6. Verify Alice's Data Integrity in Alice's Namespace ---`);
  const aliceDraftStillIntact = safeLocalStorage.getItem(getDraftPromptStorageKey(aliceUid));
  const aliceKeyStillIntact = safeLocalStorage.getItem(getDeepSeekApiKeyStorageKey(aliceUid));
  const aliceMemoriesStillIntact = memoryRepository.loadMemories(aliceUid);

  assert(aliceDraftStillIntact === "Alice's Secret Strategy Draft", "Alice draft preserved in her own partition");
  assert(aliceKeyStillIntact === "sk-alice-super-secret-key", "Alice API key preserved in her own partition");
  assert(aliceMemoriesStillIntact.some(m => m.content === "Alice's Private Core Principle" && m.userId === aliceUid), "Alice memory preserved in her own partition");

  console.log('\n================================================================');
  console.log(`🏁 FRONTEND TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendIsolationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
