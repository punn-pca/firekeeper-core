import assert from 'node:assert/strict';
import { assessGovernanceHandoff, prepareGovernanceHandoff } from '../src/utils/governanceHandoff';
assert.equal(assessGovernanceHandoff({}).recommended, false);
assert.deepEqual(assessGovernanceHandoff({ highImpact: true, insufficientEvidence: true }).reasons, ['HIGH_IMPACT','UNCERTAIN_EVIDENCE']);
const context = {question:'ลงทุนอะไรดี',userFacts:['มีเงิน 300000 บาท'],userGoals:['รายได้เสริม'],unknowns:['ทำเล'],assistantSuggestions:['เครื่องซักผ้าหยอดเหรียญ'],reason:['HIGH_IMPACT' as const]};
assert.equal(prepareGovernanceHandoff(context, false), null);
assert.deepEqual(prepareGovernanceHandoff(context, true)?.unknowns, ['ทำเล']);
console.log('Governance handoff advisory tests passed');
