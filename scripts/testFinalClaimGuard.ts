import assert from 'node:assert/strict';
import { checkFinalClaimRedFlags } from '../src/server/services/finalClaimGuard';
assert.equal(checkFinalClaimRedFlags('He won the Nobel Prize in AI').requiresReview, true);
assert.equal(checkFinalClaimRedFlags('There is no such Nobel Prize in AI').requiresReview, false);
console.log('claim guard tests passed');
