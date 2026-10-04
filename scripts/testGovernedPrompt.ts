import assert from 'assert';
import { buildGovernedPromptPackage } from '../src/server/services/governedPrompt';

console.log('Starting Governed Prompt Mode Tests...');

const pkg = buildGovernedPromptPackage({
  question: 'เปรียบเทียบผู้ให้บริการ A กับ B เพื่อเลือกสำหรับระบบ production',
  objective: 'Support a transparent vendor decision without making the decision for the user.',
  evidence: [
    {
      id: 'E-001',
      claim: 'Provider A reports 99.9% availability.',
      source: 'Provider A status documentation',
      credibility: 0.95,
      status: 'VERIFIED'
    }
  ],
  claims: [{ id: 'C-001', type: 'EVIDENCE', text: 'Provider A reports 99.9% availability.' }],
  risks: [{ id: 'R-001', type: 'DECISION_GAP', text: 'No independent cost comparison is available.' }]
});

assert.strictEqual(pkg.mode, 'GOVERNED_PROMPT');
assert.strictEqual(pkg.query.type, 'comparative_analysis', 'Comparison wording should remain comparative analysis unless the user explicitly asks the system to make the choice');
assert.strictEqual(pkg.evidence[0].status, 'VERIFIED');
assert.strictEqual(pkg.constraints.anti_fabrication, true);
assert.strictEqual(pkg.constraints.evidence_grounding, true);
assert.strictEqual(pkg.constraints.uncertainty_disclosure, true);
assert.strictEqual(pkg.constraints.human_agency_preservation, true);
assert.strictEqual(pkg.reasoning_policy.do_not_promote_unverified_claims, true);
assert.strictEqual(pkg.output_policy.preserve_human_decision_authority, true);
assert.strictEqual(pkg.audit.traceable, true);
assert.strictEqual(pkg.audit.package_version, '1.2');
assert(!pkg.external_ai_prompt.includes('USER QUERY:'), 'Runtime user query must not be duplicated into the system prompt');
assert(!pkg.external_ai_prompt.includes('GOVERNED EVIDENCE:'), 'Generic runtime evidence must not be duplicated into the system prompt');
assert(pkg.external_ai_prompt.includes('Do not fabricate missing evidence.'));

const emptyPkg = buildGovernedPromptPackage({ question: 'What is the current status?' });
assert.deepStrictEqual(emptyPkg.evidence, []);
assert.deepStrictEqual(emptyPkg.claims, []);
assert.deepStrictEqual(emptyPkg.risks, []);

console.log('All Governed Prompt Mode tests passed!');

{
  const publicationExcerpt = 'พระเจ้าและ Free Will — ในกรอบนี้ Free Will ของมนุษย์มีอยู่จริง ไม่ใช่ภาพลวงตา เพราะพระเจ้าทรงเลือกที่จะให้มีมัน';
  const pkg = buildGovernedPromptPackage({
    question: 'Sacred Flame มองเสรีภาพของมนุษย์ยังไง?',
    evidence: [{
      id: 'pub-sacred-flame-free-will',
      claim: publicationExcerpt.slice(0, 80),
      content: publicationExcerpt,
      source: 'Sacred Flame — พระเจ้าและ Free Will',
      credibility: 1,
      status: 'VERIFIED',
      url: '/firekeeper_publication/Firekeeper_Sacred_Flame.html'
    }]
  });
  assert.equal(pkg.audit.evidence_retrieved, true);
  assert.equal(pkg.audit.evidence_count, 1);
  assert.ok(!pkg.external_ai_prompt.includes(publicationExcerpt), 'Runtime publication evidence must not be duplicated into the system prompt');
  assert.ok(!pkg.external_ai_prompt.includes('CANONICAL PUBLICATION EVIDENCE:'), 'System prompt must remain governance-only');
  assert.equal(pkg.evidence[0].content, publicationExcerpt, 'Publication evidence remains available to the runtime context layer');
}


{
  const directPkg = buildGovernedPromptPackage({
    question: 'What is the current status?',
    depth: 'L0_DIRECT',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'OPTIONAL',
      competingHypotheses: 'NOT_REQUIRED',
      decisionRelevance: 'OPTIONAL',
      counterfactualAudit: 'NOT_REQUIRED',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'NOT_REQUIRED',
      reasoning: {}
    }
  });
  assert.ok(!directPkg.external_ai_prompt.includes('ACH / EPISTEMIC REASONING OPERATING GUIDANCE'), 'L0 prompt must not carry full ACH operating guidance');

  const decisionPkg = buildGovernedPromptPackage({
    question: 'Should we choose A or B?',
    depth: 'L2_STRUCTURED',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'REQUIRED',
      competingHypotheses: 'REQUIRED',
      decisionRelevance: 'REQUIRED',
      counterfactualAudit: 'REQUIRED',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'REQUIRED',
      reasoning: {}
    }
  });
  assert.ok(decisionPkg.external_ai_prompt.includes('ACH / EPISTEMIC REASONING OPERATING GUIDANCE'), 'Decision prompt must retain ACH guidance when activated');
}


{
  const analyticalPkg = buildGovernedPromptPackage({
    question: 'ทำไมร้านอาหารที่ลูกค้าเยอะอาจยังขาดทุน วิเคราะห์สาเหตุและข้อมูลที่ควรตรวจสอบ',
    depth: 'L2_STRUCTURED',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'OPTIONAL',
      competingHypotheses: 'REQUIRED',
      decisionRelevance: 'OPTIONAL',
      counterfactualAudit: 'OPTIONAL',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'REQUIRED',
      reasoning: {}
    }
  });
  assert.ok(analyticalPkg.external_ai_prompt.includes('Prevalence or frequency claims such as'), 'Prompt must guard unsupported prevalence language');
  assert.ok(analyticalPkg.external_ai_prompt.includes('Avoid unsupported comparative or superlative claims'), 'Prompt must guard unsupported comparative language');
  assert.ok(analyticalPkg.external_ai_prompt.includes('do not append visible slogans or boilerplate'), 'Human Agency must remain internal for ordinary analytical answers');
  assert.ok(analyticalPkg.external_ai_prompt.includes('Preserve the boundary internally'), 'Human Agency boundary itself must remain preserved');
}


{
  const restaurantPkg = buildGovernedPromptPackage({
    question: 'ทำไมร้านอาหารที่มีลูกค้าเยอะตลอด อาจยังขาดทุนได้ ทั้งที่ยอดขายเพิ่มขึ้นทุกเดือน? วิเคราะห์สาเหตุที่เป็นไปได้ แยกข้อเท็จจริง สมมติฐาน และข้อมูลที่ควรตรวจสอบเพิ่มเติมก่อนสรุป'
  });
  assert.strictEqual(restaurantPkg.query.type, 'causal_analysis', 'Restaurant diagnostic question with "ควรตรวจสอบ" must remain causal analysis');
}


{
  const financeDiagnosticPkg = buildGovernedPromptPackage({
    question: 'วิเคราะห์ว่าทำไมธุรกิจยอดขายโตแต่ยังขาดทุน และข้อมูลใดควรตรวจสอบ',
    depth: 'L2_STRUCTURED',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'OPTIONAL',
      competingHypotheses: 'REQUIRED',
      decisionRelevance: 'OPTIONAL',
      counterfactualAudit: 'OPTIONAL',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'REQUIRED',
      reasoning: {}
    }
  });
  assert.ok(financeDiagnosticPkg.external_ai_prompt.includes('fixed costs / contribution margin ratio yields break-even sales revenue'), 'ACH guidance must preserve formula dimensional meaning');
  assert.ok(financeDiagnosticPkg.external_ai_prompt.includes('does not by itself establish that capex or debt is the cause'), 'ACH guidance must prevent cash-flow causal leaps');
}


{
  const factualAdaptive = buildGovernedPromptPackage({
    question: 'ทำไมแมวนอนเยอะ?',
    depth: 'L0_DIRECT',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'OPTIONAL',
      competingHypotheses: 'NOT_REQUIRED',
      decisionRelevance: 'OPTIONAL',
      counterfactualAudit: 'NOT_REQUIRED',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'NOT_REQUIRED',
      reasoning: {}
    }
  });
  assert.strictEqual(factualAdaptive.query.type, 'causal_analysis');
  assert.ok(factualAdaptive.external_ai_prompt.includes('EPISTEMIC LANGUAGE (ANALYTICAL MODE)'), 'Causal analysis should retain proportional epistemic discipline');
  assert.ok(factualAdaptive.external_ai_prompt.includes('No explicit choice or action decision was requested'), 'Causal analysis must not activate decision controls');

  const directAdaptive = buildGovernedPromptPackage({
    question: 'แมวเป็นสัตว์เลี้ยงลูกด้วยนมหรือไม่?',
    depth: 'L0_DIRECT',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'OPTIONAL',
      competingHypotheses: 'NOT_REQUIRED',
      decisionRelevance: 'OPTIONAL',
      counterfactualAudit: 'NOT_REQUIRED',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'NOT_REQUIRED',
      reasoning: {}
    }
  });
  assert.strictEqual(directAdaptive.query.type, 'factual');
  assert.ok(directAdaptive.external_ai_prompt.includes('EPISTEMIC LANGUAGE (DIRECT MODE)'), 'Routine factual questions should use lightweight epistemic language');
  assert.ok(!directAdaptive.external_ai_prompt.includes('Prevalence or frequency claims such as'), 'Direct factual mode must not receive analytical prevalence boilerplate');

  const explicitDecisionAdaptive = buildGovernedPromptPackage({
    question: 'ควรเลือก A หรือ B?',
    depth: 'L2_STRUCTURED',
    activationPlan: {
      temporalGrounding: 'NOT_REQUIRED',
      evidenceGrounding: 'REQUIRED',
      competingHypotheses: 'REQUIRED',
      decisionRelevance: 'REQUIRED',
      counterfactualAudit: 'REQUIRED',
      deterministicValidation: 'REQUIRED',
      epistemicLabeling: 'REQUIRED',
      reasoning: {}
    }
  });
  assert.strictEqual(explicitDecisionAdaptive.query.type, 'decision_support');
  assert.ok(explicitDecisionAdaptive.external_ai_prompt.includes('DECISION CONTROL: The user is asking for a choice'), 'Explicit decisions must retain decision-specific controls');
}
