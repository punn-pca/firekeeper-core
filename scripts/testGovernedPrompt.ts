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
assert.strictEqual(pkg.query.type, 'decision_support');
assert.strictEqual(pkg.evidence[0].status, 'VERIFIED');
assert.strictEqual(pkg.constraints.anti_fabrication, true);
assert.strictEqual(pkg.constraints.evidence_grounding, true);
assert.strictEqual(pkg.constraints.uncertainty_disclosure, true);
assert.strictEqual(pkg.constraints.human_agency_preservation, true);
assert.strictEqual(pkg.reasoning_policy.do_not_promote_unverified_claims, true);
assert.strictEqual(pkg.output_policy.preserve_human_decision_authority, true);
assert.strictEqual(pkg.audit.traceable, true);
assert.strictEqual(pkg.audit.package_version, '1.1');
assert(pkg.external_ai_prompt.includes('USER QUERY:'));
assert(pkg.external_ai_prompt.includes('GOVERNED EVIDENCE:'));
assert(pkg.external_ai_prompt.includes('Do not fabricate missing evidence.'));

const emptyPkg = buildGovernedPromptPackage({ question: 'What is the current status?' });
assert.deepStrictEqual(emptyPkg.evidence, []);
assert.deepStrictEqual(emptyPkg.claims, []);
assert.deepStrictEqual(emptyPkg.risks, []);

console.log('All Governed Prompt Mode tests passed!');
