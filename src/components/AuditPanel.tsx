/**
 * PEREGRINE — Cryptographic Alert Composer & Audit Panel (Section 13)
 * Full ECDSA P-256 signing, SHA-256 signature verification, tamper demonstration,
 * signed withdrawal chain, Web Audio siren generator, and TTS broadcast.
 */

import React, { useState, useEffect } from 'react';
import { 
  EmergencyAlert, 
  SignedAlertBundle, 
  VerificationResult,
  signEmergencyAlert,
  verifyAlertSignature,
  createWithdrawalAlert,
  generateCapXmlPreview,
  playAudibleEmergencySiren
} from '../integrity/crypto';
import { 
  ShieldCheck, 
  Key, 
  Volume2, 
  AlertOctagon, 
  FileCode, 
  Copy, 
  Check, 
  FileCheck, 
  RefreshCw,
  Slash,
  Radio
} from 'lucide-react';

interface AuditPanelProps {
  onBroadcastSimulated?: (alert: EmergencyAlert) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ onBroadcastSimulated }) => {
  const [headline, setHeadline] = useState<string>('VERY SEVERE CYCLONIC STORM APPROACHING COAST');
  const [instruction] = useState<string>('Evacuate low-lying areas immediately. Seek reinforced storm shelters. Tune battery-powered FM receiver to 102.4 MHz.');
  const [severity, setSeverity] = useState<'EXTREME' | 'SEVERE' | 'MODERATE'>('EXTREME');
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi' | 'bn'>('en');

  const [signedBundle, setSignedBundle] = useState<SignedAlertBundle | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [tamperedText, setTamperedText] = useState<string>('');
  const [isTampering, setIsTampering] = useState<boolean>(false);
  const [history, setHistory] = useState<SignedAlertBundle[]>([]);
  const [showCapXml, setShowCapXml] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState<boolean>(false);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);

  // Initialize and sign default alert on mount
  useEffect(() => {
    handleCreateAndSignAlert();
  }, []);

  const handleCreateAndSignAlert = async () => {
    const alert: EmergencyAlert = {
      id: `ALT-2026-${Date.now().toString().slice(-5)}`,
      sender: 'IN-SDMA-CHENNAI-RELAY',
      scope: 'PUBLIC',
      severity,
      urgency: 'IMMEDIATE',
      certainty: 'OBSERVED',
      event: 'Cyclone Warning / Coastal Inundation',
      headline,
      instruction,
      targetVillages: ['kovalam', 'marina', 'pazhaya', 'karai', 'uppalam', 'sagar', 'thoni', 'hillcamp'],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 6).toISOString()
    };

    const bundle = await signEmergencyAlert(alert);
    const ver = await verifyAlertSignature(bundle, false);
    setSignedBundle(bundle);
    setVerification(ver);
    setIsTampering(false);
    setTamperedText(bundle.canonicalPayload);
    setHistory(prev => [bundle, ...prev.slice(0, 5)]);

    if (onBroadcastSimulated) {
      onBroadcastSimulated(alert);
    }
  };

  const handleVerifyCurrent = async (tamper: boolean) => {
    if (!signedBundle) return;
    const bundleToVerify: SignedAlertBundle = {
      ...signedBundle,
      tamperedPayload: tamperedText
    };
    const res = await verifyAlertSignature(bundleToVerify, tamper);
    setVerification(res);
  };

  const handleTriggerTamper = async () => {
    if (!signedBundle) return;
    setIsTampering(true);
    // Maliciously inject unauthorized evacuation cancellation
    const modified = signedBundle.canonicalPayload.replace(
      'Evacuate low-lying areas',
      'EVACUATION CANCELLED: STAY HOME [UNAUTHORIZED TAMPER]'
    );
    setTamperedText(modified);

    const tamperedBundle: SignedAlertBundle = {
      ...signedBundle,
      tamperedPayload: modified
    };
    const res = await verifyAlertSignature(tamperedBundle, true);
    setVerification(res);
  };

  const handleCreateWithdrawal = async () => {
    if (!signedBundle) return;
    const withdrawal = await createWithdrawalAlert(
      signedBundle.alert,
      'Cyclone track diverted eastward into open sea. Immediate storm danger passed.'
    );
    const bundle = await signEmergencyAlert(withdrawal);
    const ver = await verifyAlertSignature(bundle, false);
    setSignedBundle(bundle);
    setVerification(ver);
    setIsTampering(false);
    setHistory(prev => [bundle, ...prev]);
  };

  const handlePlaySiren = () => {
    if (isPlayingSiren) return;
    setIsPlayingSiren(true);
    const stopFn = playAudibleEmergencySiren();
    setTimeout(() => {
      setIsPlayingSiren(false);
    }, 3500);
  };

  const handleSpeakTts = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingTts(true);

    const textToRead = `${headline}. ${instruction}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingTts(false);
    utterance.onerror = () => setIsPlayingTts(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyCap = () => {
    if (!signedBundle) return;
    const xml = generateCapXmlPreview(signedBundle.alert, signedBundle.signatureHex);
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <Key className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                Integrity &amp; Cryptographic Audit Panel
              </h3>
              <span className="stamp-label stamp-verified">ECDSA P-256 REAL SIGNATURES</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Digital alert issuance, browser Web Crypto verification, live tamper testing, and signed withdrawal events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlaySiren}
            disabled={isPlayingSiren}
            className="btn-tactile-danger px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-md"
          >
            <Radio className="w-3.5 h-3.5" />
            {isPlayingSiren ? 'Siren Sounding...' : 'Test Siren Synth'}
          </button>
          <button
            onClick={handleSpeakTts}
            disabled={isPlayingTts}
            className="btn-tactile px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-md"
          >
            <Volume2 className="w-3.5 h-3.5" />
            {isPlayingTts ? 'Speaking...' : 'Play Audio TTS'}
          </button>
        </div>
      </div>

      {/* Alert Composer Form */}
      <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div>
            <label className="block text-xs font-mono-numbers font-bold text-[var(--navy)] mb-1">
              ALERT HEADLINE (SIGNATURE PAYLOAD):
            </label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="w-full text-xs font-mono-numbers p-2.5 bg-white border border-slate-200/80 rounded-md text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-numbers font-bold text-[var(--navy)] mb-1">
              OFFICIAL INSTRUCTION:
            </label>
            <p className="text-xs font-mono-numbers p-2.5 bg-white border border-slate-200/80 rounded-md text-[var(--muted)]">
              {instruction}
            </p>
          </div>
        </div>

        {/* Severity & Actions */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono-numbers font-bold text-[var(--navy)] mb-1">
              CAP SEVERITY:
            </label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as 'EXTREME' | 'SEVERE')}
              className="w-full text-xs font-mono-numbers p-2.5 bg-white border border-slate-200/80 rounded-md"
            >
              <option value="EXTREME">EXTREME (Immediate hazard)</option>
              <option value="SEVERE">SEVERE (Threat to life/property)</option>
              <option value="MODERATE">MODERATE (Preparedness advisory)</option>
            </select>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <button
              onClick={handleCreateAndSignAlert}
              className="btn-tactile w-full py-2 text-xs flex items-center justify-center gap-1.5 rounded-md"
            >
              <Key className="w-3.5 h-3.5" /> Sign &amp; Re-Issue Alert
            </button>
            <button
              onClick={handleCreateWithdrawal}
              className="btn-tactile-secondary w-full py-1.5 text-xs flex items-center justify-center gap-1.5 rounded-md"
            >
              <Slash className="w-3.5 h-3.5" /> Issue Signed Withdrawal
            </button>
          </div>
        </div>
      </div>

      {/* Cryptographic Verification Display */}
      {signedBundle && verification && (
        <div className="my-4 p-4 border border-slate-200/80 rounded-lg bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono-numbers text-xs font-bold text-[var(--navy)]">
                ALERT ID: {signedBundle.alert.id}
              </span>
              {signedBundle.alert.isWithdrawal && (
                <span className="stamp-label stamp-withdrawn text-[0.6rem]">AUTHENTICATED WITHDRAWAL</span>
              )}
            </div>

            <div>
              {verification.verified ? (
                <span className="stamp-label stamp-verified text-[0.72rem] px-2 py-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED SIGNATURE [ECDSA-P256]
                </span>
              ) : (
                <span className="stamp-label stamp-critical text-[0.72rem] px-2 py-1 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> REJECTED: TAMPER DETECTED
                </span>
              )}
            </div>
          </div>

          {/* Verification Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs font-mono-numbers">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-[2px]">
              <span className="text-[0.65rem] text-[var(--muted)] block">AUTHENTICATION KEY FINGERPRINT:</span>
              <span className="font-bold text-[var(--navy)] truncate block">
                {verification.fingerprint}
              </span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-[2px]">
              <span className="text-[0.65rem] text-[var(--muted)] block">CRYPTO ALGORITHM:</span>
              <span className="font-bold text-[var(--navy)]">
                {verification.algorithm} ({verification.verificationTimeMs} ms)
              </span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-[2px]">
              <span className="text-[0.65rem] text-[var(--muted)] block">RAW SIGNATURE:</span>
              <span className="font-bold text-[var(--navy)] truncate block">
                {signedBundle.signatureHex.substring(0, 24)}...
              </span>
            </div>
          </div>

          {/* Verification Audit Message */}
          <div
            className={`p-2.5 rounded-[2px] text-xs font-mono-numbers flex items-center gap-2 border ${
              verification.verified
                ? 'bg-[var(--green-inset)] text-[var(--green-text)] border-[var(--green)]'
                : 'bg-[var(--red-inset)] text-[var(--red-text)] border-[var(--red)]'
            }`}
          >
            {verification.verified ? (
              <FileCheck className="w-4 h-4 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 shrink-0" />
            )}
            <span>{verification.reason}</span>
          </div>

          {/* Tamper Demonstration Bench (Section 13) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-[var(--muted)]">
              <strong>Interactive Tamper Test:</strong> Modify a single character in the payload to prove rejection.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerTamper}
                className="btn-tactile-danger text-xs px-3 py-1 flex items-center gap-1"
              >
                <AlertOctagon className="w-3.5 h-3.5" /> Inject Malicious Tamper
              </button>
              {isTampering && (
                <button
                  onClick={() => handleCreateAndSignAlert()}
                  className="btn-tactile-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Valid Key
                </button>
              )}
              <button
                onClick={() => setShowCapXml(!showCapXml)}
                className="btn-tactile-secondary text-xs px-2.5 py-1 flex items-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5" /> {showCapXml ? 'Hide CAP XML' : 'View CAP XML'}
              </button>
            </div>
          </div>

          {/* CAP XML Preview Drawer */}
          {showCapXml && (
            <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-[2px] font-mono-numbers text-[0.7rem] relative">
              <button
                onClick={handleCopyCap}
                className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy CAP'}
              </button>
              <pre className="overflow-x-auto p-1 leading-relaxed">
                {generateCapXmlPreview(signedBundle.alert, signedBundle.signatureHex)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
