/**
 * PEREGRINE — Cryptography & Audit Console Page (Section 13)
 * Real W3C Web Crypto ECDSA P-256 digital signatures, SHA-256 verification, and tamper detection.
 */

import React from 'react';
import { AuditPanel } from '../components/cryptography/AuditPanel';

export const CryptographyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Cryptographic Alert Integrity &amp; Audit Console
            </h2>
            <span className="stamp-label stamp-verified">ECDSA P-256 REAL SIGNATURES</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Live ECDSA P-256 signature generation, SHA-256 tamper verification, authenticated withdrawal chains, and acoustic siren alerts.
          </p>
        </div>
      </div>

      <AuditPanel />
    </div>
  );
};
