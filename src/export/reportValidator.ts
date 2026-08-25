import { ReportModel, ValidationResult, ValidationError, SectionType } from './types';

/**
 * Validates a ReportModel for structural completeness, proper numeric ranges, and logical integrity.
 */
export function validateReportModel(model: ReportModel): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const sectionStatus: Record<SectionType, 'VALID' | 'WARNING' | 'EMPTY'> = {
    EXECUTIVE: 'VALID',
    DECISION: 'VALID',
    FINDINGS: 'EMPTY',
    EVIDENCE: 'EMPTY',
    ALTERNATIVES: 'EMPTY',
    RISK: 'EMPTY',
    GOVERNANCE: 'EMPTY',
    HUMAN_AGENCY: 'VALID',
    UNCERTAINTY: 'EMPTY',
    TRACE: 'EMPTY',
    PROVENANCE: 'EMPTY',
    APPENDIX: 'VALID'
  };

  // 1. Metadata Validation
  if (!model.id || model.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Report ID is missing or empty',
      severity: 'CRITICAL'
    });
  }
  if (!model.metadata.title || model.metadata.title.trim() === '') {
    warnings.push({
      field: 'metadata.title',
      message: 'Document title is missing; falling back to default',
      severity: 'WARNING'
    });
  }
  if (!model.metadata.timestamp || isNaN(Date.parse(model.metadata.timestamp))) {
    errors.push({
      field: 'metadata.timestamp',
      message: 'Invalid or missing generated timestamp',
      severity: 'CRITICAL'
    });
  }

  // 2. Range Validation & Summary Checks
  const conf = model.summary.confidenceScore;
  if (conf < 0 || conf > 100) {
    errors.push({
      field: 'summary.confidenceScore',
      message: `Confidence score (${conf}) must be between 0 and 100`,
      severity: 'CRITICAL'
    });
  } else if (conf < 50) {
    warnings.push({
      field: 'summary.confidenceScore',
      message: `Confidence score is low (${conf}%). Decision should be reviewed closely.`,
      severity: 'WARNING'
    });
  }

  // 3. Decision Analysis Check
  if (!model.decision.conclusion || model.decision.conclusion.trim() === '') {
    errors.push({
      field: 'decision.conclusion',
      message: 'Decision conclusion is completely missing',
      severity: 'CRITICAL'
    });
  }

  // 4. Section Dynamic Completeness Checks
  // Findings
  if (model.findings.length > 0) {
    sectionStatus.FINDINGS = 'VALID';
  } else {
    warnings.push({
      field: 'findings',
      message: 'Findings array is empty',
      severity: 'WARNING'
    });
    sectionStatus.FINDINGS = 'EMPTY';
  }

  // Evidence
  if (model.evidence.length > 0) {
    let hasLowCred = false;
    model.evidence.forEach((ev, idx) => {
      if (ev.credibilityScore < 0 || ev.credibilityScore > 100) {
        errors.push({
          field: `evidence[${idx}].credibilityScore`,
          message: `Credibility score for source '${ev.source}' must be between 0 and 100`,
          severity: 'CRITICAL'
        });
      }
      if (ev.credibilityScore < 50) {
        hasLowCred = true;
      }
    });
    sectionStatus.EVIDENCE = hasLowCred ? 'WARNING' : 'VALID';
    if (hasLowCred) {
      warnings.push({
        field: 'evidence',
        message: 'Some evidence claims have low credibility scores (< 50%)',
        severity: 'WARNING'
      });
    }
  } else {
    sectionStatus.EVIDENCE = 'EMPTY';
  }

  // Alternatives
  if (model.alternatives.length > 0) {
    sectionStatus.ALTERNATIVES = 'VALID';
  } else {
    sectionStatus.ALTERNATIVES = 'EMPTY';
  }

  // Risks
  if (model.risks.length > 0) {
    sectionStatus.RISK = 'VALID';
  } else {
    sectionStatus.RISK = 'EMPTY';
  }

  // Governance
  if (model.governance.policiesEnforced.length > 0) {
    sectionStatus.GOVERNANCE = 'VALID';
  } else {
    sectionStatus.GOVERNANCE = 'EMPTY';
  }

  // Uncertainty
  if (model.uncertainty.uncertaintyIndex > 40) {
    sectionStatus.UNCERTAINTY = 'WARNING';
    warnings.push({
      field: 'uncertainty.uncertaintyIndex',
      message: `Uncertainty Index is high (${model.uncertainty.uncertaintyIndex}%). Drivers: ${model.uncertainty.drivers.join(', ')}`,
      severity: 'WARNING'
    });
  } else if (model.uncertainty.drivers.length > 0 || model.uncertainty.missingInfo.length > 0) {
    sectionStatus.UNCERTAINTY = 'VALID';
  } else {
    sectionStatus.UNCERTAINTY = 'EMPTY';
  }

  // Trace
  if (model.trace.length > 0) {
    sectionStatus.TRACE = 'VALID';
  } else {
    sectionStatus.TRACE = 'EMPTY';
  }

  // Provenance (Memories)
  if (model.provenance.length > 0) {
    sectionStatus.PROVENANCE = 'VALID';
  } else {
    sectionStatus.PROVENANCE = 'EMPTY';
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sectionStatus
  };
}
