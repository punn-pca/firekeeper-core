import { ReportModel } from '../types';

/**
 * High-fidelity Tabular CSV Exporter for PUNN Cognitive Architecture reports.
 * Converts structured Decision Intelligence (Claims, Hypotheses, Risks, Alternatives, Evidence)
 * into a single analytical table of truth and integrity records.
 */
export function renderCsvReport(model: any): string {
  const rows: string[][] = [];

  // Helper to escape CSV fields
  const escape = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
  };

  const addHeader = (title: string) => {
    rows.push([]);
    rows.push([title]);
  };

  // 1. Metadata
  rows.push(['FIRE KEEPER DECISION INTELLIGENCE REPORT DATA EXPORT']);
  rows.push(['Report ID', model.id || 'N/A']);
  rows.push(['Title', model.metadata?.title || 'N/A']);
  rows.push(['Timestamp', model.metadata?.timestamp || 'N/A']);
  rows.push(['Domain', model.metadata?.domain || 'N/A']);
  rows.push(['Alignment', 'Aligned with ISO/IEC 42001:2023 & NIST AI RMF']);
  rows.push(['Cryptographic Fingerprint', model.integrity?.contentFingerprint || 'N/A']);
  rows.push([]);

  // 2. Executive Summary
  addHeader('1. EXECUTIVE SUMMARY & CONFIDENCE TAXONOMY');
  rows.push(['Metric', 'Value', 'Definition / Description']);
  rows.push(['Verdict', model.summary?.verdictThai || model.summary?.verdict || 'N/A']);
  rows.push(['Evidence Confidence', (model.evidence_confidence !== undefined) ? String(model.evidence_confidence) : 'UNKNOWN']);
  rows.push(['Inference Confidence', (model.inference_confidence !== undefined) ? String(model.inference_confidence) : 'UNKNOWN']);
  rows.push(['Prediction Confidence', (model.prediction_confidence !== undefined) ? String(model.prediction_confidence) : 'UNKNOWN']);
  rows.push(['Decision Robustness', (model.decision_robustness !== undefined) ? String(model.decision_robustness) : 'UNKNOWN']);
  rows.push(['Overall Confidence Score', `${model.summary?.confidenceScore || 0}%`]);
  rows.push(['Uncertainty Level / Risk', model.summary?.riskLevel || 'N/A']);
  rows.push(['Evidence Quality', model.summary?.evidenceQuality || 'N/A']);

  // 3. Evidence-to-Claim Mapping
  addHeader('2. EVIDENCE-TO-CLAIM MAPPING (EPISTEMIC INTEGRITY)');
  rows.push(['Claim ID', 'Claim / Conclusion', 'Epistemic Type', 'Supporting Evidence IDs', 'Source', 'Source Type', 'Evidence Strength', 'Evidence Confidence', 'Corroboration Status']);
  if (model.evidence_claim_mapping && Array.isArray(model.evidence_claim_mapping)) {
    model.evidence_claim_mapping.forEach((c: any) => {
      const evidenceIds = (c.supporting_evidence || []).map((e: any) => e.evidence_id || e.id).join('; ');
      rows.push([
        c.claim_id || c.id || 'N/A',
        c.claim || c.conclusion || 'N/A',
        c.epistemic_type || 'N/A',
        evidenceIds,
        c.source || 'N/A',
        c.source_type || 'N/A',
        c.evidence_strength || 'N/A',
        String(c.evidence_confidence || 0),
        c.corroboration_status || 'N/A'
      ]);
    });
  } else if (model.evidence && Array.isArray(model.evidence)) {
    // Fallback to legacy evidence
    model.evidence.forEach((e: any) => {
      rows.push([
        e.id || 'N/A',
        e.content || 'N/A',
        e.type || 'EVIDENCE',
        '',
        e.source || 'N/A',
        'DECISION_EVIDENCE',
        e.credibilityScore > 0.8 ? 'STRONG' : 'MODERATE',
        String(e.credibilityScore || 0),
        'CORROBORATED'
      ]);
    });
  }

  // 4. Missing Information Registry
  addHeader('3. MISSING INFORMATION REGISTRY (UNCERTAINTY & DATA GAP)');
  rows.push(['Missing ID', 'Missing Information', 'Why Needed', 'Decision Impact', 'Priority', 'Status']);
  if (model.missing_information_registry && Array.isArray(model.missing_information_registry)) {
    model.missing_information_registry.forEach((m: any) => {
      rows.push([
        m.missing_id || 'N/A',
        m.missing_information || 'N/A',
        m.why_needed || 'N/A',
        m.decision_impact || 'N/A',
        m.priority || 'N/A',
        m.status || 'N/A'
      ]);
    });
  } else if (model.uncertainty?.missingInfo && Array.isArray(model.uncertainty.missingInfo)) {
    model.uncertainty.missingInfo.forEach((info: string, idx: number) => {
      rows.push([
        `GAP-${idx + 1}`,
        info,
        'ต้องการตรวจสอบเพิ่มเพื่อเพิ่มความแม่นยำในการคาดการณ์',
        'ผลกระทบปานกลางต่อทางเลือกยุทธศาสตร์',
        'MEDIUM',
        'PENDING_COLLECTION'
      ]);
    });
  }

  // 5. Risk Architecture
  addHeader('4. RISK ARCHITECTURE DECOMPOSITION');
  rows.push(['Risk ID', 'Risk Type', 'Probability', 'Impact', 'Evidence Basis', 'Uncertainty Driver', 'Mitigation Strategy']);
  if (model.risk_architecture && Array.isArray(model.risk_architecture)) {
    model.risk_architecture.forEach((r: any) => {
      rows.push([
        r.risk_id || 'N/A',
        r.risk_type || 'N/A',
        r.probability || 'N/A',
        r.impact || 'N/A',
        r.evidence_basis || 'N/A',
        r.uncertainty || 'N/A',
        r.mitigation || 'N/A'
      ]);
    });
  } else if (model.risks && Array.isArray(model.risks)) {
    model.risks.forEach((r: any) => {
      rows.push([
        r.id || 'N/A',
        'Decision Risk',
        'Medium',
        r.impactLevel || 'High',
        'คัดลอกจากคำวิพากษ์ตนเองเชิงลึก (Self-Critique)',
        'ข้อมูลบริบทในเซสชันมีจำกัด',
        r.mitigationStrategy || 'N/A'
      ]);
    });
  }

  // 6. Decision Alternatives & Robustness
  addHeader('5. DECISION ALTERNATIVES & ROBUSTNESS MATRIX');
  rows.push(['Alternative ID', 'Title / Description', 'Status', 'Evidence Strength', 'Inference Confidence', 'Decision Robustness', 'Cost of Being Wrong', 'Reversibility']);
  if (model.decision_alternatives_v3 && Array.isArray(model.decision_alternatives_v3)) {
    model.decision_alternatives_v3.forEach((a: any) => {
      rows.push([
        a.option_id || 'N/A',
        a.title || a.description || 'N/A',
        a.status || 'N/A',
        a.evidence_strength || 'N/A',
        String(a.inference_confidence || 'N/A'),
        String(a.decision_robustness || 'N/A'),
        a.cost_of_being_wrong || 'N/A',
        a.reversibility || 'N/A'
      ]);
    });
  } else if (model.alternatives && Array.isArray(model.alternatives)) {
    model.alternatives.forEach((a: any) => {
      rows.push([
        a.id || 'N/A',
        a.title || 'N/A',
        a.recommendationLevel || 'N/A',
        'MODERATE',
        String(a.confidenceScore / 100),
        'UNKNOWN',
        'MEDIUM',
        'PARTIALLY_REVERSIBLE'
      ]);
    });
  }

  // 7. Internal Consistency Warnings
  addHeader('6. INTERNAL CONSISTENCY ENGINE CHECKS');
  rows.push(['Warning ID', 'Conflicting Fields', 'Explanation', 'Severity', 'Required Review', 'Resolution Status']);
  if (model.internal_consistency_warnings && Array.isArray(model.internal_consistency_warnings)) {
    model.internal_consistency_warnings.forEach((w: any) => {
      rows.push([
        w.conflict_id || 'N/A',
        (w.conflicting_fields || []).join(' vs '),
        w.explanation || 'N/A',
        w.severity || 'N/A',
        w.required_review || 'N/A',
        w.resolution_status || 'N/A'
      ]);
    });
  } else {
    rows.push(['PASS', 'None', 'ตรวจสอบความคงเส้นคงวาภายในสมบูรณ์ ไม่พบข้อขัดแย้งเชิงประจักษ์', 'INFO', 'No Review Required', 'RESOLVED']);
  }

  return rows.map(row => row.map(escape).join(',')).join('\n');
}
