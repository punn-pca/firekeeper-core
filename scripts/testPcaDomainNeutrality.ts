import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routeRequest } from '../src/server/services/visionRouter';

const serverSource = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

assert.match(
  serverSource,
  /state\.understanding = 'ทำความเข้าใจบริบท เป้าหมาย ข้อจำกัด และข้อมูลที่ผู้ใช้ให้มา โดยไม่สมมติประเภทของงานหรือโดเมนล่วงหน้า'/,
  'Stage 2 must infer context from the actual request, not assume a domain',
);
assert.match(
  serverSource,
  /ปรับวิธีตอบและระดับการวิเคราะห์ให้ตรงกับเจตนาและโดเมนของคำขอ ไม่บังคับใช้กรอบการตัดสินใจเชิงองค์กร/,
  'Stage 3 must preserve domain neutrality',
);
assert.doesNotMatch(
  serverSource,
  /ผู้ใช้ต้องการวิเคราะห์หาความจริงตามพยานหลักฐาน ประเมินความน่าจะเป็น และรับคำแนะนำยุทธศาสตร์/,
  'The old organization/strategy-biased Stage 2 default must not return',
);

const defaultRoute = routeRequest('อธิบายเรื่องนี้ให้เข้าใจง่าย');
assert.equal(defaultRoute.provider, 'groq');
assert.equal(defaultRoute.model, 'openai/gpt-oss-120b');

console.log('PASS: PCA domain-neutrality and Groq default regression checks');
