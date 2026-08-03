/**
 * crypto.util.js
 * AES-256-GCM authenticated encryption for PII fields stored in MongoDB.
 *
 * Why AES-256-GCM?
 *  - 256-bit key → quantum-resistant for the near future
 *  - GCM mode provides both confidentiality AND integrity (auth tag)
 *    so any tampering of the ciphertext is detected on decryption
 *  - Each encryption uses a unique random 96-bit IV → same plaintext
 *    produces different ciphertext every time (semantic security)
 *
 * Storage format (all hex, colon-delimited):
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Required env:
 *   FIELD_ENCRYPTION_KEY — 64 hex chars (= 32 bytes)
 *   Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

const ALGO       = 'aes-256-gcm';
const IV_BYTES   = 12;   // 96-bit IV — NIST recommended for GCM
const TAG_BYTES  = 16;   // 128-bit authentication tag (GCM default)
const SEPARATOR  = ':';

/**
 * Returns a 32-byte Buffer from the FIELD_ENCRYPTION_KEY env variable.
 * Throws at startup if the key is missing or wrong length so we
 * catch misconfiguration early, not at request time.
 */
const getKey = () => {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Encrypts a plaintext string.
 * Returns null/undefined as-is (allows optional model fields).
 *
 * @param {string|null|undefined} plaintext
 * @returns {string|null|undefined}  "<iv>:<tag>:<ciphertext>" hex string
 */
export const encryptField = (plaintext) => {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  const key    = getKey();
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag(); // Must be called AFTER cipher.final()

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(SEPARATOR);
};

/**
 * Decrypts a ciphertext string produced by encryptField().
 * Returns null/undefined as-is.
 * Throws if the ciphertext has been tampered with (GCM auth failure).
 *
 * @param {string|null|undefined} ciphertext
 * @returns {string|null|undefined}
 */
export const decryptField = (ciphertext) => {
  if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
    return ciphertext;
  }

  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted field format — expected iv:tag:ciphertext');
  }

  const [ivHex, tagHex, dataHex] = parts;
  const key     = getKey();
  const iv      = Buffer.from(ivHex,  'hex');
  const tag     = Buffer.from(tagHex, 'hex');
  const data    = Buffer.from(dataHex,'hex');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed — ciphertext may have been tampered with');
  }
};

/**
 * Detects whether a string is already encrypted (has our iv:tag:ct format).
 * Useful in Mongoose pre-save hooks to avoid double-encrypting.
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isEncrypted = (value) => {
  if (typeof value !== 'string') return false;
  const parts = value.split(SEPARATOR);
  return parts.length === 3 && parts[0].length === IV_BYTES * 2;
};
