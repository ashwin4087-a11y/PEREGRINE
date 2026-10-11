/**
 * PEREGRINE Experiment Service
 * Generates deterministic reproducible audit slips and executes parameter sensitivity sweeps.
 */

import { INITIAL_CONFIG, SystemConfig } from '../engine/config';
import { NetworkFailureState } from '../engine/types';
import { createDefaultFailures, applyCyclonePreset } from '../engine/graph';
import { generateReproducibleExperiment, fnv1aHash } from '../integrity/experiment';
import { evaluateHeadlineFairnessRobustness } from '../experiments/sensitivity';
import { 
  ExperimentRunRequest, 
  ExperimentRunResponse 
} from '../types';

export class ExperimentService {
  public runExperiment(
    params: ExperimentRunRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): ExperimentRunResponse {
    const seedStr = params.seed.trim();
    const seedNum = fnv1aHash(seedStr);
    const budget = params.budget !== undefined ? Number(params.budget) : 50;

    let floorRatio = 0.35;
    if (params.fairnessFloor !== undefined) {
      const val = Number(params.fairnessFloor);
      floorRatio = val > 1 ? val / 100 : val;
    }

    const failures: NetworkFailureState = {
      ...applyCyclonePreset(),
      ...(params.failures || {})
    };

    // Generate cryptographic tamper-evident experiment record
    const experiment = generateReproducibleExperiment(
      config,
      failures,
      budget,
      floorRatio,
      seedNum,
      'Cyclone Compound Infrastructure Failure'
    );

    // Run sensitivity robustness check across parameter variations
    const sensitivity = evaluateHeadlineFairnessRobustness(config, failures, budget, 0.5);

    return {
      experiment,
      sensitivity
    };
  }
}

export const experimentService = new ExperimentService();
