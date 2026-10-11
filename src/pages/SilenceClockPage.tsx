/**
 * PEREGRINE — Silence Clock Page (Section 8)
 * Displays per-village modelled hours with zero available warning paths across 72h blackout.
 */

import React from 'react';
import { S72VillageSummary } from '../model/types';
import { SilenceClockGrid } from '../components/silence-clock/SilenceClockGrid';

interface SilenceClockPageProps {
  villages: S72VillageSummary[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string) => void;
}

export const SilenceClockPage: React.FC<SilenceClockPageProps> = ({
  villages,
  selectedVillageId,
  onSelectVillage
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Silence Clock Grid
            </h2>
            <span className="stamp-label stamp-simulation">HUMAN IMPACT METRIC</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Per-village modeled hours with zero available broadcast or mesh warning paths across a 72-hour power blackout window.
          </p>
        </div>
      </div>

      <SilenceClockGrid
        villages={villages}
        totalScenarioHours={72}
        onSelectVillage={onSelectVillage}
        selectedVillageId={selectedVillageId}
      />

      {/* In-depth Tier Overview */}
      <div className="utility-card p-5 sm:p-6 space-y-3 rounded-[4px] border border-[var(--border)]">
        <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase tracking-wide">
          Transmission Tiers &amp; Last-Mile Vulnerability
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-numbers">
          <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[3px]">
            <span className="font-bold text-[var(--navy)] block mb-1">
              Tier 1: Coastal Infrastructure Centers (6 Communities · 18,400 Residents)
            </span>
            <p className="text-[var(--muted)] leading-relaxed">
              Kovalam, Pazhaya, Marina, Karai, Uppalam, Sagar. Covered by Cell Towers &amp; FM Transmitter.
              In default outage without generator, they experience 48 hours of silence until grid power returns.
            </p>
          </div>

          <div className="p-4 bg-red-50/40 border border-red-200/80 rounded-[3px]">
            <span className="font-bold text-[var(--red-text)] block mb-1">
              Tier 2: Topographically Isolated Communities (2 Communities · 1,500 Residents)
            </span>
            <p className="text-slate-700 leading-relaxed">
              Thoni (900) &amp; Hill Camp (600). Have NO cellular towers and NO FM coverage.
              Without localized satellite kits or siren patrols, they remain at 72 full hours of silence under standard broadcast plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
