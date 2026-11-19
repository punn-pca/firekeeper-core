import assert from 'node:assert/strict';
import { classifyInquiry } from '../src/server/services/inquiryClassifier';
import { buildGovernedPromptPackage } from '../src/server/services/governedPrompt';
import { buildDynamicACH } from '../src/server/services/evidenceGovernance';
import { buildRealDecisionExecutionTrace } from '../src/utils/executionTraceEngine';

const question = 'หากระบบปัญญาสามารถสร้างแบบจำลองความจริงที่อธิบายและทำนายปรากฏการณ์ได้อย่างสมบูรณ์ แต่ไม่มีทางพิสูจน์ได้ว่าแบบจำลองนั้นตรงกับความจริงที่มีอยู่โดยไม่ขึ้นกับแบบจำลอง แล้วระบบนั้นกำลังค้นพบความจริง หรือเพียงสร้างระบบที่สอดคล้องกับประสบการณ์ของมันเอง?';
const inquiry = classifyInquiry(question);
assert.equal(inquiry.type, 'HYPOTHETICAL');
assert.equal(inquiry.reasoningMode, 'DIALECTICAL');
assert.equal(inquiry.evidenceRequiredForInitialReasoning, false);
assert.equal(inquiry.competingPositionsRequired, true);

const prompt = buildGovernedPromptPackage({ question }).external_ai_prompt;
assert.match(prompt, /INQUIRY MODE: HYPOTHETICAL \/ DIALECTICAL/);
assert.match(prompt, /Do not require external Evidence IDs to explain concepts/);
assert.match(prompt, /Present at least two materially different positions/);

const ach = buildDynamicACH(question, [], [], [], 0, inquiry.type);
assert.ok(ach.hypotheses.length >= 2, 'Philosophical inquiry must produce competing positions without external evidence');
assert.ok(ach.hypotheses.some(h => /Realist position/.test(h.claim)));
assert.ok(ach.hypotheses.some(h => /Instrumentalist position/.test(h.claim)));
assert.ok(ach.hypotheses.every(h => h.posterior === null), 'No Bayesian posterior may be fabricated without probability provenance');
assert.ok(ach.hypotheses.every(h => h.evidenceIds.length === 0), 'No evidence IDs may be invented');

const trace = buildRealDecisionExecutionTrace({
  userInput: question,
  assistantOutput: 'เปรียบเทียบสองจุดยืนทางปรัชญา',
  pcaState: { hypotheses_v2: ach.hypotheses, evidence_explorer: [], hypotheses: [] } as any,
});
const review = trace.steps.find(step => step.stage_key === 'META_REFLECTION');
assert.ok(review);
assert.ok(!(review.output_payload.semantic_issues as string[]).includes('NO_VERIFIED_EVIDENCE'));
assert.ok(!(trace.claim_evidence_matrix || []).some(claim => claim.category === 'USER_QUERY'), 'A hypothetical question must not be represented as a factual user claim');
assert.ok((trace.claim_evidence_matrix || []).every(claim => claim.category === 'HYPOTHESIS'), 'Only generated competing positions belong in the philosophical claim matrix');

const factual = classifyInquiry('วันนี้ธนาคารแห่งประเทศไทยประกาศอัตราดอกเบี้ยเท่าไร');
assert.equal(factual.evidenceRequiredForInitialReasoning, true);
assert.equal(factual.reasoningMode, 'EVIDENCE_BASED');
const choose = classifyInquiry('Should we choose A or B?');
assert.notEqual(choose.reasoningMode, 'NORMATIVE_ANALYSIS', 'A direct choice request must remain eligible for decision-support routing');

console.log('PASS: philosophical/hypothetical inquiry classification, dialectical ACH, prompt, and trace boundaries');
