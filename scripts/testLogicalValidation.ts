import assert from 'node:assert/strict';
import { validateFormalArgument } from '../src/utils/logicalValidation';
import { buildRealDecisionExecutionTrace } from '../src/utils/executionTraceEngine';

// Modus ponens: valid form, but premise truth is not established.
const validUndetermined = validateFormalArgument({
  premises: ['P -> Q', 'P'],
  conclusion: 'Q'
});
assert.equal(validUndetermined.validity, 'VALID');
assert.equal(validUndetermined.soundness, 'UNDETERMINED');
assert.equal(validUndetermined.counterexample, null);

// Same valid form with independently established true premises is sound.
const sound = validateFormalArgument({
  premises: ['P -> Q', 'P'],
  conclusion: 'Q',
  premiseTruth: ['TRUE', 'TRUE']
});
assert.equal(sound.validity, 'VALID');
assert.equal(sound.soundness, 'SOUND');

// Affirming the consequent is invalid; the returned assignment is a counterexample.
const invalid = validateFormalArgument({
  premises: ['P -> Q', 'Q'],
  conclusion: 'P'
});
assert.equal(invalid.validity, 'INVALID');
assert.equal(invalid.soundness, 'UNSOUND');
assert.ok(invalid.counterexample);
assert.equal(invalid.counterexample.P, false);
assert.equal(invalid.counterexample.Q, true);

// A formally valid argument with a false premise is not sound.
const falsePremise = validateFormalArgument({
  premises: ['P -> Q', 'P'],
  conclusion: 'Q',
  premiseTruth: ['TRUE', 'FALSE']
});
assert.equal(falsePremise.validity, 'VALID');
assert.equal(falsePremise.soundness, 'UNSOUND');

// Invalid natural-language input is explicitly not assessed, never guessed.
const unsupported = validateFormalArgument({
  premises: ['ถ้าฝนตก ถนนเปียก'],
  conclusion: 'ถนนเปียก'
});
assert.equal(unsupported.validity, 'NOT_ASSESSED');
assert.equal(unsupported.soundness, 'NOT_ASSESSED');


const trace = buildRealDecisionExecutionTrace({
  userInput: 'ตรวจสอบความแตกต่างระหว่างเหตุผลกับหลักฐาน',
  assistantOutput: 'คำตอบตัวอย่าง',
  startTimeIso: '2026-11-27T04:00:00.000Z',
  endTimeIso: '2026-11-27T04:00:10.000Z',
  totalDurationMs: 10123,
  pcaState: {
    llm_model: 'test-model',
    llm_provider: 'test-provider',
    start_time: '2026-11-27T04:00:00.000Z',
    end_time: '2026-11-27T04:00:10.000Z',
    execution_time_ms: 10123,
    trace: [],
    constraints: [],
    evidence_explorer: [{
      id: 'search-unavailable',
      source: 'UNAVAILABLE',
      content: 'ไม่สามารถดึงหลักฐานจากแหล่งข้อมูลภายนอกได้'
    }],
    hypotheses: [],
    hypotheses_v2: [],
    sources_used: [],
    memories: [],
    confidence: 'UNKNOWN',
    logical_argument_extraction: {
      status: 'EXTRACTED',
      premises: [{ id: 'P1', text: 'A implies B', source_quote: 'A implies B', kind: 'CONDITIONAL', truth_status: 'UNKNOWN' }],
      inference_steps: [{ from_premise_ids: ['P1'], rule: 'Example', conclusion: 'B', source_quote: 'therefore B' }],
      conclusion: { text: 'B', source_quote: 'therefore B' },
      formalization: null,
      limitations: ['Formalization requires review.']
    }
  } as any
});
assert.equal(trace.evidence_lineage.length, 0, 'Unavailable retrieval sentinels must not be emitted as evidence.');
assert.equal(trace.version_manifest.unverified_items, 0);
assert.equal(trace.bayesian_proof?.probability_status, 'NOT_APPLICABLE');
assert.equal(trace.bayesian_proof?.prior, null, 'No hypothesis must not emit a synthetic prior.');
assert.equal(trace.bayesian_proof?.bayes_factor, null, 'No hypothesis must not emit a synthetic Bayes factor.');
assert.equal(trace.steps.length, 12, 'The canonical 12 PCA stages must remain intact.');
assert.equal(trace.steps[9].input_ref, 'event_009_decision');
assert.equal(trace.steps[9].input_payload.event_chain_head, 'event_009_decision');
assert.equal(trace.steps[8].input_payload.bayesian_verdict, 'NOT_APPLICABLE');
assert.equal(trace.summary_metrics.requirement_status, 'NOT_APPLICABLE');
assert.equal(trace.logical_validation?.validity, 'NOT_ASSESSED');
assert.equal(trace.logical_argument_extraction?.status, 'EXTRACTED');
assert.equal(trace.steps[4].output_payload.extraction_status, 'EXTRACTED');
assert.equal(trace.steps[4].output_payload.premise_count, 1);
assert.equal(trace.completed_at, '2026-11-27T04:00:10.000Z');
assert.equal(trace.steps[11].completed_at, trace.completed_at, 'Final stage must not exceed execution completion time.');
assert.equal(trace.total_duration_ms, 10000, 'Canonical timestamps must determine elapsed duration.');

console.log('Logical validity and soundness tests passed.');
