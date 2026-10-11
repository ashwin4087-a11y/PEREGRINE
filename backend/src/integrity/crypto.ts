/**
 * PEREGRINE — Cryptographic Alert Integrity Engine (Section 13)
 * Full ECDSA P-256 signatures, SHA-256 verification, tamper demonstration,
 * signed withdrawal chain, Web Audio siren generator, and CAP XML formatting.
 */

import { EmergencyAlert } from './sign';

export type { EmergencyAlert, SignedAlertBundle } from './sign';
export { getOrCreateAlertKeyPair, canonicalizeAlert, bufferToHex, signEmergencyAlert } from './sign';

export type { VerificationResult } from './verify';
export { hexToBuffer, verifyAlertSignature } from './verify';

export { createWithdrawalAlert } from './withdraw';

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
