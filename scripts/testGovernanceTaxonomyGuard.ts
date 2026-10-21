import assert from 'node:assert/strict';
import { ensureGovernanceTaxonomyPresence } from '../src/server/services/governanceTaxonomyGuard';

assert.equal(ensureGovernanceTaxonomyPresence(''), '');
assert.equal(ensureGovernanceTaxonomyPresence('   '), '   ');
assert.equal(
  ensureGovernanceTaxonomyPresence('A response without taxonomy labels.'),
  '[UNVERIFIED]\n\nA response without taxonomy labels.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('[FACT] This is supported.'),
  '[FACT] This is supported.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('**[EVIDENCE]** A cited passage supports this.'),
  '**[EVIDENCE]** A cited passage supports this.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('```text\n[FACT] sample only\n```\nA response without labels.'),
  '[UNVERIFIED]\n\n```text\n[FACT] sample only\n```\nA response without labels.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('This is an [UNKNOWN] limitation.'),
  'This is an [UNKNOWN] limitation.',
);

console.log('Governance taxonomy guard tests passed.');
