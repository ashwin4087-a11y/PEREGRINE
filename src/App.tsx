/**
 * PEREGRINE — Disaster-Resilient Broadcast Network
 * Decision-Support Simulation & Recovery Planner
 * IEEE BTS Hackathon
 */

import React, { useState, useMemo } from 'react';
import { INITIAL_CONFIG, SystemConfig } from './model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  simulateS30, 
  simulateS72, 
  calculateRedundancyIllusion 
} from './model/graph';
import { PeregrineLogo } from './components/brand/PeregrineLogo';
import { NetworkMapAndGraph } from './components/NetworkMapAndGraph';
import { SilenceClockGrid } from './components/SilenceClockGrid';
import { RedundancyIllusionPanel } from './components/RedundancyIllusionPanel';
import { DecisionEngineView } from './components/DecisionEngineView';
import { OutagePlanMatrix } from './components/OutagePlanMatrix';
import { AuditPanel } from './components/AuditPanel';
import { SensitivityPanel } from './components/SensitivityPanel';
import { ExperimentLogView } from './components/ExperimentLogView';
import { 
  Activity, 
  Clock, 
  Layers, 
  Scale, 
  Calendar, 
  Key, 
  Sliders, 
  RotateCcw, 
  CloudLightning, 
  Radio, 
  X,
  Menu,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Zap,
  Wifi,
  Signal,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Truck
} from 'lucide-react';

const NAV_ITEMS = [
  { 
    id: 'overview', 
    label: 'Overview & Topology', 
    shortLabel: 'Overview', 
    description: 'Infrastructure network, cut-path diagram & cascading fault toggles',
    icon: Activity 
  },
  { 
    id: 'silence', 
    label: 'Silence Clock', 
    shortLabel: 'Silence Clock', 
    description: 'Human impact metric & per-village warning blackout durations',
    icon: Clock 
  },
  { 
    id: 'failure_analysis', 
    label: 'Failure Analysis', 
    shortLabel: 'Failure Analysis', 
    description: 'Redundancy illusion audit, common-cause cuts & stress benchmarks',
    icon: Layers 
  },
  { 
    id: 'recovery_planner', 
    label: 'Recovery Planner', 
    shortLabel: 'Recovery Planner', 
    description: 'Dual-objective decision engine & 72h outage restoration matrix',
    icon: Scale 
  },
] as const;

type NavTabId = (typeof NAV_ITEMS)[number]['id'];

export default function App() {
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  // Network Failure State
  const [failures, setFailures] = useState<NetworkFailureState>({
    power_west: false,
    power_east: false,
    fibre: false,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false
  });

  // Active Interventions
  const [interventions, setInterventions] = useState<ActiveInterventions>({
    backup_generation: false,
    mobile_broadcast_unit: false,
    second_gateway: false,
    relay_nodes: [],
    siren_responders: [],
    community_kits: []
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');

  // Sub-sections for combined operational tabs
  const [failureAnalysisSection, setFailureAnalysisSection] = useState<'redundancy' | 'stress'>('redundancy');
  const [recoveryPlannerSection, setRecoveryPlannerSection] = useState<'decision_engine' | 'outage_matrix'>('decision_engine');

  // Mobile / tablet navigation menu toggle state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Optional WebCrypto audit console modal state (accessible without dominating primary nav)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Applied recovery plan feedback notification
  const [appliedPlanToast, setAppliedPlanToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Selected village for inspector modal
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  // Toggle single failure
  const handleToggleFailure = (nodeKey: keyof NetworkFailureState) => {
    setFailures(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  // Preset: Healthy Grid
  const handlePresetHealthy = () => {
    setFailures({
      power_west: false,
      power_east: false,
      fibre: false,
      tower_A: false,
      tower_B: false,
      fm_tx: false,
      gateway: false
    });
  };

  // Preset: Cyclone Hits (Compound Failure)
  const handlePresetCyclone = () => {
    setFailures({
      power_west: true,
      power_east: true,
      fibre: true,
      tower_A: false,
      tower_B: false,
      fm_tx: false,
      gateway: false
    });
  };

  // Preset: Gateway Lost (Dedicated demo beat: Cyclone + Gateway Cut)
  const handlePresetGatewayLost = () => {
    if (!failures.gateway) {
      setFailures({
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: true
      });
    } else {
      setFailures({
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      });
    }
  };

  // Active failure count
  const activeFailureCount = Object.values(failures).filter(Boolean).length;
  const isHealthyPreset = activeFailureCount === 0;
  const isCyclonePreset = failures.power_west && failures.power_east && failures.fibre && !failures.gateway;
  const isGatewayLostPreset = failures.power_west && failures.power_east && failures.fibre && failures.gateway;

  // Run S30 alert-window simulation
  const s30Result = useMemo(() => {
    return simulateS30(config, failures, interventions, 0.5);
  }, [config, failures, interventions]);

  // Run S72 72-hour outage simulation
  const s72Result = useMemo(() => {
    return simulateS72(config, interventions, 0.5, failures);
  }, [config, interventions, failures]);

  // Calculate Redundancy Illusion
  const illusionStatus = useMemo(() => {
    return calculateRedundancyIllusion(config, failures, interventions);
  }, [config, failures, interventions]);

  // Total population under 72h total silence
  const totalSilentPop = useMemo(() => {
    return s72Result.villages
      .filter(v => v.silenceHours === 72)
      .reduce((sum, v) => sum + v.pop, 0);
  }, [s72Result]);

  // Selected village details
  const selectedVillage = config.villages.find(v => v.id === selectedVillageId);
  const selectedVillageS72 = s72Result.villages.find(v => v.id === selectedVillageId);
  const selectedVillageIllusion = illusionStatus.find(v => v.villageId === selectedVillageId);

  // Current active navigation item metadata
  const currentNavItem = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0];
  const CurrentNavIcon = currentNavItem.icon;

  const handleSelectTab = (tabId: NavTabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F7FAFC] text-[#17212B]">
      {/* 1. Shared Application Header */}
      <header className="bg-white border-b border-[var(--border)] relative z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand Lockup & Mobile Toggle */}
          <div className="flex items-center justify-between">
            <PeregrineLogo size="md" variant="lockup-horizontal" />

            {/* Mobile / Tablet Menu Button (< lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-[3px] border border-[var(--border)] bg-slate-50 text-[var(--navy)] text-xs font-mono-numbers font-semibold hover:bg-slate-100 min-h-[44px] min-w-[44px] justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-slate-700" /> : <Menu className="w-4 h-4 text-slate-700" />}
              <span className="font-bold">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>

          {/* Scenario Preset Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-mono-numbers text-[var(--muted)] font-bold hidden sm:inline-block uppercase tracking-wider mr-1">
              SCENARIO:
            </span>

            <button
              onClick={handlePresetHealthy}
              className={`text-xs px-2.5 py-1.5 rounded-[3px] font-mono-numbers font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                isHealthyPreset
                  ? 'bg-emerald-50 text-[var(--green-text)] border border-emerald-300 font-bold shadow-xs'
                  : 'bg-white border border-[var(--border)] text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--green-text)]" /> Healthy Grid
            </button>

            <button
              onClick={handlePresetCyclone}
              className={`text-xs px-2.5 py-1.5 rounded-[3px] font-mono-numbers font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                isCyclonePreset
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'bg-white border border-red-200 text-[var(--red-text)] hover:bg-red-50'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5" /> Severe Cyclone
            </button>

            <button
              onClick={handlePresetGatewayLost}
              className={`text-xs px-2.5 py-1.5 rounded-[3px] font-mono-numbers font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                isGatewayLostPreset
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {isGatewayLostPreset ? 'Gateway Lost [SEVERED · 0%]' : 'Gateway Lost (Demo)'}
            </button>

            <span className={`text-[0.7rem] px-2.5 py-1 rounded-[2px] font-mono-numbers font-bold border ${
              activeFailureCount === 0
                ? 'bg-emerald-50 text-[var(--green-text)] border-emerald-200'
                : 'bg-red-50 text-[var(--red-text)] border-red-200'
            }`}>
              {activeFailureCount === 0 ? 'All Systems OK' : `${activeFailureCount} Outages Active`}
            </span>
          </div>
        </div>

        {/* Technical Accent Stripe */}
        <div className="technical-header-stripe" />

        {/* Desktop Navigation Bar (Flexible alignment, zero clipping, no horizontal scroll) */}
        <div className="border-t border-slate-100 bg-white hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav 
              aria-label="Main Navigation"
              className="flex items-center gap-2 py-1.5"
            >
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[3px] text-xs font-heading font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                      isActive
                        ? 'bg-[var(--navy)] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:text-[var(--navy)] hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--amber)]' : 'text-slate-500'}`} />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Dropdown (< lg) */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-navigation-drawer"
            className="lg:hidden border-t border-[var(--border)] bg-white px-4 py-3 shadow-lg font-mono-numbers text-xs divide-y divide-slate-100"
          >
            <div className="text-[0.68rem] text-[var(--muted)] uppercase tracking-wider font-bold pb-2 px-1">
              Select Navigation Destination:
            </div>
            <div className="py-1 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[3px] text-left transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-[var(--navy)] text-white font-bold shadow-xs'
                        : 'text-[var(--navy)] hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--amber)]' : 'text-slate-500'}`} />
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-xs truncate">{item.label}</div>
                        <div className={`text-[0.65rem] truncate font-normal ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-[2px] bg-white/20 uppercase font-bold shrink-0 ml-2">
                        Active
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Breadcrumb Sub-bar (< lg) */}
      <div className="lg:hidden bg-slate-100 border-b border-[var(--border)] px-4 py-2 flex items-center justify-between text-xs font-mono-numbers">
        <div className="flex items-center gap-2 text-[var(--navy)] font-bold truncate">
          <CurrentNavIcon className="w-3.5 h-3.5 text-[var(--amber-text)] shrink-0" />
          <span className="truncate">View: {currentNavItem.label}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-[var(--navy)] font-semibold flex items-center gap-1 text-[0.72rem] bg-white border border-[var(--border)] px-2 py-0.5 rounded-[2px] hover:bg-slate-50 shrink-0"
        >
          <span>Switch</span>
          <ArrowRight className="w-3 h-3 text-[var(--amber-text)]" />
        </button>
      </div>

      {/* 2. Primary Content Area (Natural vertical scrolling, balanced hierarchy) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Applied Plan & Active Interventions Feedback Banner */}
        {appliedPlanToast && (
          <div 
            role="status"
            aria-live="polite"
            className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-numbers shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{appliedPlanToast.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setInterventions({
                    backup_generation: false,
                    mobile_broadcast_unit: false,
                    second_gateway: false,
                    relay_nodes: [],
                    siren_responders: [],
                    community_kits: []
                  });
                  setAppliedPlanToast(null);
                }}
                className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-[3px] text-[0.7rem] font-bold transition-colors"
              >
                Reset Interventions
              </button>
              <button
                onClick={() => setAppliedPlanToast(null)}
                className="text-emerald-700 hover:text-emerald-900 text-sm font-bold px-1"
                aria-label="Dismiss banner"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {activeTab === 'overview' && (
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

            {/* Primary Visual Focus: Network Topology Simulation */}
            <NetworkMapAndGraph
              villages={config.villages}
              failures={failures}
              interventions={interventions}
              onToggleFailure={handleToggleFailure}
              selectedVillageId={selectedVillageId}
              onSelectVillage={id => setSelectedVillageId(id)}
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
                    onClick={() => handleSelectTab('recovery_planner')}
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
          </div>
        )}

        {activeTab === 'silence' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
                    Silence Clock Grid
                  </h2>
                  <span className="stamp-label stamp-simulation">HUMAN IMPACT METRIC</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
                  Per-village modeled hours with zero available broadcast or mesh warning paths across a 72-hour power blackout window.
                </p>
              </div>
            </div>

            <SilenceClockGrid
              villages={s72Result.villages}
              totalScenarioHours={72}
              onSelectVillage={id => setSelectedVillageId(id)}
              selectedVillageId={selectedVillageId}
            />

            {/* In-depth Tier Overview */}
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
        )}

        {activeTab === 'failure_analysis' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
                    Failure Analysis &amp; Redundancy Audit
                  </h2>
                  <span className="stamp-label stamp-warning">DEPENDENCY GRAPH &amp; STRESS AUDIT</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
                  Dependency graph audit uncovering single-point common-cause cuts, plus empirical sensitivity benchmarks and reproducible baseline trials.
                </p>
              </div>

              {/* Secondary Section Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-[var(--border)] rounded-[4px] font-mono-numbers text-xs">
                <button
                  onClick={() => setFailureAnalysisSection('redundancy')}
                  aria-pressed={failureAnalysisSection === 'redundancy'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                    failureAnalysisSection === 'redundancy'
                      ? 'bg-white text-[var(--navy)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-slate-600 hover:text-[var(--navy)] hover:bg-slate-200/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Redundancy Illusion &amp; Common-Cause Proof</span>
                </button>

                <button
                  onClick={() => setFailureAnalysisSection('stress')}
                  aria-pressed={failureAnalysisSection === 'stress'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                    failureAnalysisSection === 'stress'
                      ? 'bg-white text-[var(--navy)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-slate-600 hover:text-[var(--navy)] hover:bg-slate-200/50'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Stress &amp; Baselines (Sensitivity &amp; Experiments)</span>
                </button>
              </div>
            </div>

            {failureAnalysisSection === 'redundancy' ? (
              <div className="space-y-6">
                <RedundancyIllusionPanel
                  statusList={illusionStatus}
                  villages={config.villages}
                  onSelectVillage={id => setSelectedVillageId(id)}
                  selectedVillageId={selectedVillageId}
                />

                <div className="utility-card p-5 sm:p-6 space-y-3 rounded-[4px] border border-[var(--border)]">
                  <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase tracking-wide">
                    Mathematical Graph Proof: The East Power Common-Cause Failure
                  </h4>
                  <div className="text-xs font-mono-numbers text-[var(--ink)] space-y-2.5 leading-relaxed">
                    <p>
                      1. <strong>Nominal Configuration</strong>: Karai, Uppalam, Sagar are listed with 3 channels: Cell Broadcast, FM Radio, and Shelter Mesh.
                    </p>
                    <p>
                      2. <strong>Shared Dependency</strong>: Cell relies on Tower B powered by <code>power_east</code>. FM Transmitter relies on <code>power_east</code>.
                    </p>
                    <p>
                      3. <strong>Cascade Impact</strong>: A single fault at East Power knocks out both Cell and FM simultaneously.
                      The N-1 guaranteed channel count drops to strictly <strong>1</strong> (mesh only), proving that having multiple channel icons does not equal independent resilience.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <ExperimentLogView
                  config={config}
                  s30Score={s30Result.resilienceScore}
                  s72Reach={s72Result.overallReach}
                  silenceCount={s72Result.villages.filter(v => v.silenceHours === 72).length}
                  budgetUnits={config.planning.defaultBudget}
                  failures={failures}
                />
                <SensitivityPanel config={config} onUpdateConfig={setConfig} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'recovery_planner' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
                    Recovery Planner &amp; Restoration Engine
                  </h2>
                  <span className="stamp-label stamp-simulation">ALGORITHMIC FAIRNESS &amp; S72 RESTORATION</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
                  Dual-objective algorithmic recovery optimizer comparing reach maximization against fairness-floor equity, paired with the 72-hour hourly restoration matrix.
                </p>
              </div>

              {/* Secondary Section Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-[var(--border)] rounded-[4px] font-mono-numbers text-xs">
                <button
                  onClick={() => setRecoveryPlannerSection('decision_engine')}
                  aria-pressed={recoveryPlannerSection === 'decision_engine'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                    recoveryPlannerSection === 'decision_engine'
                      ? 'bg-white text-[var(--navy)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-slate-600 hover:text-[var(--navy)] hover:bg-slate-200/50'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span>Decision Engine (Reach vs. Fairness Optimization)</span>
                </button>

                <button
                  onClick={() => setRecoveryPlannerSection('outage_matrix')}
                  aria-pressed={recoveryPlannerSection === 'outage_matrix'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] ${
                    recoveryPlannerSection === 'outage_matrix'
                      ? 'bg-white text-[var(--navy)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-slate-600 hover:text-[var(--navy)] hover:bg-slate-200/50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>72h Outage Matrix (Restoration Benchmarks)</span>
                </button>
              </div>
            </div>

            {recoveryPlannerSection === 'decision_engine' ? (
              <DecisionEngineView 
                config={config} 
                failures={failures} 
                autoTune={0.5} 
                onApplyPlan={(planInterventions, planName) => {
                  setInterventions(planInterventions);
                  setAppliedPlanToast({
                    message: `${planName} applied to active simulation. Interventions deployed.`,
                    type: 'success'
                  });
                }}
              />
            ) : (
              <OutagePlanMatrix
                config={config}
                onSelectPlan={(planInterventions) => {
                  setInterventions(planInterventions);
                  setActiveTab('overview');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Village Details Modal */}
      {selectedVillage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--border)] shadow-xl rounded-[4px] max-w-lg w-full p-6 font-mono-numbers text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--border)]">
              <div>
                <span className="stamp-label stamp-simulation text-[0.6rem] mb-1">
                  COMMUNITY INSPECTOR
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[var(--navy)]">
                  {selectedVillage.name}
                </h3>
                <span className="text-slate-500 text-[0.75rem]">
                  Population: {selectedVillage.pop.toLocaleString()} residents
                </span>
              </div>
              <button
                onClick={() => setSelectedVillageId(null)}
                aria-label="Close modal"
                className="p-1 hover:bg-slate-100 rounded-[2px] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                <span className="font-bold text-[var(--navy)] block mb-0.5">Topographic Context:</span>
                <span className="text-[var(--muted)] leading-relaxed">{selectedVillage.description}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                  <span className="text-[0.68rem] text-[var(--muted)] block">72h SILENCE DURATION:</span>
                  <span className="text-lg font-bold text-[var(--navy)]">
                    {selectedVillageS72?.silenceHours || 0} Hours
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                  <span className="text-[0.68rem] text-[var(--muted)] block">N-1 GUARANTEED:</span>
                  <span className="text-lg font-bold text-[var(--green-text)]">
                    {selectedVillageIllusion?.n1Guaranteed || 0} Channels
                  </span>
                </div>
              </div>

              <div className="p-3 border border-[var(--border)] rounded-[3px] space-y-1.5 text-[0.72rem]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cellular Tower:</span>
                  <span className="font-bold">{selectedVillage.tower ? `Tower ${selectedVillage.tower}` : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">FM Broadcast:</span>
                  <span className="font-bold">{selectedVillage.fm ? 'Active coverage' : 'No reception'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shelter Mesh Node:</span>
                  <span className="font-bold">{selectedVillage.meshNode ? 'Installed' : 'None'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedVillageId(null)}
              className="btn-tactile w-full py-2.5 text-xs rounded-[3px]"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* 4. Optional Cryptographic Integrity Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--border)] shadow-2xl rounded-[4px] max-w-4xl w-full max-h-[90vh] flex flex-col font-mono-numbers text-xs">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-slate-50">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--navy)]" />
                <h3 className="font-heading font-extrabold text-base text-[var(--navy)]">
                  Cryptographic Alert Integrity &amp; WebCrypto Audit Console
                </h3>
                <span className="stamp-label stamp-verified text-[0.6rem]">ECDSA P-256</span>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                aria-label="Close Crypto Audit Console"
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <AuditPanel />
            </div>
          </div>
        </div>
      )}

      {/* 5. Shared Footer */}
      <footer className="bg-white border-t border-[var(--border)] py-6 text-xs font-mono-numbers text-[var(--muted)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PeregrineLogo size="sm" variant="symbol" />
            <span>
              PEREGRINE v2.1 · IEEE BTS Hackathon · Disaster-Resilient Broadcast Network
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-xs hover:text-[var(--navy)] flex items-center gap-1 underline text-slate-600 hover:text-blue-700 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>WebCrypto Audit Console</span>
            </button>
            <span className="stamp-label stamp-simulation text-[0.6rem]">
              DECISION-SUPPORT SIMULATION ONLY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
