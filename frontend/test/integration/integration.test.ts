/**
 * PEREGRINE — Integration Verification Suite
 * Verifies end-to-end integration across model, metrics, planner, and integrity layers.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { createDefaultFailures, createEmptyInterventions } from '../../src/model/graph';
import { simulateS30 } from '../../src/model/simulateS30';
import { simulateS72 } from '../../src/model/simulateS72';
import { runPlanner } from '../../src/planner/engine';
import { generateReproducibleExperiment } from '../../src/integrity/experiment';

export function runIntegrationTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Integration Layer: End-to-End Pipeline Verification ---');
  const healthy = createDefaultFailures();
  const empty = createEmptyInterventions();

  const s30 = simulateS30(INITIAL_CONFIG, healthy, empty);
  assert(s30.resilienceScore > 0, 'Integrated S30 simulation evaluates healthy network');

  const s72 = simulateS72(INITIAL_CONFIG, empty, 0.5, healthy);
  assert(s72.overallReach > 0, 'Integrated S72 simulation evaluates healthy network');

  const plan = runPlanner(INITIAL_CONFIG, healthy, 50, 'REACH_MAX', 0.35, 'S72', 0.5);
  assert(plan.totalCost <= 50, 'Integrated planner honors budget constraint');

  const exp = generateReproducibleExperiment(INITIAL_CONFIG, healthy, 50, 0.35, 12345);
  assert(Boolean(exp.experimentId && exp.checksum), 'Integrated experiment generator produces valid ID & checksum');
}
