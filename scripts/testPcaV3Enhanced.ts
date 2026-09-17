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

console.log('--- ALL PCA v3.0 ENHANCEMENT TESTS PASSED ---');
