export type ProbabilityProvenanceStatus = 'SOURCE_BACKED' | 'CALIBRATED' | 'EXPERT_ELICITATION' | 'USER_SCENARIO' | 'UNCALIBRATED';

export interface ProbabilityProvenance {
  status: ProbabilityProvenanceStatus;
  evidenceIds: string[];
  source: string;
  methodology?: string;
  sampleSize?: number;
  calibrationDataset?: string;
  calibrationDate?: string;
  rationale: string;
}

export interface SourceBackedEvidence {
  id: string;
  source?: string;
  content?: string;
  likelihood?: number;
  probabilityProvenance?: Partial<ProbabilityProvenance>;
  calibrationDataset?: string;
}

export interface SourceBackedLikelihood {
  likelihood: number;
  counterLikelihood: number;
  provenance: ProbabilityProvenance;
  quarantined: boolean;
}

/**
 * Credibility/authority is source quality, not P(E|H). Never infer a
 * Bayesian likelihood from a credibility score. A numeric likelihood may
 * only enter ACH when the source explicitly supplies it and the evidence
 * lineage is preserved.
 */
export function resolveSourceBackedLikelihood(
  prior: number,
  evidence: SourceBackedEvidence[],
  purpose: string
): SourceBackedLikelihood {
  const safePrior = clampProbability(prior);
  const safeEvidence = Array.isArray(evidence) ? evidence.filter(Boolean) : [];
  const ids = safeEvidence.map(e => e.id).filter(Boolean);

  if (ids.length === 0) {
    return {
      likelihood: safePrior,
      counterLikelihood: safePrior,
      quarantined: true,
      provenance: {
        status: 'UNCALIBRATED',
        evidenceIds: [],
        source: 'NONE',
        rationale: `${purpose}: no evidence is linked to the probability.`
      }
    };
  }

  const declared = safeEvidence.find(e =>
    typeof e.likelihood === 'number' && Number.isFinite(e.likelihood) && e.likelihood >= 0 && e.likelihood <= 1
  );

  const calibrated = safeEvidence.filter(e => e.probabilityProvenance?.status === 'CALIBRATED' || Boolean(e.calibrationDataset));
  const explicitProvenance = safeEvidence.filter(e => Boolean(e.probabilityProvenance));

  const provenance: ProbabilityProvenance = calibrated.length > 0
    ? {
        status: 'CALIBRATED',
        evidenceIds: calibrated.map(e => e.id),
        source: calibrated.map(e => e.source || e.id).join('; '),
        methodology: calibrated.map(e => e.probabilityProvenance?.methodology).filter(Boolean).join('; ') || undefined,
        sampleSize: calibrated.map(e => e.probabilityProvenance?.sampleSize).find(v => typeof v === 'number'),
        calibrationDataset: calibrated.map(e => e.probabilityProvenance?.calibrationDataset || e.calibrationDataset).find(Boolean),
        calibrationDate: calibrated.map(e => e.probabilityProvenance?.calibrationDate).find(Boolean),
        rationale: 'Probability carries explicit calibration provenance.'
      }
    : explicitProvenance.length > 0
      ? {
          status: explicitProvenance[0].probabilityProvenance?.status === 'EXPERT_ELICITATION' ? 'EXPERT_ELICITATION' : 'SOURCE_BACKED',
          evidenceIds: explicitProvenance.map(e => e.id),
          source: explicitProvenance.map(e => e.source || e.id).join('; '),
          methodology: explicitProvenance.map(e => e.probabilityProvenance?.methodology).filter(Boolean).join('; ') || undefined,
          rationale: 'Probability carries explicit source provenance.'
        }
      : {
          status: 'SOURCE_BACKED',
          evidenceIds: ids,
          source: safeEvidence.map(e => e.source || e.id).join('; '),
          methodology: 'source-backed likelihood; credibility is not treated as probability',
          rationale: 'Evidence exists, but no calibrated likelihood was declared.'
        };

  // Evidence without a declared/calibrated numeric likelihood cannot update Bayes.
  if (!declared) {
    return {
      likelihood: safePrior,
      counterLikelihood: safePrior,
      quarantined: true,
      provenance: {
        ...provenance,
        status: provenance.status === 'CALIBRATED' ? 'CALIBRATED' : 'SOURCE_BACKED',
        rationale: `${purpose}: evidence is present but no valid numeric likelihood is declared; Bayesian update quarantined.`
      }
    };
  }

  const likelihood = clampProbability(declared.likelihood!);
  return {
    likelihood,
    counterLikelihood: 1 - likelihood,
    quarantined: false,
    provenance: {
      ...provenance,
      evidenceIds: provenance.evidenceIds.length ? provenance.evidenceIds : [declared.id],
      rationale: `${purpose}: numeric likelihood is explicitly linked to evidence provenance.`
    }
  };
}

export function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}
