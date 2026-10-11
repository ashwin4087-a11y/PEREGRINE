/**
 * PEREGRINE Frontend API Client
 * Typed HTTP client connecting frontend UI to Node/Express backend with transparent local fallback.
 */

import { INITIAL_CONFIG, SystemConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions,
  S30Result,
  S72Result,
  VillageChannelStatus
} from '../model/types';
import { 
  simulateS30, 
  simulateS72, 
  createDefaultFailures, 
  createEmptyInterventions,
  applyHealthyPreset,
  applyCyclonePreset,
  applyGatewayLostPreset
} from '../model/graph';
import { 
  getActiveFailuresList, 
  getScenarioSummary,
  ActiveFailureDetail,
  ScenarioSummary
} from '../model/scenario';
import { 
  analyzeRedundancyIllusion,
  calculateRedundancyIllusion,
  calculateRedundancySummary,
  compareScenariosRedundancy,
  CRITICAL_FAILURE_NODES,
  VillageRedundancyAnalysis,
  RedundancySummary,
  ScenarioRedundancyComparison
} from '../metrics/redundancy';
import { 
  compareRecoveryStrategies, 
  calculatePriceOfFairnessFrontier,
  evaluateOptimizerBenchmarking,
  PlanComparisonResult,
  FairnessFrontierSummary,
  HeuristicComparisonResult
} from '../planner/engine';
import { 
  generateReproducibleExperiment, 
  fnv1aHash,
  DeterministicExperimentRecord
} from '../integrity/experiment';
import { 
  evaluateHeadlineFairnessRobustness,
  HeadlineRobustnessResult
} from '../experiments/sensitivity';

// --- API Request & Response Contracts ---

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
}

export interface DisasterScenarioInfo {
  id: string;
  name: string;
  description: string;
  failures: NetworkFailureState;
}

export interface InfrastructureComponentInfo {
  key: string;
  label: string;
  category: 'POWER' | 'BACKHAUL' | 'TRANSMITTER' | 'GATEWAY';
  normalImpact: string;
}

export interface SimulationRunRequest {
  failures?: Partial<NetworkFailureState>;
  interventions?: Partial<ActiveInterventions>;
  autoTune?: number;
}

export interface SimulationRunResponse {
  s30: S30Result;
  s72: S72Result;
  activeFailures: ActiveFailureDetail[];
  scenarioSummary: ScenarioSummary;
}

export interface RedundancyAnalyzeRequest {
  failures?: Partial<NetworkFailureState>;
  interventions?: Partial<ActiveInterventions>;
}

export interface RedundancyAnalyzeResponse {
  statusList: VillageChannelStatus[];
  analyses: VillageRedundancyAnalysis[];
  summary: RedundancySummary;
  scenarioComparisons: ScenarioRedundancyComparison[];
}

export interface PlannerRecommendRequest {
  budget: number;
  fairnessFloor?: number;
  failures?: Partial<NetworkFailureState>;
  autoTune?: number;
}

export interface PlannerRecommendResponse {
  budget: number;
  fairnessFloor: number;
  planA: PlanComparisonResult;
  planB: PlanComparisonResult;
  disadvantaged: boolean;
  comparisonInsight: string;
  priceOfFairness: FairnessFrontierSummary;
  benchmarks: HeuristicComparisonResult;
}

export interface ExperimentRunRequest {
  seed: string;
  budget?: number;
  fairnessFloor?: number;
  failures?: Partial<NetworkFailureState>;
}

export interface ExperimentRunResponse {
  experiment: DeterministicExperimentRecord;
  sensitivity: HeadlineRobustnessResult;
}

// --- API Client Class with Automatic Resilience ---

export class PeregrineApiClient {
  private baseUrl: string;
  private isBackendOnline: boolean = false;
  private hasCheckedHealth: boolean = false;
  private listeners: Array<(online: boolean) => void> = [];

  constructor(baseUrl?: string) {
    // In dev or Vite proxy, default to /api. Can be overridden with VITE_API_URL.
    this.baseUrl = baseUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');
  }

  public onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    if (this.hasCheckedHealth) {
      callback(this.isBackendOnline);
    }
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyStatus(online: boolean) {
    if (this.isBackendOnline !== online || !this.hasCheckedHealth) {
      this.isBackendOnline = online;
      this.hasCheckedHealth = true;
      for (const cb of this.listeners) {
        cb(online);
      }
    }
  }

  public isConnected(): boolean {
    return this.isBackendOnline;
  }

  /**
   * Health Check with 1.5s timeout
   */
  public async getHealth(): Promise<HealthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Health check returned status ${res.status}`);
      }

      const json: ApiResponse<HealthResponse> = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Invalid health payload');
      }

      this.notifyStatus(true);
      return json.data;
    } catch {
      this.notifyStatus(false);
      return {
        status: 'unavailable',
        service: 'peregrine-backend (offline)',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptimeSeconds: 0,
        memoryUsageMb: 0
      };
    }
  }

  /**
   * Disaster Scenarios
   */
  public async getScenarios(): Promise<DisasterScenarioInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/scenarios`);
      if (res.ok) {
        const json: ApiResponse<DisasterScenarioInfo[]> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through to local fallback
    }

    this.notifyStatus(false);
    return [
      {
        id: 'healthy',
        name: 'Healthy Network Baseline',
        description: 'All power grids, transmission lines, towers, and primary gateways are fully operational.',
        failures: applyHealthyPreset()
      },
      {
        id: 'cyclone',
        name: 'Cyclone Compound Landfall',
        description: 'Severe cyclone impact causing simultaneous cuts to West Power, East Power, and Backhaul Fibre.',
        failures: applyCyclonePreset()
      },
      {
        id: 'gateway_loss',
        name: 'Cyclone Landfall + Gateway Failure',
        description: 'Cyclone impact compounded by structural loss of the primary satellite gateway at Marina.',
        failures: applyGatewayLostPreset()
      }
    ];
  }

  /**
   * Critical Infrastructure Components
   */
  public async getInfrastructureComponents(): Promise<InfrastructureComponentInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/scenarios/components`);
      if (res.ok) {
        const json: ApiResponse<InfrastructureComponentInfo[]> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through
    }

    this.notifyStatus(false);
    return CRITICAL_FAILURE_NODES.map((nodeKey: string) => ({
      key: nodeKey,
      label: nodeKey.toUpperCase().replace('_', ' '),
      category: 'BACKHAUL',
      normalImpact: 'Critical alert network link'
    }));
  }

  /**
   * Run S30 and S72 Simulation
   */
  public async runSimulation(
    req: SimulationRunRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): Promise<SimulationRunResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/simulations/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (res.ok) {
        const json: ApiResponse<SimulationRunResponse> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through to local execution
    }

    this.notifyStatus(false);
    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(req.failures || {})
    };
    const interventions: ActiveInterventions = {
      ...createEmptyInterventions(),
      ...(req.interventions || {})
    };
    const autoTune = req.autoTune !== undefined ? Number(req.autoTune) : 0.5;

    const s30 = simulateS30(config, failures, interventions, autoTune);
    const s72 = simulateS72(config, interventions, autoTune, failures);
    const activeFailures = getActiveFailuresList(failures, interventions);
    const scenarioSummary = getScenarioSummary(failures, interventions);

    return {
      s30,
      s72,
      activeFailures,
      scenarioSummary
    };
  }

  /**
   * Analyze Redundancy Illusion and N-1 Guaranteed Channels
   */
  public async analyzeRedundancy(
    req: RedundancyAnalyzeRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): Promise<RedundancyAnalyzeResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/redundancy/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (res.ok) {
        const json: ApiResponse<RedundancyAnalyzeResponse> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through to local execution
    }

    this.notifyStatus(false);
    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(req.failures || {})
    };
    const interventions: ActiveInterventions = {
      ...createEmptyInterventions(),
      ...(req.interventions || {})
    };

    const statusList = calculateRedundancyIllusion(config, failures, interventions);
    const analyses = analyzeRedundancyIllusion(config, failures, interventions);
    const summary = calculateRedundancySummary(analyses);
    const scenarioComparisons = compareScenariosRedundancy(config, interventions);

    return {
      statusList,
      analyses,
      summary,
      scenarioComparisons
    };
  }

  /**
   * Recover Interventions Optimizer & Price-of-Fairness Recommendation
   */
  public async recommendPlan(
    req: PlannerRecommendRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): Promise<PlannerRecommendResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/planner/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (res.ok) {
        const json: ApiResponse<PlannerRecommendResponse> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through to local execution
    }

    this.notifyStatus(false);
    const budget = Number(req.budget);
    let floorRatio = 0.35;
    if (req.fairnessFloor !== undefined) {
      const val = Number(req.fairnessFloor);
      floorRatio = val > 1 ? val / 100 : val;
    }
    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(req.failures || {})
    };

    const strategyComparison = compareRecoveryStrategies(config, failures, budget, floorRatio, 'S72', 0.5);
    const priceOfFairness = calculatePriceOfFairnessFrontier(config, failures, budget, 'S72', 0.5);
    const benchmarks = evaluateOptimizerBenchmarking(config, failures, budget, 'S72', 0.5);

    return {
      budget,
      fairnessFloor: floorRatio,
      planA: strategyComparison.planReach,
      planB: strategyComparison.planFairness,
      disadvantaged: strategyComparison.disadvantaged,
      comparisonInsight: strategyComparison.comparisonInsight,
      priceOfFairness,
      benchmarks
    };
  }

  /**
   * Deterministic Reproducible Experiment & Sensitivity Check
   */
  public async runExperiment(
    req: ExperimentRunRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): Promise<ExperimentRunResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/experiments/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (res.ok) {
        const json: ApiResponse<ExperimentRunResponse> = await res.json();
        if (json.success && json.data) {
          this.notifyStatus(true);
          return json.data;
        }
      }
    } catch {
      // Fall through to local execution
    }

    this.notifyStatus(false);
    const seedStr = req.seed.trim();
    const seedNum = fnv1aHash(seedStr);
    const budget = req.budget !== undefined ? Number(req.budget) : 50;

    let floorRatio = 0.35;
    if (req.fairnessFloor !== undefined) {
      const val = Number(req.fairnessFloor);
      floorRatio = val > 1 ? val / 100 : val;
    }

    const failures: NetworkFailureState = {
      ...applyCyclonePreset(),
      ...(req.failures || {})
    };

    const experiment = generateReproducibleExperiment(
      config,
      failures,
      budget,
      floorRatio,
      seedNum,
      'Cyclone Compound Infrastructure Failure'
    );
    const sensitivity = evaluateHeadlineFairnessRobustness(config, failures, budget, 0.5);

    return {
      experiment,
      sensitivity
    };
  }
}

export const apiClient = new PeregrineApiClient();
