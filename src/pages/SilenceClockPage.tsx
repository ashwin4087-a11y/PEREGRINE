/**
 * PEREGRINE — Silence Clock & Settlement Outage Analysis Page (Section 8)
 * Models 72-hour extended infrastructure failure, hourly warning path availability,
 * continuous silence duration, outage interval boundaries, isolation explanations,
 * and supported recovery interventions across all eight settlements.
 */

import React, { useState, useMemo } from 'react';
import { 
  SystemConfig, 
  INITIAL_CONFIG, 
  VillageConfig 
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
import { 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Wifi, 
  Radio, 
  Signal, 
  Truck, 
  Flame, 
  MapPin, 
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2
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
  villages,
  s72Result,
  config = INITIAL_CONFIG,
  failures = createDefaultFailures(),
  interventions = createEmptyInterventions(),
  selectedVillageId,
  onSelectVillage,
  onToggleFailure,
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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Page Header with Title and Modeled Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Silence Clock &amp; Settlement Outage Analysis
            </h2>
            <span className="stamp-label stamp-simulation">HUMAN IMPACT METRIC</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Per-village modeled hours with zero available broadcast or mesh warning paths across a 72-hour power blackout window.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-numbers">
          <span className="text-[var(--muted)]">EVALUATION WINDOW:</span>
          <span className="px-2 py-0.5 bg-slate-100 border border-[var(--border)] rounded-[2px] font-bold text-[var(--navy)]">
            S72 (72 Hours)
          </span>
        </div>
      </div>

      {/* 1.1 Modeled Assumption & Fictional Data Notice */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-[4px] text-xs font-mono-numbers text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <div className="font-bold flex items-center gap-2">
            <span>SIMULATION · FICTIONAL PLANNING MODEL (IEEE BTS Hackathon)</span>
            <span className="stamp-label stamp-simulation text-[0.6rem]">ASSUMPTIONS</span>
          </div>
          <p className="text-[0.72rem] text-slate-700 font-sans">
            <strong>Critical Modeling Boundary:</strong> A missing modeled broadcast path indicates zero surviving electronic channels in this deterministic simulation; it does <em>not</em> prove that residents physically received no warning via informal word-of-mouth or unmodeled means. All population figures represent fictional synthetic benchmarks for decision-support comparison.
          </p>
        </div>
      </div>

      {/* 2. Top-Level 8-Settlement Silence Clock Grid */}
      <SilenceClockGrid
        villages={activeS72Result.villages}
        steps={activeS72Result.steps}
        totalScenarioHours={72}
        onSelectVillage={onSelectVillage}
        selectedVillageId={effectiveSelectedId}
      />

      {/* 3. Selected Settlement Deep-Dive & 72-Hour Timeline Inspector */}
      <div className="utility-card p-5 sm:p-6 rounded-[4px] border-2 border-slate-300 bg-white space-y-6 font-mono-numbers text-xs shadow-xs">
        {/* Settlement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-[3px] flex items-center justify-center ${
              isolationExplanation.tier === 'TIER_2_ISOLATED'
                ? 'bg-red-900 text-white'
                : 'bg-[#0C2A47] text-white'
            }`}>
              <MapPin className="w-5 h-5 text-[var(--amber)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] text-slate-500 uppercase font-semibold">
                  SELECTED SETTLEMENT:
                </span>
                <span className={`px-2 py-0.5 rounded-[2px] font-extrabold text-[0.7rem] ${
                  isolationExplanation.tier === 'TIER_2_ISOLATED'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {isolationExplanation.tierLabel}
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[var(--navy)]">
                {selectedVillageConfig.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-500 text-[0.68rem] block">Fictional Population:</span>
              <span className="font-bold text-[var(--navy)] text-sm">{selectedVillageConfig.pop.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[0.68rem] block">Coordinates:</span>
              <span className="font-mono text-slate-700">({selectedVillageConfig.x}, {selectedVillageConfig.y})</span>
            </div>
          </div>
        </div>

        {/* 3.1 Three Distinct Outage Duration Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Metric 1: Total Silence Hours */}
          <div className="p-3.5 bg-slate-50 rounded-[3px] border border-slate-200 flex flex-col justify-between">
            <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-semibold">
              TOTAL SILENCE HOURS
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-2xl font-extrabold ${
                timelineAnalysis.totalSilenceHours === 72 ? 'text-red-700' : timelineAnalysis.totalSilenceHours > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {timelineAnalysis.totalSilenceHours}
              </span>
              <span className="text-xs text-slate-500">/ 72 Hours</span>
            </div>
            <div className="text-[0.68rem] text-slate-600">
              Cumulative hours without surviving modeled path
            </div>
          </div>

          {/* Metric 2: Continuous Initial Silence Duration */}
          <div className="p-3.5 bg-slate-50 rounded-[3px] border border-slate-200 flex flex-col justify-between">
            <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-semibold">
              CONTINUOUS INITIAL BLACKOUT
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-2xl font-extrabold ${
                timelineAnalysis.continuousSilenceDuration === 72 ? 'text-red-700' : timelineAnalysis.continuousSilenceDuration > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {timelineAnalysis.continuousSilenceDuration}h
              </span>
              <span className="text-xs text-slate-500">from 00:00</span>
            </div>
            <div className="text-[0.68rem] text-slate-600">
              Uninterrupted outage duration until first restoration
            </div>
          </div>

          {/* Metric 3: Longest Uninterrupted Silence Period */}
          <div className="p-3.5 bg-slate-50 rounded-[3px] border border-slate-200 flex flex-col justify-between">
            <div className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-semibold">
              LONGEST SILENCE PERIOD
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-2xl font-extrabold ${
                timelineAnalysis.longestSilencePeriod === 72 ? 'text-red-700' : timelineAnalysis.longestSilencePeriod > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {timelineAnalysis.longestSilencePeriod}h
              </span>
              <span className="text-xs text-slate-500">max interval</span>
            </div>
            <div className="text-[0.68rem] text-slate-600">
              Longest single contiguous blackout window
            </div>
          </div>
        </div>

        {/* 3.2 72-Hour Interactive Timeline Visualizer */}
        <div className="space-y-2 p-4 bg-slate-50/80 rounded-[3px] border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--navy)]" />
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)]">
                72-Hour Warning Path Timeline (Hourly Resolution)
              </span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[0.68rem]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Path Active (&ge;25%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Degraded (&lt;25%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Silence Blackout (0%)
              </span>
            </div>
          </div>

          {/* Timeline Bar Strip */}
          <div className="pt-2">
            <div className="flex justify-between text-[0.65rem] font-mono-numbers text-slate-500 mb-1">
              <span>00:00 (Landfall)</span>
              <span>24:00 (Mobile Tx)</span>
              <span>25:00 (Fuel Out)</span>
              <span>48:00 (Grid Return)</span>
              <span>72:00 (End)</span>
            </div>
            <div 
              role="img"
              aria-label={`72-hour timeline for ${selectedVillageConfig.name}: ${timelineAnalysis.totalSilenceHours} hours silence, ${72 - timelineAnalysis.totalSilenceHours} hours active`}
              className="flex h-6 w-full rounded-[2px] overflow-hidden bg-slate-200 border border-slate-300 shadow-inner"
            >
              {timelineAnalysis.hourlyStatus.map(slot => (
                <div
                  key={slot.hour}
                  title={`Hour ${slot.hour} (T+${slot.hour}h): ${slot.status} · Expected Reach: ${(slot.expectedReach * 100).toFixed(1)}%`}
                  className={`flex-1 h-full border-r border-black/10 transition-colors ${
                    slot.status === 'SILENCE'
                      ? 'bg-red-500 hover:bg-red-600'
                      : slot.status === 'DEGRADED'
                      ? 'bg-amber-400 hover:bg-amber-500'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3.3 Modeled Outage Interval Boundaries */}
          <div className="pt-2">
            <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">
              IDENTIFIED OUTAGE INTERVALS:
            </span>
            {timelineAnalysis.outageIntervals.length === 0 ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[2px] text-emerald-800 text-[0.72rem] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero modeled blackout intervals: This settlement maintains surviving broadcast paths across all 72 hours.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {timelineAnalysis.outageIntervals.map((inv, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-red-200 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[0.68rem]">
                      <span className="font-bold text-red-800">Interval {idx + 1}</span>
                      <span className="font-extrabold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-[2px]">
                        {inv.durationHours} Hours
                      </span>
                    </div>
                    <div className="text-[0.72rem] font-bold text-[var(--navy)] mt-1">
                      {String(inv.startHour).padStart(2, '0')}:00 &rarr; {String(inv.endHour).padStart(2, '0')}:00
                    </div>
                    <div className="text-[0.65rem] text-slate-500 mt-0.5">
                      {inv.startHour === 0 && inv.endHour === 72
                        ? 'Continuous 72h blackout'
                        : inv.startHour === 0 && inv.endHour === 48
                        ? 'Utility power loss prior to grid return'
                        : inv.startHour === 25 && inv.endHour === 48
                        ? 'Fuel exhaustion interval (25h to 48h)'
                        : 'Modeled outage window'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3.4 Nominal vs Currently Available Warning Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-[3px] border border-slate-200 space-y-2">
            <span className="text-[0.68rem] text-[var(--navy)] font-bold uppercase tracking-wider block pb-1 border-b border-slate-200">
              AVAILABLE WARNING CHANNELS:
            </span>
            <div className="space-y-1.5 text-[0.72rem]">
              {/* Cellular Broadcast */}
              <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Signal className="w-3.5 h-3.5 text-slate-500" /> Cell Broadcast (Tower {selectedVillageConfig.tower || 'None'})
                </span>
                <span className={`font-bold text-[0.68rem] ${
                  !selectedVillageConfig.tower
                    ? 'text-slate-400'
                    : failures.fibre || (selectedVillageConfig.tower === 'A' ? failures.power_west : failures.power_east)
                    ? 'text-red-700'
                    : 'text-emerald-700'
                }`}>
                  {!selectedVillageConfig.tower
                    ? 'NO COVERAGE'
                    : failures.fibre
                    ? 'FIBRE SEVERED'
                    : (selectedVillageConfig.tower === 'A' ? failures.power_west : failures.power_east)
                    ? 'GRID TRIP'
                    : 'ACTIVE'}
                </span>
              </div>

              {/* FM Radio */}
              <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-500" /> FM Radio (102.4 MHz)
                </span>
                <span className={`font-bold text-[0.68rem] ${
                  !selectedVillageConfig.fm
                    ? 'text-slate-400'
                    : failures.fm_tx && !interventions.mobile_broadcast_unit
                    ? 'text-red-700'
                    : failures.power_east && !interventions.backup_generation && !interventions.mobile_broadcast_unit
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}>
                  {!selectedVillageConfig.fm
                    ? 'OUTSIDE CONTOUR'
                    : interventions.mobile_broadcast_unit
                    ? 'MOBILE TX (ON-AIR)'
                    : interventions.backup_generation
                    ? 'GEN ACTIVE (0-25h)'
                    : failures.power_east
                    ? 'RECOVERS 48h'
                    : 'ON-AIR'}
                </span>
              </div>

              {/* Shelter Mesh Relay */}
              <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-500" /> Shelter Mesh Relay Node
                </span>
                <span className={`font-bold text-[0.68rem] ${
                  !selectedVillageConfig.meshNode
                    ? 'text-slate-400'
                    : failures.gateway && !interventions.second_gateway
                    ? 'text-red-700'
                    : 'text-emerald-700'
                }`}>
                  {!selectedVillageConfig.meshNode
                    ? 'NOT INSTALLED'
                    : failures.gateway && !interventions.second_gateway
                    ? 'INGRESS CUT (0%)'
                    : 'ACTIVE HOPS'}
                </span>
              </div>
            </div>
          </div>

          {/* 3.5 Traceable Root-Cause Isolation Explanation */}
          <div className="p-4 bg-slate-50 rounded-[3px] border border-slate-200 space-y-2">
            <span className="text-[0.68rem] text-[var(--navy)] font-bold uppercase tracking-wider block pb-1 border-b border-slate-200">
              TRACEABLE ISOLATION ROOT CAUSES:
            </span>
            <p className="text-[0.72rem] text-slate-700 font-sans leading-relaxed">
              {isolationExplanation.isolationSummary}
            </p>
            <div className="space-y-1 pt-1">
              <span className="text-[0.62rem] text-slate-500 uppercase tracking-wider font-semibold block">
                PHYSICAL NETWORK DEPENDENCIES:
              </span>
              <ul className="space-y-1 text-[0.68rem] text-slate-700 font-sans list-disc list-inside">
                {isolationExplanation.underlyingDependencies.map((dep, i) => (
                  <li key={i} className="leading-snug">
                    <span>{dep}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3.6 Supported Interventions for this Settlement */}
        <div className="p-4 bg-white rounded-[3px] border border-slate-300 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)]">
                Supported Recovery Interventions for {selectedVillageConfig.name}
              </span>
            </div>
            <span className="text-[0.65rem] text-slate-500">
              Only interventions supported by the mathematical model are shown
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {isolationExplanation.supportedInterventions.map((inv) => (
              <div 
                key={inv.type}
                className={`p-3 rounded-[3px] border flex flex-col justify-between gap-2 text-[0.72rem] ${
                  inv.isActive
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-heading font-bold text-xs">
                      {inv.label}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[0.62rem] ${
                      inv.isActive
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {inv.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-[0.68rem] text-slate-600 font-sans leading-snug">
                    {inv.effectDescription}
                  </p>
                </div>

                {setInterventions && (
                  <button
                    onClick={() => handleToggleIntervention(inv.type)}
                    aria-label={`Toggle ${inv.label} for ${selectedVillageConfig.name}`}
                    className={`px-2.5 py-1 rounded-[2px] border font-bold text-[0.68rem] transition-colors self-start ${
                      inv.isActive
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {inv.isActive ? 'Deactivate Intervention' : 'Deploy Intervention'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Transmission Tiers Overview */}
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

