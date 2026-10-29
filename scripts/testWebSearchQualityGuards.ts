import assert from 'node:assert/strict';
import { isArticleContentTypeEligible } from '../src/server/services/webAccess/articleResolver';

assert.equal(isArticleContentTypeEligible('article'), true);
assert.equal(isArticleContentTypeEligible('general'), true);
assert.equal(isArticleContentTypeEligible('category'), false);
assert.equal(isArticleContentTypeEligible('index'), false);

console.log('PASS: web retrieval excludes category/index pages from article evidence');
