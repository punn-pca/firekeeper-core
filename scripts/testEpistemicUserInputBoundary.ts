import assert from 'node:assert/strict';
import { PCA_CORE_INVARIANTS, PCA_EPISTEMIC_TAXONOMY_RULES } from '../src/server/services/pcaGovernance';
import { buildGovernedPromptPackage } from '../src/server/services/governedPrompt';

const prompt = buildGovernedPromptPackage({
  question: 'ผมมีเงินเก็บ 50,000 บาท ไม่มีหนี้ และไม่ชอบงานที่ทำอยู่ ผมควรลาออกวันนี้เลยไหม',
  activationPlan: { epistemicLabeling: 'REQUIRED' } as any,
}).external_ai_prompt;

// Regression: user-stated context must not be downgraded merely because
// no external evidence is available.
assert.match(PCA_CORE_INVARIANTS, /USER_STATED/);
assert.match(PCA_CORE_INVARIANTS, /Do not downgrade it to UNVERIFIED merely because no external source exists/);
assert.match(PCA_EPISTEMIC_TAXONOMY_RULES, /\[FACT\].*explicitly provided by the user/);
assert.match(prompt, /Do not label a user's statement \[UNVERIFIED\] solely because it lacks external evidence/);

// Regression: missing decision parameters must not be invented.
assert.match(prompt, /Never invent missing numeric values, expenses, time periods, thresholds/);

// Regression: external verification remains distinct from user-stated context.
assert.match(prompt, /User-stated context is not the same thing as external evidence/);

console.log('epistemic user-input provenance regression checks passed');
