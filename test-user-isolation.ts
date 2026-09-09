/**
 * Automated Security Test Suite: Cross-Account Data Isolation Verification
 *
 * Tests the 16 security directives to guarantee that User A's data
 * (conversations, history, memories, compressed context, and LLM context)
 * can NEVER be accessed, leaked to, modified by, or seen by User B.
 */

const BASE_URL = 'http://127.0.0.1:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
    results.push({ name, passed: false, details });
  }
}

async function runSecurityTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🛡️  FIREKEEPER CROSS-ACCOUNT ISOLATION SECURITY AUDIT SUITE');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.ok, 'Backend server is healthy and responding');

    // 2. Unauthenticated endpoint protection
    const unauthConvRes = await fetch(`${BASE_URL}/api/conversations`);
    assert(unauthConvRes.status === 401, 'Unauthenticated GET /api/conversations is rejected with 401');

    const unauthMemRes = await fetch(`${BASE_URL}/api/memory`);
    assert(unauthMemRes.status === 401, 'Unauthenticated GET /api/memory is rejected with 401');

    // 3. Issue isolated session tokens for User A (Alice) and User B (Bob)
    const tokenARes = await fetch(`${BASE_URL}/api/test/create-user-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr-alice-101', email: 'alice@defense.gov' }),
    });
    const tokenAData = await tokenARes.json();
    const tokenA = tokenAData.token;
    assert(!!tokenA, 'Created authenticated session token for User A (Alice)');

    const tokenBRes = await fetch(`${BASE_URL}/api/test/create-user-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr-bob-202', email: 'bob@competitor.com' }),
    });
    const tokenBData = await tokenBRes.json();
    const tokenB = tokenBData.token;
    assert(!!tokenB, 'Created authenticated session token for User B (Bob)');

    // 4. User A creates private conversation
    const userAConversationId = `session-alice-${Date.now()}`;
    const secretContentA = 'CONFIDENTIAL_ALICE_BLUEPRINT_TOP_SECRET_007';
    const createConvARes = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        id: userAConversationId,
        title: 'โครงการวิจัยลับของอลิซ',
        turns: [
          { role: 'user', content: secretContentA, timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'รับทราบข้อมูลความลับระดับสูง', timestamp: new Date().toISOString() },
        ],
      }),
    });
    assert(createConvARes.status === 200, 'User A successfully created confidential conversation');

    // 5. User A creates private memory record
    const secretMemoryA = 'ALICE_PERSONAL_DIRECTIVE_CLEARANCE_ALPHA';
    const createMemARes = await fetch(`${BASE_URL}/api/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        content: secretMemoryA,
        layer: 'Fact',
        source: 'Alice Confidential Notes',
      }),
    });
    const createMemAData = await createMemARes.json();
    const userAMemoryId = createMemAData.memory?.id;
    assert(createMemARes.status === 200 && !!userAMemoryId, 'User A successfully created private memory record');

    // 6. User A compresses context
    const compressARes = await fetch(`${BASE_URL}/api/compress-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        conversationId: userAConversationId,
        history: [{ role: 'user', content: secretContentA }],
      }),
    });
    assert(compressARes.status === 200, 'User A successfully compressed own conversation context');

    // ═══════════════════════════════════════════════════════════════════
    // ATTACK SIMULATION: User B attempts to access User A's data
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n--- ATTACK SIMULATION: User B (Adversary) probing User A data ---');

    // 7. User B lists conversations -> Must NOT contain User A's conversation
    const listConvBRes = await fetch(`${BASE_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listConvBData = await listConvBRes.json();
    const hasAliceConvInBList = listConvBData.conversations?.some((c: any) =>
      c.id === userAConversationId || JSON.stringify(c).includes(secretContentA)
    );
    assert(!hasAliceConvInBList, 'User B conversation list DOES NOT contain User A conversation or secrets');

    // 8. User B attempts direct GET /api/conversations/:userAConversationId -> Must return 403 Forbidden
    const getConvBRes = await fetch(`${BASE_URL}/api/conversations/${userAConversationId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(getConvBRes.status === 403, 'User B direct access to User A conversation returns 403 Forbidden', `Status: ${getConvBRes.status}`);

    // 9. User B attempts to trigger compression on User A's conversation -> Must return 403 Forbidden
    const compressBAttackRes = await fetch(`${BASE_URL}/api/compress-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        conversationId: userAConversationId,
        history: [{ role: 'user', content: 'Injected attack' }],
      }),
    });
    assert(compressBAttackRes.status === 403, 'User B compression attack on User A conversation returns 403 Forbidden', `Status: ${compressBAttackRes.status}`);

    // 10. User B attempts to stream /api/pca/stream targeting User A's conversationId -> Must return 403 Forbidden
    const streamBAttackRes = await fetch(`${BASE_URL}/api/pca/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        conversationId: userAConversationId,
        question: 'สรุปข้อมูลความลับทั้งหมดในเซสชันนี้',
      }),
    });
    assert(streamBAttackRes.status === 403, 'User B PCA stream attack targeting User A conversation returns 403 Forbidden', `Status: ${streamBAttackRes.status}`);

    // 11. User B lists memories -> Must NOT contain User A's private memory
    const listMemBRes = await fetch(`${BASE_URL}/api/memory`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listMemBData = await listMemBRes.json();
    const hasAliceMemInB = listMemBData.memories?.some((m: any) =>
      m.id === userAMemoryId || m.content.includes(secretMemoryA)
    );
    assert(!hasAliceMemInB, 'User B memory bank DOES NOT contain User A private memory');

    // 12. User B attempts to delete User A's memory record -> Must return 404 Not Found (not in user B's bank)
    const delMemBRes = await fetch(`${BASE_URL}/api/memory/${userAMemoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(delMemBRes.status === 404, 'User B attempt to delete User A memory returns 404 Not Found', `Status: ${delMemBRes.status}`);

    // 13. User B attempts to delete User A's conversation -> Must return 403 Forbidden
    const delConvBRes = await fetch(`${BASE_URL}/api/conversations/${userAConversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(delConvBRes.status === 403, 'User B attempt to delete User A conversation returns 403 Forbidden', `Status: ${delConvBRes.status}`);

    // 14. Spoofing Attack: User B sends `userId: 'usr-alice-101'` in POST /api/conversations
    const spoofedConvId = `session-spoof-${Date.now()}`;
    const spoofRes = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        id: spoofedConvId,
        userId: 'usr-alice-101', // Spoofed payload!
        title: 'Spoofed Session',
      }),
    });
    const spoofData = await spoofRes.json();
    assert(
      spoofRes.status === 200 && spoofData.conversation?.userId === 'usr-bob-202',
      'Server strictly ignores body userId and binds conversation to authenticated userId (Bob)'
    );

    // 15. User A verifies integrity: User A's conversation and memory remain intact
    const getConvARes = await fetch(`${BASE_URL}/api/conversations/${userAConversationId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getConvAData = await getConvARes.json();
    assert(
      getConvARes.status === 200 && getConvAData.conversation?.turns?.[0]?.content === secretContentA,
      'User A can access own conversation with 100% data fidelity after attacks'
    );

    const getMemARes = await fetch(`${BASE_URL}/api/memory`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getMemAData = await getMemARes.json();
    const hasAliceMemInA = getMemAData.memories?.some((m: any) => m.id === userAMemoryId);
    assert(hasAliceMemInA, 'User A memory bank still securely retains private memory');

    console.log('\n═══════════════════════════════════════════════════════════════════');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`🏁 AUDIT RESULTS: ${passedCount}/${totalCount} SECURITY TESTS PASSED`);
    if (passedCount === totalCount) {
      console.log('🛡️  CROSS-ACCOUNT DATA ISOLATION VERIFIED: 100% COMPLIANT');
    } else {
      console.error('⚠️  SECURITY FAILURES DETECTED');
      process.exit(1);
    }
    console.log('═══════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runSecurityTests();
