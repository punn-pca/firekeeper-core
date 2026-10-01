import * as legacy from './evidenceGovernanceLegacy';
import { buildGovernedDynamicACH } from '../../utils/governedDynamicACH';

export * from './evidenceGovernanceLegacy';

/**
 * Canonical production ACH entry point.
 *
 * Diagnostic hypothesis generation is Core. Quantitative Bayesian movement is
 * optional and remains quarantined unless explicit probability provenance is
 * admissible. Source credibility, verification status, and SUPPORTS relations
 * never become P(E|H).
 */
export const buildDynamicACH = buildGovernedDynamicACH;
export const buildProductionACH = buildGovernedDynamicACH;

// Legacy ACH/Bayesian utilities remain available only for migration,
// compatibility and regression comparison. Production callers must use the
// canonical governed entry point above.
export { legacy };
