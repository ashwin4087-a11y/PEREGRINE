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
} from '../../integrity/crypto';
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
  Radio,
  Lock,
  History,
  ChevronDown
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface AuditPanelProps {
  onBroadcastSimulated?: (alert: EmergencyAlert) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ onBroadcastSimulated }) => {
  const [headline, setHeadline] = useState<string>('VERY SEVERE CYCLONIC STORM APPROACHING COAST');
  const [instruction] = useState<string>('Evacuate low-lying areas immediately. Seek reinforced storm shelters. Tune battery-powered FM receiver to 102.4 MHz.');
  const [severity, setSeverity] = useState<'EXTREME' | 'SEVERE' | 'MODERATE'>('EXTREME');

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
    setHistory(prev => [bundle, ...prev.slice(0, 7)]);

    if (onBroadcastSimulated) {
      onBroadcastSimulated(alert);
    }
  };

  const handleTriggerTamper = async () => {
    if (!signedBundle) return;
    setIsTampering(true);
    // Maliciously inject unauthorized modification
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
    playAudibleEmergencySiren();
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
    <div className="space-y-6">
      {/* 1. Verification Outcome Summary Banner (First Element) */}
      {signedBundle && verification && (
        <div className={`p-5 rounded-lg border shadow-xs space-y-3 ${
          verification.verified
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-red-50/70 border-red-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2.5">
              {verification.verified ? (
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#172033]">
                    {verification.verified ? 'Cryptographic Verification Passed' : 'Cryptographic Verification Failed'}
                  </h3>
                  {signedBundle.alert.isWithdrawal && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      Authenticated Withdrawal
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#475569] mt-0.5">
                  {verification.reason}
                </p>
              </div>
            </div>

            <StatusBadge
              status={verification.verified ? 'operational' : 'severed'}
              label={verification.verified ? 'ECDSA P-256 Valid' : 'Tamper Detected'}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs gap-3 text-[#475569]">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[#64748B]">Alert ID: </span>
                <strong className="font-mono-numbers text-[#172033]">{signedBundle.alert.id}</strong>
              </div>
              <div>
                <span className="text-[#64748B]">Fingerprint: </span>
                <span className="font-mono-numbers text-[#172033]">{verification.fingerprint.slice(0, 16)}...</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Engine: </span>
              <span className="font-medium text-[#172033]">{verification.algorithm} ({verification.verificationTimeMs}ms)</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Alert Composition & Signing Controls Form */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#172033]">
              Alert Composition & Signature Console
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Compose standard Common Alerting Protocol (CAP) messages with real W3C WebCrypto ECDSA P-256 signatures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlaySiren}
              disabled={isPlayingSiren}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              {isPlayingSiren ? 'Siren Sounding...' : 'Test Siren Tone'}
            </button>
            <button
              onClick={handleSpeakTts}
              disabled={isPlayingTts}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#2563EB]" />
              {isPlayingTts ? 'Speaking...' : 'Play Audio Broadcast'}
            </button>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Alert Headline (Signed Payload Subject)
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-[#CBD5E1] rounded-md text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Canonical Emergency Instruction
              </label>
              <div className="text-xs p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#475569] leading-relaxed">
                {instruction}
              </div>
            </div>
          </div>

          {/* Severity & Action Controls */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                CAP Severity Classification
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as 'EXTREME' | 'SEVERE' | 'MODERATE')}
                className="w-full text-xs p-2.5 bg-white border border-[#CBD5E1] rounded-md text-[#172033]"
              >
                <option value="EXTREME">EXTREME — Immediate Hazard</option>
                <option value="SEVERE">SEVERE — Threat to Life/Property</option>
                <option value="MODERATE">MODERATE — Advisory</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCreateAndSignAlert}
                className="w-full py-2.5 text-xs font-semibold rounded-md bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Key className="w-3.5 h-3.5" /> Sign &amp; Re-Issue Alert
              </button>
              <button
                onClick={handleCreateWithdrawal}
                className="w-full py-2 text-xs font-medium rounded-md border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-1.5"
              >
                <Slash className="w-3.5 h-3.5 text-amber-600" /> Issue Signed Withdrawal
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Action Toolbar: Tamper Test & CAP XML Preview */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-[#64748B]">
            Interactive verification sandbox: test malicious bit flips against the live signature.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerTamper}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Inject Tamper Test
            </button>
            {isTampering && (
              <button
                onClick={() => handleCreateAndSignAlert()}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore Canonical
              </button>
            )}
            <button
              onClick={() => setShowCapXml(!showCapXml)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" /> {showCapXml ? 'Hide CAP XML' : 'View CAP XML'}
            </button>
          </div>
        </div>

        {/* CAP XML Code Preview */}
        {showCapXml && signedBundle && (
          <div className="p-4 bg-[#1E293B] text-slate-100 rounded-lg font-mono-numbers text-[11px] relative">
            <button
              onClick={handleCopyCap}
              className="absolute top-3 right-3 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy CAP'}
            </button>
            <pre className="overflow-x-auto p-1 leading-relaxed text-[#94A3B8]">
              {generateCapXmlPreview(signedBundle.alert, signedBundle.signatureHex)}
            </pre>
          </div>
        )}
      </div>

      {/* 3. Expandable Public-Key Infrastructure & Security Details */}
      {signedBundle && verification && (
        <details className="border border-[#E2E8F0] rounded-lg bg-white shadow-xs group overflow-hidden">
          <summary className="p-4 bg-[#F8FAFC] flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-[#172033] hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#2563EB]" />
              <span>Cryptographic Infrastructure & Payload Inspection</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
          </summary>

          <div className="p-5 sm:p-6 space-y-4 text-xs border-t border-[#E2E8F0]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                <span className="text-[11px] text-[#64748B] block">Public Key Fingerprint:</span>
                <span className="font-mono-numbers text-[#172033] truncate block mt-0.5 text-xs">
                  {verification.fingerprint}
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                <span className="text-[11px] text-[#64748B] block">Signature Scheme:</span>
                <span className="font-medium text-[#172033] block mt-0.5">
                  ECDSA NIST P-256 / SHA-256
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                <span className="text-[11px] text-[#64748B] block">Raw Signature Hex:</span>
                <span className="font-mono-numbers text-[#172033] truncate block mt-0.5 text-xs">
                  {signedBundle.signatureHex.substring(0, 32)}...
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#64748B] block mb-1">Canonical Signed JSON Payload:</span>
              <pre className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-mono-numbers text-[11px] text-[#334155] overflow-x-auto leading-relaxed">
                {isTampering ? tamperedText : signedBundle.canonicalPayload}
              </pre>
            </div>
          </div>
        </details>
      )}

      {/* 4. Real Session Broadcast Audit Ledger */}
      {history.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-sm font-semibold text-[#172033]">
                Session Broadcast Audit Ledger
              </h4>
            </div>
            <span className="text-xs text-[#64748B]">
              {history.length} signed transactions in current session
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 font-mono-numbers">
                  <span className="font-semibold text-[#172033]">{item.alert.id}</span>
                  <span className="text-[#64748B]">({item.alert.severity})</span>
                  {item.alert.isWithdrawal && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-sans font-medium">
                      Withdrawal
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#64748B] truncate max-w-md">
                  {item.canonicalPayload.substring(0, 60)}...
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  Verified (ECDSA P-256)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
