import assert from 'node:assert/strict';
import fs from 'node:fs';

const serverSource = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

assert.match(
  serverSource,
  /layer:\s*layer\s*\|\|\s*['"]Context['"]/,
  'New memory records must default to Context, not Fact'
);
assert.match(
  serverSource,
  /confidence:\s*typeof confidence === ['"]number['"] \? confidence : 0/,
  'New memory records must not receive synthetic epistemic confidence by default'
);
assert.doesNotMatch(
  serverSource,
  /layer:\s*layer\s*\|\|\s*['"]Fact['"]/,
  'Memory storage metadata must not promote user context to Fact by default'
);
assert.match(
  serverSource,
  /Memory is contextual input, never empirical evidence/,
  'Prompt boundary must explicitly keep memory outside empirical evidence'
);
assert.match(
  serverSource,
  /policy:\s*['"]RELEVANCE_FILTERED_CONTEXT_ONLY['"]/,
  'Runtime audit must identify memory as context-only'
);

console.log('Memory context boundary checks passed.');
