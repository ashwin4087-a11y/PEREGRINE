/**
 * PEREGRINE Planner Service
 * Evaluates Plan A (Reach Maximiser) vs Plan B (Fairness-Constrained Floor)
 * and calculates the Price-of-Fairness Pareto Frontier.
 */

import { INITIAL_CONFIG, SystemConfig } from '../engine/config';
import { NetworkFailureState } from '../engine/types';
import { createDefaultFailures } from '../engine/graph';
import { 
  compareRecoveryStrategies, 
  calculatePriceOfFairnessFrontier,
  evaluateOptimizerBenchmarking
} from '../planner/engine';
import { 
  PlannerRecommendRequest, 
  PlannerRecommendResponse 
} from '../types';

export class PlannerService {
  public recommendPlan(
    params: PlannerRecommendRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): PlannerRecommendResponse {
    const budget = Number(params.budget);
    // Note: fairness floor in planner engine is in ratio 0..1 (default 0.35)
    let floorRatio = 0.35;
    if (params.fairnessFloor !== undefined) {
      const val = Number(params.fairnessFloor);
      floorRatio = val > 1 ? val / 100 : val;
    }

    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(params.failures || {})
    };

    // Run strategy comparison (Plan A Reach vs Plan B Fairness)
    const strategyComparison = compareRecoveryStrategies(config, failures, budget, floorRatio, 'S72', 0.5);

    // Compute Price-of-Fairness Pareto Frontier curve
    const priceOfFairness = calculatePriceOfFairnessFrontier(config, failures, budget, 'S72', 0.5);

    // Run benchmarking across heuristics
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
}

export const plannerService = new PlannerService();
