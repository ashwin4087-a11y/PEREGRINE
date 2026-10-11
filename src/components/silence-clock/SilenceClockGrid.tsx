/**
 * PEREGRINE — Silence Clock Grid (Section 8)
 * Displays per-village modelled hours with NO available warning path
 * Using retro-utility odometer-drum chambers and clean typography.
 */

import React, { useState, useMemo } from 'react';
import { S72VillageSummary, S72HourlyStep } from '../../model/graph';
import { analyzeVillageSilenceTimeline } from '../../metrics/silence';
import { Clock, AlertTriangle, ArrowDownUp, ShieldCheck, Activity } from 'lucide-react';

interface SilenceClockGridProps {
  villages: S72VillageSummary[];
  steps?: S72HourlyStep[];
  totalScenarioHours?: number;
  planLabel?: string;
  onSelectVillage?: (villageId: string) => void;
  selectedVillageId?: string | null;
}

export const SilenceClockGrid: React.FC<SilenceClockGridProps> = ({
  villages,
  steps,
  totalScenarioHours = 72,
  onSelectVillage,
  selectedVillageId
}) => {
  const [sortOrder, setSortOrder] = useState<'worst-first' | 'best-first' | 'population'>('worst-first');

  const sortedVillages = useMemo(() => {
    return [...villages].sort((a, b) => {
      if (sortOrder === 'worst-first') return b.silenceHours - a.silenceHours;
      if (sortOrder === 'best-first') return a.silenceHours - b.silenceHours;
      return b.pop - a.pop;
    });
  }, [villages, sortOrder]);

  const totalSilentPop = useMemo(() => {
    return villages
      .filter(v => v.silenceHours === totalScenarioHours)
      .reduce((sum, v) => sum + v.pop, 0);
  }, [villages, totalScenarioHours]);

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
                Silence Clock Grid (All 8 Settlements)
              </h3>
              <span className="stamp-label stamp-simulation">HUMAN IMPACT METRIC</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Modelled 72-hour outage analysis: continuous silence, longest blackout intervals, and surviving broadcast paths.
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
            aria-pressed={sortOrder === 'worst-first'}
            className={`px-2.5 py-1 rounded-[2px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] ${
              sortOrder === 'worst-first'
                ? 'bg-white text-[var(--navy)] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[var(--ink)]'
            }`}
          >
            Worst First
          </button>
          <button
            onClick={() => setSortOrder('best-first')}
            aria-pressed={sortOrder === 'best-first'}
            className={`px-2.5 py-1 rounded-[2px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] ${
              sortOrder === 'best-first'
                ? 'bg-white text-[var(--navy)] shadow-xs font-bold'
                : 'text-slate-600 hover:text-[var(--ink)]'
            }`}
          >
            Lowest Silence
          </button>
          <button
            onClick={() => setSortOrder('population')}
            aria-pressed={sortOrder === 'population'}
            className={`px-2.5 py-1 rounded-[2px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] ${
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
          POPULATION UNDER 72-HOUR COMPLETE WARNING BLACKOUT:
        </span>
        <span className="font-bold text-sm text-[var(--navy-deep)]">
          {totalSilentPop.toLocaleString()} residents ({((totalSilentPop / 19900) * 100).toFixed(1)}% of total fictional population)
        </span>
      </div>

      {/* Grid of 8 Village Silence Clocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sortedVillages.map(v => {
          const isTotalSilence = v.silenceHours === totalScenarioHours;
          const isZeroSilence = v.silenceHours === 0;
          const isSelected = selectedVillageId === v.id;

          // Derive timeline analysis if steps are available
          const timelineAnalysis = steps ? analyzeVillageSilenceTimeline(
            v.id,
            steps.map(s => Boolean(s.villagePaths[v.id])),
            steps.map(s => s.villageReach[v.id] ?? 0)
          ) : null;

          return (
            <div
              key={v.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select settlement ${v.name}. Population: ${v.pop}. Silence: ${v.silenceHours} hours.`}
              onClick={() => onSelectVillage && onSelectVillage(v.id)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelectVillage) {
                  e.preventDefault();
                  onSelectVillage(v.id);
                }
              }}
              className={`p-3.5 rounded-[3px] border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                isTotalSilence
                  ? 'border-red-200 bg-red-50/40 hover:border-red-300'
                  : isZeroSilence
                  ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
                  : 'border-[var(--border)] bg-white hover:border-slate-300 hover:shadow-xs'
              } ${isSelected ? 'ring-2 ring-[var(--amber)] ring-offset-1 shadow-sm' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--navy)] leading-tight">
                    {v.name}
                  </h4>
                  <span className="text-[0.68rem] font-mono-numbers text-[var(--muted)]">
                    Fictional Pop: {v.pop.toLocaleString()}
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
                <span className="text-[0.62rem] text-slate-400 uppercase tracking-widest">
                  TOTAL SILENCE:
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

              {/* Durations Breakdown (Continuous initial vs Longest period) */}
              {timelineAnalysis && (
                <div className="text-[0.65rem] font-mono-numbers text-slate-600 bg-slate-50 p-1.5 rounded-[2px] border border-slate-200 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Initial Continuous:</span>
                    <span className="font-bold text-[var(--navy)]">{timelineAnalysis.continuousSilenceDuration}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longest Outage Run:</span>
                    <span className="font-bold text-[var(--navy)]">{timelineAnalysis.longestSilencePeriod}h</span>
                  </div>
                </div>
              )}

              {/* Mini 72-Hour Timeline Strip */}
              {timelineAnalysis && (
                <div className="my-2">
                  <div className="flex justify-between text-[0.58rem] font-mono-numbers text-slate-500 mb-0.5">
                    <span>0h</span>
                    <span>24h</span>
                    <span>48h</span>
                    <span>72h</span>
                  </div>
                  <div 
                    className="flex h-2.5 w-full rounded-[1px] overflow-hidden bg-slate-200 border border-slate-300" 
                    title={`72-Hour Timeline: ${v.silenceHours}h silence, ${72 - v.silenceHours}h active`}
                  >
                    {timelineAnalysis.hourlyStatus.map(slot => (
                      <div
                        key={slot.hour}
                        className={`flex-1 h-full ${
                          slot.status === 'SILENCE'
                            ? 'bg-red-500'
                            : slot.status === 'DEGRADED'
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Channels Status Summary */}
              <div className="mt-2 text-[0.68rem] font-mono-numbers text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Channels Nominal / Live:</span>
                <span className="font-bold text-[var(--navy)]">{v.nominalChannels} / {v.availableChannelsNow}</span>
              </div>

              {/* Progress Bar (if no timeline) */}
              {!timelineAnalysis && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
