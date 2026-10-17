import { reviewGovernedDecision, type DecisionOption, type DecisionEvidence } from './governedDecisionQuality';

export interface GovernedDecisionEnvelope {
  options: DecisionOption[];
  evidence: DecisionEvidence[];
  confidence: number | null;
}

/** Extract only a dedicated, parseable, bounded decision envelope.
 * Never infer verified evidence or confidence from free-form prose.
 */
export function extractGovernedDecisionEnvelope(text: string): GovernedDecisionEnvelope | null {
  const match = text.match(/<governed-decision-json>\s*([\s\S]*?)\s*<\/governed-decision-json>/);
  if (!match || match[1].length > 30000) return null;
  try {
    const raw: unknown = JSON.parse(match[1]);
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    if (!Array.isArray(obj.options) || !Array.isArray(obj.evidence) || obj.options.length > 12 || obj.evidence.length > 100) return null;
    const options: DecisionOption[] = obj.options.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new Error('INVALID_OPTION');
      const o = item as Record<string, unknown>;
      const strings = (key: string) => {
        if (!Array.isArray(o[key]) || !(o[key] as unknown[]).every(v => typeof v === 'string')) throw new Error('INVALID_ARRAY');
        return o[key] as string[];
      };
      if (typeof o.id !== 'string' || typeof o.title !== 'string' || !['primary', 'intermediate', 'defer'].includes(String(o.type))) throw new Error('INVALID_OPTION');
      return { id: o.id, title: o.title, type: o.type as DecisionOption['type'], benefits: strings('benefits'), costs: strings('costs'), risks: strings('risks'), assumptions: strings('assumptions'), evidenceIds: strings('evidenceIds') };
    });
    // Model output cannot certify evidence as verified. All model-supplied
    // evidence references are unverified until reconciled with trusted runtime.
    const evidence: DecisionEvidence[] = obj.evidence.map((item: unknown) => {
      if (!item || typeof item !== 'object' || typeof (item as Record<string, unknown>).id !== 'string') throw new Error('INVALID_EVIDENCE');
      return { id: (item as { id: string }).id, verified: false };
    });
    return { options, evidence, confidence: null };
  } catch { return null; }
}

export interface TrustedEvidenceRecord {
  id: string;
  source?: string;
  status?: string;
}

/** Only trusted server evidence can satisfy an option's evidence references.
 * A model-provided verified flag, URL or confidence is ignored.
 */
export function reconcileTrustedDecisionEvidence(
  envelope: GovernedDecisionEnvelope | null,
  trustedEvidence: TrustedEvidenceRecord[]
): DecisionEvidence[] {
  if (!envelope) return [];
  const trusted = new Map(trustedEvidence
    .filter(e => e.status === 'VERIFIED' && typeof e.source === 'string' && e.source.trim())
    .map(e => [e.id, e]));
  const ids = new Set(envelope.options.flatMap(o => o.evidenceIds));
  return [...ids].map(id => ({
    id,
    verified: trusted.has(id),
    source: trusted.get(id)?.source,
  }));
}

export function inspectGovernedDecision(text: string, isComplexDecision: boolean, trustedEvidence: TrustedEvidenceRecord[] = []) {
  const envelope = extractGovernedDecisionEnvelope(text);
  const quality = reviewGovernedDecision({
    options: envelope?.options ?? [],
    evidence: reconcileTrustedDecisionEvidence(envelope, trustedEvidence),
    isComplexDecision,
    confidence: null,
  });
  return { envelope, quality };
}

/**
 * Remove machine-only decision envelopes before any user-facing publication.
 * Accept literal and backslash-escaped tags, plus HTML-escaped tags. If an
 * opening marker is malformed or truncated, fail closed and suppress the tail.
 */
export function stripGovernedDecisionPayloads(text: string): string {
  let output = String(text || '');
  output = output.replace(/\\\\?<governed-decision-json\\s*>[\\s\\S]*?\\\\?<\\/governed-decision-json\\s*>/gi, '');
  output = output.replace(/&lt;governed-decision-json\\s*&gt;[\\s\\S]*?&lt;\\/governed-decision-json\\s*&gt;/gi, '');
  output = output.replace(/\\\\?<governed-decision-json\\b[\\s\\S]*$/gi, '');
  output = output.replace(/\\\\?<\\/governed-decision-json\\s*>/gi, '');
  return output.trimEnd();
}
