/**
 * PEREGRINE — Silence Clock Grid (Section 8)
 * Displays per-village modelled hours with NO available warning path
 * Using retro-utility odometer-drum chambers and clean typography.
 */

import React, { useState } from 'react';
import { S72VillageSummary } from '../model/graph';
import { Clock, AlertTriangle, ArrowDownUp } from 'lucide-react';

interface SilenceClockGridProps {
  villages: S72VillageSummary[];
  totalScenarioHours?: number;
  planLabel?: string;
  onSelectVillage?: (villageId: string) => void;
  selectedVillageId?: string | null;
}

export const SilenceClockGrid: React.FC<SilenceClockGridProps> = ({
  villages,
  totalScenarioHours = 72,
  onSelectVillage,
  selectedVillageId
}) => {
  const [sortOrder, setSortOrder] = useState<'worst-first' | 'best-first' | 'population'>('worst-first');

  const sortedVillages = [...villages].sort((a, b) => {
    if (sortOrder === 'worst-first') return b.silenceHours - a.silenceHours;
    if (sortOrder === 'best-first') return a.silenceHours - b.silenceHours;
    return b.pop - a.pop;
  });

  const totalSilentPop = villages
    .filter(v => v.silenceHours === totalScenarioHours)
    .reduce((sum, v) => sum + v.pop, 0);

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-[4px] border border-[var(--border)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[3px] bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <Clock className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                Silence Clock Grid
              </h3>
              <span className="stamp-label stamp-simulation">HUMAN IMPACT METRIC</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Modelled duration with zero available broadcast or mesh warning paths.
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-[3px] text-xs font-mono-numbers border border-[var(--border)]">
          <span className="text-[var(--muted)] px-1.5 flex items-center gap-1 text-[0.7rem] font-semibold">
            <ArrowDownUp className="w-3 h-3" /> SORT:
          </span>
          <button
            onClick={() => setSortOrder('worst-first')}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              sortOrder === 'worst-first'
                ? 'bg-white text-[var(--navy)] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[var(--ink)]'
            }`}
          >
            Worst First
          </button>
          <button
            onClick={() => setSortOrder('best-first')}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              sortOrder === 'best-first'
                ? 'bg-white text-[var(--navy)] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[var(--ink)]'
            }`}
          >
            Lowest Silence
          </button>
          <button
            onClick={() => setSortOrder('population')}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              sortOrder === 'population'
                ? 'bg-white text-[var(--navy)] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[var(--ink)]'
            }`}
          >
            Population
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-3.5 bg-slate-50 border border-[var(--border)] rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono-numbers gap-1.5">
        <span className="text-[var(--navy)] font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-pulse" />
          POPULATION UNDER 72-HOUR WARNING BLACKOUT:
        </span>
        <span className="font-bold text-sm text-[var(--navy-deep)]">
          {totalSilentPop.toLocaleString()} residents ({((totalSilentPop / 19900) * 100).toFixed(1)}% of total)
        </span>
      </div>

      {/* Grid of Village Silence Clocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sortedVillages.map(v => {
          const isTotalSilence = v.silenceHours === totalScenarioHours;
          const isZeroSilence = v.silenceHours === 0;
          const isSelected = selectedVillageId === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVillage && onSelectVillage(v.id)}
              className={`p-3.5 rounded-[3px] border transition-all cursor-pointer ${
                isTotalSilence
                  ? 'border-red-200 bg-red-50/40 hover:border-red-300'
                  : isZeroSilence
                  ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
                  : 'border-[var(--border)] bg-white hover:border-slate-300 hover:shadow-xs'
              } ${isSelected ? 'ring-2 ring-[var(--amber)] ring-offset-1' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--navy)] leading-tight">
                    {v.name}
                  </h4>
                  <span className="text-[0.7rem] font-mono-numbers text-[var(--muted)]">
                    Pop. {v.pop.toLocaleString()}
                  </span>
                </div>
                {isTotalSilence ? (
                  <span className="stamp-label stamp-critical text-[0.55rem]">72h SILENCE</span>
                ) : isZeroSilence ? (
                  <span className="stamp-label stamp-verified text-[0.55rem]">PROTECTED</span>
                ) : (
                  <span className="stamp-label stamp-warning text-[0.55rem]">DEGRADED</span>
                )}
              </div>

              {/* Odometer Chamber */}
              <div className="odometer-chamber px-2.5 py-1.5 my-2 flex items-center justify-between">
                <span className="text-[0.65rem] text-slate-400 uppercase tracking-widest">
                  SILENCE:
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold tracking-wider ${
                      isTotalSilence
                        ? 'text-[#FFA1A1]'
                        : isZeroSilence
                        ? 'text-[#88E4B0]'
                        : 'text-[var(--amber)]'
                    }`}
                  >
                    {String(v.silenceHours).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-slate-400">/ 72h</span>
                </div>
              </div>

              {/* Status */}
              {isTotalSilence ? (
                <div className="hazard-stripes p-1.5 mt-2 rounded border border-red-200 text-center">
                  <span className="font-mono-numbers font-bold text-[0.68rem] text-[var(--red-text)] flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> NO MODELLED PATH
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-[0.68rem] font-mono-numbers text-[var(--muted)] flex items-center justify-between">
                  <span>Active coverage:</span>
                  <span className="font-bold text-[var(--ink)]">{72 - v.silenceHours}h</span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${
                    isTotalSilence
                      ? 'bg-[var(--red)]'
                      : isZeroSilence
                      ? 'bg-[var(--green)]'
                      : 'bg-[var(--amber)]'
                  }`}
                  style={{ width: `${(v.silenceHours / totalScenarioHours) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
