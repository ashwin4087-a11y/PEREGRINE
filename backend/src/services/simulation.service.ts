/**
 * PEREGRINE Simulation Service
 * Authoritative execution of S30 (alert window) and S72 (outage window) simulations.
 */

import { INITIAL_CONFIG, SystemConfig } from '../engine/config';
import { 
  NetworkFailureState, 
  ActiveInterventions 
} from '../engine/types';
import { 
  simulateS30, 
  simulateS72, 
  createDefaultFailures, 
  createEmptyInterventions 
} from '../engine/graph';
import { 
  getActiveFailuresList, 
  getScenarioSummary 
} from '../engine/scenario';
import { 
  SimulationRunRequest, 
  SimulationRunResponse 
} from '../types';

export class SimulationService {
  public runSimulation(
    params: SimulationRunRequest,
    config: SystemConfig = INITIAL_CONFIG
  ): SimulationRunResponse {
    const failures: NetworkFailureState = {
      ...createDefaultFailures(),
      ...(params.failures || {})
    };

    const interventions: ActiveInterventions = {
      ...createEmptyInterventions(),
      ...(params.interventions || {})
    };

    const autoTune = params.autoTune !== undefined ? Number(params.autoTune) : 0.5;

    // Run S30 simulation (30-minute alert window arrival decay model)
    const s30 = simulateS30(config, failures, interventions, autoTune);

    // Run S72 simulation (72-hour outage availability model)
    const s72 = simulateS72(config, interventions, autoTune, failures);

    // Generate active failures list with component diagnostics
    const activeFailures = getActiveFailuresList(failures, interventions);

    // Generate scenario summary explaining root causes
    const scenarioSummary = getScenarioSummary(failures, interventions);

    return {
      s30,
      s72,
      activeFailures,
      scenarioSummary
    };
  }
}

export const simulationService = new SimulationService();
