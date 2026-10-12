/**
 * PEREGRINE — Alert Signature Verification (Section 13)
 * Real SHA-256 signature verification, tampering detection, and audit validation.
 */

import { SignedAlertBundle } from './sign';

export interface VerificationResult {
  verified: boolean;
  algorithm: string;
  fingerprint: string;
  verificationTimeMs: number;
  reason: string;
}

export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

const getSubtle = (): SubtleCrypto => {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  return globalThis.crypto.subtle;
};

export async function verifyAlertSignature(
  bundle: SignedAlertBundle,
  useTamperedPayload: boolean = false
): Promise<VerificationResult> {
  const start = performance.now();
  const subtle = getSubtle();
  try {
    const publicKey = await subtle.importKey(
      'jwk',
      bundle.publicKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['verify']
    );

    const payloadToVerify = useTamperedPayload
      ? (bundle.tamperedPayload || bundle.canonicalPayload + ' [ALTERED_UNAUTHORIZED_STRING]')
      : bundle.canonicalPayload;

    const encoder = new TextEncoder();
    const data = encoder.encode(payloadToVerify);
    const signatureBuffer = hexToBuffer(bundle.signatureHex);

    const isValid = await subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      signatureBuffer,
      data
    );

    const fingerprint = bundle.publicKeyJwk.x?.substring(0, 12) || 'ECDSA-P256';
    const elapsed = Number((performance.now() - start).toFixed(2));

    return {
      verified: isValid,
      algorithm: 'ECDSA_P256_SHA256',
      fingerprint: `KEY-${fingerprint.toUpperCase()}`,
      verificationTimeMs: elapsed,
      reason: isValid 
        ? 'Signature valid. Message integrity and authoritative origin confirmed.'
        : 'REJECTED: Cryptographic hash mismatch. Payload has been tampered with or corrupted in transit!'
    };
  } catch (err) {
    return {
      verified: false,
      algorithm: 'ECDSA_P256_SHA256',
      fingerprint: 'INVALID_KEY',
      verificationTimeMs: Number((performance.now() - start).toFixed(2)),
      reason: `Verification error: ${(err as Error).message}`
    };
  }
}
