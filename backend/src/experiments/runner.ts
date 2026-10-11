/**
 * PEREGRINE — Reproducible Experiment Runner (Section 11)
 * Executes reproducible scenario batches with explicit seeds and deterministic audit logging.
 */

import { SystemConfig } from '../model/config';
import { NetworkFailureState } from '../model/types';
import { generateReproducibleExperiment } from '../integrity/experiment';
import { DeterministicExperimentRecord } from './types';

export interface BatchRunConfig {
  config: SystemConfig;
  failures: NetworkFailureState;
  budgets: number[];
  floors: number[];
  seeds: number[];
  scenarioLabel?: string;
}

/**
 * Runs a batch matrix of reproducible experiments.
 */
export function runBatchExperiments(batchConfig: BatchRunConfig): DeterministicExperimentRecord[] {
  const { config, failures, budgets, floors, seeds, scenarioLabel } = batchConfig;
  const results: DeterministicExperimentRecord[] = [];

  for (const seed of seeds) {
    for (const budget of budgets) {
      for (const floor of floors) {
        const record = generateReproducibleExperiment(
          config,
          failures,
          budget,
          floor,
          seed,
          scenarioLabel || 'Batch Automated Verification Run'
        );
        results.push(record);
      }
    }
  }

  return results;
}
