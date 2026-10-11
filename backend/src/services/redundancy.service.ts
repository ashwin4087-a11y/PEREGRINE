/**
 * PEREGRINE Redundancy Service
 * Evaluates Nominal Channels vs Available Channels vs N-1 Guaranteed Channels.
 */

import { INITIAL_CONFIG, SystemConfig } from '../engine/config';
import { 
  NetworkFailureState, 
  ActiveInterventions 
} from '../engine/types';
import { 
  createDefaultFailures, 
  createEmptyInterventions 
} from '../engine/graph';
import { 
  calculateRedundancyIllusion, 
  analyzeRedundancyIllusion, 
  calculateRedundancySummary,
  compareScenariosRedundancy
} from '../metrics/redundancy';
import { 
  RedundancyAnalyzeRequest, 
  RedundancyAnalyzeResponse 
} from '../types';

export class RedundancyService {
  public analyzeRedundancy(
    params: RedundancyAnalyzeRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): RedundancyAnalyzeResponse {
    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(params.failures || {})
    };

    const interventions: ActiveInterventions = {
      ...createEmptyInterventions(),
      ...(params.interventions || {})
    };

    // Calculate baseline status list
    const statusList = calculateRedundancyIllusion(config, failures, interventions);

    // Deep-dive analysis for each settlement
    const analyses = analyzeRedundancyIllusion(config, failures, interventions);

    // Island-wide summary metrics
    const summary = calculateRedundancySummary(analyses);

    // Cross-scenario comparisons (Healthy, Cyclone, Gateway Loss)
    const scenarioComparisons = compareScenariosRedundancy(config, interventions);

    return {
      statusList,
      analyses,
      summary,
      scenarioComparisons
    };
  }
}

export const redundancyService = new RedundancyService();
