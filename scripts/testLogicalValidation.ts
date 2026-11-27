import assert from 'node:assert/strict';
import { validateFormalArgument } from '../src/utils/logicalValidation';

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

console.log('Logical validity and soundness tests passed.');
