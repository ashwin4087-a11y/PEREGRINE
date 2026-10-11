/**
 * PEREGRINE — Redundancy Illusion Analysis Panel (Section 9)
 * Detects common-cause failure dependencies across nominally diverse channels.
 * Displays: "Nominal on paper · Available now · N-1 Guaranteed after 1 more failure"
 */

import React, { useState } from 'react';
import { 
  VillageChannelStatus, 
  NodeId, 
  NetworkFailureState, 
  ActiveInterventions 
} from '../../model/types';
import { VillageConfig } from '../../model/config';
import { 
  analyzeRedundancyIllusion, 
  explainNodeCascade, 
  calculateRedundancySummary,
  CRITICAL_FAILURE_NODES
} from '../../metrics/redundancy';
import { 
  Layers, 
  ShieldAlert, 
  AlertCircle, 
  Info, 
  Zap, 
  Radio, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  ChevronRight,
  GitFork,
  ArrowRight
} from 'lucide-react';

interface RedundancyIllusionPanelProps {
  statusList: VillageChannelStatus[];
  villages: VillageConfig[];
  onSelectVillage?: (id: string) => void;
  selectedVillageId?: string | null;
  failures?: NetworkFailureState;
  interventions?: ActiveInterventions;
  onToggleFailure?: (node: keyof NetworkFailureState) => void;
  setInterventions?: React.Dispatch<React.SetStateAction<ActiveInterventions>>;
}

export const RedundancyIllusionPanel: React.FC<RedundancyIllusionPanelProps> = ({
  statusList,
  villages,
  onSelectVillage,
  selectedVillageId,
  failures = {
    power_west: false,
    power_east: false,
    power_east_permanent: false,
    fibre: false,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false,
    gateway_backup: false,
    mesh_nodes_down: []
  },
  interventions = {
    backup_generation: false,
    second_gateway: false,
    mobile_broadcast_unit: false,
    community_kits: [],
    siren_responders: [],
    relay_nodes: []
  }
}) => {
  const [inspectedNode, setInspectedNode] = useState<NodeId | null>(null);

  // Full detailed analyses
  const analyses = React.useMemo(() => {
    return analyzeRedundancyIllusion({ villages } as any, failures, interventions);
  }, [villages, failures, interventions]);

  const summary = React.useMemo(() => {
    return calculateRedundancySummary(analyses);
  }, [analyses]);

  const getVillageName = (id: string) => villages.find(v => v.id === id)?.name || id;
  const getVillagePop = (id: string) => villages.find(v => v.id === id)?.pop || 0;

  const nodeDetail = inspectedNode ? explainNodeCascade(inspectedNode) : null;

  return (
    <div className="utility-card p-5 sm:p-6 space-y-6 rounded-lg border border-[var(--border)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-base text-[var(--navy)] uppercase tracking-wide">
                Redundancy Illusion Matrix
              </h3>
              <span className="stamp-label stamp-warning">DEPENDENCY GRAPH AUDIT</span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Audits warning paths by tracing upstream power, backhaul fibre, mast hardware, and satellite gateway dependencies.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-numbers px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-md text-amber-900 font-semibold flex items-center gap-1.5 shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--amber-text)]" />
            {summary.villagesAtIllusionRisk} of 8 at illusion risk
          </span>
          {summary.villagesAtSinglePointCut > 0 && (
            <span className="text-xs font-mono-numbers px-2.5 py-1 bg-red-50 border border-red-200/80 rounded-md text-red-900 font-bold flex items-center gap-1.5 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--red-text)]" />
              {summary.villagesAtSinglePointCut} at N-1 = 0 blackout risk
            </span>
          )}
        </div>
      </div>

      {/* Island-wide Metric Chamber Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[0.68rem] uppercase font-bold text-[var(--muted)] tracking-wider">
            Nominal Diversity
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-heading font-black text-[var(--navy)]">
              {summary.islandAvgNominalChannels}
            </span>
            <span className="text-xs text-[var(--muted)] font-mono-numbers">ch / village</span>
          </div>
          <p className="text-[0.68rem] text-[var(--muted)] mt-1">
            Nominal warning channels on paper
          </p>
        </div>

        <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-lg">
          <div className="text-[0.68rem] uppercase font-bold text-blue-900 tracking-wider">
            Available Now
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-heading font-black text-blue-950">
              {summary.islandAvgAvailableChannels}
            </span>
            <span className="text-xs text-blue-700 font-mono-numbers">ch / village</span>
          </div>
          <p className="text-[0.68rem] text-blue-850 mt-1">
            Operational under current scenario
          </p>
        </div>

        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg">
          <div className="text-[0.68rem] uppercase font-bold text-amber-900 tracking-wider">
            N-1 Guaranteed
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-heading font-black text-amber-950">
              {summary.islandAvgN1Guaranteed}
            </span>
            <span className="text-xs text-amber-700 font-mono-numbers">ch / village</span>
          </div>
          <p className="text-[0.68rem] text-amber-850 mt-1">
            Surviving after 1 worst-case failure
          </p>
        </div>

        <div className="p-3.5 bg-red-50/60 border border-red-200/70 rounded-lg">
          <div className="text-[0.68rem] uppercase font-bold text-red-900 tracking-wider">
            Single-Point Fragility
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-heading font-black text-red-950">
              {summary.villagesAtSinglePointCut + summary.villagesCompletelySevered}
            </span>
            <span className="text-xs text-red-700 font-mono-numbers">/ 8 settlements</span>
          </div>
          <p className="text-[0.68rem] text-red-850 mt-1">
            Severed or 1 cut from blackout
          </p>
        </div>
      </div>

      {/* Educational Callout: The Redundancy Illusion Explained */}
      <div className="p-4 bg-slate-50 border-l-4 border-[var(--navy)] border border-slate-200/80 rounded-lg text-xs text-[var(--ink)] space-y-2 leading-relaxed">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--navy)] shrink-0" />
          <h4 className="font-heading font-bold text-sm text-[var(--navy)]">
            Physical Diversity vs. Topological Independence
          </h4>
        </div>
        <p>
          A citizen with a mobile smartphone, an FM transistor radio, and a shelter mesh receiver appears to enjoy 
          <strong className="text-[var(--navy-deep)]"> 3-fold redundancy on paper</strong>.
          However, broadcast networks share physical single points of failure.
        </p>
        <p>
          In PEREGRINE&apos;s architecture: <strong>Tower B villages (Karai, Uppalam, Sagar)</strong> rely on Tower B for Cell Broadcast 
          and the central FM Transmitter for radio. <em>Both transmitters are powered by the East Grid Substation (110kV)</em>.
          When East Power trips, both Cell and FM drop simultaneously, collapsing from 3 channels to 1 (Shelter Mesh only).
          The <span className="font-bold text-[var(--navy)]">N−1 guaranteed count</span> evaluates this worst-case single component cut.
        </p>
      </div>

      {/* Interactive Upstream Dependency Node Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-heading font-bold text-[var(--navy)] uppercase tracking-wide flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-[var(--muted)]" />
            Inspect Critical Upstream Components
          </span>
          <span className="text-[0.68rem] text-[var(--muted)]">
            Click component to inspect cascading impact
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {CRITICAL_FAILURE_NODES.map(nodeId => {
            const isFailed = Boolean(failures[nodeId as keyof NetworkFailureState]);
            const isSelected = inspectedNode === nodeId;
            const cascade = explainNodeCascade(nodeId);

            return (
              <button
                key={nodeId}
                type="button"
                onClick={() => setInspectedNode(isSelected ? null : nodeId)}
                className={`p-2 rounded-md border text-left transition-all text-xs font-mono-numbers ${
                  isSelected
                    ? 'ring-2 ring-[var(--navy)] border-[var(--navy)] bg-slate-100 shadow-xs'
                    : isFailed
                    ? 'bg-red-50/80 border-red-200 text-red-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-[var(--navy)]'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-bold uppercase text-[var(--muted)]">
                    {cascade.category}
                  </span>
                  {isFailed ? (
                    <span className="w-2 h-2 rounded-full bg-red-500" title="Offline" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Operational" />
                  )}
                </div>
                <div className="font-bold text-xs truncate mt-1">
                  <code>{nodeId}</code>
                </div>
                <div className="text-[0.62rem] text-[var(--muted)] truncate mt-0.5">
                  {cascade.name.split('(')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Node Details Box */}
        {nodeDetail && (
          <div className="p-3.5 bg-slate-50 border border-[var(--navy)]/30 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-[var(--navy)] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[var(--amber-text)]" />
                Component: {nodeDetail.name} (<code>{nodeDetail.nodeId}</code>)
              </span>
              <span className="stamp-label stamp-warning text-[0.62rem]">
                {nodeDetail.vulnerabilityType}
              </span>
            </div>
            <p className="text-[var(--ink)] leading-relaxed">
              <strong>Impact:</strong> {nodeDetail.impactDescription}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[0.72rem] text-[var(--muted)]">
              <span>
                <strong>Affected Channels:</strong> {nodeDetail.affectedChannels.join(', ').toUpperCase()}
              </span>
              <span>•</span>
              <span>
                <strong>Affected Settlements:</strong> {nodeDetail.affectedVillages.join(', ')}
              </span>
              {nodeDetail.mitigatingIntervention && (
                <>
                  <span>•</span>
                  <span className="text-emerald-800 font-semibold">
                    <strong>Mitigation:</strong> {nodeDetail.mitigatingIntervention}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settlement Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-heading font-bold text-[var(--navy)] uppercase tracking-wide">
            Settlement Redundancy Audit (Click row to inspect)
          </span>
          <span className="text-[0.68rem] text-[var(--muted)]">
            Worst-first sorting: vulnerable settlements highlighted
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
          <table className="w-full text-left text-xs font-mono-numbers border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[var(--navy)]">
                <th className="p-3 font-bold">Community</th>
                <th className="p-3 font-bold">Population</th>
                <th className="p-3 font-bold">On Paper (Nominal)</th>
                <th className="p-3 font-bold">Available Now</th>
                <th className="p-3 font-bold text-center">N-1 Guaranteed</th>
                <th className="p-3 font-bold">Shared Node & Vulnerability</th>
                <th className="p-3 font-bold">Honest Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map(analysis => {
                const isSelected = selectedVillageId === analysis.villageId;
                const hasIllusion = analysis.hasRedundancyIllusion;
                const isDead = analysis.isCompletelySevered;
                const isVulnerable = analysis.isCompletelyVulnerable;

                return (
                  <tr
                    key={analysis.villageId}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => onSelectVillage && onSelectVillage(analysis.villageId)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVillage && onSelectVillage(analysis.villageId);
                      }
                    }}
                    className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-50/80 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 font-heading font-bold text-sm text-[var(--navy)]">
                      <div className="flex items-center gap-1.5">
                        {analysis.villageName}
                        {isSelected && (
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--navy)]" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {analysis.population.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                          {analysis.nominalCount} channels
                        </span>
                        <div className="flex items-center gap-1 text-[var(--muted)] text-[0.68rem]">
                          {analysis.tower && (
                            <span title={`Cell (Tower ${analysis.tower})`}>
                              <Zap className="w-3 h-3 text-slate-600" />
                            </span>
                          )}
                          {analysis.hasFm && (
                            <span title="FM Radio">
                              <Radio className="w-3 h-3 text-slate-600" />
                            </span>
                          )}
                          {analysis.hasMeshNode && (
                            <span title="Shelter Mesh">
                              <Wifi className="w-3 h-3 text-slate-600" />
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                          analysis.availableCount > 0
                            ? 'bg-blue-50 text-[var(--navy)] border border-blue-200'
                            : 'bg-red-50 text-[var(--red)] border border-red-200'
                        }`}
                      >
                        {analysis.availableCount > 0 ? (
                          <CheckCircle2 className="w-3 h-3 text-blue-700" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        {analysis.availableCount} active
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded font-black ${
                          analysis.n1Guaranteed >= 2
                            ? 'bg-emerald-50 text-[var(--green-text)] border border-emerald-300'
                            : analysis.n1Guaranteed === 1
                            ? 'bg-amber-50 text-[var(--amber-text)] border border-amber-300'
                            : 'bg-red-50 text-[var(--red-text)] border border-red-300'
                        }`}
                      >
                        {analysis.n1Guaranteed} guaranteed
                      </span>
                    </td>
                    <td className="p-3 text-[0.72rem]">
                      {analysis.commonCauseNodes.length > 0 ? (
                        <span className="text-[var(--red-text)] font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Shared: <code>{analysis.commonCauseNodes.join(', ')}</code>
                        </span>
                      ) : analysis.worstCaseNode ? (
                        <span className="text-[var(--muted)]">
                          Worst cut: <code>{analysis.worstCaseNode}</code>
                        </span>
                      ) : analysis.nominalCount === 0 ? (
                        <span className="text-[var(--muted)]">No modeled paths</span>
                      ) : (
                        <span className="text-[var(--green-text)] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          Independent cut-sets
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isDead ? (
                        <span className="stamp-label stamp-critical text-[0.6rem]">PATH CUT</span>
                      ) : isVulnerable ? (
                        <span className="stamp-label stamp-critical text-[0.6rem]">N-1 = 0 SPOF</span>
                      ) : hasIllusion ? (
                        <span className="stamp-label stamp-warning text-[0.6rem]">ILLUSION RISK</span>
                      ) : (
                        <span className="stamp-label stamp-verified text-[0.6rem]">ROBUST</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectVillage && onSelectVillage(analysis.villageId);
                        }}
                        className="text-xs text-[var(--navy)] hover:text-amber-800 font-bold inline-flex items-center gap-1"
                      >
                        Audit
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
