import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  S30Result, 
  S72Result, 
  VillageChannelStatus 
} from '../model/types';
import { 
  ScenarioSummary, 
  ActiveFailureDetail, 
  getScenarioSummary, 
  getActiveFailuresList 
} from '../model/graph';
import { NetworkMapAndGraph } from '../components/network/NetworkMapAndGraph';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  Activity, 
  Zap, 
  Signal, 
  Scale, 
  Clock, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  CloudLightning, 
  ArrowUpRight,
  ShieldCheck,
  Radio,
  Users
} from 'lucide-react';

interface OverviewPageProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  interventions: ActiveInterventions;
  s30Result: S30Result;
  s72Result: S72Result;
  illusionStatus: VillageChannelStatus[];
  totalSilentPop: number;
  selectedVillageId: string | null;
  onToggleFailure: (nodeKey: keyof NetworkFailureState) => void;
  onSelectVillage: (id: string) => void;
  setInterventions: React.Dispatch<React.SetStateAction<ActiveInterventions>>;
  onNavigateToPlanner: () => void;
  onResetDefaults?: () => void;
  onPresetHealthy?: () => void;
  onPresetCyclone?: () => void;
  onPresetGatewayLost?: () => void;
  scenarioSummary?: ScenarioSummary;
  activeFailuresList?: ActiveFailureDetail[];
  scenarioFeedback?: { message: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
  onClearFeedback?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  config,
  failures,
  interventions,
  s30Result,
  s72Result,
  illusionStatus,
  totalSilentPop,
  selectedVillageId,
  onToggleFailure,
  onSelectVillage,
  onNavigateToPlanner,
  scenarioSummary,
  activeFailuresList
}) => {
  const [copied, setCopied] = useState(false);

  // Authoritative scenario summary & active failures list
  const summary = useMemo(() => {
    return scenarioSummary || getScenarioSummary(failures, interventions);
  }, [scenarioSummary, failures, interventions]);

  const activeList = useMemo(() => {
    return activeFailuresList || getActiveFailuresList(failures, interventions);
  }, [activeFailuresList, failures, interventions]);

  const handleCopyJson = () => {
    const payload = {
      scenario: summary.scenarioName,
      status: summary.status,
      headline: summary.headline,
      disclaimer: 'SIMULATION · FICTIONAL DATA',
      exportedAt: new Date().toISOString(),
      failures,
      interventions,
      causes: summary.causes,
      mitigations: summary.mitigations,
      metrics: {
        s30ResilienceScore: s30Result.resilienceScore,
        s30CellOnly: s30Result.cellOnlyResilience,
        s72OverallReach: s72Result.overallReach,
        s72LowestVillage: s72Result.minVillageReach,
        silentPopulation72h: totalSilentPop
      }
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute number of villages with partial or complete outage
  const degradedVillagesCount = s72Result.villages.filter(v => v.silenceHours > 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Operations Dashboard & Network Topology"
        category="Operational Command"
        description="Real-time coastal broadcast infrastructure status, cascading cut-path analysis, and last-mile emergency alert reach across 8 settlements."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#475569] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5 shadow-xs"
              title="Copy active incident data as JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export JSON'}</span>
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="px-3 py-1.5 rounded-md bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Recovery Planner</span>
            </button>
          </div>
        }
      />

      {/* Unified Operational Status Strip: Answers the 4 key questions directly */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md shrink-0 mt-0.5 ${
              summary.status === 'OPERATIONAL'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : summary.status === 'DEGRADED'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {summary.status === 'OPERATIONAL' && <CheckCircle2 className="w-5 h-5" />}
              {summary.status === 'DEGRADED' && <CloudLightning className="w-5 h-5" />}
              {summary.status === 'CRITICAL' && <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172033]">
                  {summary.scenarioName}
                </h2>
                <StatusBadge
                  status={summary.status === 'OPERATIONAL' ? 'operational' : summary.status === 'DEGRADED' ? 'degraded' : 'severed'}
                  label={summary.status}
                  size="sm"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl leading-relaxed">
                {summary.headline}
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] text-[#64748B] block">S30 Alert Reach</span>
              <span className="text-base font-bold text-[#172033] font-mono-numbers">
                {s30Result.resilienceScore.toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] text-[#64748B] block">S72 Mean Reach</span>
              <span className="text-base font-bold text-[#172033] font-mono-numbers">
                {s72Result.overallReach.toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] text-[#64748B] block">72h Blackout</span>
              <span className={`text-base font-bold font-mono-numbers ${totalSilentPop > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {totalSilentPop.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] text-[#64748B] block">Isolated Towns</span>
              <span className={`text-base font-bold font-mono-numbers ${degradedVillagesCount > 0 ? 'text-amber-700' : 'text-[#172033]'}`}>
                {degradedVillagesCount} / 8
              </span>
            </div>
          </div>
        </div>

        {/* Direct Root Causes & Active Mitigations */}
        {summary.causes.length > 0 && (
          <div className="pt-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#475569]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#172033]">Active Fault Cascades:</span>
              <span>{summary.causes.join(' • ')}</span>
            </div>
            {summary.mitigations.length > 0 && (
              <span className="text-emerald-700 font-medium shrink-0">
                {summary.mitigations.length} Mitigations Active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Primary Workspace: Topology Diagram & Settlement Impact List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Network Topology Visualization */}
        <div className="lg:col-span-7 space-y-4">
          <NetworkMapAndGraph
            villages={config.villages}
            failures={failures}
            interventions={interventions}
            onToggleFailure={onToggleFailure}
            selectedVillageId={selectedVillageId}
            onSelectVillage={onSelectVillage}
          />
        </div>

        {/* Right Column: Community Impact List & Fault Diagnostics */}
        <div className="lg:col-span-5 space-y-5">
          {/* Settlement Outage Triage Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Signal className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                  Settlement Warning Access (8 Communities)
                </h3>
              </div>
              <span className="text-xs text-[#64748B]">
                Click to inspect
              </span>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {config.villages.map((v) => {
                const s72v = s72Result.villages.find(sv => sv.id === v.id);
                const illv = illusionStatus.find(iv => iv.villageId === v.id);
                const isSelected = selectedVillageId === v.id;
                const isSilent = s72v ? s72v.silenceHours === 72 : false;
                const isOperational = s72v ? s72v.silenceHours === 0 : true;

                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVillage(v.id)}
                    className={`py-2.5 px-3 flex items-center justify-between text-xs cursor-pointer rounded-md transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#172033] flex items-center gap-1.5">
                        <span className="truncate">{v.name}</span>
                        {isSilent ? (
                          <StatusBadge status="severed" label="72h Blackout" size="sm" dot={false} />
                        ) : isOperational ? (
                          <StatusBadge status="operational" label="Connected" size="sm" dot={false} />
                        ) : (
                          <StatusBadge status="degraded" label={`${s72v?.silenceHours}h Outage`} size="sm" dot={false} />
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        <span className="font-mono-numbers">{v.pop.toLocaleString()}</span> pop • <span className="font-mono-numbers">{illv?.availableCount ?? 0}/{illv?.nominalCount ?? 0}</span> channels
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#64748B] font-mono-numbers">
                        {(s72v ? s72v.timeAvgReach * 100 : 0).toFixed(0)}% reach
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Infrastructure Faults Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                  Infrastructure Failure Impacts
                </h3>
              </div>
              <span className="text-xs text-[#64748B]">
                <span className="font-mono-numbers font-semibold">{activeList.length}</span> active faults
              </span>
            </div>

            {activeList.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All core infrastructure components (power, fibre, towers, gateway) are currently operational.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeList.map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#172033]">
                        {item.label}
                      </span>
                      <StatusBadge
                        status={item.status === 'UNAVAILABLE' ? 'severed' : item.status === 'DEGRADED' ? 'degraded' : 'operational'}
                        label={item.status}
                        size="sm"
                      />
                    </div>
                    <div className="text-[11px] text-[#64748B] leading-relaxed">
                      {item.impact}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
