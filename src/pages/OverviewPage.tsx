/**
 * PEREGRINE — Overview & Topology Page
 * Topographical network map, cascading fault toggles, KPI summary cards,
 * subsystem diagnostics, and 72-hour outage chronology.
 */

import React, { useState } from 'react';
import { SystemConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  S30Result, 
  S72Result, 
  VillageChannelStatus 
} from '../model/types';
import { NetworkMapAndGraph } from '../components/network/NetworkMapAndGraph';
import { SilenceClockGrid } from '../components/silence-clock/SilenceClockGrid';
import { RedundancyIllusionPanel } from '../components/redundancy-illusion/RedundancyIllusionPanel';
import { 
  Activity, 
  Zap, 
  Wifi, 
  Signal, 
  Radio, 
  ShieldAlert, 
  Scale, 
  Clock, 
  Flame, 
  Truck,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Compass
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
  setInterventions,
  onNavigateToPlanner,
  onResetDefaults
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    const payload = {
      scenario: 'PEREGRINE Disaster Resilience Simulation',
      disclaimer: 'SIMULATION · FICTIONAL DATA',
      exportedAt: new Date().toISOString(),
      failures,
      interventions,
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
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Overview Header & Controls Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Disaster-Resilient Network Overview
            </h2>
            <span className="stamp-label stamp-simulation">TOPOLOGY &amp; RESILIENCE</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Interactive coastal broadcast topology, common-cause failure analysis, and last-mile warning reach across 8 communities.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-numbers">
          <span className="text-[var(--muted)]">EVALUATED WINDOWS:</span>
          <span className="px-2 py-0.5 bg-slate-100 border border-[var(--border)] rounded-[2px] font-bold text-[var(--navy)]">
            S30 (30m) &amp; S72 (72h)
          </span>
        </div>
      </div>

      {/* Action Bar: Export, Reset, Simulation Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[var(--border)] rounded-[4px] font-mono-numbers text-xs">
        <div className="flex items-center gap-2">
          <span className="stamp-label stamp-simulation">SIMULATION · FICTIONAL DATA</span>
          <span className="text-[0.72rem] text-slate-500 hidden sm:inline">
            Deterministic models verified offline (IEEE BTS Hackathon)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="px-2.5 py-1.5 rounded-[3px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Run JSON!' : 'Copy Run as JSON'}</span>
          </button>
          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              className="px-2.5 py-1.5 rounded-[3px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Row (The 4 KPIs in consistent compact row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono-numbers text-xs">
        {/* KPI 1: S30 Resilience */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[0.68rem] text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="font-bold text-[var(--navy)]">S30 RESILIENCE</span>
              <span className="text-[0.62rem] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-[2px] font-semibold">30-MIN</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--navy-deep)]">
                {s30Result.resilienceScore}%
              </span>
              <span className="text-xs text-slate-500">
                (Cell: {s30Result.cellOnlyResilience}%)
              </span>
            </div>
          </div>
          <div className="text-[0.7rem] text-[var(--muted)] mt-2 pt-2 border-t border-slate-100">
            {s30Result.totalReachedEst.toLocaleString()} / 19,900 reached
          </div>
        </div>

        {/* KPI 2: S72 Expected Reception */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[0.68rem] text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="font-bold text-[var(--navy)]">S72 EXPECTED RECEPTION</span>
              <span className="text-[0.62rem] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-[2px] font-semibold">72-HOURS</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--navy-deep)]">
                {s72Result.overallReach}%
              </span>
              <span className="text-xs text-slate-500">pop-weighted</span>
            </div>
          </div>
          <div className="text-[0.7rem] text-[var(--muted)] mt-2 pt-2 border-t border-slate-100">
            Time-averaged over 72h outage
          </div>
        </div>

        {/* KPI 3: Lowest Community Reach */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[0.68rem] text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="font-bold text-[var(--navy)]">LOWEST COMMUNITY</span>
              <span className="text-[0.62rem] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[2px] font-semibold">FAIRNESS</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${
                s72Result.minVillageReach.value === 0 ? 'text-[var(--red-text)]' : 'text-[var(--amber-text)]'
              }`}>
                {s72Result.minVillageReach.value}%
              </span>
              <span className="text-xs text-slate-500 truncate">
                ({s72Result.minVillageReach.name})
              </span>
            </div>
          </div>
          <div className="text-[0.7rem] text-[var(--muted)] mt-2 pt-2 border-t border-slate-100">
            Gap: {(s72Result.overallReach - s72Result.minVillageReach.value).toFixed(1)} pts vs avg
          </div>
        </div>

        {/* KPI 4: 72h Total Silence Blackout */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[0.68rem] text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="font-bold text-[var(--navy)]">72h SILENCE BLACKOUT</span>
              <span className="text-[0.62rem] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px] font-semibold">HUMAN IMPACT</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--red-text)]">
                {totalSilentPop.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">residents</span>
            </div>
          </div>
          <div className="text-[0.7rem] text-[var(--muted)] mt-2 pt-2 border-t border-slate-100">
            {s72Result.villages.filter(v => v.silenceHours === 72).length} of 8 communities in total silence
          </div>
        </div>
      </div>

      {/* Unforgettable Failure Demo: Gateway Collapse vs Redundant Gateway */}
      <div className="utility-card p-4 sm:p-5 rounded-[4px] border-2 border-slate-300 bg-slate-50/90 space-y-3 font-mono-numbers text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h3 className="font-heading font-extrabold text-sm text-[var(--navy)] uppercase tracking-wide">
              Single-Point Failure Demo: Marina Satellite Gateway (54.0% → 0.0%)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] text-slate-500">Live S30 Mesh Reach:</span>
            <span className={`px-2 py-0.5 rounded-[2px] font-extrabold text-xs ${
              s30Result.resilienceScore === 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {s30Result.resilienceScore}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onToggleFailure('gateway')}
            className={`px-3 py-1.5 rounded-[3px] border font-bold text-xs flex items-center gap-1.5 transition-all ${
              failures.gateway
                ? 'bg-red-100 border-red-300 text-red-900 shadow-xs ring-1 ring-red-400'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>{failures.gateway ? 'Restore Marina Gateway' : 'Simulate Gateway Loss (54% → 0%)'}</span>
          </button>

          <button
            onClick={() => setInterventions(prev => ({ ...prev, second_gateway: !prev.second_gateway }))}
            className={`px-3 py-1.5 rounded-[3px] border font-bold text-xs flex items-center gap-1.5 transition-all ${
              interventions.second_gateway
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-xs ring-1 ring-emerald-400'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{interventions.second_gateway ? 'Deactivate Redundant Gateway' : 'Deploy Redundant Gateway (+40u)'}</span>
          </button>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded text-[0.72rem] text-slate-700 leading-relaxed space-y-1">
          <p>
            <strong>Under these assumptions:</strong> Marina is modelled as the sole satellite downlink ingress for the entire 6-node coastal mesh. Under cyclone conditions (terrestrial cell &amp; fixed FM down), external broadcast ingestion to all 6 mesh-connected communities depends strictly on Marina. If the Marina gateway fails, S30 broadcast reach collapses catastrophically from <strong>54.0% to 0.0%</strong>.
          </p>
          <p>
            <strong>Redundant Gateway Assumption:</strong> Deploying the Redundant Gateway (40 units) models a secondary satellite downlink positioned outside the coastal surge zone with autonomous solar/battery power, preserving mesh injection even when Marina gateway severs.
          </p>
        </div>
      </div>

      {/* Primary Visual Focus: Network Topology Simulation */}
      <NetworkMapAndGraph
        villages={config.villages}
        failures={failures}
        interventions={interventions}
        onToggleFailure={onToggleFailure}
        selectedVillageId={selectedVillageId}
        onSelectVillage={onSelectVillage}
      />

      {/* Aligned Operational Panels: Subsystem Diagnostics, Key Findings, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-numbers text-xs">
        {/* Panel 1: Network Subsystem Diagnostics */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[var(--navy)]" />
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)]">
                Subsystem Diagnostics
              </span>
            </div>
            <span className="text-[0.65rem] text-[var(--muted)]">7 NODES</span>
          </div>

          <div className="space-y-1.5 text-[0.72rem]">
            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-slate-500" /> West Power Grid (Tower A)
              </span>
              <span className={`font-bold ${failures.power_west ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.power_west ? 'TRIPPED [CUT]' : 'OPERATIONAL'}
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-slate-500" /> East Power Grid (Tower B / FM)
              </span>
              <span className={`font-bold ${failures.power_east ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.power_east ? 'TRIPPED [CUT]' : 'OPERATIONAL'}
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-slate-500" /> Core Fibre Backhaul
              </span>
              <span className={`font-bold ${failures.fibre ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.fibre ? 'SEVERED' : 'ACTIVE'}
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-slate-500" /> Cellular Tower A &amp; B
              </span>
              <span className={`font-bold ${failures.tower_A || failures.tower_B ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.tower_A && failures.tower_B ? 'BOTH DOWN' : failures.tower_A ? 'A DOWN' : failures.tower_B ? 'B DOWN' : 'ON-AIR'}
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-slate-500" /> FM Transmitter (102.4 MHz)
              </span>
              <span className={`font-bold ${failures.fm_tx ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.fm_tx ? 'OFF-AIR' : 'TRANSMITTING'}
              </span>
            </div>

            <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded-[2px]">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-slate-500" /> Marina Satellite Gateway
              </span>
              <span className={`font-bold ${failures.gateway ? 'text-[var(--red-text)]' : 'text-[var(--green-text)]'}`}>
                {failures.gateway ? 'FEED LOST' : 'FEEDING MESH'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Key Calculated Findings */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[var(--amber-text)]" />
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)]">
                Key Calculated Findings
              </span>
            </div>
            <span className="stamp-label stamp-simulation text-[0.6rem]">EMPIRICAL</span>
          </div>

          <div className="space-y-2 text-[0.72rem] text-slate-700 leading-relaxed font-sans">
            <div className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-[2px]">
              <strong className="text-[var(--navy)] block font-heading text-xs">1. The East Power Common-Cause:</strong>
              East Grid failure severs both FM transmitter and Cell Tower B simultaneously, dropping guaranteed N-1 diversity to 1 (mesh only).
            </div>

            <div className="p-2 bg-red-50/60 border border-red-200/80 rounded-[2px]">
              <strong className="text-[var(--red-text)] block font-heading text-xs">2. Coverage Blind Spots:</strong>
              Thoni (900) &amp; Hill Camp (600) have neither cell nor FM broadcast reception. Only localized community satellite kits or siren patrols can protect them.
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-[2px]">
              <strong className="text-[var(--navy)] block font-heading text-xs">3. Fairness Floor Necessity:</strong>
              An unconstrained reach maximizer concentrates spend on dense coastal centers, leaving outlying hamlets at 0% reach.
            </div>
          </div>
        </div>

        {/* Panel 3: Quick Operational Actions */}
        <div className="utility-card p-4 rounded-[4px] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[var(--navy)]" />
              <span className="font-heading font-bold text-xs uppercase text-[var(--navy)]">
                Quick Operational Actions
              </span>
            </div>
            <span className="text-[0.65rem] text-[var(--muted)]">TACTICAL</span>
          </div>

          <div className="space-y-2 pt-0.5">
            <button
              onClick={() => setInterventions(prev => ({ ...prev, backup_generation: !prev.backup_generation }))}
              className={`w-full p-2 rounded-[3px] border text-left flex items-center justify-between transition-all ${
                interventions.backup_generation
                  ? 'bg-emerald-50 border-emerald-300 text-[var(--green-text)] font-bold'
                  : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Backup Generators (20u)
              </span>
              <span className="font-mono-numbers text-[0.68rem]">
                {interventions.backup_generation ? 'ACTIVE' : 'DEPLOY'}
              </span>
            </button>

            <button
              onClick={() => setInterventions(prev => ({ ...prev, mobile_broadcast_unit: !prev.mobile_broadcast_unit }))}
              className={`w-full p-2 rounded-[3px] border text-left flex items-center justify-between transition-all ${
                interventions.mobile_broadcast_unit
                  ? 'bg-emerald-50 border-emerald-300 text-[var(--green-text)] font-bold'
                  : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-500" /> Mobile FM Unit (30u)
              </span>
              <span className="font-mono-numbers text-[0.68rem]">
                {interventions.mobile_broadcast_unit ? 'ACTIVE' : 'DEPLOY'}
              </span>
            </button>

            <button
              onClick={() => setInterventions(prev => ({ ...prev, second_gateway: !prev.second_gateway }))}
              className={`w-full p-2 rounded-[3px] border text-left flex items-center justify-between transition-all ${
                interventions.second_gateway
                  ? 'bg-emerald-50 border-emerald-300 text-[var(--green-text)] font-bold'
                  : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-purple-500" /> 2nd Satellite Gateway (40u)
              </span>
              <span className="font-mono-numbers text-[0.68rem]">
                {interventions.second_gateway ? 'ACTIVE' : 'DEPLOY'}
              </span>
            </button>

            <button
              onClick={onNavigateToPlanner}
              className="btn-tactile w-full py-2 text-xs flex items-center justify-center gap-1.5 mt-2"
            >
              <Scale className="w-3.5 h-3.5" /> Launch Recovery Decision Engine
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Timeline: 72-Hour Outage Chronology */}
      <div className="utility-card p-5 rounded-[4px] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--navy)]" />
            <h3 className="font-heading font-bold text-sm text-[var(--navy)] uppercase">
              72-Hour Infrastructure Outage Chronology
            </h3>
          </div>
          <span className="text-[0.68rem] font-mono-numbers text-[var(--muted)]">
            GRID RESTORATION: 48H · FM ON-AIR: 24H (DEFAULT)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono-numbers">
          <div className="p-2.5 bg-red-50/60 border border-red-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--red-text)] block">00:00 LANDFALL</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">Grid West &amp; East fail. Cell drops to 0%.</p>
          </div>

          <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--amber-text)] block">00:05 ALERT</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">S30 30-minute critical broadcast window.</p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--navy)] block">24:00 MOBILE TX</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">Mobile unit arrives if dispatched.</p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--navy)] block">25:00 FUEL EXHAUST</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">On-site generator reserves deplete.</p>
          </div>

          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--green-text)] block">48:00 GRID POWER</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">Substations restored; FM returns.</p>
          </div>

          <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-[3px]">
            <span className="text-[0.65rem] font-bold text-[var(--navy)] block">72:00 EVALUATION</span>
            <p className="text-[0.7rem] text-slate-700 mt-1">S72 window closes; reach audited.</p>
          </div>
        </div>
      </div>

      {/* Lower In-Depth Operational Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <SilenceClockGrid
          villages={s72Result.villages}
          totalScenarioHours={72}
          onSelectVillage={onSelectVillage}
          selectedVillageId={selectedVillageId}
        />

        <RedundancyIllusionPanel
          statusList={illusionStatus}
          villages={config.villages}
          onSelectVillage={onSelectVillage}
          selectedVillageId={selectedVillageId}
        />
      </div>
    </div>
  );
};
