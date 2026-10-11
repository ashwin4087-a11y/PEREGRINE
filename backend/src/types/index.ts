/**
 * PEREGRINE Backend API Types
 * Exports domain simulation types and API request/response contracts.
 */

export * from '../engine/types';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  S30Result, 
  S72Result, 
  VillageChannelStatus 
} from '../engine/types';
import { 
  ActiveFailureDetail, 
  ScenarioSummary 
} from '../engine/scenario';
import { 
  VillageRedundancyAnalysis, 
  RedundancySummary, 
  ScenarioRedundancyComparison 
} from '../metrics/redundancy';
import { 
  PlanComparisonResult, 
  FairnessFrontierSummary, 
  HeuristicComparisonResult 
} from '../planner/engine';
import { DeterministicExperimentRecord } from '../integrity/experiment';
import { HeadlineRobustnessResult } from '../experiments/sensitivity';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
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
  sensitivity?: HeadlineRobustnessResult;
}

export interface HealthResponse {
  status: 'healthy';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
}
