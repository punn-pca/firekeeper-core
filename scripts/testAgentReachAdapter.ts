import assert from 'node:assert/strict';
import { retrieveAgentReachEvidence } from '../src/server/integrations/agentReachAdapter';

async function main() {
  assert.deepEqual(await retrieveAgentReachEvidence('test', { enabled: false }), []);
  assert.deepEqual(await retrieveAgentReachEvidence('test', { enabled: true }), []);
  await assert.rejects(() => retrieveAgentReachEvidence('', {
    enabled: true, endpoint: 'https://example.com/api',
  }), /INVALID_AGENT_REACH_QUERY/);
  console.log('Agent Reach adapter disabled-by-default contract passed');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
