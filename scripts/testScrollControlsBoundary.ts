import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controls = readFileSync(new URL('../src/components/ScrollControls.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(app, /fk-chat-message-scroll overflow-y-auto/, 'Chat must expose its scroll container');
assert.match(app, /<ScrollControls isLight=\{isLight\} chatMode=\{activeTab === 'chat'\}/, 'Chat must use the shared scroll controls');
assert.match(controls, /new MutationObserver\(\(\) =>/, 'Scroll controls must observe chat container changes');
assert.match(controls, /window\.requestAnimationFrame\(/, 'Reconnect checks must be batched per frame');
assert.match(controls, /window\.cancelAnimationFrame\(pendingReconnect\)/, 'Pending reconnect must be cancelled on unmount');
assert.match(controls, /if \(next === element\) \{\s*update\(\);\s*return;/, 'Content changes must refresh button visibility even when container stays mounted');
assert.match(controls, /new MutationObserver\(scheduleUpdate\)/, 'Streaming mutations must use batched updates');
assert.match(controls, /window\.cancelAnimationFrame\(pendingUpdate\)/, 'Pending scroll updates must be cancelled on cleanup');
assert.match(controls, /new ResizeObserver\(update\)/, 'Scroll controls must react to resized chat containers');
assert.match(controls, /element\?\.removeEventListener\('scroll', update\)/, 'Scroll listener must be cleaned up');
assert.match(controls, /hostObserver\.disconnect\(\)/, 'DOM observer must be cleaned up');
assert.match(controls, /if \(chatMode && !element\)/, 'Missing chat container must not scroll the page');
assert.match(controls, /top-1\/2 -translate-y-1\/2/, 'Controls must remain vertically centered');
console.log('Scroll controls source-contract checks passed (browser behavior not covered).');
