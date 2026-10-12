import React from 'react';
import { AuditPanel } from '../components/cryptography/AuditPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

export const CryptographyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cryptographic Alert Integrity & Audit Console"
        category="Authentication & Integrity"
        description="Authenticates emergency broadcast packets with digital signatures, verifies SHA-256 integrity, detects tampering, issues withdrawal chains, and validates acoustic siren alarms."
        statusBadge={
          <StatusBadge
            status="operational"
            label="W3C WebCrypto ECDSA"
          />
        }
      />

      <AuditPanel />
    </div>
  );
};
