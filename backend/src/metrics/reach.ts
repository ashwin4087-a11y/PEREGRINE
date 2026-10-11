/**
 * PEREGRINE — Warning Reach Metrics (Sections 6.4, 7.2, 7.3)
 * Pure functions calculating channel reach, independent union combinations, and population-weighted coverage.
 */

/**
 * Calculates FM broadcast village reach based on auto-tune adoption:
 * reach_FM_village(a) = radioShare * (a + (1 - a) * existingListenerShare)
 */
export function computeFmVillageReach(
  radioShare: number,
  autoTuneShare: number,
  existingListenerShare: number
): number {
  return radioShare * (autoTuneShare + (1 - autoTuneShare) * existingListenerShare);
}

/**
 * Calculates independent union reach across surviving channels:
 * R = 1 - Π(1 - r_c)
 */
export function computeIndependentUnionReach(channelReaches: number[]): number {
  let combined = 1 - channelReaches.reduce((product, r) => product * (1 - Math.max(0, Math.min(1, r))), 1);
  return Math.max(0, Math.min(1, combined));
}

/**
 * Calculates overall population-weighted average reach across settlements.
 */
export function computePopulationWeightedReach(
  villages: Array<{ pop: number; reach: number }>
): number {
  const totalPop = villages.reduce((sum, v) => sum + v.pop, 0);
  if (totalPop === 0) return 0;
  const totalWeighted = villages.reduce((sum, v) => sum + (v.pop * v.reach), 0);
  return (totalWeighted / totalPop) * 100;
}
