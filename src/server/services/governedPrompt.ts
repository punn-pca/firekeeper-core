import { ControlActivationPlan, ProcessDepth } from '../../types';
import { buildUnifiedPcaGovernancePrompt } from './pcaGovernance';
import { ACH_EPISTEMIC_KNOWLEDGE } from './epistemicAchKnowledge';

export type GovernedPromptEvidence = {
  id: string;
  claim: string;
  /** Full source excerpt when available. Keep claim concise for generic evidence. */
  content?: string;
  source: string;
  /** Measured evidence credibility only. Undefined means UNMEASURED. */
  credibility?: number;
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTEXT_ONLY';
  url?: string;
  relevance?: number;
  retrieved_at?: string;
};

export type GovernedPromptPackage = {
  mode: 'GOVERNED_PROMPT';
  activationPlan?: ControlActivationPlan;
  depth?: ProcessDepth;
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
  // Classify explanatory/causal intent before decision-support keywords so
  // phrases such as "ข้อมูลที่ควรตรวจสอบ" do not become decision requests.
  if (/\b(why|cause|explain|analy[sz]e causes?)\b|(สาเหตุ|ทำไม|วิเคราะห์สาเหตุ|อธิบายสาเหตุ)/i.test(q)) return 'causal_analysis';
  // A comparison becomes decision support only when the user explicitly asks
  // to choose/decide/recommend. Pure comparison remains comparative analysis.
  const explicitDecision = /\b(should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|choose|select|recommend|decision|decide|which)\b|(ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ตัดสินใจ|อนุมัติ|เหมาะกว่า|ไหนดี|เพื่อเลือก)/i.test(q);
  if (explicitDecision) return 'decision_support';
  if (/\b(compare|versus|vs\.?)\b|(เปรียบเทียบ|ข้อแตกต่าง|ต่างกัน)/i.test(q)) return 'comparative_analysis';
  if (/\b(how|implement|code|debug|build)\b|(เขียน|แก้โค้ด|สร้างระบบ|ทำอย่างไร)/i.test(q)) return 'technical';
  if (/\b(legal|law|regulation|policy)\b|(กฎหมาย|ระเบียบ|นโยบาย)/i.test(q)) return 'legal_policy';
  return 'factual';
}

function buildExternalPrompt(pkg: Omit<GovernedPromptPackage, 'external_ai_prompt'>): string {
  const activation = pkg.activationPlan;
  const labelsRequired = activation?.epistemicLabeling === 'REQUIRED';
  const achRequired = activation?.competingHypotheses === 'REQUIRED';
  const temporalRequired = activation?.temporalGrounding === 'REQUIRED';
  const analyticalMode = labelsRequired || achRequired || ['causal_analysis', 'comparative_analysis', 'decision_support', 'legal_policy'].includes(pkg.query.type);
  const decisionMode = pkg.query.type === 'decision_support' || activation?.decisionRelevance === 'REQUIRED';

  const pcaGovernance = buildUnifiedPcaGovernancePrompt({
    depth: pkg.depth || 'L0_DIRECT',
    activationPlan: activation
  });

  // System instruction is governance-only. Runtime evidence, including official
  // publication excerpts, belongs in the context payload and must be sent once.
  return [
    pcaGovernance,
    '',
    'You are the external generation model operating under a Firekeeper governance package.',
    'Generate the answer, but do not invent facts or treat governance metadata as proof.',
    'Do not fabricate missing evidence.',
    'Evidence marked UNVERIFIED or CONTEXT_ONLY must not be presented as verified fact.',
    'If evidence is insufficient for a reliable conclusion, explicitly state what is unknown.',
    '',
    'FIRE KEEPER ADAPTIVE REASONING — GOVERNANCE DIRECTIVES:',
    labelsRequired
      ? '• Epistemic Labeling REQUIRED: Use [FACT], [INFERENCE], [UNCERTAINTY], or [TRADE-OFF] inline where ambiguity exists or material support is cited. Do not use as headings.'
      : '• Epistemic Labeling NOT_REQUIRED: Use natural contemporary language. Do not use taxonomy tags unless manually requested.',
    achRequired
      ? '• ACH REQUIRED: This query has meaningful alternatives. Evaluate competing hypotheses, prioritize diagnostic evidence, and avoid premature convergence.'
      : '• ACH NOT_REQUIRED: Provide a direct answer. Do not fabricate competing hypotheses if none are meaningful.',
    temporalRequired
      ? '• Temporal Grounding REQUIRED: Explicitly cross-reference the date of evidence against the current query timeframe.'
      : '',
    '',
    ...(achRequired ? [
      'FIRE KEEPER REASONING KNOWLEDGE — ACH / EPISTEMIC REASONING:',
      ACH_EPISTEMIC_KNOWLEDGE,
      ''
    ] : []),
    'REASONING POLICY:',
    JSON.stringify(pkg.reasoning_policy, null, 2),
    '',
    'OUTPUT POLICY:',
    JSON.stringify(pkg.output_policy, null, 2),
    '',
    'Return the best-supported answer. Clearly distinguish verified facts from inferences when risk or ambiguity is present.',
    analyticalMode
      ? 'EPISTEMIC LANGUAGE (ANALYTICAL MODE): Avoid unsupported comparative or superlative claims such as "ดีที่สุด", "ใหญ่สุด", "สำคัญที่สุด", "most likely", or "best" unless governed evidence supports the comparison. Prefer neutral wording when no comparison is established.'
      : 'EPISTEMIC LANGUAGE (DIRECT MODE): Use ordinary natural language for well-established general knowledge. Do not over-qualify routine explanations merely because governed evidence was not retrieved; still avoid fabricated precision or unsupported certainty.',
    analyticalMode
      ? 'EPISTEMIC LANGUAGE (ANALYTICAL MODE): Prevalence or frequency claims such as "มัก", "โดยทั่วไป", "typically", "usually", or "commonly" should be grounded when they materially support a diagnosis, comparison, or conclusion. If support is absent, use conditional wording such as "หาก" or "อาจ".'
      : '',
    decisionMode
      ? 'DECISION CONTROL: The user is asking for a choice, recommendation, or consequential course of action. Apply decision-specific evidence, uncertainty, trade-off, and Human Agency controls proportionally to the stakes.'
      : 'DECISION CONTROL: No explicit choice or action decision was requested. Do not manufacture a recommendation, Decision Record, approval requirement, decision owner, or decision-authority boilerplate.',
    'VISIBLE RESPONSE POLICY: Default to a concise, direct answer in plain language. Use technical jargon only when it is needed for accuracy or the user asks for it.',
    'VISIBLE RESPONSE POLICY: Do not print a full governance template. Include only sections and analytical modules that materially help answer this specific query.',
    'VISIBLE RESPONSE POLICY: Risk analysis, counterfactual audit, decision gaps, competing hypotheses, and uncertainty sections are conditional; omit them when they are not relevant or not activated.',
    'VISIBLE RESPONSE POLICY: Governance depth is not response length. Deep internal analysis may produce a short visible answer.',
    'VISIBLE RESPONSE POLICY: Epistemic tags are presentation metadata. Showing or hiding tags must never change the underlying answer, evidence, caveats, or reasoning quality.',
    'FORMATTING RULE: Avoid unnecessary headings, repeated summaries, boilerplate, and meta-commentary. Headings, when useful, must be plain natural language.',
    'HUMAN AGENCY: Preserve the boundary internally for all requests, but do not append visible slogans or boilerplate such as "ผู้มีอำนาจตัดสินใจคือคุณ" to ordinary factual, causal, explanatory, or analytical answers. Surface approval/decision-authority language only when it is materially relevant to a consequential decision, authorization, or action request.'
  ].filter(Boolean).join('\n');
}

export function buildGovernedPromptPackage(input: {
  question: string;
  evidence?: GovernedPromptEvidence[];
  claims?: any[];
  risks?: any[];
  objective?: string;
  activationPlan?: ControlActivationPlan;
  depth?: ProcessDepth;
}): GovernedPromptPackage {
  const question = String(input.question || '').trim();
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const claims = Array.isArray(input.claims) ? input.claims : [];
  const risks = Array.isArray(input.risks) ? input.risks : [];
  const base = {
    mode: 'GOVERNED_PROMPT' as const,
    activationPlan: input.activationPlan,
    depth: input.depth,
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
