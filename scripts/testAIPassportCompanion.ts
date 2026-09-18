import assert from 'node:assert/strict';
import { buildAIPassportCompanionPackage } from '../src/server/services/aiPassportCompanion';

const pkg = buildAIPassportCompanionPackage({
  question: 'ควรเลือกแนวทาง A หรือ B หรือไม่?',
  provider: 'gemini',
});

assert.equal(pkg.mode, 'AI_PASSPORT_COMPANION');
assert.equal(pkg.integration, 'USER_MEDIATED');
assert.equal(pkg.provider, 'gemini');
assert.equal(pkg.constraints.no_aipass_api_access, true);
assert.equal(pkg.constraints.no_aipass_automation, true);
assert.equal(pkg.constraints.preserve_human_agency, true);
assert.match(pkg.governed_prompt, /FIREKEEPER GOVERNANCE PACKAGE|Firekeeper governance package/i);
assert.match(pkg.governed_prompt, /ควรเลือกแนวทาง A หรือ B/);
assert.deepEqual(pkg.workflow, [
  'GENERATE_PROMPT',
  'USER_SUBMITS_TO_AI_PROVIDER',
  'USER_PASTES_RESPONSE',
  'FIREKEEPER_VERIFIES',
  'HUMAN_DECIDES'
]);

console.log('AI Passport Companion checks passed.');
