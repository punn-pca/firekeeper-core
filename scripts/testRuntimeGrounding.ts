import assert from 'node:assert/strict';
import { buildRuntimeGrounding } from '../src/server/services/runtimeGrounding';

const grounding = buildRuntimeGrounding(new Date('2026-10-09T04:00:00.000Z'));
assert.match(grounding, /CURRENT_DATE_UTC: 2026-10-09/);
assert.match(grounding, /CURRENT_TIMESTAMP_UTC: 2026-10-09T04:00:00.000Z/);
assert.match(grounding, /Hypothetical numbers may be used/);
assert.match(grounding, /Check all factual assertions/);
assert.match(grounding, /Do not invent award categories/);
assert.throws(() => buildRuntimeGrounding(new Date('invalid')), /Invalid runtime date/);
console.log('runtime grounding regression checks passed');
