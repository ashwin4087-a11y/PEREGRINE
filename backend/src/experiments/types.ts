/**
 * PEREGRINE — Experiment & Sensitivity Types (Section 11)
 * Data contracts for deterministic experiment runs, audit slips, and parameter stress tests.
 */

export type { DeterministicExperimentRecord } from '../integrity/experiment';

export interface SensitivityParameters {
  radioShare: number;
  existingListenerShare: number;
  generatorRuntimeH: number;
  mobileUnitArrivalH: number;
  gridReturnH: number;
}

export interface SensitivityTrialResult {
  params: SensitivityParameters;
  genOnlyOverallReach: number;
  mobileOnlyOverallReach: number;
  bothOverallReach: number;
}
