/**
 * PEREGRINE — Redundancy Illusion Analysis (Section 9)
 * Detects common-cause failure dependencies across nominally diverse channels.
 * Displays: "Nominal on paper · Available now · N-1 Guaranteed after 1 more failure"
 */

import React from 'react';
import { VillageChannelStatus } from '../model/graph';
import { VillageConfig } from '../model/config';
import { Layers, ShieldAlert, AlertCircle, Info } from 'lucide-react';

interface RedundancyIllusionPanelProps {
  statusList: VillageChannelStatus[];
  villages: VillageConfig[];
  onSelectVillage?: (id: string) => void;
  selectedVillageId?: string | null;
}

export const RedundancyIllusionPanel: React.FC<RedundancyIllusionPanelProps> = ({
  statusList,
  villages,
  onSelectVillage,
  selectedVillageId
}) => {
  const getVillageName = (id: string) => villages.find(v => v.id === id)?.name || id;
  const getVillagePop = (id: string) => villages.find(v => v.id === id)?.pop || 0;

  // Count villages suffering from redundancy illusion (where available > n1Guaranteed)
  const atRiskCount = statusList.filter(s => s.availableCount > s.n1Guaranteed && s.availableCount > 0).length;

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                Redundancy Illusion Analysis
              </h3>
              <span className="stamp-label stamp-warning">DEPENDENCY GRAPH AUDIT</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Counts channels honestly by inspecting shared upstream power, backhaul, and gateway dependencies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-numbers px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-md text-amber-900 font-semibold flex items-center gap-1.5 shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--amber-text)]" />
            {atRiskCount} of 8 communities have single-point fragility
          </span>
        </div>
      </div>

      {/* Insight Explanatory Callout */}
      <div className="p-3.5 bg-slate-50 border-l-3 border-[var(--navy)] border border-slate-200/80 rounded-lg text-xs text-[var(--ink)] flex items-start gap-2.5 leading-relaxed">
        <Info className="w-4 h-4 text-[var(--navy)] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--navy)]">The Illusion Explained: </span>
          <span>
            Having Cell, FM, and Shelter Mesh appears as 3 independent warning paths on paper. However, for Tower B communities (Karai, Uppalam, Sagar),
            both Cell and FM depend on the <strong className="text-[var(--navy-deep)]">East Power Grid</strong>. A single substation trip collapses 2 channels simultaneously, leaving only 1 guaranteed channel.
          </span>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
        <table className="w-full text-left text-xs font-mono-numbers border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[var(--navy)]">
              <th className="p-3 font-bold">Community</th>
              <th className="p-3 font-bold">Population</th>
              <th className="p-3 font-bold">On Paper (Nominal)</th>
              <th className="p-3 font-bold">Available Now</th>
              <th className="p-3 font-bold text-center">N-1 Guaranteed</th>
              <th className="p-3 font-bold">Common-Cause Vulnerability</th>
              <th className="p-3 font-bold">Honest Status</th>
            </tr>
          </thead>
          <tbody>
            {statusList.map(st => {
              const name = getVillageName(st.villageId);
              const pop = getVillagePop(st.villageId);
              const isSelected = selectedVillageId === st.villageId;
              const hasIllusion = st.availableCount > 1 && st.n1Guaranteed <= 1;
              const isDead = st.availableCount === 0;

              return (
                <tr
                  key={st.villageId}
                  onClick={() => onSelectVillage && onSelectVillage(st.villageId)}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-amber-50/70 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 font-heading font-bold text-sm text-[var(--navy)]">
                    {name}
                  </td>
                  <td className="p-3 text-[var(--muted)]">
                    {pop.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                      {st.nominalCount} channels
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        st.availableCount > 0
                          ? 'bg-blue-50 text-[var(--navy)] border border-blue-200'
                          : 'bg-red-50 text-[var(--red)] border border-red-200'
                      }`}
                    >
                      {st.availableCount} active
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-extrabold ${
                        st.n1Guaranteed >= 2
                          ? 'bg-emerald-50 text-[var(--green-text)] border border-emerald-300'
                          : st.n1Guaranteed === 1
                          ? 'bg-amber-50 text-[var(--amber-text)] border border-amber-300'
                          : 'bg-red-50 text-[var(--red-text)] border border-red-300'
                      }`}
                    >
                      {st.n1Guaranteed} guaranteed
                    </span>
                  </td>
                  <td className="p-3 text-[0.72rem]">
                    {st.commonCauseNodes.length > 0 ? (
                      <span className="text-[var(--red-text)] font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Shared node: {st.commonCauseNodes.join(', ')}
                      </span>
                    ) : st.nominalCount === 0 ? (
                      <span className="text-[var(--muted)]">No configured paths</span>
                    ) : (
                      <span className="text-[var(--green-text)]">Independent paths</span>
                    )}
                  </td>
                  <td className="p-3">
                    {isDead ? (
                      <span className="stamp-label stamp-critical text-[0.6rem]">PATH CUT</span>
                    ) : hasIllusion ? (
                      <span className="stamp-label stamp-warning text-[0.6rem]">ILLUSION RISK</span>
                    ) : (
                      <span className="stamp-label stamp-verified text-[0.6rem]">ROBUST</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
