/**
 * PEREGRINE Backend Engine & API Test Suite
 * Validates backend simulation services, endpoints, error handling, and algorithmic integrity.
 */

import { simulationService } from '../src/services/simulation.service';
import { redundancyService } from '../src/services/redundancy.service';
import { plannerService } from '../src/services/planner.service';
import { experimentService } from '../src/services/experiment.service';
import { scenarioService } from '../src/services/scenario.service';
import { createApp } from '../src/app';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failCount++;
  }
}

function assertClose(actual: number, expected: number, tolerance: number, testName: string) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ PASS: ${testName} (${actual} ≈ ${expected}, diff ${diff.toFixed(4)} <= ${tolerance})`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} (actual ${actual}, expected ${expected}, diff ${diff})`);
    failCount++;
  }
}

async function runBackendTests() {
  console.log('\n======================================================');
  console.log('PEREGRINE BACKEND ARCHITECTURE & ENGINE VERIFICATION');
  console.log('======================================================\n');

  // 1. Scenario Service
  console.log('--- 1. Scenario Service Verification ---');
  const scenarios = scenarioService.getScenarios();
  assert(scenarios.length === 3, 'Scenario service exposes exactly 3 canonical scenarios');
  assert(scenarios.some(s => s.id === 'healthy'), 'Healthy scenario exists');
  assert(scenarios.some(s => s.id === 'cyclone'), 'Cyclone scenario exists');
  assert(scenarios.some(s => s.id === 'gateway_loss'), 'Gateway Loss scenario exists');

  const healthyScenario = scenarioService.getScenarioById('healthy')!;
  assert(healthyScenario.failures.power_east === false, 'Healthy scenario has power_east operational');

  const cycloneScenario = scenarioService.getScenarioById('cyclone')!;
  assert(cycloneScenario.failures.power_east === true, 'Cyclone scenario has power_east cut');
  assert(cycloneScenario.failures.fibre === true, 'Cyclone scenario has fibre cut');

  const invalidScenario = scenarioService.getScenarioById('unknown_scenario');
  assert(invalidScenario === null, 'Non-existent scenario returns null');

  const components = scenarioService.getInfrastructureComponents();
  assert(components.length === 7, 'Infrastructure components list contains all 7 critical failure nodes');

  // 2. Simulation Service (S30 & S72)
  console.log('\n--- 2. Simulation Service Verification ---');
  const healthySim = simulationService.runSimulation({ failures: healthyScenario.failures });
  assertClose(healthySim.s30.cellOnlyResilience, 78.07, 0.5, 'Healthy S30 cell-only resilience matches ~78%');
  assertClose(healthySim.s30.resilienceScore, 88.23, 0.5, 'Healthy S30 combined resilience matches ~88.2%');
  assert(healthySim.activeFailures.length === 0, 'Healthy simulation has 0 active failures');

  const cycloneSim = simulationService.runSimulation({ failures: cycloneScenario.failures });
  assertClose(cycloneSim.s30.resilienceScore, 53.95, 0.1, 'Cyclone S30 resilience score matches authoritative 54.0%');
  assert(cycloneSim.s72.villages.length === 8, 'Cyclone S72 covers all 8 settlements');
  assert(cycloneSim.s72.steps.length === 72, 'Cyclone S72 timeline has 72 hourly steps');

  // 3. Redundancy Service (Redundancy Illusion & N-1 Guaranteed)
  console.log('\n--- 3. Redundancy Service Verification ---');
  const healthyRedundancy = redundancyService.analyzeRedundancy({ failures: healthyScenario.failures });
  const karaiHealthy = healthyRedundancy.analyses.find(a => a.villageId === 'karai')!;
  const marinaHealthy = healthyRedundancy.analyses.find(a => a.villageId === 'marina')!;

  assert(marinaHealthy.n1Guaranteed === 2, 'Marina has N-1 guaranteed of 2 in healthy baseline');
  assert(marinaHealthy.commonCauseNodes.length === 0, 'Marina has 0 common-cause nodes in healthy baseline');
  assert(karaiHealthy.n1Guaranteed === 1, 'Karai has N-1 guaranteed of 1 in healthy baseline');
  assert(karaiHealthy.commonCauseNodes.includes('power_east'), 'Karai correctly identifies East Power CCF');
  assert(karaiHealthy.hasRedundancyIllusion === true, 'Karai is flagged with redundancy illusion');

  // Mitigating East Power CCF with generator
  const mitigatedRedundancy = redundancyService.analyzeRedundancy({
    failures: healthyScenario.failures,
    interventions: { backup_generation: true }
  });
  const karaiMitigated = mitigatedRedundancy.analyses.find(a => a.villageId === 'karai')!;
  assert(karaiMitigated.n1Guaranteed === 2, 'Backup generator lifts Karai N-1 guaranteed to 2');
  assert(karaiMitigated.commonCauseNodes.length === 0, 'Backup generator eliminates power_east CCF');

  // 4. Planner Service (Plan A vs Plan B)
  console.log('\n--- 4. Planner Service Verification ---');
  const planRecommendation = plannerService.recommendPlan({
    budget: 50,
    fairnessFloor: 23,
    failures: cycloneScenario.failures
  });

  assert(planRecommendation.planA.totalCost <= 50, 'Plan A respects budget ceiling of 50 units');
  assert(planRecommendation.planB.totalCost <= 50, 'Plan B respects budget ceiling of 50 units');
  assert(planRecommendation.priceOfFairness.frontier.length > 0, 'Price of fairness frontier contains evaluated points');
  assert(planRecommendation.benchmarks.exhaustiveOptimal.isPlanAOptimal, 'Plan A optimality confirmed against exhaustive search');

  // 5. Experiment Service (Seeded Reproducibility & Sensitivity)
  console.log('\n--- 5. Experiment Service Verification ---');
  const exp1 = experimentService.runExperiment({ seed: 'IEEE-BTS-2026', budget: 50 });
  const exp2 = experimentService.runExperiment({ seed: 'IEEE-BTS-2026', budget: 50 });

  assert(exp1.experiment.experimentId === exp2.experiment.experimentId, 'Identical seeds produce identical experiment ID');
  assert(exp1.sensitivity?.totalTrials === 16, 'Sensitivity evaluates 16 parameter corner cases');
  assert((exp1.sensitivity?.smallestVillagesAbandonedCount || 0) >= 8, 'Plan A abandons smallest villages across parameter trials');
  assert(typeof exp1.sensitivity?.averageFairnessCost === 'number', 'Average fairness trade-off cost is computed');

  // 6. Express App Route & HTTP Pipeline Verification
  console.log('\n--- 6. Express HTTP API Verification ---');
  const app = createApp();
  assert(typeof app.listen === 'function', 'Express application factory created valid server app');

  console.log('\n======================================================');
  console.log(`BACKEND TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBackendTests().catch(err => {
  console.error('Fatal backend test error:', err);
  process.exit(1);
});
