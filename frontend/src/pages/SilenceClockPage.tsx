import React, { useMemo } from 'react';
import { 
  SystemConfig, 
  INITIAL_CONFIG 
} from '../model/config';
import { 
  S72VillageSummary, 
  S72Result, 
  NetworkFailureState, 
  ActiveInterventions 
} from '../model/types';
import { 
  simulateS72, 
  createDefaultFailures, 
  createEmptyInterventions 
} from '../model/graph';
import { 
  analyzeVillageSilenceTimeline, 
  explainVillageIsolation 
} from '../metrics/silence';
import { SilenceClockGrid } from '../components/silence-clock/SilenceClockGrid';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Users, 
  Wifi, 
  Info,
  Volume2,
  PackageCheck
} from 'lucide-react';

interface SilenceClockPageProps {
  villages?: S72VillageSummary[];
  s72Result?: S72Result;
  config?: SystemConfig;
  failures?: NetworkFailureState;
  interventions?: ActiveInterventions;
  selectedVillageId: string | null;
  onSelectVillage: (id: string) => void;
  onToggleFailure?: (key: keyof NetworkFailureState) => void;
  setInterventions?: React.Dispatch<React.SetStateAction<ActiveInterventions>>;
}

export const SilenceClockPage: React.FC<SilenceClockPageProps> = ({
  s72Result,
  config = INITIAL_CONFIG,
  failures = createDefaultFailures(),
  interventions = createEmptyInterventions(),
  selectedVillageId,
  onSelectVillage,
  setInterventions
}) => {
  // Derive effective S72 simulation result dynamically
  const activeS72Result = useMemo(() => {
    return s72Result || simulateS72(config, interventions, 0.5, failures);
  }, [s72Result, config, interventions, failures]);

  // Default selected village to 'thoni' (or worst-served village) if not set
  const effectiveSelectedId = useMemo(() => {
    if (selectedVillageId) return selectedVillageId;
    if (activeS72Result.minVillageReach?.id) return activeS72Result.minVillageReach.id;
    return 'thoni';
  }, [selectedVillageId, activeS72Result]);

  // Find selected village configuration and summary
  const selectedVillageConfig = useMemo(() => {
    return config.villages.find(v => v.id === effectiveSelectedId) || config.villages[0];
  }, [config.villages, effectiveSelectedId]);

  const selectedVillageSummary = useMemo(() => {
    return activeS72Result.villages.find(v => v.id === effectiveSelectedId) || activeS72Result.villages[0];
  }, [activeS72Result.villages, effectiveSelectedId]);

  // 72-Hour hourly timeline analysis for the selected village
  const timelineAnalysis = useMemo(() => {
    const steps = activeS72Result.steps;
    const pathAvailable = steps.map(s => Boolean(s.villagePaths[effectiveSelectedId]));
    const expectedReach = steps.map(s => s.villageReach[effectiveSelectedId] ?? 0);
    return analyzeVillageSilenceTimeline(
      effectiveSelectedId,
      pathAvailable,
      expectedReach,
      config.metrics.lowServiceThreshold
    );
  }, [activeS72Result.steps, effectiveSelectedId, config.metrics.lowServiceThreshold]);

  // Traceable root-cause isolation explanation
  const isolationExplanation = useMemo(() => {
    return explainVillageIsolation(
      selectedVillageConfig,
      failures,
      interventions,
      selectedVillageSummary.silenceHours
    );
  }, [selectedVillageConfig, failures, interventions, selectedVillageSummary.silenceHours]);

  // Aggregated KPIs
  const totalSilentPop = useMemo(() => {
    return activeS72Result.villages
      .filter(v => v.silenceHours === 72)
      .reduce((sum, v) => sum + v.pop, 0);
  }, [activeS72Result]);

  const completeOutageVillagesCount = useMemo(() => {
    return activeS72Result.villages.filter(v => v.silenceHours === 72).length;
  }, [activeS72Result]);

  const meanSilenceHours = useMemo(() => {
    const sum = activeS72Result.villages.reduce((acc, v) => acc + v.silenceHours, 0);
    return (sum / activeS72Result.villages.length).toFixed(1);
  }, [activeS72Result]);

  // Toggle interventions handler for selected settlement
  const handleToggleIntervention = (type: string) => {
    if (!setInterventions) return;

    setInterventions(prev => {
      switch (type) {
        case 'community_kit': {
          const exists = prev.community_kits.includes(effectiveSelectedId);
          return {
            ...prev,
            community_kits: exists
              ? prev.community_kits.filter(id => id !== effectiveSelectedId)
              : [...prev.community_kits, effectiveSelectedId]
          };
        }
        case 'siren_responder': {
          const exists = prev.siren_responders.includes(effectiveSelectedId);
          return {
            ...prev,
            siren_responders: exists
              ? prev.siren_responders.filter(id => id !== effectiveSelectedId)
              : [...prev.siren_responders, effectiveSelectedId]
          };
        }
        case 'relay_node': {
          const exists = prev.relay_nodes.includes(effectiveSelectedId);
          return {
            ...prev,
            relay_nodes: exists
              ? prev.relay_nodes.filter(id => id !== effectiveSelectedId)
              : [...prev.relay_nodes, effectiveSelectedId]
          };
        }
        case 'backup_generation':
          return { ...prev, backup_generation: !prev.backup_generation };
        case 'mobile_broadcast_unit':
          return { ...prev, mobile_broadcast_unit: !prev.mobile_broadcast_unit };
        case 'second_gateway':
          return { ...prev, second_gateway: !prev.second_gateway };
        default:
          return prev;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Silence Clock: 72-Hour Warning Blackout Analysis"
        category="Human Impact Assessment"
        description="Measures modeled hours with zero surviving broadcast or mesh warning paths across the 72-hour utility failure window."
        statusBadge={
          <StatusBadge
            status={completeOutageVillagesCount === 0 ? 'operational' : 'severed'}
            label={completeOutageVillagesCount === 0 ? 'No Communities Isolated' : `${completeOutageVillagesCount} Communities Fully Isolated`}
          />
        }
      />

      {/* Primary KPI Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          {/* Blackout Pop */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Complete Blackout Population</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className={`text-2xl font-bold ${totalSilentPop > 0 ? 'text-red-700' : 'text-[#172033]'}`}>
                {totalSilentPop.toLocaleString()}
              </span>
              <span className="text-xs text-[#64748B]">residents</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Zero warning reach across 72h</p>
          </div>

          {/* Completely Isolated */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Completely Isolated</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className={`text-2xl font-bold ${completeOutageVillagesCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {completeOutageVillagesCount}
              </span>
              <span className="text-xs text-[#64748B]">/ 8 settlements</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">72 hours uninterrupted silence</p>
          </div>

          {/* Mean Silence */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">Mean Settlement Silence</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className="text-2xl font-bold text-[#172033]">
                {meanSilenceHours}
              </span>
              <span className="text-xs text-[#64748B]">hours</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Average blackout per settlement</p>
          </div>

          {/* 72h Population Reach (CORRECTED UNIT: already 0..100) */}
          <div className="p-3">
            <span className="text-xs text-[#64748B]">72h Mean Reach</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono-numbers">
              <span className={`text-2xl font-bold ${activeS72Result.overallReach >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {activeS72Result.overallReach.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Time-averaged warning coverage</p>
          </div>
        </div>
      </div>

      {/* Settlement Outage Matrix Table */}
      <SilenceClockGrid
        villages={activeS72Result.villages}
        steps={activeS72Result.steps}
        totalScenarioHours={72}
        selectedVillageId={effectiveSelectedId}
        onSelectVillage={onSelectVillage}
      />

      {/* Selected Settlement Deep-Dive Detail Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B]">
                Settlement Details
              </span>
              <StatusBadge
                status={selectedVillageSummary.silenceHours === 72 ? 'severed' : selectedVillageSummary.silenceHours > 0 ? 'degraded' : 'operational'}
                label={`${selectedVillageSummary.silenceHours}h Total Silence`}
              />
            </div>
            <h3 className="text-lg font-bold text-[#172033] mt-1">
              {selectedVillageConfig.name}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Population: <span className="font-mono-numbers">{selectedVillageConfig.pop.toLocaleString()}</span> residents • Coordinates: <span className="font-mono-numbers">({selectedVillageConfig.x}, {selectedVillageConfig.y})</span>
            </p>
          </div>

          <div className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-md">
            <span>Nominal Channels: <strong className="font-mono-numbers text-[#172033]">{selectedVillageSummary.nominalChannels}</strong> • Surviving: <strong className="font-mono-numbers text-[#172033]">{selectedVillageSummary.availableChannelsNow}</strong></span>
          </div>
        </div>

        {/* Root Cause Assessment */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-semibold text-[#172033]">
              Root-Cause Isolation Assessment
            </h4>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            {isolationExplanation.isolationSummary}
          </p>
          {isolationExplanation.activeMitigations.length > 0 && (
            <div className="pt-2 border-t border-slate-200 text-xs">
              <span className="font-medium text-[#172033]">Active Interventions: </span>
              <span className="text-[#64748B]">{isolationExplanation.activeMitigations.join(' • ')}</span>
            </div>
          )}
        </div>

        {/* Timeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-md">
            <span className="text-[#64748B] text-[11px] block">Longest Uninterrupted Silence Streak</span>
            <div className="text-lg font-bold text-[#172033] mt-1 font-mono-numbers">
              {timelineAnalysis.longestSilencePeriod}h continuous
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Worst contiguous blackout window
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-md">
            <span className="text-[#64748B] text-[11px] block">Discrete Outage Intervals</span>
            <div className="text-lg font-bold text-[#172033] mt-1 font-mono-numbers">
              {timelineAnalysis.outageIntervals.length} interval(s)
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              {timelineAnalysis.outageIntervals.map(inv => `H${inv.startHour}–H${inv.endHour}`).join(', ') || 'No Outage'}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-md">
            <span className="text-[#64748B] text-[11px] block">Time-Averaged Village Reach</span>
            <div className="text-lg font-bold text-[#172033] mt-1 font-mono-numbers">
              {(selectedVillageSummary.timeAvgReach * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Across 72 simulated hourly steps
            </div>
          </div>
        </div>

        {/* Targeted Interventions Section */}
        <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#172033]">
              Targeted Interventions for {selectedVillageConfig.name}
            </h4>
            <span className="text-xs text-[#64748B]">
              Toggle intervention hardware to evaluate modeled recovery
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Community Kit */}
            <button
              onClick={() => handleToggleIntervention('community_kit')}
              className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                interventions.community_kits.includes(effectiveSelectedId)
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033]">Community Kit</span>
                <PackageCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Off-grid satellite receiver + power
              </div>
              <div className="text-[11px] font-medium mt-2 text-emerald-700">
                {interventions.community_kits.includes(effectiveSelectedId) ? 'Deployed (+1 Channel)' : 'Not Deployed'}
              </div>
            </button>

            {/* Siren Responder */}
            <button
              onClick={() => handleToggleIntervention('siren_responder')}
              className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                interventions.siren_responders.includes(effectiveSelectedId)
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033]">Siren Patrol</span>
                <Volume2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Acoustic motorbike responder
              </div>
              <div className="text-[11px] font-medium mt-2 text-emerald-700">
                {interventions.siren_responders.includes(effectiveSelectedId) ? 'Active Patrol' : 'Inactive'}
              </div>
            </button>

            {/* Backup Generator */}
            <button
              onClick={() => handleToggleIntervention('backup_generation')}
              className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                interventions.backup_generation
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033]">Backup Generator</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Substation East diesel generator
              </div>
              <div className="text-[11px] font-medium mt-2 text-emerald-700">
                {interventions.backup_generation ? 'Running (H0–H24)' : 'Offline'}
              </div>
            </button>

            {/* Second Gateway */}
            <button
              onClick={() => handleToggleIntervention('second_gateway')}
              className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all ${
                interventions.second_gateway
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033]">Secondary Gateway</span>
                <Wifi className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Pazhaya emergency satellite uplink
              </div>
              <div className="text-[11px] font-medium mt-2 text-emerald-700">
                {interventions.second_gateway ? 'Operational' : 'Inactive'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
