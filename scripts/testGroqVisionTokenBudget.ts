import assert from 'node:assert/strict';
import { estimateGroqPromptTokens } from '../src/server/services/unifiedLlm';

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

console.log('PASS: Groq image token budget ignores base64 transport payload');
