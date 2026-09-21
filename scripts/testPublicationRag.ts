import assert from 'node:assert/strict';
import { retrievePublicationKnowledge } from '../src/server/services/publicationKnowledge';

type Case = { query: string; expectedSource: string; label: string };

const cases: Case[] = [
  { query: 'Firekeeper Theory PCA 12 stages Human Approval Gate', expectedSource: 'Firekeeper Theory', label: 'Theory' },
  { query: 'Practical Guide', expectedSource: 'Practical Guide', label: 'Practical Guide' },
  { query: 'Case Studies', expectedSource: 'Case Studies', label: 'Case Studies' },
  { query: 'Quick Start', expectedSource: 'Quick Start', label: 'Quick Start' },
  { query: 'AI Governance Human Agency', expectedSource: 'AI Governance', label: 'AI Governance' },
  { query: 'Sacred Flame พระเจ้า มนุษย์ เสรีภาพ เปลวไฟ', expectedSource: 'Sacred Flame', label: 'Sacred Flame' },
];

let failures = 0;
for (const testCase of cases) {
  const chunks = retrievePublicationKnowledge(testCase.query, 6);
  const sources = [...new Set(chunks.map(c => c.source))];
  const ok = chunks.length > 0 && sources.includes(testCase.expectedSource);
  console.log(`[Publication RAG] ${testCase.label}: ${ok ? 'PASS' : 'FAIL'} | chunks=${chunks.length} | sources=${sources.join(', ')}`);
  if (!ok) failures++;
}

const fallbackProbe = retrievePublicationKnowledge('มนุษย์ เสรีภาพ ไฟ', 6);
assert.ok(fallbackProbe.length > 0, 'Lexical fallback must return publication chunks without any embedding/API dependency');
assert.ok(fallbackProbe.every(c => c.hash && c.canonicalUrl && c.sourceType === 'OFFICIAL_PUBLICATION'), 'Every retrieved chunk must preserve provenance metadata');

if (failures > 0) {
  throw new Error(`Publication RAG retrieval regression: ${failures} corpus checks failed`);
}

console.log('[Publication RAG] PASS: corpus retrieval + lexical fallback + provenance metadata');
