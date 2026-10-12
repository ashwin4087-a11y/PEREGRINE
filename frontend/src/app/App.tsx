/**
 * PEREGRINE — Disaster-Resilient Broadcast Network
 * Decision-Support Simulation & Recovery Planner
 * IEEE BTS Hackathon
 */

import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_CONFIG, SystemConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions 
} from '../model/types';
import { 
  simulateS30, 
  simulateS72, 
  calculateRedundancyIllusion,
  createDefaultFailures,
  createEmptyInterventions,
  applyHealthyPreset,
  applyCyclonePreset,
  applyGatewayLostPreset,
  toggleFailureNode,
  getScenarioSummary,
  getActiveFailuresList
} from '../model/graph';

import { AppShell } from './layout/AppShell';
import { NavTabId } from './routes';
import { GuidedDemoTour, DemoStepDefinition } from './layout/GuidedDemoTour';
import { 
  Activity, 
  CloudLightning, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Scale,
  Calendar,
  Sliders,
  Key,
  X
} from 'lucide-react';

import { OverviewPage } from '../pages/OverviewPage';
import { SilenceClockPage } from '../pages/SilenceClockPage';
import { RedundancyPage } from '../pages/RedundancyPage';
import { DecisionEnginePage } from '../pages/DecisionEnginePage';
import { OutageMatrixPage } from '../pages/OutageMatrixPage';
import { CryptographyPage } from '../pages/CryptographyPage';
import { StressBaselinesPage } from '../pages/StressBaselinesPage';
import { apiClient } from '../services/api';

export default function App() {
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  // Backend API Connection Tracker (null = checking, true = connected, false = offline fallback)
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial health check and reactive status subscription
    apiClient.getHealth();
    const unsubscribe = apiClient.onStatusChange(online => {
      setIsBackendConnected(online);
    });
    return unsubscribe;
  }, []);

  // Guided Demo Walkthrough Step State (0 to 5, or null when inactive)
  const [demoStep, setDemoStep] = useState<number | null>(null);

  // Network Failure State (initialized via shared factory)
  const [failures, setFailures] = useState<NetworkFailureState>(createDefaultFailures);

  // Active Interventions (initialized via shared factory)
  const [interventions, setInterventions] = useState<ActiveInterventions>(createEmptyInterventions);

  // Scenario Action & Reset Confirmation Feedback
  const [scenarioFeedback, setScenarioFeedback] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  // Active Navigation Tab (4 Primary Operational Destinations)
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');

  // Optional WebCrypto audit modal state
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState<boolean>(false);

  // Secondary sub-tab section state
  const [failureAnalysisSection, setFailureAnalysisSection] = useState<'redundancy' | 'stress'>('redundancy');
  const [recoveryPlannerSection, setRecoveryPlannerSection] = useState<'decision_engine' | 'outage_matrix'>('decision_engine');

  // Selected village for inspector modal
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  // Toggle single failure
  const handleToggleFailure = (nodeKey: keyof NetworkFailureState) => {
    setFailures(prev => {
      const next = toggleFailureNode(prev, nodeKey);
      const isFailed = next[nodeKey];
      setScenarioFeedback({
        message: `Failure toggled: ${String(nodeKey).toUpperCase()} is now ${isFailed ? 'FAILED [CUT]' : 'OPERATIONAL'}.`,
        type: isFailed ? 'warning' : 'info'
      });
      return next;
    });
  };

  // Preset: Healthy Grid
  const handlePresetHealthy = () => {
    setFailures(applyHealthyPreset());
    setScenarioFeedback({
      message: 'Scenario activated: Healthy Grid — All infrastructure restored to baseline operational state.',
      type: 'success'
    });
  };

  // Preset: Cyclone Hits (Compound Failure)
  const handlePresetCyclone = () => {
    setFailures(applyCyclonePreset());
    setScenarioFeedback({
      message: 'Scenario activated: Cyclone Landfall — West Grid, East Grid, and Core Fibre severed.',
      type: 'warning'
    });
  };

  // Preset: Gateway Lost (Dedicated demo beat: Cyclone + Gateway Cut)
  const handlePresetGatewayLost = () => {
    if (!failures.gateway) {
      setFailures(applyGatewayLostPreset());
      setScenarioFeedback({
        message: 'Scenario activated: Gateway Loss — Marina satellite gateway severed; mesh alert reach drops to 0.0%.',
        type: 'error'
      });
    } else {
      setFailures(applyCyclonePreset());
      setScenarioFeedback({
        message: 'Marina Gateway restored — Returned to Cyclone Landfall baseline.',
        type: 'info'
      });
    }
  };

  const handleResetDefaults = () => {
    setConfig(INITIAL_CONFIG);
    setFailures(createDefaultFailures());
    setInterventions(createEmptyInterventions());
    setSelectedVillageId(null);
    setDemoStep(null);
    setScenarioFeedback({
      message: 'System Reset: Initial configuration restored, all failures cleared, and interventions reset.',
      type: 'info'
    });
  };

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

  // Scenario summary explaining causes and status
  const scenarioSummary = useMemo(() => {
    return getScenarioSummary(failures, interventions);
  }, [failures, interventions]);

  // Active failures list with component status labels and impacts
  const activeFailuresList = useMemo(() => {
    return getActiveFailuresList(failures, interventions);
  }, [failures, interventions]);

  // Selected village details
  const selectedVillage = config.villages.find(v => v.id === selectedVillageId);
  const selectedVillageS72 = s72Result.villages.find(v => v.id === selectedVillageId);
  const selectedVillageIllusion = illusionStatus.find(v => v.villageId === selectedVillageId);

  // 6-Step Guided Evaluator Demo Tour Definitions
  const demoSteps: DemoStepDefinition[] = useMemo(() => [
    {
      stepIndex: 0,
      title: 'Healthy Baseline Network',
      tab: 'overview',
      targetFailures: {
        power_west: false,
        power_east: false,
        fibre: false,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      },
      icon: Activity,
      getCaption: () => `Under these assumptions the baseline network operates with all power, fibre, and satellite links intact. Effective S30 population reach is ${s30Result.resilienceScore.toFixed(1)}% with zero blackout hours across all 8 settlements.`
    },
    {
      stepIndex: 1,
      title: 'Cyclone Compound Landfall',
      tab: 'overview',
      targetFailures: {
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      },
      icon: CloudLightning,
      getCaption: () => `Under cyclone landfall, correlated utility failures knock out terrestrial power and fibre backhaul simultaneously. Effective S30 reach falls to ${s30Result.resilienceScore.toFixed(1)}%, sustained solely by battery-buffered shelter mesh.`
    },
    {
      stepIndex: 2,
      title: 'Gateway Single-Point Collapse',
      tab: 'overview',
      targetFailures: {
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: true
      },
      icon: AlertTriangle,
      getCaption: () => `When the primary satellite uplink gateway at Marina is severed, all six mesh-connected shelters lose external alert ingestion. Effective S30 reach collapses from 54.0% to ${s30Result.resilienceScore.toFixed(1)}%, demonstrating catastrophic single-point vulnerability.`
    },
    {
      stepIndex: 3,
      title: 'Silence Clock Blackout Tracking',
      tab: 'silence',
      targetFailures: {
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      },
      icon: Clock,
      getCaption: () => `Beyond instant alerting, the Silence Clock tracks prolonged isolation over 72 hours. Small communities Thoni and Hill Camp (${totalSilentPop.toLocaleString()} combined residents) experience 72 hours of complete communication blackout.`
    },
    {
      stepIndex: 4,
      title: 'Redundancy Illusion (East Power Cut)',
      tab: 'failure_analysis',
      targetFailures: {
        power_west: false,
        power_east: true,
        fibre: false,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      },
      icon: Layers,
      getCaption: () => `A single upstream substation fault at East Power simultaneously severs both Tower B cell coverage and the primary FM transmitter. Communities with three nominal channels lose guaranteed failover entirely, exposing the Redundancy Illusion.`
    },
    {
      stepIndex: 5,
      title: 'Plan A vs Plan B at Budget 50',
      tab: 'recovery_planner',
      targetFailures: {
        power_west: true,
        power_east: true,
        fibre: true,
        tower_A: false,
        tower_B: false,
        fm_tx: false,
        gateway: false
      },
      icon: Scale,
      getCaption: () => `At budget 50, Plan A achieves 31.8% overall reach but completely abandons Thoni to 0% reach. Plan B enforces fairness, lifting Thoni to 50.0% with a 6.8 percentage point trade-off in aggregate reach.`
    }
  ], [s30Result.resilienceScore, totalSilentPop]);

  const handleGoToDemoStep = (stepIdx: number) => {
    if (stepIdx >= 0 && stepIdx < demoSteps.length) {
      setDemoStep(stepIdx);
      const step = demoSteps[stepIdx];
      setFailures(step.targetFailures);
      setActiveTab(step.tab);
      if (step.tab === 'failure_analysis') {
        setFailureAnalysisSection('redundancy');
      } else if (step.tab === 'recovery_planner') {
        setRecoveryPlannerSection('decision_engine');
      }
    }
  };

  const handleStartDemo = () => {
    handleGoToDemoStep(0);
  };

  const handleNextDemoStep = () => {
    if (demoStep !== null) {
      if (demoStep < demoSteps.length - 1) {
        handleGoToDemoStep(demoStep + 1);
      } else {
        setDemoStep(null);
      }
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStep !== null && demoStep > 0) {
      handleGoToDemoStep(demoStep - 1);
    }
  };

  const handleExitDemo = () => {
    setDemoStep(null);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      failures={failures}
      onToggleFailure={handleToggleFailure}
      onPresetHealthy={handlePresetHealthy}
      onPresetCyclone={handlePresetCyclone}
      onPresetGatewayLost={handlePresetGatewayLost}
      onResetDefaults={handleResetDefaults}
      scenarioFeedback={scenarioFeedback}
      onClearFeedback={() => setScenarioFeedback(null)}
      selectedVillage={selectedVillage}
      selectedVillageS72={selectedVillageS72}
      selectedVillageIllusion={selectedVillageIllusion}
      onCloseVillageModal={() => setSelectedVillageId(null)}
      isDemoActive={demoStep !== null}
      onStartDemo={handleStartDemo}
      onOpenCryptoAudit={() => setIsCryptoModalOpen(true)}
      isBackendConnected={isBackendConnected}
      demoTourNode={
        demoStep !== null ? (
          <GuidedDemoTour
            currentStep={demoStep}
            totalSteps={demoSteps.length}
            stepDef={demoSteps[demoStep]}
            onNext={handleNextDemoStep}
            onPrev={handlePrevDemoStep}
            onGoToStep={handleGoToDemoStep}
            onExit={handleExitDemo}
          />
        ) : null
      }
    >
      {activeTab === 'overview' && (
        <OverviewPage
          config={config}
          failures={failures}
          interventions={interventions}
          s30Result={s30Result}
          s72Result={s72Result}
          illusionStatus={illusionStatus}
          totalSilentPop={totalSilentPop}
          selectedVillageId={selectedVillageId}
          onToggleFailure={handleToggleFailure}
          onSelectVillage={id => setSelectedVillageId(id)}
          setInterventions={setInterventions}
          onNavigateToPlanner={() => setActiveTab('recovery_planner')}
          onResetDefaults={handleResetDefaults}
          onPresetHealthy={handlePresetHealthy}
          onPresetCyclone={handlePresetCyclone}
          onPresetGatewayLost={handlePresetGatewayLost}
          scenarioSummary={scenarioSummary}
          activeFailuresList={activeFailuresList}
          scenarioFeedback={scenarioFeedback}
          onClearFeedback={() => setScenarioFeedback(null)}
        />
      )}

      {activeTab === 'silence' && (
        <SilenceClockPage
          config={config}
          s72Result={s72Result}
          failures={failures}
          interventions={interventions}
          selectedVillageId={selectedVillageId}
          onSelectVillage={id => setSelectedVillageId(id)}
          onToggleFailure={handleToggleFailure}
          setInterventions={setInterventions}
        />
      )}

      {activeTab === 'failure_analysis' && (
        <div className="space-y-6">
          {/* Failure Analysis Secondary Sub-Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-mono-numbers">
              <button
                onClick={() => setFailureAnalysisSection('redundancy')}
                aria-pressed={failureAnalysisSection === 'redundancy'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-all ${
                  failureAnalysisSection === 'redundancy'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Dependency Graph & Redundancy Illusion</span>
              </button>
              <button
                onClick={() => setFailureAnalysisSection('stress')}
                aria-pressed={failureAnalysisSection === 'stress'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-all ${
                  failureAnalysisSection === 'stress'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Stress Baselines & Experiments</span>
              </button>
            </div>
            <span className="text-xs text-[#64748B] hidden sm:inline">
              {failureAnalysisSection === 'redundancy' ? 'Common-cause cuts & N-1 graph audits' : 'Mulberry32 PRNG & FNV-1a checksum trials'}
            </span>
          </div>

          {failureAnalysisSection === 'redundancy' ? (
            <RedundancyPage
              config={config}
              statusList={illusionStatus}
              selectedVillageId={selectedVillageId}
              onSelectVillage={id => setSelectedVillageId(id)}
              failures={failures}
              interventions={interventions}
              onToggleFailure={handleToggleFailure}
              setInterventions={setInterventions}
              onApplyScenario={scenario => {
                if (scenario === 'healthy') handlePresetHealthy();
                else if (scenario === 'cyclone') handlePresetCyclone();
                else if (scenario === 'gateway_loss') handlePresetGatewayLost();
              }}
            />
          ) : (
            <StressBaselinesPage
              config={config}
              failures={failures}
              s30Result={s30Result}
              s72Result={s72Result}
              onUpdateConfig={setConfig}
            />
          )}
        </div>
      )}

      {activeTab === 'recovery_planner' && (
        <div className="space-y-6">
          {/* Recovery Planner Secondary Sub-Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-mono-numbers">
              <button
                onClick={() => setRecoveryPlannerSection('decision_engine')}
                aria-pressed={recoveryPlannerSection === 'decision_engine'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-all ${
                  recoveryPlannerSection === 'decision_engine'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Decision Engine (Fairness vs Reach)</span>
              </button>
              <button
                onClick={() => setRecoveryPlannerSection('outage_matrix')}
                aria-pressed={recoveryPlannerSection === 'outage_matrix'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-all ${
                  recoveryPlannerSection === 'outage_matrix'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#CBD5E1]'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>72h Outage Restoration Matrix</span>
              </button>
            </div>
            <span className="text-xs text-[#64748B] hidden sm:inline">
              {recoveryPlannerSection === 'decision_engine' ? 'Plan A (Reach Max) vs Plan B (Fairness Floor)' : '12-cell matrix benchmark across autoTune adoption'}
            </span>
          </div>

          {recoveryPlannerSection === 'decision_engine' ? (
            <DecisionEnginePage
              config={config}
              failures={failures}
              autoTune={0.5}
              onApplyPlan={(planInterventions, planName) => {
                setInterventions(planInterventions);
                setScenarioFeedback({
                  message: `${planName} applied to active simulation. Interventions deployed.`,
                  type: 'success'
                });
              }}
            />
          ) : (
            <OutageMatrixPage
              config={config}
              onSelectPlan={(planInterventions) => {
                setInterventions(planInterventions);
                setActiveTab('overview');
              }}
            />
          )}
        </div>
      )}

      {/* WebCrypto Alert Integrity & Audit Console Modal */}
      {isCryptoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] shadow-2xl rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden font-sans-ui">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-base text-[#172033]">
                  Cryptographic Alert Integrity &amp; WebCrypto Audit Console
                </h3>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  ECDSA P-256
                </span>
              </div>
              <button
                onClick={() => setIsCryptoModalOpen(false)}
                aria-label="Close Crypto Audit Console"
                className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#172033] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <CryptographyPage />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
