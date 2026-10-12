/**
 * PEREGRINE — Cryptographic Alert Integrity Engine (Section 13)
 * Uses Web Crypto API for real ECDSA P-256 signatures, SHA-256 verification,
 * tamper demonstration, and withdrawal chains.
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

export interface VerificationResult {
  verified: boolean;
  algorithm: string;
  fingerprint: string;
  verificationTimeMs: number;
  reason: string;
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
    targetVillages: alert.targetVillages.sort(),
    previousAlertId: alert.previousAlertId || null,
    isWithdrawal: !!alert.isWithdrawal
  });
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
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

export async function verifyAlertSignature(
  bundle: SignedAlertBundle,
  useTamperedPayload: boolean = false
): Promise<VerificationResult> {
  const start = performance.now();
  try {
    const publicKey = await window.crypto.subtle.importKey(
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

    const isValid = await window.crypto.subtle.verify(
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

/**
 * Creates authenticated withdrawal / cancellation alert referencing the original alert ID
 */
export async function createWithdrawalAlert(
  originalAlert: EmergencyAlert,
  cancellationReason: string
): Promise<EmergencyAlert> {
  const now = new Date().toISOString();
  return {
    id: `WD-${originalAlert.id.replace('ALT-', '')}-${Date.now().toString().slice(-4)}`,
    sender: originalAlert.sender,
    scope: 'PUBLIC',
    severity: 'MINOR',
    urgency: 'IMMEDIATE',
    certainty: 'OBSERVED',
    event: `WITHDRAWAL: ${originalAlert.event}`,
    headline: `CANCELLATION: ${originalAlert.headline}`,
    instruction: `THIS WARNING IS RESCINDED. Reason: ${cancellationReason}. Normal conditions resume.`,
    targetVillages: originalAlert.targetVillages,
    issuedAt: now,
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    previousAlertId: originalAlert.id,
    isWithdrawal: true
  };
}

/**
 * Generates CAP-formatted XML preview
 */
export function generateCapXmlPreview(alert: EmergencyAlert, signatureHex: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alert.id}</identifier>
  <sender>${alert.sender}</sender>
  <sent>${alert.issuedAt}</sent>
  <status>Actual</status>
  <msgType>${alert.isWithdrawal ? 'Cancel' : 'Alert'}</msgType>
  ${alert.previousAlertId ? `<references>${alert.sender},${alert.previousAlertId},${alert.issuedAt}</references>` : ''}
  <scope>${alert.scope}</scope>
  <info>
    <category>Met</category>
    <event>${alert.event}</event>
    <urgency>${alert.urgency}</urgency>
    <severity>${alert.severity}</severity>
    <certainty>${alert.certainty}</certainty>
    <headline>${alert.headline}</headline>
    <description>${alert.instruction}</description>
    <expires>${alert.expiresAt}</expires>
    <area>
      <areaDesc>${alert.targetVillages.join(', ')}</areaDesc>
    </area>
    <parameter>
      <valueName>SignatureAlgorithm</valueName>
      <value>ECDSA-P256-SHA256</value>
    </parameter>
    <parameter>
      <valueName>DigitalSignature</valueName>
      <value>${signatureHex.substring(0, 32)}...[verified]</value>
    </parameter>
  </info>
</alert>`;
}

/**
 * Web Audio Siren Generator
 */
export function playAudibleEmergencySiren(): () => void {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    // Siren pitch modulation
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 1.8; // 1.8 Hz sweep
    lfoGain.gain.value = 220; // pitch sweep depth

    osc.frequency.setValueAtTime(680, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    lfo.start();

    // Auto-stop after 3.5 seconds
    const timeout = setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
        audioCtx.close();
      }, 500);
    }, 3500);

    return () => {
      clearTimeout(timeout);
      try {
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        setTimeout(() => {
          osc.stop();
          lfo.stop();
          audioCtx.close();
        }, 120);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}
