import assert from 'assert';
import { generateDecisionExecutionTrace, verifyDecisionExecutionTrace, computeStepEventHash } from '../src/utils/executionTraceEngine';
import { computeSha256Hex, verifyCryptographicAuditPackage } from '../src/utils/auditExport';

async function runAdversarialAuditTests() {
  console.log('=== RUNNING ADVERSARIAL CRYPTOGRAPHIC INTEGRITY TESTS ===\n');

  // Generate baseline realistic trace
  const userInput = 'ทดสอบการส่งเสริมการเกษตรยั่งยืนในประเทศไทย';
  const responseText = 'จากการวิเคราะห์หลักฐาน ข้อมูลระบุว่าเกษตรกรต้องการการสนับสนุนด้านแหล่งน้ำและเมล็ดพันธุ์';
  const trace = generateDecisionExecutionTrace(userInput, responseText, null);

  console.log(`Baseline Trace generated:
  - Execution ID: ${trace.execution_id}
  - Merkle Root: ${trace.provenance_hashes?.merkle_root_sha256}
  - Canonical Trace Hash: ${trace.provenance_hashes?.trace_canonical_sha256}
  - Total Steps: ${trace.steps.length}`);

  // Verification of untouched baseline
  const baselineVerification = verifyDecisionExecutionTrace(trace);
  assert.strictEqual(baselineVerification.overall_verified, true, 'Baseline trace must be cryptographically valid');
  assert.strictEqual(baselineVerification.tamper_detected, false, 'Baseline trace must have no tamper detected');
  assert.strictEqual(baselineVerification.checks.merkle_root_valid, true, 'Baseline Merkle root must be valid');
  assert.strictEqual(baselineVerification.checks.canonical_trace_hash_valid, true, 'Baseline canonical trace hash must be valid');
  assert.strictEqual(baselineVerification.checks.previous_hash_linkage_valid, true, 'Baseline forward chain linkage must be valid');
  console.log('✅ Baseline Verification Passed: 100% genuine cryptographic integrity.\n');

  // TEST 1: Adversarial Payload Tampering -> Hash must change and verification fail
  console.log('--- TEST 1: Adversarial Payload Tampering ---');
  const tamperedTrace1 = JSON.parse(JSON.stringify(trace));
  tamperedTrace1.steps[2].output_payload = {
    ...tamperedTrace1.steps[2].output_payload,
    injected_tamper: 'ADVERSARIAL_MODIFICATION_PAYLOAD'
  };
  
  const originalStepHash = trace.steps[2].event_hash;
  const recomputedStepHash = computeStepEventHash(tamperedTrace1.steps[2]);
  assert.notStrictEqual(originalStepHash, recomputedStepHash, 'Step hash must change when payload content changes');
  
  const v1 = verifyDecisionExecutionTrace(tamperedTrace1);
  assert.strictEqual(v1.overall_verified, false, 'Verification must fail when payload is tampered');
  assert.strictEqual(v1.tamper_detected, true, 'Tamper must be detected');
  assert.strictEqual(v1.checks.event_hashes_valid, false, 'Event hashes check must fail');
  assert(v1.tampered_step_indices.includes(2), 'Tampered step index 2 must be identified');
  console.log('✅ TEST 1 Passed: Payload tampering correctly caught by event hash recalculation.\n');

  // TEST 2: Adversarial Merkle Root Tampering
  console.log('--- TEST 2: Adversarial Merkle Root Tampering ---');
  const tamperedTrace2 = JSON.parse(JSON.stringify(trace));
  tamperedTrace2.provenance_hashes.merkle_root_sha256 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const v2 = verifyDecisionExecutionTrace(tamperedTrace2);
  assert.strictEqual(v2.overall_verified, false, 'Verification must fail on tampered Merkle root');
  assert.strictEqual(v2.checks.merkle_root_valid, false, 'Merkle root check must be false');
  assert.strictEqual(v2.tamper_detected, true, 'Tamper must be flagged');
  console.log('✅ TEST 2 Passed: Merkle root tampering detected and rejected.\n');

  // TEST 3: Adversarial Canonical Trace Hash Tampering
  console.log('--- TEST 3: Adversarial Canonical Trace Hash Tampering ---');
  const tamperedTrace3 = JSON.parse(JSON.stringify(trace));
  tamperedTrace3.provenance_hashes.trace_canonical_sha256 = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  const v3 = verifyDecisionExecutionTrace(tamperedTrace3);
  assert.strictEqual(v3.overall_verified, false, 'Verification must fail on tampered canonical trace hash');
  assert.strictEqual(v3.checks.canonical_trace_hash_valid, false, 'Canonical trace hash check must be false');
  assert.strictEqual(v3.tamper_detected, true, 'Tamper must be flagged');
  console.log('✅ TEST 3 Passed: Canonical trace hash tampering detected and rejected.\n');

  // TEST 4: Adversarial Chain Linkage Disruption
  console.log('--- TEST 4: Adversarial Chain Linkage Disruption ---');
  const tamperedTrace4 = JSON.parse(JSON.stringify(trace));
  tamperedTrace4.steps[5].previous_event_hash = 'baadf00dbaadf00dbaadf00dbaadf00dbaadf00dbaadf00dbaadf00dbaadf00d';
  const v4 = verifyDecisionExecutionTrace(tamperedTrace4);
  assert.strictEqual(v4.overall_verified, false, 'Verification must fail when previous hash link is altered');
  assert.strictEqual(v4.checks.previous_hash_linkage_valid, false, 'Linkage validity must be false');
  assert.strictEqual(v4.tamper_detected, true, 'Tamper must be flagged');
  console.log('✅ TEST 4 Passed: Broken previous hash linkage detected and rejected.\n');

  // TEST 5: Fake or Tampered Digital Signature
  console.log('--- TEST 5: Fake / Tampered Digital Signature ---');
  const rawHtml = '<html><body>Test Report</body></html>';
  const canonHash = await computeSha256Hex(rawHtml);
  const fakeAuditJson = JSON.stringify({
    audit_id: 'AUDIT-TEST-001',
    canonical_artifact_sha256: canonHash,
    signature_base64: 'INVALID_FORGED_SIGNATURE_BYTES_BASE64==',
    verification_key_pem: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefake12==\n-----END PUBLIC KEY-----',
    provenance_hashes: {
      raw_artifact_hash: canonHash,
      canonical_artifact_hash: canonHash,
      signed_manifest_hash: await computeSha256Hex('{}')
    }
  });

  const v5 = await verifyCryptographicAuditPackage(fakeAuditJson, '{}', rawHtml);
  assert.strictEqual(v5.signature_valid, false, 'Fake signature must be declared invalid');
  assert.strictEqual(v5.SIGNATURE_VALID, false, 'SIGNATURE_VALID must be false');
  assert.strictEqual(v5.OVERALL_VERIFIED, false, 'Overall verified must be false');
  assert.strictEqual(v5.cryptographic_integrity, 'FAIL', 'Cryptographic integrity must fail');
  console.log('✅ TEST 5 Passed: Fake / tampered digital signature rejected.\n');

  // TEST 6: Unconfigured WORM Anchor Status Reporting
  console.log('--- TEST 6: Non-WORM Accurate Reporting (No Mocked Valid Anchor) ---');
  assert.strictEqual(v5.WORM_ANCHOR_VALID, false, 'WORM anchor must NOT be reported as valid when unconfigured');
  assert.strictEqual(v5.worm_chain_valid, false, 'worm_chain_valid must be false');
  assert(!v5.details.includes('COMMITTED_TO_WORM_LEDGER'), 'Must not claim COMMITTED_TO_WORM_LEDGER without hardware anchor');
  console.log('✅ TEST 6 Passed: System reports unanchored status honestly without faking WORM validity.\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 ADVERSARIAL INTEGRITY REGRESSION TESTS PASSED!');
  console.log('====================================================');
}

runAdversarialAuditTests().catch(err => {
  console.error('❌ Adversarial test failed:', err);
  process.exit(1);
});
