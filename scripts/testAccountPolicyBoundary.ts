import assert from 'node:assert/strict';
import { DEFAULT_ACCOUNT_POLICY, parseAccountPolicy, providerAllowed, requiresCustomEndpointOptIn, restrictedTopic, decisionApprovalHash, hasMatchingDecisionApproval } from '../src/server/services/accountPolicy';
import { retentionDaysFor } from '../src/server/services/retentionPolicy';
import { getPlan } from '../src/config/plans';

const policy = parseAccountPolicy({ allowedProviders: ['openai'], approvalRequired: true, restrictedTopics: ['financial-risk', 'ข้อมูลลับ'] });
assert(!providerAllowed(policy, 'deepseek_vision'), 'image routing cannot bypass provider policy');
assert(providerAllowed(policy, 'openai'));
assert(providerAllowed(DEFAULT_ACCOUNT_POLICY, 'gemini'), 'default governance policy must not silently block configured BYOK providers');
assert(!providerAllowed(DEFAULT_ACCOUNT_POLICY, 'custom'), 'custom endpoints require explicit policy opt-in');
assert(!providerAllowed(DEFAULT_ACCOUNT_POLICY, 'ollama'), 'local Ollama endpoints require explicit policy opt-in');
assert(!requiresCustomEndpointOptIn('ollama', 'https://ollama.firekeeper.site/', 'https://ollama.firekeeper.site'), 'the built-in Ollama endpoint must not also require custom endpoint approval');
assert(requiresCustomEndpointOptIn('ollama', 'http://localhost:11434', 'https://ollama.firekeeper.site'), 'a user-supplied Ollama endpoint must require custom endpoint approval');
assert(!requiresCustomEndpointOptIn('openai', 'https://api.openai.com/v1/', 'https://api.openai.com/v1'), 'a provider default URL must not require custom endpoint approval');
assert(requiresCustomEndpointOptIn('openai', 'https://proxy.example/v1', 'https://api.openai.com/v1'), 'a provider URL override must require custom endpoint approval');
assert(providerAllowed({ ...policy, allowedProviders: ['deepseek'] }, 'deepseek_vision'));
assert.equal(restrictedTopic(policy, ['FINANCIAL risk']), 'financial-risk');
assert.equal(restrictedTopic(policy, ['เอกสารข้อมูลลับ']), 'ข้อมูลลับ');
assert.equal(restrictedTopic(policy, ['unrelated']), null);
assert.throws(() => parseAccountPolicy({ ...policy, allowedProviders: ['unknown'] }));
assert.throws(() => parseAccountPolicy({ ...policy, approvalRequired: 'false' }));
assert(!providerAllowed({ ...policy, allowedProviders: [] }, 'openai'));
const decision = { question: 'Proceed?', context: [], options: [], risks: [], uncertainties: [], consequences: [], evidence: [], assumptions: [],
  confidence: { score: null, label: 'UNKNOWN', breakdown: {} }, applicable_policies: [], policy_conflicts: [], escalation_required: false, controlLevel: 'LOW' };
let workspace = { ownerId: 'owner', members: [{ userId: 'alice', role: 'analyst' }, { userId: 'reviewer', role: 'reviewer' }] };
let approval = { status: 'APPROVED', reviewedBy: 'reviewer', decisionHash: decisionApprovalHash(decision) };
const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => workspace }),
  collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => approval }) }) }) }) }) };
assert(await hasMatchingDecisionApproval(db, 'alice', 'w', 'a', decision));
assert(!await hasMatchingDecisionApproval(db, 'outsider', 'w', 'a', decision));
assert(!await hasMatchingDecisionApproval(db, 'alice', 'w', 'a', { ...decision, question: 'Changed' }));
approval.status = 'REJECTED'; assert(!await hasMatchingDecisionApproval(db, 'alice', 'w', 'a', decision));
approval.status = 'APPROVED'; workspace.members = workspace.members.filter(m => m.userId !== 'reviewer');
assert(!await hasMatchingDecisionApproval(db, 'alice', 'w', 'a', decision));
assert.equal(decisionApprovalHash(decision), decisionApprovalHash({ ...decision, human_decision: { status: 'ACCEPTED' } }));
const defaults = { conversations: 30, memories: 90, auditLogs: 365 };
for (const [id, days] of [['free', 7], ['byok', 30], ['professional', 365], ['team', 90], ['business', 365]] as const) {
  assert.equal(retentionDaysFor(getPlan(id), 'conversations', defaults), days);
  assert.equal(retentionDaysFor(getPlan(id), 'auditLogs', defaults), days);
}
assert.equal(retentionDaysFor(getPlan('enterprise'), 'conversations', defaults), 30);
assert.equal(retentionDaysFor(getPlan('free'), 'memories', defaults), 90);
console.log('Account policy, approval binding, and plan retention tests passed.');
