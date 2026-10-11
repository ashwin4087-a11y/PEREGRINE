/**
 * PEREGRINE Frontend API Client Test
 * Verifies frontend API client operations, error handling, and transparent local engine fallback.
 */

import { PeregrineApiClient } from '../src/services/api';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runClientTests() {
  console.log('\n======================================================');
  console.log('PEREGRINE FRONTEND API CLIENT & FALLBACK VERIFICATION');
  console.log('======================================================\n');

  // Test client with offline / dummy endpoint to verify graceful fallback
  const client = new PeregrineApiClient('http://127.0.0.1:9999/api');

  // 1. Health check on offline server returns offline status without throwing
  console.log('--- 1. Health Check Fallback ---');
  const health = await client.getHealth();
  assert(health.status === 'unavailable', 'Offline backend returns status unavailable');
  assert(health.service.includes('offline'), 'Offline status identifies service as offline');
  assert(client.isConnected() === false, 'Client connection state is false');

  // 2. Scenarios fallback
  console.log('\n--- 2. Scenarios Fallback ---');
  const scenarios = await client.getScenarios();
  assert(Array.isArray(scenarios), 'getScenarios returns array on offline fallback');
  assert(scenarios.length === 3, 'All 3 canonical disaster scenarios available offline');
  const cyclone = scenarios.find(s => s.id === 'cyclone')!;
  assert(cyclone.failures.power_west === true, 'Offline cyclone scenario has power_west severed');

  // 3. Components fallback
  console.log('\n--- 3. Infrastructure Components Fallback ---');
  const components = await client.getInfrastructureComponents();
  assert(Array.isArray(components), 'getInfrastructureComponents returns array');
  assert(components.length === 7, '7 critical infrastructure components returned');

  // 4. Simulation Execution Fallback
  console.log('\n--- 4. Simulation Execution Fallback ---');
  const sim = await client.runSimulation({
    failures: cyclone.failures
  });
  assert(typeof sim.s30.resilienceScore === 'number', 'Simulation returns valid S30 resilience score');
  assert(sim.s30.resilienceScore > 50 && sim.s30.resilienceScore < 60, 'Cyclone S30 resilience score is authoritative ~54%');
  assert(sim.s72.villages.length === 8, 'S72 simulation includes all 8 settlements');
  assert(sim.activeFailures.length > 0, 'Simulation includes active failures list');
  assert(sim.scenarioSummary.scenarioName === 'Cyclone Landfall', 'Simulation generates Cyclone Landfall summary');

  // 5. Redundancy Analysis Fallback
  console.log('\n--- 5. Redundancy Analysis Fallback ---');
  const redundancy = await client.analyzeRedundancy({
    failures: {}
  });
  assert(redundancy.analyses.length === 8, 'Redundancy analysis evaluates 8 settlements');
  assert(redundancy.summary.totalVillages === 8, 'Redundancy summary confirms 8 settlements');
  const karai = redundancy.analyses.find(a => a.villageId === 'karai')!;
  assert(karai.hasRedundancyIllusion === true, 'Karai correctly identified with redundancy illusion');
  assert(karai.n1Guaranteed === 1, 'Karai N-1 guaranteed is 1 in healthy baseline');

  // 6. Planner Recommendation Fallback
  console.log('\n--- 6. Planner Recommendation Fallback ---');
  const plan = await client.recommendPlan({
    budget: 50,
    fairnessFloor: 23,
    failures: cyclone.failures
  });
  assert(plan.planA.totalCost <= 50, 'Plan A respects 50u budget');
  assert(plan.planB.totalCost <= 50, 'Plan B respects 50u budget');
  assert(plan.priceOfFairness.frontier.length > 0, 'Price of fairness frontier generated');

  // 7. Experiment Fallback
  console.log('\n--- 7. Experiment Fallback ---');
  const exp = await client.runExperiment({
    seed: 'IEEE-BTS-2026',
    budget: 50
  });
  assert(typeof exp.experiment.experimentId === 'string', 'Experiment ID generated');
  assert(typeof exp.experiment.checksum === 'string', 'Experiment checksum generated');
  assert(exp.sensitivity.totalTrials === 16, 'Sensitivity trials evaluated');

  console.log('\n======================================================');
  console.log(`FRONTEND API CLIENT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runClientTests().catch(err => {
  console.error('Fatal client test error:', err);
  process.exit(1);
});
