import { MemoryItem, MemoryCandidate, MemoryAuditRecord } from '../types';

let memoryAudits: MemoryAuditRecord[] = [];

export function recordMemoryAudit(
  memoryId: string,
  source: string,
  action: MemoryAuditRecord['action'],
  reason: string,
  prevValue?: string,
  newValue?: string,
  actor: string = 'User / System'
): MemoryAuditRecord {
  const record: MemoryAuditRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    memory_id: memoryId,
    source,
    action,
    previous_value: prevValue,
    new_value: newValue,
    actor,
    reason,
  };
  memoryAudits.unshift(record);
  console.log(`[Memory Governance Audit] ${action}:`, record);
  return record;
}

export function getMemoryAudits(): MemoryAuditRecord[] {
  return memoryAudits;
}

export function detectMemoryCandidates(
  text: string,
  existingMemories: MemoryItem[]
): MemoryCandidate[] {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();

  // Ignore general questions / temporary session chat / fictional examples
  if (
    lower.includes('fictional') ||
    lower.includes('สมมติ') ||
    lower.includes('baseline') ||
    lower.startsWith('สวัสดี') ||
    lower.startsWith('hello') ||
    lower.length < 15
  ) {
    return [];
  }

  const candidates: MemoryCandidate[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Check if line indicates Constraint, Preference, Fact, or Rule
    let detectedLayer: MemoryCandidate['layer'] | null = null;
    let authority: MemoryCandidate['authority'] = 'User';
    let mutability: MemoryCandidate['mutability'] = 'Mutable';
    let source = 'User Statement';
    let confidence = 0.90;

    if (
      lineLower.includes('constraint') ||
      lineLower.includes('governance') ||
      lineLower.includes('rule') ||
      lineLower.includes('ห้าม') ||
      lineLower.includes('ต้องรักษา') ||
      lineLower.includes('mandatory')
    ) {
      detectedLayer = 'Constraint';
      authority = lineLower.includes('system') ? 'System' : 'User';
      mutability = 'Protected';
      confidence = 0.95;
      source = 'User Statement / Governance Policy';
    } else if (
      lineLower.includes('preference') ||
      lineLower.includes('ชอบ') ||
      lineLower.includes('i prefer') ||
      lineLower.includes('my favorite')
    ) {
      detectedLayer = 'Preference';
      authority = 'User';
      mutability = 'Mutable';
      confidence = 0.91;
      source = 'User Profile';
    } else if (
      lineLower.includes('fact') ||
      lineLower.includes('ข้อเท็จจริง') ||
      lineLower.includes('organization') ||
      lineLower.includes('องค์กร')
    ) {
      detectedLayer = 'Fact';
      authority = 'User';
      mutability = 'Mutable';
      confidence = 0.89;
      source = 'User Statement';
    } else if (
      lineLower.includes('goal') ||
      lineLower.includes('objective') ||
      lineLower.includes('เป้าหมาย')
    ) {
      // Session goals should be kept as Context / Session State, not auto-committed LTM without review
      detectedLayer = 'Context';
      authority = 'Session';
      mutability = 'Mutable';
      confidence = 0.88;
      source = 'Session Context';
    }

    if (detectedLayer && line.length >= 12) {
      // Check deduplication against existing memories
      const duplicateMatch = existingMemories.find(
        (m) => m.content.toLowerCase().includes(lineLower) || lineLower.includes(m.content.toLowerCase().substring(0, 30))
      );

      const candidate: MemoryCandidate = {
        id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        content: line,
        layer: detectedLayer,
        source,
        authority,
        mutability,
        confidence,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        evidence: `Detected long-term memory pattern (${detectedLayer}) from user input.`,
        existingMatchId: duplicateMatch?.id,
        updateSuggested: !!duplicateMatch,
      };

      if (duplicateMatch) {
        recordMemoryAudit(
          duplicateMatch.id || 'unknown',
          source,
          'MEMORY_DUPLICATE_DETECTED',
          `Duplicate or update candidate detected for existing memory: "${duplicateMatch.content.substring(0, 40)}..."`,
          duplicateMatch.content,
          line
        );
      } else {
        recordMemoryAudit(
          candidate.id,
          source,
          'MEMORY_CANDIDATE_CREATED',
          `New memory candidate detected for Layer [${detectedLayer}] with confidence ${confidence}`
        );
      }

      candidates.push(candidate);
    }
  }

  return candidates;
}
