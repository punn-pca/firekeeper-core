import crypto from 'node:crypto';
import { DecisionObjectSchema } from '../../shared/contracts/decision';

export const POLICY_PROVIDERS = ['deepseek', 'deepseek_vision', 'openai', 'anthropic', 'gemini', 'groq', 'mistral', 'perplexity', 'openrouter', 'ollama', 'custom'];
export type AccountPolicy = { allowedProviders: string[]; approvalRequired: boolean; restrictedTopics: string[] };
// Default hosted policy permits the supported managed providers, including the
// built-in Ollama service. User-supplied custom endpoints still require an
// explicit account policy opt-in. Capability support is not policy permission.
export const DEFAULT_ACCOUNT_POLICY: AccountPolicy = {
  allowedProviders: ['deepseek', 'deepseek_vision', 'openai', 'anthropic', 'gemini', 'groq', 'mistral', 'perplexity', 'openrouter', 'ollama'],
  approvalRequired: false,
  restrictedTopics: []
};

export function parseAccountPolicy(value: any): AccountPolicy {
  if (!value || !Array.isArray(value.allowedProviders) || typeof value.approvalRequired !== 'boolean' || !Array.isArray(value.restrictedTopics) ||
    value.allowedProviders.length > POLICY_PROVIDERS.length || value.restrictedTopics.length > 100 ||
    value.allowedProviders.some((p: unknown) => typeof p !== 'string' || !POLICY_PROVIDERS.includes(p)) ||
    value.restrictedTopics.some((t: unknown) => typeof t !== 'string' || !t.trim() || t.length > 200)) {
    throw new Error('INVALID_ACCOUNT_POLICY');
  }
  return { allowedProviders: [...new Set(value.allowedProviders)] as string[], approvalRequired: value.approvalRequired,
    restrictedTopics: [...new Set(value.restrictedTopics.map((t: string) => t.trim()))] as string[] };
}

export function providerAllowed(policy: AccountPolicy | null, provider: string): boolean {
  if (!policy) return true;
  const normalized = provider.toLowerCase();
  return policy.allowedProviders.includes(normalized) || (normalized === 'deepseek_vision' && policy.allowedProviders.includes('deepseek'));
}

function normalizeBaseUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    return `${url.protocol.toLowerCase()}//${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, '')}${url.search}`;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
}

/** Require custom-endpoint approval only when a provider URL overrides its built-in endpoint. */
export function requiresCustomEndpointOptIn(provider: string, baseUrl: string | undefined, defaultBaseUrl: string | undefined): boolean {
  if (!baseUrl || provider.toLowerCase() === 'custom') return false;
  if (!defaultBaseUrl) return true;
  return normalizeBaseUrl(baseUrl) !== normalizeBaseUrl(defaultBaseUrl);
}

// Restricted topics are literal phrases, not a claim of semantic classification.
export function restrictedTopic(policy: AccountPolicy | null, texts: string[]): string | null {
  if (!policy) return null;
  const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[-_\s]+/g, ' ');
  const corpus = texts.map(normalize).join('\n');
  return policy.restrictedTopics.find(topic => corpus.includes(normalize(topic))) || null;
}

function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Hash the validated decision, independent of client-supplied approval assertions. */
export function decisionApprovalHash(decision: unknown): string {
  const { human_decision, ...content } = DecisionObjectSchema.parse(decision);
  return crypto.createHash('sha256').update(canonical(content)).digest('hex');
}

export async function hasMatchingDecisionApproval(db: any, userId: string, workspaceId: string, approvalId: string, decision: unknown): Promise<boolean> {
  const workspaceRef = db.collection('workspaces').doc(workspaceId);
  const [workspace, approval] = await Promise.all([workspaceRef.get(), workspaceRef.collection('approvals').doc(approvalId).get()]);
  if (!workspace.exists || !approval.exists) return false;
  const data = workspace.data();
  const role = (uid: string) => data.ownerId === uid ? 'owner' : data.members?.find((m: any) => m.userId === uid)?.role;
  const record = approval.data();
  return Boolean(role(userId)) && ['owner', 'reviewer'].includes(role(record.reviewedBy)) &&
    record.status === 'APPROVED' && record.decisionHash === decisionApprovalHash(decision);
}
