import { mergeConversationLists, persistLocalSessions } from '../src/context/ConversationContext';
import { safeLocalStorage, safeSessionStorage } from '../src/utils/safeStorage';
import { APP_CONFIG } from '../src/config/env';
import { ConversationSession } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('=== RUNNING CONVERSATION HYDRATION & REFRESH REGRESSION TESTS ===\n');

// -------------------------------------------------------------
// CASE A: Local = A, B, C; Firestore = A -> Refresh => [A, B, C]
// -------------------------------------------------------------
console.log('--- TEST CASE A: Local=[A,B,C], Firestore=[A] ---');
const localA_base: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A (Local)',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T10:00:00.000Z',
  turns: []
};
const localB: ConversationSession = {
  id: 'session-B',
  userId: 'user-1',
  title: 'Session B (Local Only)',
  created_at: '2026-09-02T10:05:00.000Z',
  updated_at: '2026-09-02T10:05:00.000Z',
  turns: []
};
const localC: ConversationSession = {
  id: 'session-C',
  userId: 'user-1',
  title: 'Session C (Local Only)',
  created_at: '2026-09-02T10:10:00.000Z',
  updated_at: '2026-09-02T10:10:00.000Z',
  turns: []
};
const firestoreA: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A (Firestore)',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T10:00:00.000Z',
  turns: []
};

const caseAResult = mergeConversationLists([localA_base, localB, localC], [firestoreA]);
assert(caseAResult.length === 3, 'Case A: Output must contain all 3 conversations [A, B, C]');
assert(caseAResult.some(s => s.id === 'session-A'), 'Case A: Session A is preserved');
assert(caseAResult.some(s => s.id === 'session-B'), 'Case A: Session B (local only) is NOT deleted');
assert(caseAResult.some(s => s.id === 'session-C'), 'Case A: Session C (local only) is NOT deleted');

// -------------------------------------------------------------
// CASE B: Local = [A]; Firestore = [A, B] -> Refresh => [A, B]
// -------------------------------------------------------------
console.log('\n--- TEST CASE B: Local=[A], Firestore=[A,B] ---');
const firestoreB: ConversationSession = {
  id: 'session-B',
  userId: 'user-1',
  title: 'Session B (Remote Only)',
  created_at: '2026-09-02T11:00:00.000Z',
  updated_at: '2026-09-02T11:00:00.000Z',
  turns: []
};

const caseBResult = mergeConversationLists([localA_base], [firestoreA, firestoreB]);
assert(caseBResult.length === 2, 'Case B: Output must contain both [A, B]');
assert(caseBResult.some(s => s.id === 'session-A'), 'Case B: Session A is preserved');
assert(caseBResult.some(s => s.id === 'session-B'), 'Case B: Session B (remote only) is successfully merged in');

// -------------------------------------------------------------
// CASE C: Local A updated newer than Firestore A -> Refresh => Keep Local A
// -------------------------------------------------------------
console.log('\n--- TEST CASE C: Local A updated newer than Firestore A ---');
const localANewer: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A - Updated Locally with new turns',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T12:00:00.000Z', // 12:00 (Newer)
  turns: [{ role: 'user', content: 'Local turn', timestamp: '2026-09-02T12:00:00.000Z' }]
};
const firestoreAOlder: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A - Stale on Firestore',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T10:30:00.000Z', // 10:30 (Older)
  turns: []
};

const caseCResult = mergeConversationLists([localANewer], [firestoreAOlder]);
assert(caseCResult.length === 1, 'Case C: Exactly 1 deduplicated conversation');
assert(caseCResult[0].title === 'Session A - Updated Locally with new turns', 'Case C: Newer Local A must be preserved over stale Firestore A');
assert(caseCResult[0].turns.length === 1, 'Case C: Local turns must be retained');

// -------------------------------------------------------------
// CASE D: Firestore A updated newer than Local A -> Refresh => Keep Firestore A
// -------------------------------------------------------------
console.log('\n--- TEST CASE D: Firestore A updated newer than Local A ---');
const localAOlder: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A - Stale on Local',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T10:00:00.000Z', // 10:00 (Older)
  turns: []
};
const firestoreANewer: ConversationSession = {
  id: 'session-A',
  userId: 'user-1',
  title: 'Session A - Newer on Firestore from Another Device',
  created_at: '2026-09-02T10:00:00.000Z',
  updated_at: '2026-09-02T13:00:00.000Z', // 13:00 (Newer)
  turns: [{ role: 'user', content: 'Remote device turn', timestamp: '2026-09-02T13:00:00.000Z' }]
};

const caseDResult = mergeConversationLists([localAOlder], [firestoreANewer]);
assert(caseDResult.length === 1, 'Case D: Exactly 1 deduplicated conversation');
assert(caseDResult[0].title === 'Session A - Newer on Firestore from Another Device', 'Case D: Newer Firestore A must be adopted');
assert(caseDResult[0].turns.length === 1, 'Case D: Firestore turns adopted');

// -------------------------------------------------------------
// CASE E: Create new conversation, refresh immediately -> Never lost
// -------------------------------------------------------------
console.log('\n--- TEST CASE E: Create new conversation -> immediate refresh simulation ---');
const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
safeLocalStorage.clear();
safeSessionStorage.clear();

const newlyCreatedSession: ConversationSession = {
  id: 'session-E-' + Date.now(),
  userId: 'user-1',
  title: 'Brand New Instant Conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  turns: []
};

// Simulate immediate synchronous persist on creation:
persistLocalSessions([newlyCreatedSession]);

// Simulate browser refresh: read from storage
const rawLocal = safeLocalStorage.getItem(storageKey);
const rawSession = safeSessionStorage.getItem(storageKey);
assert(rawLocal !== null, 'Case E: Storage must contain serialized sessions immediately');
assert(rawSession !== null, 'Case E: Session storage also contains serialized sessions');

const hydratedFromLocal: ConversationSession[] = JSON.parse(rawLocal!);
assert(hydratedFromLocal.length === 1, 'Case E: Exactly 1 session restored from storage');
assert(hydratedFromLocal[0].id === newlyCreatedSession.id, 'Case E: ID matches newly created session');

// When Firestore later resolves (e.g. returning older sessions or empty list):
const firestoreAsyncLoaded: ConversationSession[] = [
  {
    id: 'session-old-from-db',
    userId: 'user-1',
    title: 'Old History',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    turns: []
  }
];

const afterAuthMerge = mergeConversationLists(hydratedFromLocal, firestoreAsyncLoaded);
assert(afterAuthMerge.length === 2, 'Case E: Newly created session + old history both exist');
assert(afterAuthMerge.some(s => s.id === newlyCreatedSession.id), 'Case E: Newly created session is NEVER lost when Firestore resolves');

// -------------------------------------------------------------
// EXTRA: Race Condition Simulation
// -------------------------------------------------------------
console.log('\n--- TEST RACE CONDITION: User creates turn while Firestore getDocs() in flight ---');
// State before fetch:
const activeStateBeforeFetch: ConversationSession[] = [localA_base];

// User adds turn while fetch is underway:
const activeStateDuringFetch: ConversationSession[] = [
  {
    ...localA_base,
    title: 'Active modified mid-flight',
    updated_at: '2026-09-02T15:00:00.000Z',
    turns: [{ role: 'user', content: 'In-flight message', timestamp: '2026-09-02T15:00:00.000Z' }]
  },
  {
    id: 'session-D-created-mid-flight',
    userId: 'user-1',
    title: 'Created while loading',
    created_at: '2026-09-02T15:01:00.000Z',
    updated_at: '2026-09-02T15:01:00.000Z',
    turns: []
  }
];

// Stale Firestore response arriving later:
const staleFirestoreResponse: ConversationSession[] = [firestoreAOlder];

// Functional updater receives activeStateDuringFetch:
const raceConditionResult = mergeConversationLists(activeStateDuringFetch, staleFirestoreResponse);
assert(raceConditionResult.length === 2, 'Race condition: All in-flight created/modified sessions preserved');
assert(raceConditionResult.some(s => s.id === 'session-D-created-mid-flight'), 'Race condition: Session D created mid-flight is preserved');
const mergedA = raceConditionResult.find(s => s.id === 'session-A');
assert(mergedA?.title === 'Active modified mid-flight', 'Race condition: In-flight user turn on session A is NOT overwritten by stale Firestore response');

console.log('\n======================================================');
console.log('🎉 ALL 5 VERIFICATION SCENARIOS & RACE TESTS PASSED 100%!');
console.log('======================================================\n');
