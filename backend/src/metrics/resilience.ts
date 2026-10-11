/**
 * PEREGRINE — Resilience Score Metrics (Section 7.1)
 * Formal definitions for S30 alert resilience, time-arrival decay weighting, and honest scoring.
 */

/**
 * Calculates linear time-arrival decay factor: (window - arrival) / window
 */
export function computeTimeDecay(arrivalMin: number, windowMin: number): number {
  if (windowMin <= 0) return 0;
  return Math.max(0, windowMin - arrivalMin) / windowMin;
}

/**
 * Calculates percentage resilience score from population contribution sum:
 * Score = (Sum(pop_i * reach_i * decay_i) / TotalPop) * 100
 */
export function computeResilienceScore(
  totalContribution: number,
  totalPopulation: number
): number {
  if (totalPopulation <= 0) return 0;
  return (totalContribution / totalPopulation) * 100;
}
