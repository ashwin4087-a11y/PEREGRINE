/**
 * PEREGRINE — Redundancy Illusion Page (Section 9)
 * Detects common-cause failure dependencies across nominally diverse broadcast channels.
 * Compares nominal diversity vs actual operational paths vs N-1 guaranteed resilience.
 */

import React, { useState } from 'react';
import { SystemConfig } from '../model/config';
import { 
  VillageChannelStatus, 
  NetworkFailureState, 
  ActiveInterventions 
} from '../model/types';
import { RedundancyIllusionPanel } from '../components/redundancy-illusion/RedundancyIllusionPanel';
import { 
  analyzeRedundancyIllusion, 
  compareScenariosRedundancy,
  explainNodeCascade
} from '../metrics/redundancy';
import { 
  ShieldAlert, 
  AlertCircle, 
  Info, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Radio, 
  Wifi, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Sparkles,
  GitCommit
} from 'lucide-react';

export interface RedundancyPageProps {
  config: SystemConfig;
  statusList: VillageChannelStatus[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string) => void;
  failures?: NetworkFailureState;
  interventions?: ActiveInterventions;
  onToggleFailure?: (id: keyof NetworkFailureState) => void;
  setInterventions?: React.Dispatch<React.SetStateAction<ActiveInterventions>>;
  onApplyScenario?: (scenario: 'healthy' | 'cyclone' | 'gateway_loss') => void;
}

export const RedundancyPage: React.FC<RedundancyPageProps> = ({
  config,
  statusList,
  selectedVillageId,
  onSelectVillage,
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
  },
  onToggleFailure,
  setInterventions,
  onApplyScenario
}) => {
  const [activeScenarioTab, setActiveScenarioTab] = useState<'healthy' | 'cyclone' | 'gateway_loss' | 'current'>('current');

  // Full detailed analyses for current state
  const currentAnalyses = React.useMemo(() => {
    return analyzeRedundancyIllusion(config, failures, interventions);
  }, [config, failures, interventions]);

  // Scenario comparisons
  const scenarioComparisons = React.useMemo(() => {
    return compareScenariosRedundancy(config, interventions);
  }, [config, interventions]);

  // Determine which settlement to deep-dive into (default to first if none selected)
  const activeVillageId = selectedVillageId || (config.villages[0]?.id ?? 'karai');
  const activeAnalysis = currentAnalyses.find(a => a.villageId === activeVillageId) || currentAnalyses[0];
  const activeVillage = config.villages.find(v => v.id === activeVillageId);

  // Intervention toggle helpers
  const handleToggleIntervention = (key: 'backup_generation' | 'second_gateway' | 'mobile_broadcast_unit') => {
    if (!setInterventions) return;
    setInterventions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleCommunityKit = (vId: string) => {
    if (!setInterventions) return;
    setInterventions(prev => {
      const exists = prev.community_kits.includes(vId);
      return {
        ...prev,
        community_kits: exists 
          ? prev.community_kits.filter(id => id !== vId)
          : [...prev.community_kits, vId]
      };
    });
  };

  const handleToggleSirenResponder = (vId: string) => {
    if (!setInterventions) return;
    setInterventions(prev => {
      const exists = prev.siren_responders.includes(vId);
      return {
        ...prev,
        siren_responders: exists 
          ? prev.siren_responders.filter(id => id !== vId)
          : [...prev.siren_responders, vId]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Redundancy Illusion Audit
            </h2>
            <span className="stamp-label stamp-warning">DEPENDENCY GRAPH AUDIT · SECTION 9</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Evaluates nominal broadcast diversity against physical upstream dependencies. Demonstrates why multiple channel icons 
            do not guarantee independent failure protection.
          </p>
        </div>

        {/* Quick Scenario Preset Controller */}
        {onApplyScenario && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <span className="text-[0.68rem] font-bold text-[var(--muted)] px-2 uppercase">
              Apply Preset:
            </span>
            <button
              type="button"
              onClick={() => {
                onApplyScenario('healthy');
                setActiveScenarioTab('healthy');
              }}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-[var(--navy)] font-semibold border border-slate-200/80 shadow-xs"
            >
              Healthy
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyScenario('cyclone');
                setActiveScenarioTab('cyclone');
              }}
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 shadow-xs"
            >
              Cyclone
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyScenario('gateway_loss');
                setActiveScenarioTab('gateway_loss');
              }}
              className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-900 font-semibold border border-red-200 shadow-xs"
            >
              Gateway Loss
            </button>
          </div>
        )}
      </div>

      {/* Scenario Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioComparisons.map(sc => {
          const isSelected = activeScenarioTab === sc.scenarioId;
          return (
            <div
              key={sc.scenarioId}
              className={`utility-card p-4 rounded-lg border transition-all ${
                isSelected 
                  ? 'border-[var(--navy)] bg-slate-50/90 ring-1 ring-[var(--navy)]' 
                  : 'border-[var(--border)] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <span className="font-heading font-bold text-sm text-[var(--navy)]">
                  {sc.scenarioName}
                </span>
                {onApplyScenario && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyScenario(sc.scenarioId);
                      setActiveScenarioTab(sc.scenarioId);
                    }}
                    className="text-[0.68rem] font-bold text-[var(--navy)] hover:text-amber-800 underline"
                  >
                    Load State
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="p-2 bg-white rounded border border-slate-100">
                  <div className="text-[0.62rem] uppercase text-[var(--muted)] font-semibold">Avg Avail</div>
                  <div className="text-base font-heading font-bold text-[var(--navy)]">
                    {sc.summary.islandAvgAvailableChannels}
                  </div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-100">
                  <div className="text-[0.62rem] uppercase text-[var(--muted)] font-semibold">N-1 Floor</div>
                  <div className="text-base font-heading font-bold text-amber-900">
                    {sc.summary.islandAvgN1Guaranteed}
                  </div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-100">
                  <div className="text-[0.62rem] uppercase text-[var(--muted)] font-semibold">N-1 = 0 Cut</div>
                  <div className="text-base font-heading font-bold text-red-900">
                    {sc.summary.villagesAtSinglePointCut}
                  </div>
                </div>
              </div>

              <p className="text-[0.72rem] text-[var(--ink)] mt-3 leading-relaxed">
                {sc.keyFinding}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Redundancy Illusion Matrix Panel */}
      <RedundancyIllusionPanel
        statusList={statusList}
        villages={config.villages}
        onSelectVillage={onSelectVillage}
        selectedVillageId={activeVillageId}
        failures={failures}
        interventions={interventions}
        onToggleFailure={onToggleFailure}
        setInterventions={setInterventions}
      />

      {/* Settlement Channel Deep-Dive Inspector */}
      {activeAnalysis && activeVillage && (
        <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg border border-[var(--border)] bg-white shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center font-heading font-black text-sm">
                {activeVillage.id.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-lg text-[var(--navy)]">
                    {activeVillage.name} — Dependency & Resilience Audit
                  </h3>
                  {activeAnalysis.hasRedundancyIllusion && (
                    <span className="stamp-label stamp-warning">ILLUSION DETECTED</span>
                  )}
                  {activeAnalysis.isCompletelyVulnerable && (
                    <span className="stamp-label stamp-critical">N-1 = 0 SPOF</span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Population: {activeVillage.pop.toLocaleString()} · Coordinates: ({activeVillage.x}, {activeVillage.y})
                </p>
              </div>
            </div>

            {/* Village Selector Pills */}
            <div className="flex flex-wrap gap-1">
              {config.villages.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVillage(v.id)}
                  className={`px-2 py-0.5 rounded text-xs font-mono-numbers transition-colors ${
                    v.id === activeVillageId
                      ? 'bg-[var(--navy)] text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Key Stat Chamber for Selected Village */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <div className="text-[0.68rem] uppercase font-bold text-[var(--muted)]">
                Nominal On Paper
              </div>
              <div className="text-xl font-heading font-black text-[var(--navy)] mt-1">
                {activeAnalysis.nominalCount} channels
              </div>
              <p className="text-[0.68rem] text-[var(--muted)] mt-0.5">
                Configured broadcast pathways
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg">
              <div className="text-[0.68rem] uppercase font-bold text-blue-900">
                Available Now
              </div>
              <div className="text-xl font-heading font-black text-blue-950 mt-1">
                {activeAnalysis.availableCount} active
              </div>
              <p className="text-[0.68rem] text-blue-800 mt-0.5">
                Functional in current disaster state
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg">
              <div className="text-[0.68rem] uppercase font-bold text-amber-900">
                N-1 Guaranteed
              </div>
              <div className="text-xl font-heading font-black text-amber-950 mt-1">
                {activeAnalysis.n1Guaranteed} channels
              </div>
              <p className="text-[0.68rem] text-amber-800 mt-0.5">
                Surviving worst-case single component failure
              </p>
            </div>
          </div>

          {/* Detailed Channel-by-Channel Breakdown */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase text-[var(--navy)] tracking-wide">
              Physical Warning Channel Audit
            </h4>

            <div className="space-y-2">
              {activeAnalysis.channelDetails.map((ch, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    ch.available 
                      ? 'bg-slate-50/60 border-slate-200' 
                      : 'bg-red-50/40 border-red-200/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[var(--navy)]">
                        {ch.channelName}
                      </span>
                      {ch.available ? (
                        <span className="stamp-label stamp-verified text-[0.6rem]">OPERATIONAL</span>
                      ) : (
                        <span className="stamp-label stamp-critical text-[0.6rem]">SEVERED</span>
                      )}
                    </div>
                    <p className="text-[var(--ink)] leading-relaxed">
                      {ch.statusReason}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-1.5 shrink-0 text-[0.72rem] font-mono-numbers">
                    {ch.upstreamNodes.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[var(--muted)]">
                        <span className="font-semibold">Required Nodes:</span>
                        {ch.upstreamNodes.map(node => {
                          const isFailed = failures[node as keyof NetworkFailureState];
                          return (
                            <span
                              key={node}
                              className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold ${
                                isFailed 
                                  ? 'bg-red-100 text-red-900 line-through' 
                                  : 'bg-slate-200/70 text-slate-800'
                              }`}
                            >
                              {node}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {ch.mitigations.length > 0 && (
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {ch.mitigations.join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Root-Cause Explanation & Vulnerability Diagnostics */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-2 font-heading font-bold text-[var(--navy)]">
              <AlertCircle className="w-4 h-4 text-[var(--amber-text)]" />
              Traceable Dependency Explanation
            </div>
            <p className="text-[var(--ink)] leading-relaxed">
              {activeAnalysis.explanation}
            </p>

            {activeAnalysis.worstCaseNode && (
              <div className="pt-2 border-t border-slate-200/70 text-[0.72rem] flex flex-wrap items-center gap-2">
                <span className="font-bold text-[var(--navy)]">Worst-Case Component Cut:</span>
                <code className="px-1.5 py-0.5 bg-slate-200 rounded font-bold text-red-900">
                  {activeAnalysis.worstCaseNode}
                </code>
                <span className="text-[var(--muted)]">
                  — additionally removing this component drops surviving channels to {activeAnalysis.n1Guaranteed}.
                </span>
              </div>
            )}
          </div>

          {/* Interactive Mitigation Testbed for this Village */}
          <div className="p-4 bg-slate-50 border border-[var(--navy)]/20 rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)] tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--navy)]" />
                Intervention Testbed: Mitigate Fragility for {activeVillage.name}
              </span>
              <span className="text-[0.68rem] text-[var(--muted)]">
                Toggle to observe real-time N-1 recovery
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono-numbers">
              {/* East Substation Generator */}
              <button
                type="button"
                onClick={() => handleToggleIntervention('backup_generation')}
                className={`p-2.5 rounded border text-left transition-all ${
                  interventions.backup_generation 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-[var(--navy)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[0.75rem]">East Generator</span>
                  <span className={`w-2 h-2 rounded-full ${interventions.backup_generation ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-[0.65rem] text-[var(--muted)] mt-1">
                  Protects Tower B & FM from East Power failure
                </p>
              </button>

              {/* Secondary Backup Gateway */}
              <button
                type="button"
                onClick={() => handleToggleIntervention('second_gateway')}
                className={`p-2.5 rounded border text-left transition-all ${
                  interventions.second_gateway 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-[var(--navy)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[0.75rem]">2nd Gateway (Pazhaya)</span>
                  <span className={`w-2 h-2 rounded-full ${interventions.second_gateway ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-[0.65rem] text-[var(--muted)] mt-1">
                  Protects mesh from Marina gateway loss
                </p>
              </button>

              {/* Community Kit for Village */}
              <button
                type="button"
                onClick={() => handleToggleCommunityKit(activeVillage.id)}
                className={`p-2.5 rounded border text-left transition-all ${
                  interventions.community_kits.includes(activeVillage.id)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-[var(--navy)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[0.75rem]">Community Kit</span>
                  <span className={`w-2 h-2 rounded-full ${interventions.community_kits.includes(activeVillage.id) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-[0.65rem] text-[var(--muted)] mt-1">
                  Deploys standalone satellite terminal to {activeVillage.name}
                </p>
              </button>

              {/* Siren Responder for Village */}
              <button
                type="button"
                onClick={() => handleToggleSirenResponder(activeVillage.id)}
                className={`p-2.5 rounded border text-left transition-all ${
                  interventions.siren_responders.includes(activeVillage.id)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-[var(--navy)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[0.75rem]">Siren Responder</span>
                  <span className={`w-2 h-2 rounded-full ${interventions.siren_responders.includes(activeVillage.id) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-[0.65rem] text-[var(--muted)] mt-1">
                  Dispatches acoustic siren responder to shelter
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mathematical Proof & Modeled Assumptions */}
      <div className="utility-card p-5 sm:p-6 space-y-4 rounded-lg border border-[var(--border)]">
        <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase tracking-wide">
          Mathematical Graph Proof: The East Power Common-Cause Failure
        </h4>
        <div className="text-xs font-mono-numbers text-[var(--ink)] space-y-3 leading-relaxed">
          <p>
            1. <strong>Nominal Configuration</strong>: Karai, Uppalam, and Sagar are listed with 3 channels: Cell Broadcast, VHF FM Radio, and Shelter Mesh.
          </p>
          <p>
            2. <strong>Shared Physical Dependency</strong>: Cell broadcast relies on Tower B powered by <code>power_east</code>. Central FM Transmitter relies on <code>power_east</code>.
          </p>
          <p>
            3. <strong>Common-Cause Failure Cascades</strong>: A single fault at the East Grid substation knocks out both Cell and FM simultaneously.
            The N−1 guaranteed channel count drops to strictly <strong>1</strong> (mesh only), proving that having multiple nominal channel icons does not equal independent physical resilience.
          </p>
          <p>
            4. <strong>Compound Disaster Collapse</strong>: Under the cyclone landfall scenario (West Grid down, East Grid down, Fibre severed), Cell and FM are both down island-wide.
            Shelter Mesh is the sole operational channel. Because all mesh nodes rely on the Marina Gateway, any subsequent single gateway fault drops available channels from 1 to 0.
            This single-point-of-failure risk (N−1 = 0) is absorbed only when a secondary backup gateway is deployed at Pazhaya.
          </p>
        </div>

        {/* Modeling Assumptions Disclaimer */}
        <div className="pt-3 border-t border-slate-200/80 text-[0.68rem] text-[var(--muted)] leading-relaxed">
          <strong>Modeled Assumptions & Fictional Population Data:</strong> Settlement population figures (19,900 benchmark) and topology coordinates are fictional values designed for deterministic disaster resilience modeling.
          Crucially, a missing modeled broadcast path does not prove that residents physically received no warning, nor does it model non-networked media (word of mouth, sirens, megaphones).
          All resilience calculations reflect deterministic graph traversals under stated scenario assumptions.
        </div>
      </div>
    </div>
  );
};
