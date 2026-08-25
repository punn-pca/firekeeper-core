import { ReportModel, ReportSection, SectionType } from './types';

/**
 * Dynamic Section Engine that evaluates the normalized ReportModel 
 * and computes which sections are active and renderable.
 */
export function buildReportSections(model: ReportModel): ReportSection[] {
  const sections: ReportSection[] = [
    {
      id: 'EXECUTIVE',
      title: '✨ 1. EXECUTIVE SUMMARY (บทสรุปผู้บริหาร)',
      status: model.summary.evidenceQuality === 'HIGH' ? 'SUPPORTED' : 'PARTIALLY SUPPORTED',
      available: true,
      priority: 1,
      renderable: true,
      data: model.summary
    },
    {
      id: 'DECISION',
      title: '🎯 2. DECISION ANALYSIS (การวิเคราะห์ตัดสินใจหลัก)',
      status: model.decision.conclusion ? 'SUPPORTED' : 'INSUFFICIENT',
      available: true,
      priority: 2,
      renderable: true,
      data: model.decision
    },
    {
      id: 'FINDINGS',
      title: '🔍 3. KEY FINDINGS & OBSERVATIONS (ข้อค้นพบหลัก)',
      status: model.findings.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT',
      available: model.findings.length > 0,
      priority: 3,
      renderable: model.findings.length > 0,
      data: model.findings
    },
    {
      id: 'EVIDENCE',
      title: '📄 4. EVIDENCE MATRIX & CREDIBILITY SCORING (หลักฐานและค่าความน่าเชื่อถือ)',
      status: model.evidence.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT',
      available: model.evidence.length > 0,
      priority: 4,
      renderable: model.evidence.length > 0,
      data: model.evidence
    },
    {
      id: 'ALTERNATIVES',
      title: '💡 5. STRATEGIC ALTERNATIVES & TRADE-OFFS (ยุทธศาสตร์ทางเลือกและการแลกเปลี่ยน)',
      status: model.alternatives.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT',
      available: model.alternatives.length > 0,
      priority: 5,
      renderable: model.alternatives.length > 0,
      data: model.alternatives
    },
    {
      id: 'RISK',
      title: '⚠️ 6. CRITICAL RISKS & MITIGATION MATRIX (ความเสี่ยงและแนวทางเยียวยา)',
      status: model.risks.length > 0 ? 'STABLE' : 'UNASSESSED',
      available: model.risks.length > 0,
      priority: 6,
      renderable: model.risks.length > 0,
      data: model.risks
    },
    {
      id: 'GOVERNANCE',
      title: '⚖️ 7. COGNITIVE GOVERNANCE & POLICY ENFORCEMENT (ธรรมาภิบาลทางปัญญา)',
      status: model.governance.policiesEnforced.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT',
      available: model.governance.policiesEnforced.length > 0,
      priority: 7,
      renderable: model.governance.policiesEnforced.length > 0,
      data: model.governance
    },
    {
      id: 'HUMAN_AGENCY',
      title: '🦾 8. HUMAN AGENCY & PROTOCOLS (การควบคุมโดยมนุษย์)',
      status: 'STABLE',
      available: true,
      priority: 8,
      renderable: true,
      data: model.humanAgency
    },
    {
      id: 'UNCERTAINTY',
      title: '🔮 9. UNCERTAINTY PROFILE & CONSTRAINTS (ประวัติความคลุมเครือและข้อจำกัด)',
      status: model.uncertainty.uncertaintyIndex > 40 ? 'WARNING' : 'SUPPORTED',
      available: model.uncertainty.drivers.length > 0 || model.uncertainty.missingInfo.length > 0,
      priority: 9,
      renderable: model.uncertainty.drivers.length > 0 || model.uncertainty.missingInfo.length > 0,
      data: model.uncertainty
    },
    {
      id: 'TRACE',
      title: '🧬 10. 12-STAGE COGNITIVE PIPELINE TRACE (ข้อมูลการรันเชิงปริญญาณวิทยา)',
      status: model.trace.length > 0 ? 'STABLE' : 'INCOMPLETE',
      available: model.trace.length > 0,
      priority: 10,
      renderable: model.trace.length > 0,
      data: model.trace
    },
    {
      id: 'PROVENANCE',
      title: '🕸️ 11. PROVENANCE & LONG-TERM MEMORY STORES (คลังความทรงจำเชิงประจักษ์)',
      status: model.provenance.length > 0 ? 'SUPPORTED' : 'INCOMPLETE',
      available: model.provenance.length > 0,
      priority: 11,
      renderable: model.provenance.length > 0,
      data: model.provenance
    },
    {
      id: 'APPENDIX',
      title: '📁 12. APPENDIX & TECHNICAL SPECIFICATIONS (ภาคผนวกทางเทคนิค)',
      status: 'OK',
      available: true,
      priority: 12,
      renderable: true,
      data: { integrity: model.integrity, metadata: model.metadata }
    }
  ];

  // Return list sorted by priority, filtering out non-available entries
  return sections
    .filter((sec) => sec.available)
    .sort((a, b) => a.priority - b.priority);
}
