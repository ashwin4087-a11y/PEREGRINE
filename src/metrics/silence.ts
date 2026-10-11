/**
 * PEREGRINE — Silence Clock Metrics (Section 8)
 * Quantifies blackout duration: cumulative hours where communities have zero surviving broadcast paths.
 */

/**
 * Calculates silence hours for a village given total scenario hours and active path hours.
 */
export function computeSilenceHours(totalScenarioHours: number, pathAvailableHours: number): number {
  return Math.max(0, totalScenarioHours - pathAvailableHours);
}

/**
 * Calculates total population experiencing complete communication blackout for all scenario hours.
 */
export function computeTotalSilentPopulation(
  villages: Array<{ pop: number; silenceHours: number }>,
  totalScenarioHours: number = 72
): number {
  return villages
    .filter(v => v.silenceHours >= totalScenarioHours)
    .reduce((sum, v) => sum + v.pop, 0);
}

/**
 * Calculates hours where expected reach falls below low-service threshold.
 */
export function computeLowServiceHours(
  stepReaches: number[],
  lowServiceThreshold: number = 0.25
): number {
  return stepReaches.filter(reach => reach < lowServiceThreshold).length;
}
