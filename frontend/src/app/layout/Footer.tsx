/**
 * PEREGRINE — Primary Footer Component
 * Contains official vector symbol, version metadata, IEEE BTS Hackathon attribution,
 * and mandatory non-operational simulation disclaimers.
 */

import React from 'react';
import { PeregrineLogo } from '../../components/ui/PeregrineLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[var(--border)] py-6 text-xs font-mono-numbers text-[var(--muted)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PeregrineLogo size="sm" variant="symbol" />
          <span>
            PEREGRINE v2.1 · IEEE BTS Hackathon · Disaster-Resilient Broadcast Network
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="stamp-label stamp-simulation text-[0.6rem]">
            DECISION-SUPPORT SIMULATION ONLY
          </span>
        </div>
      </div>
    </footer>
  );
};
