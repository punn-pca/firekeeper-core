import { EvidenceItem, DecisionRelevance, CounterfactualImpact, ConflictRecord } from '../../types';

/**
 * PCA v3.0 Epistemic Analysis Service
 * Implements Decision Relevance Test and Counterfactual Auditing
 */

/**
 * Evaluates the relevance of an evidence item to the current decision query.
 * Logic:
 * 1. CRITICAL: Directly supports or refutes a core requirement or constraint.
 * 2. RELEVANT: Provides supporting context but isn't a single point of failure.
 * 3. NON_CRITICAL: Tangential or redundant information.
 */
export function evaluateDecisionRelevance(query: string, item: EvidenceItem): DecisionRelevance {
  const q = query.toLowerCase();
  const text = item.content.toLowerCase();
  
  // Rule 1: High keyword overlap + causal terms
  const keywords = q.split(/\s+/).filter(t => t.length > 3);
  let matches = 0;
  for (const k of keywords) {
    if (text.includes(k)) matches++;
  }
  
  const overlap = keywords.length > 0 ? matches / keywords.length : 0;
  const hasUrgentModifier = /(must|required|essential|critical|mandatory|necessary|ควร|ต้อง|จำเป็น)/i.test(text);

  if (overlap > 0.7 || (overlap >= 0.2 && hasUrgentModifier)) {
    return 'CRITICAL';
  }
  
  if (overlap > 0.2) {
    return 'RELEVANT';
  }
  
  return 'NON_CRITICAL';
}

/**
 * Performs a Counterfactual Audit on an evidence item.
 * "What happens to the decision if this evidence is removed or proven false?"
 */
export function performCounterfactualAudit(item: EvidenceItem): CounterfactualImpact {
  // Logic: Based on credibility and relevance
  if (item.relevance === 'CRITICAL') {
    if (item.credibilityScore > 80) return 'DECISION_CRITICAL';
    return 'HIGH_IMPACT';
  }
  
  if (item.relevance === 'RELEVANT') {
    return 'LOW_IMPACT';
  }
  
  return 'NO_IMPACT';
}

/**
 * Detects conflicts between two evidence items.
 */
export function detectConflicts(itemA: EvidenceItem, itemB: EvidenceItem): ConflictRecord | null {
  // Placeholder for advanced semantic conflict detection
  // For now, simple keyword contradiction check
  const textA = itemA.content.toLowerCase();
  const textB = itemB.content.toLowerCase();
  
  const contradictions = [
    ['ใช่', 'ไม่ใช่'],
    ['yes', 'no'],
    ['high', 'low'],
    ['increase', 'decrease'],
    ['ปลอดภัย', 'อันตราย'],
    ['safe', 'unsafe']
  ];
  
  for (const [pos, neg] of contradictions) {
    if ((textA.includes(pos) && textB.includes(neg)) || (textA.includes(neg) && textB.includes(pos))) {
      // Check if they are talking about the same thing (keyword overlap)
      const wordsA = textA.split(/\s+/).filter(w => w.length > 4);
      let common = 0;
      for (const w of wordsA) {
        if (textB.includes(w)) common++;
      }
      
      if (common > 2) {
        return {
          id: `conflict-${itemA.id}-${itemB.id}`,
          sourceA: itemA.source,
          sourceB: itemB.source,
          type: 'CONTRADICTION',
          severity: itemA.relevance === 'CRITICAL' || itemB.relevance === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          description: `Direct contradiction found regarding common keywords: ${wordsA.filter(w => textB.includes(w)).join(', ')}`,
          impactOnDecision: 'HIGH',
          resolutionStatus: 'UNRESOLVED'
        };
      }
    }
  }
  
  return null;
}
