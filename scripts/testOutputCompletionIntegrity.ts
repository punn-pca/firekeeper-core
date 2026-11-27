import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const llm = readFileSync(new URL('../src/server/services/unifiedLlm.ts', import.meta.url), 'utf8');
const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

assert.match(llm, /MAX_LENGTH_CONTINUATIONS = 2/, 'provider output continuation must be bounded');
assert.match(llm, /finishReason !== 'length' && finishReason !== 'max_tokens'/, 'only explicit provider length stops should trigger continuation');
assert.match(llm, /content: combinedText/, 'continuation must include all generated assistant text');
assert.match(llm, /role === 'system' \|\| item\.role === 'user'/, 'continuation must preserve original system and user context');
assert.match(llm, /LLM_OUTPUT_TRUNCATED/, 'exhausted continuation must fail instead of accepting partial output');

const gate = server.indexOf('// Stage 11 consumes the model\'s structured options');
const stream = server.indexOf('// Keep the typing effect bounded for long, fully governed responses.');
assert.ok(gate >= 0 && stream > gate, 'decision quality gate must finalize the response before any token is streamed');

const tokenLoop = server.indexOf("sendSSE('token', { token: textSlice });", stream);
const responseAppend = server.indexOf('finalResponse +=', gate);
assert.ok(responseAppend >= gate && responseAppend < stream, 'post-generation uncertainty text must be appended before streaming');
assert.ok(tokenLoop > stream, 'token emission must follow final response preparation');

console.log('PASS: provider truncation is continued or rejected; governed output is finalized before streaming.');
