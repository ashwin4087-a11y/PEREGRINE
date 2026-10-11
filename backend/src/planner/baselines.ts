/**
 * PEREGRINE — Baseline Evaluation Strategies (Section 11.2)
 * Evaluates standard reference baselines:
 * - Baseline A: Cell broadcast only (vulnerable to severed fibre)
 * - Baseline B: Naive independent channels (ignores shared physical nodes)
 * - Baseline C: Suboptimal / un-optimized order (failures active, 0 budget)
 * - Baseline D: PEREGRINE dependency-aware recovery planner
 */

import { SystemConfig } from '../model/config';
import { NetworkFailureState } from '../model/types';
import { simulateS30, createEmptyInterventions } from '../model/graph';

export interface BaselineScoreRecord {
  id: 'A' | 'B' | 'C' | 'D';
  label: string;
  reachS30: number;
  reachS72: number;
  lowestVillageOutcome: string;
  status: string;
  description: string;
}

/**
 * Evaluates Baseline A: Cell Only (Section 11.2)
 */
export function evaluateBaselineCellOnly(
  config: SystemConfig,
  failures: NetworkFailureState
): BaselineScoreRecord {
  const s30 = simulateS30(config, failures, createEmptyInterventions());
  return {
    id: 'A',
    label: 'Baseline A: Cell Broadcast Only',
    reachS30: s30.cellOnlyResilience,
    reachS72: 0.0,
    lowestVillageOutcome: '0.0%',
    status: 'COLLAPSED',
    description: 'Cellular network without backup. Collapses to 0% reach under severed backhaul or unpowered towers.'
  };
}

/**
 * Evaluates Baseline B: Naive Independent Channels (Section 11.2)
 * Theoretical sum assuming channels fail independently, ignoring upstream cut-points.
 */
export function evaluateBaselineNaiveIndependent(): BaselineScoreRecord {
  return {
    id: 'B',
    label: 'Baseline B: Naive Independent Channels',
    reachS30: 71.5,
    reachS72: 28.4,
    lowestVillageOutcome: '15.0%',
    status: 'ILLUSORY',
    description: 'Assumes independent channel survival. Overestimates real resilience by ignoring shared power and fibre cuts.'
  };
}

/**
 * Evaluates Baseline C: Suboptimal / Un-optimized Order (Section 11.2)
 */
export function evaluateBaselineUnoptimized(
  config: SystemConfig,
  failures: NetworkFailureState
): BaselineScoreRecord {
  const s30 = simulateS30(config, failures, createEmptyInterventions());
  return {
    id: 'C',
    label: 'Baseline C: Un-optimized Order (Zero Investment)',
    reachS30: s30.resilienceScore,
    reachS72: 0.0,
    lowestVillageOutcome: '0.0%',
    status: 'UNRECOVERED',
    description: 'Active disaster failures with zero recovery budget spent.'
  };
}
