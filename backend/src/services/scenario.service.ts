/**
 * PEREGRINE Scenario Service
 * Manages canonical disaster scenario presets and failure enumerations.
 */

import { INITIAL_CONFIG } from '../engine/config';
import { NetworkFailureState } from '../engine/types';
import { 
  createDefaultFailures, 
  applyCyclonePreset, 
  applyGatewayLostPreset 
} from '../engine/graph';
import { CRITICAL_FAILURE_NODES, explainNodeCascade } from '../metrics/redundancy';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  failures: NetworkFailureState;
}

export class ScenarioService {
  public getScenarios(): ScenarioDefinition[] {
    return [
      {
        id: 'healthy',
        name: 'Healthy Baseline',
        description: 'All 7 infrastructure nodes operational. East grid common-cause vulnerability present on Tower B villages.',
        failures: createDefaultFailures()
      },
      {
        id: 'cyclone',
        name: 'Cyclone Landfall',
        description: 'Compound disaster: West power, East power, and fibre severed. Terrestrial broadcast down; mesh survives via Marina gateway.',
        failures: applyCyclonePreset()
      },
      {
        id: 'gateway_loss',
        name: 'Gateway Loss',
        description: 'Complete blackout: Cyclone landfall with primary Marina satellite gateway severed. All 8 settlements silenced unless 2nd gateway deployed.',
        failures: applyGatewayLostPreset()
      }
    ];
  }

  public getScenarioById(id: string): ScenarioDefinition | null {
    const list = this.getScenarios();
    return list.find(s => s.id === id) || null;
  }

  public getInfrastructureComponents() {
    return CRITICAL_FAILURE_NODES.map(id => explainNodeCascade(id));
  }

  public getInitialConfig() {
    return INITIAL_CONFIG;
  }
}

export const scenarioService = new ScenarioService();
