import * as legacy from './evidenceGovernanceLegacy';
import { buildGovernedDynamicACH } from '../../utils/governedDynamicACH';

// Re-export legacy governance utilities explicitly so the legacy buildDynamicACH
// symbol cannot collide with the canonical production ACH authority.
export {
  computeRelevanceToQuestion,
  validateAndClassifyClaims,
  calculateStrictCalibratedConfidence,
  buildEvidenceClaimMapping,
  evaluateInternalConsistency,
  buildMissingInformationRegistry,
  buildRiskArchitecture,
  buildDecisionAlternatives,
  buildPCAStageContracts,
  buildDynamicExecutiveDossier,
  evaluateStrictGovernancePolicies,
  evaluateResponseCentricGovernance,
  repairResponseText,
  runGovernanceBehavioralTests,
} from './evidenceGovernanceLegacy';

export type {
  ClaimCategory,
  EvidenceStatus,
  ClassifiedClaim,
  ClaimValidationResult,
  CalibratedConfidenceResult,
  DynamicACHResult,
  GovernanceDecisionState,
  GovernanceEvaluationResult,
  BehavioralTestResult,
} from './evidenceGovernanceLegacy';

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

// Legacy ACH/Bayesian utilities remain available only under the explicit
// namespace for migration, compatibility and regression comparison.
export { legacy };
