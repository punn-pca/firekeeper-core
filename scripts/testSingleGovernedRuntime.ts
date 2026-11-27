import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const server = read('server.ts');
const app = read('src/App.tsx');
const composer = read('src/components/Chatข้อมูลนำเข้า.tsx');
const settings = read('src/components/Chatตั้งค่าModal.tsx');
const mobileSettings = read('mobile/src/components/ChatSettingsModal.tsx');
const mobileChat = read('mobile/src/screens/ChatScreen.tsx');
const gateway = read('src/server/integrations/openclawGateway.ts');

assert.ok(!fs.existsSync(path.join(process.cwd(), 'src/server/services/normalChatService.ts')),
  'The standalone Normal Chat service must not exist');
assert.ok(!server.includes('normalChatService') && !server.includes('handleNormalChatStream'),
  'The main server must not import or route to a Normal Chat handler');
assert.ok(!server.includes("mode === 'normal'") && !server.includes('dailyDirectCount'),
  'The server must not retain a separate Normal Mode quota or route');
assert.ok(server.includes('Legacy clients may still send') && server.includes('intentionally ignored'),
  'Legacy mode parameters must be ignored by the server');
assert.ok(!app.includes('requestMode') && !app.includes('mode: requestMode'),
  'The web client must not send or select an execution mode');
assert.ok(!app.includes('pendingModeConsent') && !app.includes('showHandoffOffer'),
  'The legacy mode handoff UI must be removed');
assert.ok(!composer.includes('onToggleMode') && !composer.includes('Normal Mode'),
  'The web composer must not expose a Normal Mode selector');
assert.ok(!settings.includes('Normal Mode') && !settings.includes('chatMode'),
  'Settings must describe one fixed PCA architecture');
assert.ok(!mobileSettings.includes('Normal Mode') && !mobileSettings.includes('Compare Mode'),
  'The mobile app must not expose Normal or Compare modes');
assert.ok(!mobileChat.includes('compareResult') && !mobileChat.includes("mode: 'normal'"),
  'The mobile chat must not render or request Normal/Compare responses');
assert.ok(!gateway.includes('executeNormalChat') && !gateway.includes('firekeeper-direct'),
  'OpenClaw must not expose a direct-chat model');
assert.ok(gateway.includes("active_modes: ['governed']"),
  'OpenClaw health must advertise the single governed runtime');

console.log('PASS: FIREKEEPER has one governed PCA chat runtime; Normal/Compare execution paths are absent.');
