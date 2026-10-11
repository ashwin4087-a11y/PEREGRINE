/**
 * PEREGRINE — Alert Signing & Key Management (Section 13)
 * W3C Web Crypto ECDSA P-256 digital signature generation and canonical JSON formatting.
 */

export interface EmergencyAlert {
  id: string;
  sender: string;
  scope: 'PUBLIC' | 'RESTRICTED';
  severity: 'EXTREME' | 'SEVERE' | 'MODERATE' | 'MINOR';
  urgency: 'IMMEDIATE' | 'EXPECTED' | 'FUTURE';
  certainty: 'OBSERVED' | 'LIKELY' | 'POSSIBLE';
  event: string;
  headline: string;
  instruction: string;
  targetVillages: string[];
  issuedAt: string;
  expiresAt: string;
  previousAlertId?: string; // For withdrawals / cancellations
  isWithdrawal?: boolean;
}

export interface SignedAlertBundle {
  alert: EmergencyAlert;
  publicKeyJwk: JsonWebKey;
  signatureHex: string;
  canonicalPayload: string;
  isTampered: boolean;
  tamperedPayload?: string;
}

let cachedKeyPair: CryptoKeyPair | null = null;

export async function getOrCreateAlertKeyPair(): Promise<CryptoKeyPair> {
  if (cachedKeyPair) return cachedKeyPair;
  cachedKeyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );
  return cachedKeyPair;
}

export function canonicalizeAlert(alert: EmergencyAlert): string {
  // Deterministic JSON canonical representation
  return JSON.stringify({
    id: alert.id,
    event: alert.event,
    severity: alert.severity,
    urgency: alert.urgency,
    headline: alert.headline,
    instruction: alert.instruction,
    issuedAt: alert.issuedAt,
    expiresAt: alert.expiresAt,
    targetVillages: [...alert.targetVillages].sort(),
    previousAlertId: alert.previousAlertId || null,
    isWithdrawal: !!alert.isWithdrawal
  });
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signEmergencyAlert(
  alert: EmergencyAlert,
  keyPair?: CryptoKeyPair
): Promise<SignedAlertBundle> {
  const keys = keyPair || (await getOrCreateAlertKeyPair());
  const canonicalPayload = canonicalizeAlert(alert);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalPayload);

  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    keys.privateKey,
    data
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keys.publicKey);

  return {
    alert,
    publicKeyJwk,
    signatureHex: bufferToHex(signature),
    canonicalPayload,
    isTampered: false
  };
}
