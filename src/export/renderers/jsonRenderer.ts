import { ReportModel } from '../types';

/**
 * Renders the ReportModel into a beautifully structured, schema-compliant JSON string.
 */
export function renderJsonReport(model: ReportModel): string {
  const jsonOutput = {
    schemaVersion: "1.0",
    report: {
      reportId: model.id,
      title: model.metadata.title,
      creator: model.metadata.creator,
      timestamp: model.metadata.timestamp,
      domain: model.metadata.domain,
      systemVersion: model.metadata.systemVersion
    },
    sections: [
      { id: "EXECUTIVE", title: "Executive Summary", status: "VALID" },
      { id: "DECISION", title: "Decision Analysis", status: "VALID" },
      { id: "FINDINGS", title: "Key Findings & Observations", status: model.findings.length > 0 ? "VALID" : "EMPTY" },
      { id: "EVIDENCE", title: "Evidence Matrix & Credibility Scoring", status: model.evidence.length > 0 ? "VALID" : "EMPTY" },
      { id: "ALTERNATIVES", title: "Strategic Alternatives & Trade-offs", status: model.alternatives.length > 0 ? "VALID" : "EMPTY" },
      { id: "RISK", title: "Critical Risks & Mitigation Matrix", status: model.risks.length > 0 ? "VALID" : "EMPTY" },
      { id: "GOVERNANCE", title: "Cognitive Governance & Policy Enforcement", status: model.governance.policiesEnforced.length > 0 ? "VALID" : "EMPTY" },
      { id: "HUMAN_AGENCY", title: "Human Agency & Protocols", status: "VALID" },
      { id: "UNCERTAINTY", title: "Uncertainty Profile & Constraints", status: model.uncertainty.uncertaintyIndex > 40 ? "WARNING" : "VALID" },
      { id: "TRACE", title: "12-Stage Cognitive Pipeline Trace", status: model.trace.length > 0 ? "VALID" : "EMPTY" },
      { id: "PROVENANCE", title: "Provenance & Long-Term Memory Stores", status: model.provenance.length > 0 ? "VALID" : "EMPTY" },
      { id: "APPENDIX", title: "Appendix & Technical Specifications", status: "VALID" }
    ],
    summary: {
      verdict: model.summary.verdict,
      confidenceScore: model.summary.confidenceScore,
      riskLevel: model.summary.riskLevel,
      evidenceQuality: model.summary.evidenceQuality,
      unknownsCount: model.summary.unknownsCount,
      biasLevel: model.summary.biasLevel,
      recommendations: model.summary.recommendations
    },
    decision: {
      goal: model.decision.goal,
      purpose: model.decision.purpose,
      conclusion: model.decision.conclusion,
      rationale: model.decision.rationale,
      understanding: model.decision.understanding
    },
    findings: model.findings.map(f => ({
      id: f.id,
      topic: f.topic,
      observation: f.observation,
      significance: f.significance
    })),
    evidence: model.evidence.map(e => ({
      id: e.id,
      source: e.source,
      content: e.content,
      credibilityScore: e.credibilityScore,
      reliabilityScore: e.reliabilityScore,
      citationQuote: e.citationQuote,
      type: e.type,
      locator: e.locator
    })),
    decisions: model.alternatives.map(a => ({
      id: a.id,
      title: a.title,
      recommendationLevel: a.recommendationLevel,
      expectedOutcome: a.expectedOutcome,
      pros: a.pros,
      cons: a.cons,
      tradeOffs: {
        riskScore: a.riskScore,
        costEffort: a.costEffort,
        confidenceScore: a.confidenceScore
      },
      selectionRationale: a.selectionRationale
    })),
    risks: model.risks.map(r => ({
      id: r.id,
      description: r.description,
      impactLevel: r.impactLevel,
      mitigationStrategy: r.mitigationStrategy
    })),
    governance: {
      policiesEnforced: model.governance.policiesEnforced.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        description: p.description,
        ruleEnforced: p.ruleEnforced
      })),
      selfCorrectionNotes: model.governance.selfCorrectionNotes,
      hallucinationRisk: model.governance.hallucinationRisk,
      factCheckPassed: model.governance.factCheckPassed
    },
    humanAgency: {
      level: model.humanAgency.level,
      levelName: model.humanAgency.levelName,
      isBlocked: model.humanAgency.isBlocked,
      blockReason: model.humanAgency.blockReason,
      requiresHumanToken: model.humanAgency.requiresHumanToken,
      tokenApproved: model.humanAgency.tokenApproved,
      approvedBy: model.humanAgency.approvedBy,
      overrideActionTaken: model.humanAgency.overrideActionTaken
    },
    uncertainty: {
      uncertaintyIndex: model.uncertainty.uncertaintyIndex,
      drivers: model.uncertainty.drivers,
      mitigationStrategy: model.uncertainty.mitigationStrategy,
      missingInfo: model.uncertainty.missingInfo
    },
    trace: {
      pipelineEntries: model.trace.map(t => ({
        stage: t.stage,
        stageNumber: t.stageNumber,
        durationMs: t.durationMs,
        executionType: t.executionType,
        outputSummary: t.outputSummary
      }))
    },
    provenance: model.provenance.map(p => ({
      id: p.id,
      content: p.content,
      layer: p.layer,
      storeType: p.storeType,
      source: p.source,
      authority: p.authority,
      confidence: p.confidence
    })),
    integrity: {
      sourceIntegrityHash: model.integrity.sourceIntegrityHash,
      contentFingerprint: model.integrity.contentFingerprint,
      cryptographicSignature: model.integrity.cryptographicSignature,
      algorithmName: model.integrity.algorithmName
    }
  };

  return JSON.stringify(jsonOutput, null, 2);
}
