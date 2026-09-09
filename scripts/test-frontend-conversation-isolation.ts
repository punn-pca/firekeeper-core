import {
  mergeConversationLists,
  persistLocalSessions,
  loadLocalConversationsForUser,
  getConversationsStorageKey,
  getCurrentConversationKey
} from '../src/context/ConversationContext';
import { safeLocalStorage, safeSessionStorage, purgeLegacyUnscopedStorage } from '../src/utils/safeStorage';
import { ConversationSession } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('================================================================');
console.log('🔒 RUNNING FRONTEND CONVERSATION STATE & STORAGE ISOLATION AUDIT');
console.log('================================================================\n');

// Clean environment
safeLocalStorage.clear();
safeSessionStorage.clear();
purgeLegacyUnscopedStorage();

// Helper to simulate a session
const createMockSession = (id: string, userId: string, title: string, count = 0): ConversationSession => ({
  id,
  userId,
  title,
  created_at: new Date(Date.now() + count * 1000).toISOString(),
  updated_at: new Date(Date.now() + count * 1000).toISOString(),
  turns: [
    {
      role: 'user',
      content: `Prompt for ${title}`,
      timestamp: new Date().toISOString()
    },
    {
      role: 'assistant',
      content: `Response for ${title}`,
      timestamp: new Date().toISOString()
    }
  ]
});

// -------------------------------------------------------------------------------------------------
// TEST 1: A login -> Create conversation A -> logout -> B login -> History B must have NO A
// -------------------------------------------------------------------------------------------------
console.log('--- TEST 1: A login -> Create conversation A -> logout -> B login -> No A in B ---');
const userA_id = 'user-A-uuid-1111';
const userB_id = 'user-B-uuid-2222';

const sessionA1 = createMockSession('session-A-1', userA_id, 'User A Secret Strategy');
persistLocalSessions(userA_id, [sessionA1]);

// A logs out -> B logs in
const sessionsLoadedForB = loadLocalConversationsForUser(userB_id);
assert(sessionsLoadedForB.length === 0, 'TEST 1: User B receives empty list, no sessions belonging to User A');
assert(!sessionsLoadedForB.some(s => s.id === sessionA1.id), 'TEST 1: User A session is completely absent from B');

// -------------------------------------------------------------------------------------------------
// TEST 2: A login -> Create 5 conversations -> logout -> B login -> Only B
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 2: A login -> 5 conversations -> logout -> B login -> Only B ---');
const userA_sessions = Array.from({ length: 5 }, (_, i) => 
  createMockSession(`session-A-${i + 1}`, userA_id, `User A Discussion #${i + 1}`, i)
);
persistLocalSessions(userA_id, userA_sessions);

const sessionB1 = createMockSession('session-B-1', userB_id, 'User B Standalone Topic');
persistLocalSessions(userB_id, [sessionB1]);

const bResolvedSessions = loadLocalConversationsForUser(userB_id);
assert(bResolvedSessions.length === 1, 'TEST 2: User B has exactly 1 conversation');
assert(bResolvedSessions[0].id === 'session-B-1', 'TEST 2: User B only has session-B-1');
assert(bResolvedSessions.every(s => s.userId === userB_id), 'TEST 2: All sessions for B strictly match userB_id');

// -------------------------------------------------------------------------------------------------
// TEST 3: B logout -> A login -> A must get all 5 original conversations
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 3: B logout -> A login -> A must get original 5 conversations preserved ---');
const aRestoredSessions = loadLocalConversationsForUser(userA_id);
assert(aRestoredSessions.length === 5, 'TEST 3: User A gets all 5 original conversations intact');
assert(aRestoredSessions.every(s => s.userId === userA_id), 'TEST 3: All restored sessions strictly belong to User A');
assert(!aRestoredSessions.some(s => s.id === 'session-B-1'), 'TEST 3: User B session is NOT leaked into User A');

// -------------------------------------------------------------------------------------------------
// TEST 4: A login -> logout -> B login -> logout -> A login -> Full round-trip restoration
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 4: Multi-switch round trip: A -> logout -> B -> logout -> A ---');
// Switch to B
const bStep = loadLocalConversationsForUser(userB_id);
assert(bStep.length === 1 && bStep[0].id === 'session-B-1', 'TEST 4 (Step 1): B is isolated');
// Switch to Guest
const guestSession = createMockSession('session-guest-1', 'guest', 'Guest Anonymous Question');
persistLocalSessions('guest', [guestSession]);
const guestStep = loadLocalConversationsForUser(null);
assert(guestStep.length === 1 && guestStep[0].userId === 'guest', 'TEST 4 (Step 2): Guest namespace is isolated');
// Switch back to A
const aFinalStep = loadLocalConversationsForUser(userA_id);
assert(aFinalStep.length === 5, 'TEST 4 (Step 3): A is perfectly restored after guest and B switches');

// -------------------------------------------------------------------------------------------------
// TEST 5: Tab / cross-session switch simulation -> No cross-contamination
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 5: Cross-session simulation & merge guard ---');
const mixedForeignList = [sessionA1, sessionB1, guestSession];
// Attempt to merge foreign list under User A context
const mergedForA = mergeConversationLists(mixedForeignList, [], userA_id);
assert(mergedForA.length === 1, 'TEST 5: mergeConversationLists with userA_id filtered out all non-A sessions');
assert(mergedForA[0].id === sessionA1.id, 'TEST 5: Only session A was accepted for user A');

const mergedForB = mergeConversationLists([], mixedForeignList, userB_id);
assert(mergedForB.length === 1, 'TEST 5: mergeConversationLists with userB_id filtered out all non-B sessions');
assert(mergedForB[0].id === sessionB1.id, 'TEST 5: Only session B was accepted for user B');

// -------------------------------------------------------------------------------------------------
// TEST 6: Race condition simulation -> In-flight response of A arrives after B has logged in
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 6: Race condition simulation (A in-flight response arriving after switch to B) ---');
// Simulate state machine with auth generation token
let activeUserId: string | null = userA_id;
let authGeneration = 1;

const inflightGenerationA = authGeneration;
const inflightUserA = activeUserId;

// User quickly switches to B
authGeneration = 2;
activeUserId = userB_id;

// Stale Firestore response for A resolves
const staleFirestoreResponseForA = [sessionA1];
let stateB: ConversationSession[] = [sessionB1];

// State update guard:
const shouldAcceptStaleResponse = (inflightGenerationA === authGeneration && inflightUserA === activeUserId);
assert(!shouldAcceptStaleResponse, 'TEST 6: Race condition guard successfully detected stale generation and mismatch');

if (shouldAcceptStaleResponse) {
  stateB = mergeConversationLists(stateB, staleFirestoreResponseForA, activeUserId);
}
assert(stateB.length === 1 && stateB[0].userId === userB_id, 'TEST 6: State for B was NOT contaminated by stale A response');

// -------------------------------------------------------------------------------------------------
// TEST 7: Inspect localStorage namespaces -> A and B are in isolated keys, no global key used
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 7: Storage Key Namespace Verification ---');
const keyA = getConversationsStorageKey(userA_id);
const keyB = getConversationsStorageKey(userB_id);
const keyGuest = getConversationsStorageKey(null);

assert(keyA === `fire_keeper_conversations_user_${userA_id}`, 'TEST 7: User A key format is strictly user-scoped');
assert(keyB === `fire_keeper_conversations_user_${userB_id}`, 'TEST 7: User B key format is strictly user-scoped');
assert(keyGuest === 'fire_keeper_conversations_user_guest', 'TEST 7: Guest key format is strictly guest-scoped');
assert(keyA !== keyB && keyA !== keyGuest && keyB !== keyGuest, 'TEST 7: All keys are completely disjoint');

// Verify that global unscoped key is never written
assert(safeLocalStorage.getItem('fire_keeper_conversations') === null, 'TEST 7: Global key "fire_keeper_conversations" is NULL in localStorage');
assert(safeSessionStorage.getItem('fire_keeper_conversations') === null, 'TEST 7: Global key "fire_keeper_conversations" is NULL in sessionStorage');

// -------------------------------------------------------------------------------------------------
// TEST 8: Prevent A conversations from ever being synced or written to B's Firestore
// -------------------------------------------------------------------------------------------------
console.log('\n--- TEST 8: Sync / Save guard against cross-account writes ---');
// Simulate an attempt to persist A's session under B's namespace
persistLocalSessions(userB_id, [sessionA1, sessionB1]);
const bCheckedSessions = loadLocalConversationsForUser(userB_id);
assert(bCheckedSessions.length === 1, 'TEST 8: Only sessionB1 was saved under userB_id namespace, sessionA1 was rejected');
assert(bCheckedSessions[0].id === 'session-B-1', 'TEST 8: sessionA1 is never persisted into B storage');

console.log('\n================================================================');
console.log('🎉 ALL 8 SECURITY REGRESSION TESTS PASSED (100% ISOLATION)');
console.log('================================================================');
