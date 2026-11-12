import assert from 'node:assert/strict';
import { estimateGroqPromptTokens, fitGroqMessagesToBudget } from '../src/server/services/unifiedLlm';

const oneLargeImage = [{
  role: 'user',
  content: [
    { type: 'text', text: 'ช่วยวิเคราะห์ภาพนี้' },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${'A'.repeat(1_000_000)}` } },
  ],
}];

const oneImageEstimate = estimateGroqPromptTokens(oneLargeImage);
assert(oneImageEstimate >= 2048, 'One image must count as at least 2,048 tokens');
assert(oneImageEstimate < 2200, 'Base64 transport bytes must not be counted as text tokens');

const threeImages = [{
  role: 'user',
  content: [
    { type: 'text', text: 'Compare these images' },
    ...Array.from({ length: 3 }, () => ({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${'B'.repeat(500_000)}` },
    })),
  ],
}];
const threeImageEstimate = estimateGroqPromptTokens(threeImages);
assert(threeImageEstimate >= 6144, 'Three images must count as 6,144 image tokens');
assert(threeImageEstimate < 6300, 'Three image base64 payloads must not inflate the token estimate');


const longHistory = [
  { role: 'system' as const, content: 'PCA governance instructions must remain intact.' },
  { role: 'user' as const, content: 'Old user context '.repeat(1800) },
  { role: 'assistant' as const, content: 'Old assistant response '.repeat(1800) },
  { role: 'user' as const, content: 'Recent user question: preserve this exact latest request.' },
];
const fittedHistory = fitGroqMessagesToBudget(longHistory, 2500);
assert(fittedHistory[0].role === 'system', 'System governance instructions must remain first');
assert(fittedHistory.some((message) => message.content === 'Recent user question: preserve this exact latest request.'), 'Latest user request must be preserved');
assert(estimateGroqPromptTokens(fittedHistory) <= 2500, 'Fitted conversation must stay within the prompt budget');
assert(fittedHistory.length < longHistory.length, 'Old conversation turns should be removed when over budget');

const oversizedEssential = fitGroqMessagesToBudget([
  { role: 'system', content: 'S'.repeat(24_000) },
  { role: 'user', content: 'Keep this request.' },
], 2500);
assert(estimateGroqPromptTokens(oversizedEssential) <= 2500, 'Essential context must be compacted before dispatch');
assert(oversizedEssential.some((message) => message.role === 'user' && message.content === 'Keep this request.'), 'Latest user request must survive compaction');

console.log('PASS: Groq image accounting and safe rolling context budget');
