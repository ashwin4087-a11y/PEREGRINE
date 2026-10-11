/**
 * PEREGRINE — Planner Objectives & Scoring Models (Section 10.4)
 * Formal definitions for Reach Maximisation and Fairness-Floor equity objectives.
 */

import { CandidateIntervention } from './interventions';
import { NetworkFailureState } from '../model/types';

export type PlannerObjective = 'REACH_MAX' | 'FAIRNESS_FLOOR';
export type PlannerScenarioMode = 'S72' | 'S30';

export interface PlannerDecisionStep {
  stepNumber: number;
  interventionId: string;
  label: string;
  cost: number;
  score: number;
  remainingBudget: number;
  reason: string;
  villagesHelped: string[];
}

export interface VillagePlanOutcome {
  id: string;
  name: string;
  pop: number;
  reachBefore: number;
  reachAfter: number;
  silenceBefore: number;
  silenceAfter: number;
  meetsFloor: boolean;
  shortfall: number;
}

export interface PlanComparisonResult {
  objective: PlannerObjective;
  scenarioMode: PlannerScenarioMode;
  failures: NetworkFailureState;
  budget: number;
  floor: number;
  chosenInterventions: CandidateIntervention[];
  totalCost: number;
  remainingBudget: number;
  overallReachBefore: number;
  overallReachAfter: number;
  minVillageReachBefore: { id: string; name: string; value: number };
  minVillageReachAfter: { id: string; name: string; value: number };
  floorMet: boolean;
  villagesBelowFloor: Array<{ id: string; name: string; reach: number; shortfall: number }>;
  perVillageOutcomes: VillagePlanOutcome[];
  steps: PlannerDecisionStep[];
  gainPerCost: number;
  insightReport: string;
}

/**
 * Calculates unweighted cumulative shortfall from the fairness floor across villages:
 * shortfall(s) = Σ_v max(0, F - reach_v)
 */
export function calculateFairnessShortfall(
  villageReaches: number[],
  floor: number
): number {
  return villageReaches.reduce((sum, r) => sum + Math.max(0, floor - r), 0);
}
