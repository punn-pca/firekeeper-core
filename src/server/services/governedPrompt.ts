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
  const explicitDecision = /\b(?:should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|help (?:me|us) choose|decide (?:between|whether|what to)|recommend (?:which|whether)|compare .{1,100} to choose)\b|(ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|(?:จะ|อยาก|ต้องการ)?เลือก(?:ทำอะไร|งานอะไร|อาชีพอะไร|สายงานอะไร|ทางไหน)|ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ตัดสินใจ|อนุมัติ|ทำงานอะไรดี|อาชีพอะไรดี|เลือกอะไรดี|เพื่อเลือก)/i.test(q);
  if (explicitDecision) return 'decision_support';
  if (/\b(compare|versus|vs\.?)\b|(เปรียบเทียบ|ข้อแตกต่าง|ต่างกัน)/i.test(q)) return 'comparative_analysis';
  if (/\b(how|implement|code|debug|build)\b|(เขียน|แก้โค้ด|สร้างระบบ|ทำอย่างไร)/i.test(q)) return 'technical';
  if (/\b(legal|law|regulation|policy)\b|(กฎหมาย|ระเบียบ|นโยบาย)/i.test(q)) return 'legal_policy';
  return 'factual';
}

function buildExternalPrompt(pkg: Omit<GovernedPromptPackage, 'external_ai_prompt'>): string {
  const activation = pkg.activationPlan;
  // Governance mode must always emit visible epistemic tags; adaptive activation controls depth, not whether tags disappear.
  const labelsRequired = true;
  const governanceActivation = { ...(activation || {}), epistemicLabeling: 'REQUIRED' } as ControlActivationPlan;
  const achRequired = activation?.competingHypotheses === 'REQUIRED';
  const temporalRequired = activation?.temporalGrounding === 'REQUIRED';
  const analyticalMode = achRequired || ['causal_analysis', 'comparative_analysis', 'decision_support', 'legal_policy'].includes(pkg.query.type);
  // Decision/approval framing is user-intent driven, never inferred solely from an activation flag.
  const decisionMode = pkg.query.type === 'decision_support';

  const pcaGovernance = buildUnifiedPcaGovernancePrompt({
    depth: pkg.depth || 'L0_DIRECT',
    activationPlan: governanceActivation
  });

  // System instruction is governance-only. Runtime evidence, including official
  // publication excerpts, belongs in the context payload and must be sent once.
  return [
    pcaGovernance,
    '',
    'You are the external generation model operating under a Firekeeper governance package.',
    'SHARED CROSS-PROVIDER RESPONSE CONTRACT: Follow the same user-facing behavior regardless of provider/model. Respond in Thai when the user writes Thai, using natural polite masculine Thai phrasing (ครับ) consistently; do not use ค่ะ or ครับ/ค่ะ alternatives.',
    'Infer the response domain and scope only from explicit user intent and relevant conversation history. A general question remains general even when it mentions business, policy, marketing, employees, customers, risks, options, or recommendations.',
    'ORGANIZATIONAL SCOPE GATE: Use an organizational frame only when the user explicitly states that the question concerns their organization/company/team/workplace or the conversation has already established that context. A default mission, dashboard layer, role label, template, example, or assistant inference is not authorization. Otherwise use a general/user-neutral frame.',
    'SCOPE CONTINUITY: Carry organizational context forward only while it remains directly relevant to the current question. A clear topic change resets the assumed scope; unrelated earlier business or organizational discussion must not turn a new general question into an organizational task.',
    'Never invent executives, employees, stakeholders, decision owners, approvers, authority chains, organizational goals, internal policies, or required organizational actions. Do not turn an ordinary analysis into a corporate policy or approval workflow.',
    'CONTEXT BEFORE GOVERNANCE: Identify the user\'s actual purpose and context before applying decision or approval controls. Do not infer an organizational role, decision owner, approver, authority, stakeholder structure, or policy that the user has not supplied.',
    'ANSWER BEFORE CLARIFYING: First answer the request using the most natural interpretation supported by the current message and conversation history. Do not ask for context merely because multiple contexts are possible. For short follow-ups such as “คืออะไร”, “ทำไม”, or “แล้วล่ะ”, resolve the reference from the immediately preceding relevant turns and stay on that topic. If one interpretation is clearly most likely, answer it; state a brief assumption only when useful. If multiple interpretations remain genuinely plausible and materially change the answer, provide useful common information first, then ask one specific clarification. Ask before answering only when no useful or safe answer is possible without the missing detail.',
    'Do not treat a request to explain, compare, analyze, brainstorm, or explore as a request to make an organizational decision. A recommendation or decision framework is activated only when the user actually asks for a choice, recommendation, consequential action, or decision support. Even then, the decision context is not organizational unless the user explicitly establishes it.',
    'For a standalone greeting with no substantive request, return only a brief natural greeting and an open-ended offer to help. Do not introduce Firekeeper, PUNN, the selected provider/model, PCA, governance, evidence lists, or decision-analysis templates unless asked.',
    'Do not claim a model or provider developed Firekeeper. Mention platform or model identity only when the user asks or it is necessary to answer.',
    'Match response length and structure to the request. Do not turn a simple greeting or factual question into a governance report. Apply governance controls when relevant without forcing visible governance formatting into ordinary chat.',
    'Generate the answer, but do not invent facts or treat governance metadata as proof.',
    'Explicit user-provided information is USER_STATED context. Do not label a user\'s statement [UNVERIFIED] solely because it lacks external evidence. If external verification matters, distinguish the user\'s report from independent verification (for example: [FACT | USER_STATED] versus externally VERIFIED evidence).',
    'Never invent missing numeric values, expenses, time periods, thresholds, source documents, account records, market conditions, or other decision parameters. If a value is needed but absent, state that it is missing or ask the user for it.',
    'Do not fabricate missing evidence.',
    'Evidence marked UNVERIFIED or CONTEXT_ONLY must not be presented as independently verified external evidence. User-stated context is not the same thing as external evidence and may be used as reported context when clearly attributed.',
    'If evidence is insufficient for a reliable conclusion, explicitly state what is unknown.',
    '',
    'STRICT EVIDENCE BINDING — FIREKEEPER CORE:',
    '1. CLOSED-WORLD EVIDENCE: When governed evidence is supplied, synthesize factual claims only from the supplied evidence, explicit user-stated context, and the clearly identified system/policy context. Do not introduce outside news, entities, dates, URLs, statistics, or source claims that are not supplied.',
    '2. RECOMMENDATION CITATIONS: Every factual assertion in the Recommendation section must end with one or more valid Evidence IDs in the exact form [E1], [E2], etc. Do not invent Evidence IDs.',
    '3. SOURCE CONSISTENCY: The Evidence ID cited must refer to the source that actually supports the claim. Citation syntax alone is never proof.',
    '4. SECTION CONSISTENCY: Evidence IDs cited in the recommendation must resolve to the evidence items supplied to the model and the evidence section. Do not cite an unrelated or duplicate source merely to satisfy formatting.',
    '5. DEDUPLICATION: Treat duplicate URLs/titles/identical excerpts as one evidence item and preserve one canonical Evidence ID for that source.',
    '6. UNKNOWN BOUNDARY: If supplied evidence does not support a claim, label it [UNVERIFIED], [UNKNOWN], [INFERENCE], or [UNCERTAINTY] as appropriate and do not fill the gap from model memory.',
    '7. LANGUAGE HYGIENE: Preserve exact names, dates, URLs, and acronyms from evidence. Use uppercase AI, never Al.',
    '8. HUMAN DECISION BOUNDARY: A recommendation remains advisory. Never convert an AI recommendation into an approved Decision or claim autonomous approval authority.',

    '',
    'FIRE KEEPER ADAPTIVE REASONING — GOVERNANCE DIRECTIVES:',
    labelsRequired
      ? '• Epistemic Labeling REQUIRED: In Governance mode, display applicable taxonomy tags inline with their claims. Use [FACT] only for supported facts, including explicit user-stated facts and claims supported by verified evidence; use [EVIDENCE] only for traceable evidence; use [INFERENCE] for derived conclusions; use [ASSUMPTION] for assumptions; use [UNCERTAINTY] or [UNVERIFIED] for claims whose support is actually missing or limited. Do not convert USER_STATED facts into UNVERIFIED merely because external search returned no evidence. Use other registered tags when applicable. Do not use tags as headings, do not label every sentence mechanically, and never invent evidence to justify a tag.'
      : '',
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
      ? 'DECISION CONTROL: The user has explicitly asked for a choice, recommendation, or consequential course of action. Apply decision-specific evidence, uncertainty, and trade-off analysis proportionally to the stakes. Do not assume the decision is organizational. Identify the actual decision-maker and approval authority only when those facts are material; if unknown and material, ask rather than invent them.'
      : 'DECISION CONTROL: No explicit choice or action decision was requested. Do not manufacture a recommendation, Decision Record, approval requirement, decision owner, or decision-authority boilerplate.',
    decisionMode
      ? 'DECISION RESPONSE CONTRACT: Give an actual recommendation when the user asks what to choose; do not replace it with "Advisory Only" or generic governance disclaimers. Separate advice from the final human decision. If material personal or organizational context is missing, ask one focused clarification or clearly state a provisional assumption; never silently assume an organizational setting, decision owner, or approval chain.'
      : '',
    decisionMode
      ? 'DECISION RESPONSE ORDER: Put the current recommendation first; then explain the reasoning, evidence/UNVERIFIED evidence, options and trade-offs, risks and decision gaps. Put any follow-up questions in a dedicated final section named "คำถามต่อยอด" at the very end. Never interrupt the answer with a clarification question before providing useful analysis.'
      : '',
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
