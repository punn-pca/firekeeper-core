import { ACH_EPISTEMIC_KNOWLEDGE } from './epistemicAchKnowledge';
import { getLanguagePolicySystemInstruction, DEFAULT_LANGUAGE_POLICY } from './languagePolicy';

export type GovernedPromptEvidence = {
  id: string;
  claim: string;
  source: string;
  credibility: number;
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTEXT_ONLY';
  url?: string;
  relevance?: number;
  retrieved_at?: string;
};

export type GovernedPromptPackage = {
  mode: 'GOVERNED_PROMPT';
  query: {
    original: string;
    type: string;
    objective: string;
  };
  evidence: GovernedPromptEvidence[];
  claims: any[];
  risks: any[];
  constraints: {
    anti_fabrication: true;
    evidence_grounding: true;
    uncertainty_disclosure: true;
    human_agency_preservation: true;
  };
  reasoning_policy: {
    separate_facts_from_inference: true;
    do_not_promote_unverified_claims: true;
    cite_evidence_when_available: true;
    competing_hypotheses_when_applicable: true;
    falsification_over_confirmation: true;
    diagnosticity_awareness: true;
    sensitivity_analysis_when_material: true;
  };
  output_policy: {
    output_language: 'th';
    answer_question_directly: true;
    disclose_uncertainty: true;
    preserve_human_decision_authority: true;
  };
  external_ai_prompt: string;
  audit: {
    traceable: true;
    generated_at: string;
    package_version: '1.2';
    evidence_retrieved: boolean;
    evidence_count: number;
  };
};

function inferQueryType(question: string): string {
  const q = question.toLowerCase();
  if (/\b(should|choose|select|recommend|decision|decide|which|versus|compare|trade.?off)\b|(เลือก|ควร|เปรียบเทียบ|ตัดสินใจ|เหมาะกว่า|ไหนดี)/i.test(q)) return 'decision_support';
  if (/\b(compare|versus|vs\.?)\b|(เปรียบเทียบ|ข้อแตกต่าง|ต่างกัน)/i.test(q)) return 'comparative_analysis';
  if (/\b(how|implement|code|debug|build)\b|(เขียน|แก้โค้ด|สร้างระบบ|ทำอย่างไร)/i.test(q)) return 'technical';
  if (/\b(legal|law|regulation|policy)\b|(กฎหมาย|ระเบียบ|นโยบาย)/i.test(q)) return 'legal_policy';
  if (/\b(why|cause)\b|(สาเหตุ|ทำไม)/i.test(q)) return 'causal_analysis';
  return 'factual';
}

function buildExternalPrompt(pkg: Omit<GovernedPromptPackage, 'external_ai_prompt'>): string {
  const decisionReasoningEnabled = ['decision_support', 'comparative_analysis', 'causal_analysis'].includes(pkg.query.type);

  return [
    getLanguagePolicySystemInstruction(DEFAULT_LANGUAGE_POLICY),
    '',
    'You are the external generation model operating under a Firekeeper governance package.',
    'Generate the answer, but do not invent facts or treat governance metadata as proof.',
    'Evidence marked UNVERIFIED or CONTEXT_ONLY must not be presented as verified fact.',
    'If evidence is insufficient for a reliable conclusion, explicitly state what is unknown and what additional evidence would resolve it.',
    '',
    'FIRE KEEPER REASONING KNOWLEDGE — ACH / EPISTEMIC REASONING:',
    ACH_EPISTEMIC_KNOWLEDGE,
    '',
    'APPLICATION RULE:',
    decisionReasoningEnabled
      ? 'This query is decision-oriented. Apply competing-hypothesis analysis where meaningful. Evaluate evidence across alternatives, prioritize diagnostic and disconfirming evidence, surface critical uncertainties, and avoid premature convergence.'
      : 'Apply the epistemic safeguards that are relevant to this query. Do not force an ACH matrix when competing hypotheses are not meaningful.',
    '',
    'USER QUERY:',
    pkg.query.original,
    '',
    `QUERY TYPE: ${pkg.query.type}`,
    `OBJECTIVE: ${pkg.query.objective}`,
    '',
    'GOVERNED EVIDENCE:',
    JSON.stringify(pkg.evidence, null, 2),
    '',
    'CLAIMS:',
    JSON.stringify(pkg.claims, null, 2),
    '',
    'RISKS / UNCERTAINTIES:',
    JSON.stringify(pkg.risks, null, 2),
    '',
    'REASONING POLICY:',
    JSON.stringify(pkg.reasoning_policy, null, 2),
    '',
    'OUTPUT POLICY:',
    JSON.stringify(pkg.output_policy, null, 2),
    '',
    'Return the best-supported answer. Clearly distinguish verified facts, inference, assumptions, and unknowns.',
    'FORMATTING RULE: Taxonomy labels MUST NEVER be used as headings or section titles. Headings must be plain natural language. Taxonomy labels are semantic annotations attached only to the specific claims or information in the body text.',
    'YOU MUST FORMAT KEY INFORMATION USING TAXONOMY TAGS IN BRACKETS WHEREVER APPLICABLE:',
    '- Use [FACT] for verifiable facts.',
    '- Use [INFERENCE] for reasoned conclusions.',
    '- Use [TRADE-OFF] for strategic trade-offs.',
    '- Use [UNCERTAINTY] for points of doubt.',
    'For decision analysis, show meaningful competing hypotheses or alternatives, emphasize disconfirming evidence and diagnosticity, identify sensitivity to critical evidence, and state what future evidence could change the conclusion. Do not fabricate missing evidence. Preserve the user\'s final decision authority.'
  ].join('\n');
}

export function buildGovernedPromptPackage(input: {
  question: string;
  evidence?: GovernedPromptEvidence[];
  claims?: any[];
  risks?: any[];
  objective?: string;
}): GovernedPromptPackage {
  const question = String(input.question || '').trim();
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const claims = Array.isArray(input.claims) ? input.claims : [];
  const risks = Array.isArray(input.risks) ? input.risks : [];
  const base = {
    mode: 'GOVERNED_PROMPT' as const,
    query: {
      original: question,
      type: inferQueryType(question),
      objective: input.objective || 'Produce a well-grounded answer using governed evidence and explicit uncertainty.'
    },
    evidence,
    claims,
    risks,
    constraints: {
      anti_fabrication: true as const,
      evidence_grounding: true as const,
      uncertainty_disclosure: true as const,
      human_agency_preservation: true as const,
    },
    reasoning_policy: {
      separate_facts_from_inference: true as const,
      do_not_promote_unverified_claims: true as const,
      cite_evidence_when_available: true as const,
      competing_hypotheses_when_applicable: true as const,
      falsification_over_confirmation: true as const,
      diagnosticity_awareness: true as const,
      sensitivity_analysis_when_material: true as const,
    },
    output_policy: {
      output_language: 'th' as const,
      answer_question_directly: true as const,
      disclose_uncertainty: true as const,
      preserve_human_decision_authority: true as const,
    },
    audit: {
      traceable: true as const,
      generated_at: new Date().toISOString(),
      package_version: '1.2' as const,
      evidence_retrieved: evidence.length > 0,
      evidence_count: evidence.length,
    }
  };

  return {
    ...base,
    external_ai_prompt: buildExternalPrompt(base),
  };
}
