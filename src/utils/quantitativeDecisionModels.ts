/**
 * Deterministic quantitative models for decision analysis.
 *
 * These models intentionally refuse to invent missing financial inputs.
 * They return `determinable: false` when the minimum required inputs are absent.
 */

export interface ROIInputs {
  initialInvestment: number;
  netBenefit: number;
  periodMonths?: number;
}

export interface ROIResult {
  determinable: boolean;
  roiPercent: number | null;
  periodMonths: number | null;
  formula: string;
  missingInputs: string[];
}

export function calculateROI(input: ROIInputs): ROIResult {
  const missing: string[] = [];
  if (!Number.isFinite(input.initialInvestment) || input.initialInvestment <= 0) missing.push('initialInvestment');
  if (!Number.isFinite(input.netBenefit)) missing.push('netBenefit');

  if (missing.length) {
    return { determinable: false, roiPercent: null, periodMonths: null, formula: 'ROI = (Net Benefit / Initial Investment) × 100', missingInputs: missing };
  }

  return {
    determinable: true,
    roiPercent: Number(((input.netBenefit / input.initialInvestment) * 100).toFixed(2)),
    periodMonths: Number.isFinite(input.periodMonths) ? Number(input.periodMonths) : null,
    formula: 'ROI = (Net Benefit / Initial Investment) × 100',
    missingInputs: []
  };
}

export interface RunwayInputs {
  cashOnHand: number;
  monthlyBurn: number;
}

export interface RunwayResult {
  determinable: boolean;
  runwayMonths: number | null;
  formula: string;
  missingInputs: string[];
}

export function calculateRunway(input: RunwayInputs): RunwayResult {
  const missing: string[] = [];
  if (!Number.isFinite(input.cashOnHand) || input.cashOnHand < 0) missing.push('cashOnHand');
  if (!Number.isFinite(input.monthlyBurn) || input.monthlyBurn <= 0) missing.push('monthlyBurn');

  if (missing.length) {
    return { determinable: false, runwayMonths: null, formula: 'Runway (months) = Cash on Hand / Monthly Burn', missingInputs: missing };
  }

  return {
    determinable: true,
    runwayMonths: Number((input.cashOnHand / input.monthlyBurn).toFixed(2)),
    formula: 'Runway (months) = Cash on Hand / Monthly Burn',
    missingInputs: []
  };
}

export interface BreakEvenInputs {
  fixedCosts: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
}

export interface BreakEvenResult {
  determinable: boolean;
  units: number | null;
  formula: string;
  missingInputs: string[];
}

export function calculateBreakEvenUnits(input: BreakEvenInputs): BreakEvenResult {
  const missing: string[] = [];
  if (!Number.isFinite(input.fixedCosts) || input.fixedCosts < 0) missing.push('fixedCosts');
  if (!Number.isFinite(input.pricePerUnit) || input.pricePerUnit <= 0) missing.push('pricePerUnit');
  if (!Number.isFinite(input.variableCostPerUnit) || input.variableCostPerUnit < 0) missing.push('variableCostPerUnit');

  const contribution = input.pricePerUnit - input.variableCostPerUnit;
  if (!missing.length && contribution <= 0) missing.push('pricePerUnit must exceed variableCostPerUnit');

  if (missing.length) {
    return { determinable: false, units: null, formula: 'Break-even units = Fixed Costs / (Price − Variable Cost)', missingInputs: missing };
  }

  return {
    determinable: true,
    units: Number((input.fixedCosts / contribution).toFixed(2)),
    formula: 'Break-even units = Fixed Costs / (Price − Variable Cost)',
    missingInputs: []
  };
}
