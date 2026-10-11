/**
 * PEREGRINE — Disaster-Resilient Broadcast Network
 * Decision-Support Simulation & Recovery Planner
 * IEEE BTS Hackathon
 */

import React, { useState, useMemo } from 'react';
import { INITIAL_CONFIG, SystemConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions 
} from '../model/types';
import { 
  simulateS30, 
  simulateS72, 
  calculateRedundancyIllusion 
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
  Scale 
} from 'lucide-react';

import { OverviewPage } from '../pages/OverviewPage';
import { SilenceClockPage } from '../pages/SilenceClockPage';
import { RedundancyPage } from '../pages/RedundancyPage';
import { DecisionEnginePage } from '../pages/DecisionEnginePage';
import { OutageMatrixPage } from '../pages/OutageMatrixPage';
import { CryptographyPage } from '../pages/CryptographyPage';
import { StressBaselinesPage } from '../pages/StressBaselinesPage';

export default function App() {
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  // Guided Demo Walkthrough Step State (0 to 5, or null when inactive)
  const [demoStep, setDemoStep] = useState<number | null>(null);

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

  const handleResetDefaults = () => {
    setConfig(INITIAL_CONFIG);
    setFailures({
      power_west: false,
      power_east: false,
      fibre: false,
      tower_A: false,
      tower_B: false,
      fm_tx: false,
      gateway: false
    });
    setInterventions({
      backup_generation: false,
      mobile_broadcast_unit: false,
      second_gateway: false,
      relay_nodes: [],
      siren_responders: [],
      community_kits: []
    });
    setSelectedVillageId(null);
    setDemoStep(null);
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

  // Selected village details
  const selectedVillage = config.villages.find(v => v.id === selectedVillageId);
  const selectedVillageS72 = s72Result.villages.find(v => v.id === selectedVillageId);
  const selectedVillageIllusion = illusionStatus.find(v => v.villageId === selectedVillageId);  // 6-Step Guided Evaluator Demo Tour Definitions
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
      tab: 'illusion',
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
      tab: 'planner',
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
      selectedVillage={selectedVillage}
      selectedVillageS72={selectedVillageS72}
      selectedVillageIllusion={selectedVillageIllusion}
      onCloseVillageModal={() => setSelectedVillageId(null)}
      isDemoActive={demoStep !== null}
      onStartDemo={handleStartDemo}
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
          onNavigateToPlanner={() => setActiveTab('planner')}
          onResetDefaults={handleResetDefaults}
        />
      )}

      {activeTab === 'silence' && (
        <SilenceClockPage
          villages={s72Result.villages}
          selectedVillageId={selectedVillageId}
          onSelectVillage={id => setSelectedVillageId(id)}
        />
      )}

      {activeTab === 'illusion' && (
        <RedundancyPage
          config={config}
          statusList={illusionStatus}
          selectedVillageId={selectedVillageId}
          onSelectVillage={id => setSelectedVillageId(id)}
        />
      )}

      {activeTab === 'planner' && (
        <DecisionEnginePage
          config={config}
          failures={failures}
          autoTune={0.5}
        />
      )}

      {activeTab === 'matrix' && (
        <OutageMatrixPage
          config={config}
          onSelectPlan={(planInterventions) => {
            setInterventions(planInterventions);
            setActiveTab('overview');
          }}
        />
      )}

      {activeTab === 'audit' && (
        <CryptographyPage />
      )}

      {activeTab === 'experiments' && (
        <StressBaselinesPage
          config={config}
          failures={failures}
          s30Result={s30Result}
          s72Result={s72Result}
          onUpdateConfig={setConfig}
        />
      )}
    </AppShell>
  );
}
