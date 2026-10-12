import React, { useState, useMemo } from 'react';
import { S72VillageSummary, S72HourlyStep } from '../../model/graph';
import { ArrowUpDown, ChevronRight, Activity, Clock } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

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
  const [sortField, setSortField] = useState<'silence' | 'pop' | 'channels'>('silence');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute per-village longest silence streak and continuous silence if steps are provided
  const villageStats = useMemo(() => {
    return villages.map(v => {
      let longestSilence = v.silenceHours;
      let initialSilence = 0;
      const hourlyPath = steps ? steps.map(s => Boolean(s.villagePaths[v.id])) : [];

      if (steps && steps.length > 0) {
        let currentStreak = 0;
        let maxStreak = 0;
        let countingInitial = true;

        for (let i = 0; i < hourlyPath.length; i++) {
          if (!hourlyPath[i]) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
            if (countingInitial) {
              initialSilence++;
            }
          } else {
            currentStreak = 0;
            countingInitial = false;
          }
        }
        longestSilence = maxStreak;
      }

      return {
        ...v,
        longestSilence,
        initialSilence,
        hourlyPath
      };
    });
  }, [villages, steps]);

  const sortedVillages = useMemo(() => {
    return [...villageStats].sort((a, b) => {
      let diff = 0;
      if (sortField === 'silence') {
        diff = b.silenceHours - a.silenceHours;
      } else if (sortField === 'pop') {
        diff = b.pop - a.pop;
      } else if (sortField === 'channels') {
        diff = a.availableChannelsNow - b.availableChannelsNow;
      }
      return sortAsc ? -diff : diff;
    });
  }, [villageStats, sortField, sortAsc]);

  const handleSort = (field: 'silence' | 'pop' | 'channels') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
      {/* Table Control Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
        <div>
          <h3 className="text-sm font-semibold text-[#172033]">
            Settlement Outage Matrix & Silence Duration
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Continuous and cumulative modeled hours with zero surviving warning paths across the 72-hour window.
          </p>
        </div>

        {/* Quick Sorting Badges */}
        <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-md p-1 text-xs">
          <span className="text-[#64748B] px-2 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <button
            onClick={() => handleSort('silence')}
            className={`px-2.5 py-1 rounded transition-colors ${
              sortField === 'silence'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Outage Hours {sortField === 'silence' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('pop')}
            className={`px-2.5 py-1 rounded transition-colors ${
              sortField === 'pop'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Population {sortField === 'pop' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('channels')}
            className={`px-2.5 py-1 rounded transition-colors ${
              sortField === 'channels'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Channels {sortField === 'channels' && (sortAsc ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-medium">
              <th className="py-3 px-4">Settlement</th>
              <th className="py-3 px-4">Population</th>
              <th className="py-3 px-4">Communication State</th>
              <th className="py-3 px-4">Continuous Silence</th>
              <th className="py-3 px-4">Total 72h Outage</th>
              <th className="py-3 px-4 min-w-[200px]">72h Availability Timeline</th>
              <th className="py-3 px-4">Channels</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {sortedVillages.map((v) => {
              const isSelected = selectedVillageId === v.id;
              const isTotalBlackout = v.silenceHours === totalScenarioHours;
              const isPartialBlackout = v.silenceHours > 0 && v.silenceHours < totalScenarioHours;
              const status = isTotalBlackout ? 'severed' : isPartialBlackout ? 'degraded' : 'operational';

              return (
                <tr
                  key={v.id}
                  onClick={() => onSelectVillage && onSelectVillage(v.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#EFF6FF]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Settlement */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172033] flex items-center gap-1.5">
                      {v.name}
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono-numbers">
                      ID: {v.id}
                    </div>
                  </td>

                  {/* Population */}
                  <td className="py-3 px-4 font-mono-numbers text-[#172033]">
                    {v.pop.toLocaleString()}
                  </td>

                  {/* Current State */}
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={status}
                      label={isTotalBlackout ? 'Blackout' : isPartialBlackout ? 'Degraded' : 'Operational'}
                      size="sm"
                    />
                  </td>

                  {/* Continuous Silence Streak */}
                  <td className="py-3 px-4 font-mono-numbers">
                    <span className={v.longestSilence > 0 ? 'text-red-700 font-semibold' : 'text-slate-700'}>
                      {v.longestSilence}h
                    </span>
                    <span className="text-[11px] text-[#64748B] ml-1">longest streak</span>
                  </td>

                  {/* Total 72h Outage */}
                  <td className="py-3 px-4 font-mono-numbers">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        isTotalBlackout ? 'text-red-700' : isPartialBlackout ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {v.silenceHours}h
                      </span>
                      <span className="text-[11px] text-[#64748B]">/ {totalScenarioHours}h</span>
                    </div>
                    <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${isTotalBlackout ? 'bg-red-500' : isPartialBlackout ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(v.silenceHours / totalScenarioHours) * 100}%` }}
                      />
                    </div>
                  </td>

                  {/* 72h Availability Timeline Bar */}
                  <td className="py-3 px-4">
                    {v.hourlyPath.length > 0 ? (
                      <div>
                        <div className="flex h-2 rounded overflow-hidden bg-slate-100 gap-px">
                          {v.hourlyPath.map((isUp, idx) => (
                            <div
                              key={idx}
                              title={`Hour ${idx}: ${isUp ? 'Operational Path Available' : 'No Operational Path (Silence)'}`}
                              className={`flex-1 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono-numbers mt-0.5">
                          <span>0h</span>
                          <span>24h</span>
                          <span>48h</span>
                          <span>72h</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#94A3B8] text-[11px]">Timeline unavailable</span>
                    )}
                  </td>

                  {/* Channels */}
                  <td className="py-3 px-4 font-mono-numbers text-[#172033]">
                    <span className={v.availableChannelsNow === 0 ? 'text-red-600 font-semibold' : ''}>
                      {v.availableChannelsNow}
                    </span>
                    <span className="text-[#64748B]"> / {v.nominalChannels}</span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVillage && onSelectVillage(v.id);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Inspect'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Legend */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between text-[11px] text-[#64748B]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>Path Available (Operational)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block" />
            <span>Zero Warning Path (Silence)</span>
          </div>
        </div>
        <div>
          Click any row to load root-cause analysis and targeted interventions below.
        </div>
      </div>
    </div>
  );
};
