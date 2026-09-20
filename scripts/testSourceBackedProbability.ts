import { calculateExactBayesianPosterior, calculateSourceBackedBayesianPosterior, computeDeterministicACH } from '../src/utils/bayesianEngine';
import { calculateROI, calculateRunway, calculateBreakEvenUnits } from '../src/utils/quantitativeDecisionModels';

const uncalibrated = calculateExactBayesianPosterior(0.5, 0.65, 0.35);
if (uncalibrated.probability_status !== 'UNCALIBRATED') throw new Error('Uncalibrated probability was not quarantined');
if (uncalibrated.likelihood_h !== 0.5 || uncalibrated.likelihood_not_h !== 0.5) throw new Error('Synthetic likelihood was allowed to update posterior');
if (uncalibrated.posterior !== 0.5) throw new Error('Neutral evidence should preserve the prior');

const backed = calculateSourceBackedBayesianPosterior(0.5, 0.8, 0.2, {
  sourceEvidenceIds: ['ev-1', 'ev-2'],
  method: 'EMPIRICAL_RATE',
  sampleSize: 200,
  calibrationDataset: 'historical-test-set-v1',
  calibrationDate: '2026-09-05',
  likelihoodSource: 'historical contingency table'
});
if (backed.probability_status !== 'SOURCE_BACKED') throw new Error('Source-backed probability not recognized');
if (backed.posterior <= backed.prior) throw new Error('Source-backed likelihood did not update posterior');

// Regression guard: a declared provenance method is not sufficient when its
// role-specific validation requirements fail. These cases must remain neutral.
const calibratedWithoutEvidence = calculateExactBayesianPosterior(0.5, 0.9, 0.1, {
  sourceEvidenceIds: [],
  method: 'CALIBRATED_MODEL',
  calibrationDataset: 'claimed-model-v1'
});
if (calibratedWithoutEvidence.likelihood_h !== 0.5 || calibratedWithoutEvidence.likelihood_not_h !== 0.5) {
  throw new Error('CALIBRATED_MODEL without evidence linkage bypassed probability admission');
}
if (calibratedWithoutEvidence.posterior !== calibratedWithoutEvidence.prior) {
  throw new Error('Invalid calibrated provenance was allowed to move posterior');
}
if (!calibratedWithoutEvidence.provenance_warnings.length) {
  throw new Error('Missing evidence linkage did not produce a provenance warning');
}

const empiricalWithoutSample = calculateExactBayesianPosterior(0.5, 0.9, 0.1, {
  sourceEvidenceIds: ['ev-forged'],
  method: 'EMPIRICAL_RATE'
});
if (empiricalWithoutSample.likelihood_h !== 0.5 || empiricalWithoutSample.likelihood_not_h !== 0.5) {
  throw new Error('EMPIRICAL_RATE without sample size bypassed probability admission');
}
if (empiricalWithoutSample.posterior !== empiricalWithoutSample.prior) {
  throw new Error('Invalid empirical provenance was allowed to move posterior');
}
if (!empiricalWithoutSample.provenance_warnings.some(w => w.includes('positive sample size'))) {
  throw new Error('Missing empirical sample size did not produce the expected provenance warning');
}

const ach = computeDeterministicACH([
  { id: 'h1', claim: 'A', prior: 0.5, likelihood: 0.9, evidenceIds: ['ev-1'] },
  { id: 'h2', claim: 'B', prior: 0.5, likelihood: 0.1, evidenceIds: ['ev-2'] }
], 2, 2);
if (ach.hasSufficientEvidence) throw new Error('ACH reported sufficient evidence without probability provenance');
if (ach.hypotheses.some(h => h.mathematicalProof.probability_status !== 'UNCALIBRATED')) throw new Error('ACH accepted uncalibrated likelihoods');

const roi = calculateROI({ initialInvestment: 100000, netBenefit: 25000 });
if (!roi.determinable || roi.roiPercent !== 25) throw new Error('ROI model failed');

const runway = calculateRunway({ cashOnHand: 120000, monthlyBurn: 20000 });
if (!runway.determinable || runway.runwayMonths !== 6) throw new Error('Runway model failed');

const breakEven = calculateBreakEvenUnits({ fixedCosts: 100000, pricePerUnit: 500, variableCostPerUnit: 250 });
if (!breakEven.determinable || breakEven.units !== 400) throw new Error('Break-even model failed');

const missing = calculateROI({ initialInvestment: 0, netBenefit: 100 });
if (missing.determinable || missing.roiPercent !== null) throw new Error('Quantitative model fabricated missing inputs');

console.log('Source-backed probability and quantitative model tests passed.');
