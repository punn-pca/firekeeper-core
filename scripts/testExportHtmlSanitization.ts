import assert from 'node:assert/strict';
import { parseMarkdownToHtml, renderEvidenceSourceForExport } from '../src/utils/exportUtils';

const body = parseMarkdownToHtml('# <img src=x onerror=alert(1)>\n\nข้อความ <script>alert(1)</script>');
assert.doesNotMatch(body, /<img\b|<script\b/i);
assert.match(body, /&lt;img/);
assert.match(body, /&lt;script/);

const table = parseMarkdownToHtml('| ชื่อ |\n| --- |\n| <svg onload=alert(1)> |');
assert.doesNotMatch(table, /<svg\b/i);
assert.match(table, /&lt;svg/);

const source = renderEvidenceSourceForExport({ sourceUrl: 'https://example.com/" onmouseover="alert(1)' });
assert.doesNotMatch(source, / onmouseover=/i);
assert.match(source, /&quot;/);
console.log('Export HTML sanitization tests passed.');
