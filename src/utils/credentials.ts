// Credential utilities: handle Zenkaku (全角) to Hankaku (半角) normalization and whitespace trimming
export function toHalfWidth(str: string): string {
  if (!str) return '';
  return str
    // Convert full-width ASCII characters (！ through ～: 0xFF01-0xFF5E) to half-width (! through ~: 0x0021-0x007E)
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    // Convert full-width space (\u3000) to half-width space
    .replace(/\u3000/g, ' ')
    .trim();
}

// Clean and normalize login ID (lowercase, half-width, trimmed, no internal spaces)
export function normalizeLoginId(id: string): string {
  if (!id) return '';
  return toHalfWidth(id).replace(/\s+/g, '').toLowerCase();
}

// Clean and normalize password (half-width, trimmed)
export function normalizePassword(pwd: string): string {
  if (!pwd) return '';
  return toHalfWidth(pwd).replace(/\s+/g, '');
}
