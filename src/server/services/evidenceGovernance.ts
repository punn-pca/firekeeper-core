import * as legacy from './evidenceGovernanceLegacy';
import { buildGovernedDynamicACH } from '../../utils/governedDynamicACH';

export * from './evidenceGovernanceLegacy';

/** Production Dynamic ACH is governed: source credibility never becomes P(E|H). */
export const buildDynamicACH = buildGovernedDynamicACH;

// Keep the legacy implementation available for migration/debugging without using it in production.
export { legacy };
