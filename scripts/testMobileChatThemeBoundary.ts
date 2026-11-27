import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chat = readFileSync('src/components/MobileChatLayout.tsx', 'utf8');
const composer = readFileSync('src/components/MobileComposer.tsx', 'utf8');
const css = readFileSync('src/index.css', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');

assert.match(chat, /isLight \? 'bg-slate-50 text-slate-900' : 'bg-\[#060a16\] text-white'/);
assert.match(chat, /isLight \? 'text-slate-600' : 'text-slate-400'/);
assert.match(chat, /isLight \? 'text-amber-700' : 'text-amber-400'/);
assert.match(composer, /isLight \? 'border-slate-300 text-slate-600 hover:bg-slate-100'/);
assert.match(composer, /grid grid-cols-4 lg:flex/);
assert.match(app, /activeTab === 'chat' && !isLight \? 'fk-executive-premium'/);
assert.match(css, /\[data-theme="light"\] \.firekeeper-chat-scroll h1\.bg-clip-text\.text-transparent\s*\{\s*color: transparent !important;/);
console.log('Mobile chat theme source regression checks passed.');
