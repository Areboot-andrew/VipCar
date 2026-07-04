import { createHmac, timingSafeEqual } from 'crypto';

// Validates Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body with the App Secret).
// Protects the Messenger/WhatsApp webhooks from spoofed requests.
export function isValidMetaSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const provided = header.slice('sha256='.length);
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
