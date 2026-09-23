import assert from 'node:assert/strict';
import { retrievePublicationKnowledge, retrievePublicationKnowledgeHybrid, detectNamedPublication, hasExplicitPublicationIntent, shouldSupplementPublicationWithWeb, isPublicationInventoryQuestion, getPublicationInventory, resolvePublicationEvidence } from '../src/server/services/publicationKnowledge';

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

const sacredQuery = 'Sacred Flame มองเสรีภาพของมนุษย์อย่างไร';
const sacredChunks = retrievePublicationKnowledge(sacredQuery, 6);
assert.ok(sacredChunks.some(c => c.source === 'Sacred Flame'), 'Named Sacred Flame query must retrieve Sacred Flame as official publication evidence');
const sacredContext = sacredChunks.map(c => `[${c.source}] ${c.section}\n${c.content}`).join('\n');
assert.ok(sacredContext.includes('[Sacred Flame]'), 'Retrieved context passed downstream must contain Sacred Flame publication evidence');
console.log('[Publication RAG] PASS: named Sacred Flame query preserves official publication context for downstream grounding');

assert.equal(detectNamedPublication('Sacred Flame มองเสรีภาพของมนุษย์ยังไง?'), 'Sacred Flame');
const namedSacred = await retrievePublicationKnowledgeHybrid('Sacred Flame มองเสรีภาพของมนุษย์ยังไง?', 6);
assert.ok(namedSacred.length > 0, 'Named Sacred Flame query must return publication chunks');
assert.ok(namedSacred.every(c => c.source === 'Sacred Flame'), 'Named Sacred Flame query must be corpus-locked to Sacred Flame');
assert.ok(namedSacred.some(c => /เสรีภาพ|Free Will/i.test(c.section + ' ' + c.content)), 'Sacred Flame freedom query must retrieve freedom/Free Will content');
console.log('[Publication RAG] PASS: named Sacred Flame identity is resolved before hybrid retrieval and freedom content is retrieved');

const corpusQuestion = 'มีข้อมูลใน RAG มั้ย เรื่อง firekeeper';
assert.equal(hasExplicitPublicationIntent(corpusQuestion), true);
assert.equal(isPublicationInventoryQuestion(corpusQuestion), true);
assert.equal(isPublicationInventoryQuestion('Firekeeper RAG ทำงานอย่างไร'), false);
const inventory = getPublicationInventory();
assert.ok(inventory.some(item => item.source === 'Firekeeper Theory' && item.chunkCount > 0 && item.url));
assert.equal(shouldSupplementPublicationWithWeb(corpusQuestion, [], inventory.length > 0), false);
const corpusRoute = await resolvePublicationEvidence(corpusQuestion);
assert.equal(corpusRoute.intent, true);
assert.equal(corpusRoute.needsWeb, false);
assert.equal(corpusRoute.chunks.length, 0, 'Inventory questions must not inject unrelated passages');
assert.ok(corpusRoute.inventory.length > 0, 'Inventory must come from loaded canonical files');
assert.equal(hasExplicitPublicationIntent('RAG คืออะไร'), false);
assert.equal((await resolvePublicationEvidence('RAG คืออะไร')).intent, false);
assert.equal((await resolvePublicationEvidence('official publication ของ WHO คืออะไร')).intent, false);
assert.equal((await resolvePublicationEvidence('AI Governance ของ WHO คืออะไร')).intent, false);
assert.equal((await resolvePublicationEvidence('Practical Guide ของ WHO')).intent, false);
assert.equal(detectNamedPublication('ทฤษฎี firekeeper คืออะไร'), 'Firekeeper Theory');
assert.equal(hasExplicitPublicationIntent('ทฤษฎี firekeeper คืออะไร'), true);
const contentRoute = await resolvePublicationEvidence('ทฤษฎี firekeeper คืออะไร');
assert.ok(contentRoute.chunks.length > 0 && contentRoute.chunks.every(c => c.source === 'Firekeeper Theory'));
const chapterRoute = await resolvePublicationEvidence('บทที่ 17 ของ Firekeeper Theory พูดถึงอะไร');
assert.ok(chapterRoute.chunks.length > 0 && chapterRoute.chunks.every(c => c.source === 'Firekeeper Theory' && /บทที่\s*17(?!\d)/.test(c.section)));
const chapterInRag = await resolvePublicationEvidence('มีข้อมูลใน RAG มั้ย เรื่อง firekeeper บทที่ 17');
assert.ok(chapterInRag.chunks.length > 0 && chapterInRag.chunks.every(c => /บทที่\s*17(?!\d)/.test(c.section)));
const chapterRange = await resolvePublicationEvidence('บทที่ 17-18 ของ Firekeeper Theory');
assert.ok(chapterRange.chunks.some(c => /บทที่\s*17(?!\d)/.test(c.section)));
assert.ok(chapterRange.chunks.some(c => /บทที่\s*18(?!\d)/.test(c.section)));
assert.equal(shouldSupplementPublicationWithWeb('ค้นเว็บล่าสุดเกี่ยวกับ Firekeeper Theory', contentRoute.chunks), true);
assert.equal(shouldSupplementPublicationWithWeb(corpusQuestion, []), true);
console.log('[Publication RAG] PASS: corpus intent routes to publication first and uses web only when requested or evidence is absent');
