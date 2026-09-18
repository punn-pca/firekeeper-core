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
