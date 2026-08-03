/**
 * eccKeyPair.util.js
 * ECC P-256 (secp256r1 / NIST P-256) identity keypair generation
 * for approved hospitals.
 *
 * Why ECC P-256?
 *  - Same security as RSA-3072 at ~1/10th the key size
 *  - Faster key generation, signing, and verification
 *  - Used by TLS 1.3, modern browsers, FIDO2, and government PKI
 *  - Built into Node.js crypto — zero extra dependencies
 *
 * Keypair lifecycle:
 *  1. Generated when admin APPROVES a hospital registration
 *  2. Public key  → stored as PEM in Hospital.identity.publicKeyPem (readable)
 *  3. Private key → AES-256-GCM encrypted → stored in Hospital.identity.encryptedPrivateKeyPem
 *  4. Private key → offered as one-time download to hospital on approval
 *
 * Future use: Hospital signs organ/transport records with their private key.
 *             Anyone can verify authenticity with the stored public key.
 */

import crypto from 'crypto';
import { encryptField, decryptField } from './crypto.util.js';

const CURVE = 'P-256'; // NIST P-256 (secp256r1) — widely supported, FIPS-approved

/**
 * Generates a new ECC P-256 keypair.
 *
 * @returns {{ publicKeyPem: string, privateKeyPem: string }}
 */
export const generateHospitalKeyPair = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: CURVE,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    publicKeyPem:  publicKey,
    privateKeyPem: privateKey,
  };
};

/**
 * Signs arbitrary data with a hospital's private key (ECDSA + SHA-256).
 * Returns a base64-encoded DER signature.
 *
 * @param {object|string} data — will be JSON.stringify'd if object
 * @param {string} privateKeyPem — raw (unencrypted) PEM private key
 * @returns {string} base64 signature
 */
export const signData = (data, privateKeyPem) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const sign = crypto.createSign('SHA256');
  sign.update(payload);
  sign.end();
  return sign.sign(privateKeyPem, 'base64');
};

/**
 * Verifies an ECDSA + SHA-256 signature against a public key.
 *
 * @param {object|string} data
 * @param {string} signature — base64 signature
 * @param {string} publicKeyPem
 * @returns {boolean}
 */
export const verifySignature = (data, signature, publicKeyPem) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const verify = crypto.createVerify('SHA256');
  verify.update(payload);
  verify.end();
  return verify.verify(publicKeyPem, signature, 'base64');
};

/**
 * Generates a keypair and returns:
 *  - publicKeyPem         → store directly in DB (human-readable)
 *  - encryptedPrivateKey  → AES-256-GCM encrypted private key → store in DB
 *  - rawPrivateKeyPem     → return to caller for one-time download, never persist raw
 *
 * @returns {{ publicKeyPem, encryptedPrivateKey, rawPrivateKeyPem, algorithm }}
 */
export const generateAndEncryptKeyPair = () => {
  const { publicKeyPem, privateKeyPem } = generateHospitalKeyPair();

  return {
    publicKeyPem,
    encryptedPrivateKey: encryptField(privateKeyPem), // AES-256-GCM encrypted
    rawPrivateKeyPem:    privateKeyPem,               // For one-time download only
    algorithm:           `EC-${CURVE}`,
  };
};

/**
 * Decrypts the stored private key for signing operations.
 *
 * @param {string} encryptedPrivateKey — AES-256-GCM ciphertext from DB
 * @returns {string} raw PEM private key
 */
export const decryptPrivateKey = (encryptedPrivateKey) => {
  return decryptField(encryptedPrivateKey);
};
