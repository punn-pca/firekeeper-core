import { EvidenceItem, PCAState } from '../src/types';
import { evaluateDecisionRelevance, performCounterfactualAudit } from '../src/server/services/pcaEpistemicAnalysis';

console.log('--- Testing PCA v3.0 Enhanced Epistemic Analysis ---');

const mockEvidence: EvidenceItem = {
  id: 'e1',
  source: 'Official Manual',
  content: 'The system must be turned off before maintenance.',
  credibilityScore: 95,
  strength: 'High',
  type: 'Empirical'
};

// Test 1: Decision Relevance
const query = 'How to perform maintenance safely?';
const relevance = evaluateDecisionRelevance(query, mockEvidence);
console.log(`[TEST 1] Relevance: ${relevance}`);
if (relevance !== 'CRITICAL') throw new Error('Expected CRITICAL relevance');

// Test 2: Counterfactual Audit
const enriched: EvidenceItem = {
  ...mockEvidence,
  relevance: 'CRITICAL'
};
const impact = performCounterfactualAudit(enriched);
console.log(`[TEST 2] Counterfactual Impact: ${impact}`);
if (impact !== 'DECISION_CRITICAL') throw new Error('Expected DECISION_CRITICAL impact');

// Test 3: PCAState compatibility
const state: PCAState = {
  question: 'Should I invest?',
  user_input: 'Should I invest?',
  context: ['Market is volatile'],
  language: 'en',
  observations: [],
  understanding: '',
  purpose: '',
  constraints: [],
  memories: [],
  hypotheses: [],
  evidence: [],
  evidenceItems: [mockEvidence],
  critique: [],
  uncertainty: [],
  decision: '',
  response: '',
  reflection: [],
  learning: [],
  agency_checks: [],
  notes: [],
  confidence: 'HIGH',
  conflicts: [],
  missing_info: [],
  trace: [],
  llm_provider: 'gemini',
  llm_model: 'gemini-1.5-pro',
  execution_time_ms: 100,
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString()
};

console.log(`[TEST 3] PCAState: ${state.question} (Evidence count: ${state.evidenceItems?.length})`);
if (state.question !== 'Should I invest?') throw new Error('Expected PCAState field mapping');

// A brevity instruction must not bypass consequential PCA review.
const { calculateRuntimeResponseDepth } = await import('../src/server/services/pcaRuntimeController');
for (const question of [
  'ตอบสั้นๆ ฉันควรลงทุนจำนวนมากในสินทรัพย์นี้หรือไม่',
  'brief: should I proceed with this emergency medical diagnosis?',
  'brief: what are symptoms of an overdose?',
  'brief: transfer funds to the supplier',
  'ตอบสั้นๆ ควรโอนเงินหรือไม่'
]) {
  const route = calculateRuntimeResponseDepth(question);
  if (route.depth === 'L0_DIRECT' || route.depth === 'L1_ANALYTICAL') {
    throw new Error('Consequential request incorrectly downgraded: ' + question);
  }
}
const conflictRoute = calculateRuntimeResponseDepth('ตอบสั้นๆ ควรอนุมัติการจ่ายเงินหรือไม่', { hasConflicts: true });
if (conflictRoute.depth === 'L0_DIRECT' || conflictRoute.depth === 'L1_ANALYTICAL') {
  throw new Error('Conflicted consequential decision must receive structured review');
}
const greetingRoute = calculateRuntimeResponseDepth('สวัสดี', { intent: 'GREETING' });
if (greetingRoute.depth !== 'L0_DIRECT') throw new Error('Greeting should remain direct');
console.log('[TEST 4] Consequential brevity guard and greeting regression passed');

console.log('--- ALL PCA v3.0 ENHANCEMENT TESTS PASSED ---');
