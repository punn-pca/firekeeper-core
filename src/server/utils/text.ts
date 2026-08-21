import crypto from 'crypto';

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

export function countTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
