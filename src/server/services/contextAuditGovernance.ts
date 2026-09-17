import { ConversationTurn } from '../../types';

export interface GovernedContextAuditMetrics {
  retrieved_count: number;
  relevant_count: number;
  contextually_relevant_count: number;
  isolated_count: number;
  excluded_count: number;
  relevance_mean: number;
  contamination_rate: number;
  cross_topic_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reported_context_coverage: string;
  coverage_status: string;
}

const NOISE_REGEX = /^(สวัสดี|สวัสดีครับ|สวัสดีค่ะ|หวัดดี|ขอบคุณ|ขอบคุณครับ|ขอบคุณค่ะ|hello|hi|thanks|thank you|ok|โอเค)\b/i;

/**
 * Conservative conversation-context audit.
 *
 * Only explicit signals are counted as relevant. Absence of a signal is not
 * treated as proof of irrelevance, contamination, or complete coverage.
 */
export function calculateGovernedContextAuditMetrics(history: ConversationTurn[]): GovernedContextAuditMetrics {
  const turns = Array.isArray(history) ? history : [];
  const usable = turns.filter((turn) => {
    const text = String(turn?.content || '').trim();
    return text.length > 0 && !(text.length < 15 && NOISE_REGEX.test(text));
  });

  const relevant = usable.filter((turn) => {
    const text = String(turn?.content || '');
    return /\[(ข้อเท็จจริง|FACT|CONSTRAINT|EVIDENCE|หลักฐาน|ข้อจำกัด)\]/i.test(text)
      || /^(Fact|Constraint|Evidence):/i.test(text.trim());
  });

  const contextual = usable.filter((turn) => {
    const text = String(turn?.content || '');
    return /\[(บริบท|CONTEXT|OBSERVATION|ข้อสังเกต)\]/i.test(text)
      || /^(Context|Observation):/i.test(text.trim());
  });

  const relevanceMean = usable.length > 0
    ? Number(((relevant.length + contextual.length) / usable.length).toFixed(2))
    : 0;

  const signalCoverage = usable.length > 0
    ? Math.min(1, (relevant.length + contextual.length) / usable.length)
    : 0;

  return {
    retrieved_count: turns.length,
    relevant_count: relevant.length,
    contextually_relevant_count: contextual.length,
    isolated_count: 0,
    excluded_count: turns.length - usable.length,
    relevance_mean: relevanceMean,
    // No semantic contamination detector exists here; 0 means "no observed
    // contamination signal", not proof that contamination is impossible.
    contamination_rate: 0,
    cross_topic_risk: usable.length === 0 ? 'HIGH' : signalCoverage < 0.25 ? 'HIGH' : signalCoverage < 0.60 ? 'MEDIUM' : 'LOW',
    reported_context_coverage: usable.length === 0 ? '0%' : `${Math.round(signalCoverage * 100)}%`,
    coverage_status: usable.length === 0
      ? 'NO_CONTEXT'
      : signalCoverage >= 0.60
        ? 'SIGNAL_BACKED_CONTEXT'
        : 'PARTIAL_SIGNAL_CONTEXT',
  };
}
