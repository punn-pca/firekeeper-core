import assert from 'assert';
import { buildWebEvidenceGovernanceContext } from '../src/server/services/webEvidenceGovernance';
import { WebSearchExecutionResult } from '../src/server/services/webSearch';

console.log('Starting Web Evidence Governance Unit Tests...');

// 1. When web search is empty or failed -> returns empty string
const emptyResult: WebSearchExecutionResult = {
  success: false,
  query: 'test query',
  searchQueries: ['test query'],
  results: [],
  retrievedAt: new Date().toISOString(),
  statusMessage: 'Failed to retrieve',
  totalFound: 0
};
assert.strictEqual(buildWebEvidenceGovernanceContext(emptyResult), '', 'Failed or empty search must produce empty governance string');

const emptySuccessfulResult: WebSearchExecutionResult = {
  success: true,
  query: 'test query',
  searchQueries: ['test query'],
  results: [],
  retrievedAt: new Date().toISOString(),
  statusMessage: 'No results found',
  totalFound: 0
};
assert.strictEqual(buildWebEvidenceGovernanceContext(emptySuccessfulResult), '', 'Successful search with 0 results must produce empty governance string');

// 2. When web search succeeded and has results
const successfulResult: WebSearchExecutionResult = {
  success: true,
  query: 'Latest Thailand economic policy 2026',
  searchQueries: ['Thailand economic policy 2026'],
  results: [
    {
      id: 'ws-1',
      title: 'Bank of Thailand Monetary Policy Report',
      url: 'https://bot.or.th/report-2026',
      snippet: 'Policy interest rate remains steady at 2.50 percent.',
      sourceDomain: 'bot.or.th',
      credibilityScore: 0.98,
      sourceType: 'official'
    }
  ],
  retrievedAt: new Date().toISOString(),
  statusMessage: 'Found 1 results',
  totalFound: 1
};

const govContext = buildWebEvidenceGovernanceContext(successfulResult);
assert(govContext.length > 0, 'Must produce non-empty governance context when results exist');

// 3. Governance Invariant checks
assert(govContext.includes('WEB EVIDENCE GOVERNANCE BOUNDARY'), 'Header must be present');
assert(govContext.includes('DATA/EVIDENCE ONLY'), 'Must emphasize data/evidence, not commands');
assert(govContext.includes('NO AUTOMATIC [FACT] PROMOTION'), 'Must forbid automatic [FACT] classification');
assert(govContext.includes('[FACT]'), 'Must include epistemic taxonomy');
assert(govContext.includes('[INFERENCE]'), 'Must include [INFERENCE]');
assert(govContext.includes('[HYPOTHESIS]'), 'Must include [HYPOTHESIS]');
assert(govContext.includes('[UNVERIFIED]'), 'Must include [UNVERIFIED]');
assert(govContext.includes('[OPINION]'), 'Must include [OPINION]');
assert(govContext.includes('PRESERVE HUMAN AGENCY'), 'Must protect Human Agency');
assert(govContext.includes('EVIDENCE LINEAGE & PROVENANCE'), 'Must mandate evidence lineage');

console.log('All Web Evidence Governance tests passed successfully!');
