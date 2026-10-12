import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../model/config';
import { 
  VillageChannelStatus, 
  NetworkFailureState, 
  ActiveInterventions 
} from '../model/types';
import { RedundancyIllusionPanel } from '../components/redundancy-illusion/RedundancyIllusionPanel';
import { 
  analyzeRedundancyIllusion, 
  compareScenariosRedundancy
} from '../metrics/redundancy';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  ShieldAlert, 
  AlertCircle, 
  ShieldCheck, 
  Radio, 
  Wifi, 
  Signal, 
  Zap,
  Info
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
  setInterventions,
  onApplyScenario
}) => {
  const [activeScenarioTab, setActiveScenarioTab] = useState<'healthy' | 'cyclone' | 'gateway_loss' | 'current'>('current');

  // Full detailed analyses for current state
  const currentAnalyses = useMemo(() => {
    return analyzeRedundancyIllusion(config, failures, interventions);
  }, [config, failures, interventions]);

  // Active village deep-dive
  const activeVillageId = selectedVillageId || (config.villages[0]?.id ?? 'karai');
  const activeAnalysis = currentAnalyses.find(a => a.villageId === activeVillageId) || currentAnalyses[0];
  const activeVillage = config.villages.find(v => v.id === activeVillageId);

  // Aggregated KPIs
  const illusionCount = currentAnalyses.filter(a => a.hasRedundancyIllusion).length;
  const zeroN1Count = currentAnalyses.filter(a => a.n1Guaranteed === 0).length;
  const robustCount = currentAnalyses.filter(a => a.n1Guaranteed >= 2).length;

  // Toggle helpers
  const handleToggleIntervention = (key: 'backup_generation' | 'second_gateway' | 'mobile_broadcast_unit') => {
    if (!setInterventions) return;
    setInterventions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Redundancy Illusion: Physical Diversity Audit"
        category="Resilience Analysis"
        description="Evaluates whether nominally diverse broadcast channels (Cell, FM, Mesh) share hidden upstream power, backhaul, and satellite dependencies that fail simultaneously."
        statusBadge={
          <StatusBadge
            status={illusionCount > 0 ? 'degraded' : 'operational'}
            label={illusionCount > 0 ? `${illusionCount} Settlements at Illusion Risk` : 'Genuine Physical Diversity'}
          />
        }
        actions={
          onApplyScenario && (
            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-md text-xs">
              <span className="text-[#64748B] px-1.5 font-medium">Scenario:</span>
              <button
                type="button"
                onClick={() => {
                  onApplyScenario('healthy');
                  setActiveScenarioTab('healthy');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeScenarioTab === 'healthy' ? 'bg-white font-semibold text-[#172033] shadow-xs' : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Healthy
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyScenario('cyclone');
                  setActiveScenarioTab('cyclone');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeScenarioTab === 'cyclone' ? 'bg-amber-100 font-semibold text-amber-900 shadow-xs' : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Cyclone
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyScenario('gateway_loss');
                  setActiveScenarioTab('gateway_loss');
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeScenarioTab === 'gateway_loss' ? 'bg-red-100 font-semibold text-red-900 shadow-xs' : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Gateway Loss
              </button>
            </div>
          )
        }
      />

      {/* Summary Area: Consolidated KPI Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          {/* Illusion Count */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Redundancy Illusion</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className={`text-2xl font-bold ${illusionCount > 0 ? 'text-amber-700' : 'text-[#172033]'}`}>
                {illusionCount}
              </span>
              <span className="text-xs text-[#64748B]">/ 8 settlements</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Channels share correlated cuts</p>
          </div>

          {/* Zero N-1 */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Zero N-1 Guarantee</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className={`text-2xl font-bold ${zeroN1Count > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {zeroN1Count}
              </span>
              <span className="text-xs text-[#64748B]">/ 8 settlements</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Single failure causes total blackout</p>
          </div>

          {/* Guaranteed Resilient */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Genuinely Resilient (N-1 ≥ 2)</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className="text-2xl font-bold text-[#172033]">
                {robustCount}
              </span>
              <span className="text-xs text-[#64748B]">/ 8 settlements</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Multiple independent paths</p>
          </div>

          {/* Shared Dependencies */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Top Upstream Chokepoint</span>
            <div className="mt-1">
              <span className="text-base font-bold text-red-700">
                East Grid & Fibre
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Most common correlated cut</p>
          </div>
        </div>
      </div>

      {/* Redundancy Comparison Table */}
      <RedundancyIllusionPanel
        statusList={statusList}
        villages={config.villages}
        selectedVillageId={activeVillageId}
        onSelectVillage={onSelectVillage}
        failures={failures}
        interventions={interventions}
      />

      {/* Selected Settlement Detailed Dependency Inspector */}
      {activeVillage && activeAnalysis && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Dependency Inspector
                </span>
                <StatusBadge
                  status={activeAnalysis.n1Guaranteed === 0 ? 'severed' : activeAnalysis.hasRedundancyIllusion ? 'degraded' : 'operational'}
                  label={activeAnalysis.n1Guaranteed === 0 ? 'N-1 = 0 Cut Risk' : activeAnalysis.hasRedundancyIllusion ? 'Illusion Detected' : 'Genuine Redundancy'}
                />
              </div>
              <h3 className="text-lg font-bold text-[#172033] mt-1">
                {activeVillage.name} — Upstream Path Breakdown
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Nominal: <strong className="font-mono-numbers text-[#172033]">{activeAnalysis.nominalCount}</strong> • Available: <strong className="font-mono-numbers text-[#172033]">{activeAnalysis.availableCount}</strong> • Guaranteed N-1: <strong className="font-mono-numbers text-[#172033]">{activeAnalysis.n1Guaranteed}</strong>
              </p>
            </div>

            <div className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-md">
              <span>Population: <strong className="font-mono-numbers text-[#172033]">{activeVillage.pop.toLocaleString()}</strong> residents</span>
            </div>
          </div>

          {/* Channels Dependency Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAnalysis.channelDetails.map((ch) => (
              <div
                key={ch.channelName}
                className={`p-4 rounded-lg border flex flex-col justify-between space-y-3 ${
                  ch.available
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#172033] flex items-center gap-1.5">
                      {ch.channelName.toLowerCase().includes('cell') && <Signal className="w-4 h-4 text-[#2563EB]" />}
                      {ch.channelName.toLowerCase().includes('fm') && <Radio className="w-4 h-4 text-[#16A34A]" />}
                      {ch.channelName.toLowerCase().includes('mesh') && <Wifi className="w-4 h-4 text-[#D97706]" />}
                      <span>{ch.channelName}</span>
                    </span>
                    <span className={`text-xs font-semibold ${ch.available ? 'text-emerald-700' : 'text-red-700'}`}>
                      {ch.available ? 'Operational' : 'Cut'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <span className="text-[11px] font-medium text-[#64748B] block">
                      Upstream Nodes:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ch.upstreamNodes.map((dep) => (
                        <span
                          key={dep}
                          className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] text-[#475569] font-medium"
                        >
                          {dep.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] pt-2 border-t border-slate-200/60 leading-relaxed">
                  {ch.statusReason}
                </div>
              </div>
            ))}
          </div>

          {/* Hardware Mitigations Controls */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#172033]">
                Targeted Mitigation Controls (Breaks Common-Cause Failure)
              </h4>
              <span className="text-xs text-[#64748B]">
                Immediate model recalculation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => handleToggleIntervention('backup_generation')}
                className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                  interventions.backup_generation
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
                }`}
              >
                <div className="font-semibold text-[#172033] flex items-center justify-between">
                  <span>Substation East Generator</span>
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Protects Tower B and FM transmitter from grid failure.
                </div>
                <div className="text-[11px] font-medium mt-2 text-emerald-700">
                  {interventions.backup_generation ? 'Active (+1 Guaranteed)' : 'Inactive'}
                </div>
              </button>

              <button
                onClick={() => handleToggleIntervention('second_gateway')}
                className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                  interventions.second_gateway
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
                }`}
              >
                <div className="font-semibold text-[#172033] flex items-center justify-between">
                  <span>Secondary Gateway (Pazhaya)</span>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Eliminates Marina Gateway as a Single Point of Failure.
                </div>
                <div className="text-[11px] font-medium mt-2 text-emerald-700">
                  {interventions.second_gateway ? 'Active (Eliminates SPOF)' : 'Inactive'}
                </div>
              </button>

              <button
                onClick={() => handleToggleIntervention('mobile_broadcast_unit')}
                className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                  interventions.mobile_broadcast_unit
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
                }`}
              >
                <div className="font-semibold text-[#172033] flex items-center justify-between">
                  <span>Mobile Broadcast Unit</span>
                  <Radio className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Provides vehicle-mounted FM transmission failover.
                </div>
                <div className="text-[11px] font-medium mt-2 text-emerald-700">
                  {interventions.mobile_broadcast_unit ? 'Active (FM Failover)' : 'Inactive'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
