export type GovernedPromptEvidence = {
  id: string;
  claim: string;
  source: string;
  credibility: number;
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTEXT_ONLY';
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
  };
  output_policy: {
    answer_question_directly: true;
    disclose_uncertainty: true;
    preserve_human_decision_authority: true;
  };
  external_ai_prompt: string;
  audit: {
    traceable: true;
    generated_at: string;
    package_version: '1.0';
  };
};

function inferQueryType(question: string): string {
  const q = question.toLowerCase();
  if (/\b(how|implement|code|debug|build|เขียน|แก้โค้ด|สร้างระบบ)\b/.test(q)) return 'technical';
  if (/\b(legal|law|regulation|policy|กฎหมาย|ระเบียบ|นโยบาย)\b/.test(q)) return 'legal_policy';
  if (/\b(compare|versus|which|เลือก|เปรียบเทียบ)\b/.test(q)) return 'decision_support';
  if (/\b(why|cause|ทำไม|สาเหตุ)\b/.test(q)) return 'causal_analysis';
  return 'factual';
}

function buildExternalPrompt(pkg: Omit<GovernedPromptPackage, 'external_ai_prompt'>): string {
  return [
    'You are the external generation model operating under a Firekeeper governance package.',
    'Generate the answer, but do not invent facts or treat governance metadata as proof.',
    '',
    'USER QUERY:',
    pkg.query.original,
    '',
    'VERIFIED / CLASSIFIED EVIDENCE:',
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
    'Return the best-supported answer. Clearly distinguish verified facts, inference, assumptions, and unknowns. Do not fabricate missing evidence. Preserve the user\'s final decision authority.'
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
  const base = {
    mode: 'GOVERNED_PROMPT' as const,
    query: {
      original: question,
      type: inferQueryType(question),
      objective: input.objective || 'Produce a well-grounded answer using governed evidence and explicit uncertainty.'
    },
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    claims: Array.isArray(input.claims) ? input.claims : [],
    risks: Array.isArray(input.risks) ? input.risks : [],
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
    },
    output_policy: {
      answer_question_directly: true as const,
      disclose_uncertainty: true as const,
      preserve_human_decision_authority: true as const,
    },
    audit: {
      traceable: true as const,
      generated_at: new Date().toISOString(),
      package_version: '1.0' as const,
    }
  };

  return {
    ...base,
    external_ai_prompt: buildExternalPrompt(base),
  };
}
