import { createApp } from '../src/app';
import type { Server } from 'http';

let server: Server;
let baseUrl: string;

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

async function runApiTests() {
  console.log('\n======================================================');
  console.log('PEREGRINE BACKEND HTTP API ENDPOINT INTEGRATION TESTS');
  console.log('======================================================\n');

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });

  try {
    // 1. Health Endpoint
    console.log('--- 1. Health Endpoint Verification ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthJson.success === true, 'GET /api/health envelope indicates success: true');
    assert(healthJson.data.status === 'healthy', 'GET /api/health body indicates status "healthy"');
    assert(healthJson.data.service === 'peregrine-backend', 'GET /api/health identifies service correctly');
    assert(typeof healthJson.data.uptimeSeconds === 'number', 'GET /api/health provides system uptime');

    // 2. Scenarios Endpoint
    console.log('\n--- 2. Scenarios Endpoint Verification ---');
    const scenariosRes = await fetch(`${baseUrl}/api/scenarios`);
    const scenariosJson = await scenariosRes.json();
    assert(scenariosRes.status === 200, 'GET /api/scenarios returns 200 OK');
    assert(Array.isArray(scenariosJson.data), 'GET /api/scenarios returns array of scenarios in data');
    assert(scenariosJson.data.length === 3, 'GET /api/scenarios contains all 3 canonical disaster scenarios');

    const cycloneRes = await fetch(`${baseUrl}/api/scenarios/cyclone`);
    const cycloneJson = await cycloneRes.json();
    assert(cycloneRes.status === 200, 'GET /api/scenarios/cyclone returns 200 OK');
    assert(cycloneJson.data.id === 'cyclone', 'Cyclone scenario ID matches');
    assert(cycloneJson.data.failures.power_east === true, 'Cyclone scenario includes power_east cut');

    const notFoundScenarioRes = await fetch(`${baseUrl}/api/scenarios/invalid_scenario`);
    assert(notFoundScenarioRes.status === 404, 'GET /api/scenarios/invalid_scenario returns 404 Not Found');

    const componentsRes = await fetch(`${baseUrl}/api/scenarios/components`);
    const componentsJson = await componentsRes.json();
    assert(componentsRes.status === 200, 'GET /api/scenarios/components returns 200 OK');
    assert(componentsJson.data.length === 7, 'Components endpoint lists all 7 critical failure elements');

    // 3. Simulations Endpoint
    console.log('\n--- 3. Simulation Endpoint Verification ---');
    const simRes = await fetch(`${baseUrl}/api/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        failures: { power_east: true, fibre: true }
      })
    });
    const simJson = await simRes.json();
    assert(simRes.status === 200, 'POST /api/simulations/run returns 200 OK');
    assert(simJson.success === true, 'Simulation response success flag is true');
    assert(typeof simJson.data.s30.resilienceScore === 'number', 'Simulation returns valid S30 resilience score');
    assert(simJson.data.s72.villages.length === 8, 'Simulation S72 analysis spans all 8 settlements');
    assert(simJson.data.activeFailures.some((f: any) => f.key === 'power_east'), 'Simulation reflects active power_east failure');

    // Invalid payload test for simulation
    const invalidSimRes = await fetch(`${baseUrl}/api/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('invalid_payload_not_object')
    });
    assert(invalidSimRes.status === 400, 'POST /api/simulations/run rejects invalid JSON body with 400 Bad Request');

    // 4. Redundancy Illusion Endpoint
    console.log('\n--- 4. Redundancy Illusion Endpoint Verification ---');
    const redundancyRes = await fetch(`${baseUrl}/api/redundancy/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        failures: {}
      })
    });
    const redundancyJson = await redundancyRes.json();
    assert(redundancyRes.status === 200, 'POST /api/redundancy/analyze returns 200 OK');
    assert(redundancyJson.data.analyses.length === 8, 'Redundancy analysis evaluates all 8 settlements');
    const karai = redundancyJson.data.analyses.find((v: any) => v.villageId === 'karai');
    assert(karai.hasRedundancyIllusion === true, 'Karai detected with Redundancy Illusion in healthy baseline');
    assert(karai.commonCauseNodes.includes('power_east'), 'Karai common-cause node identified as power_east');

    // 5. Planner Recommendation Endpoint
    console.log('\n--- 5. Planner Recommendation Endpoint Verification ---');
    const plannerRes = await fetch(`${baseUrl}/api/planner/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 50,
        fairnessFloor: 23,
        failures: { power_east: true, fibre: true }
      })
    });
    const plannerJson = await plannerRes.json();
    assert(plannerRes.status === 200, 'POST /api/planner/recommend returns 200 OK');
    assert(plannerJson.data.planA.totalCost <= 50, 'Plan A respects budget cap');
    assert(plannerJson.data.planB.totalCost <= 50, 'Plan B respects budget cap');
    assert(typeof plannerJson.data.priceOfFairness.fairnessCostAtMaxMin === 'number', 'Price of fairness cost is calculated');

    // 6. Experiments Endpoint
    console.log('\n--- 6. Experiments Endpoint Verification ---');
    const expRes = await fetch(`${baseUrl}/api/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seed: 'IEEE-BTS-2026',
        budget: 50
      })
    });
    const expJson = await expRes.json();
    assert(expRes.status === 200, 'POST /api/experiments/run returns 200 OK');
    assert(typeof expJson.data.experiment.seed === 'number', 'Experiment records deterministic seed hash');
    assert(typeof expJson.data.experiment.checksum === 'string', 'Experiment returns deterministic checksum');
    assert(expJson.data.sensitivity.totalTrials === 16, 'Sensitivity benchmark evaluates 16 corner scenarios');

    // 7. Route 404 Centralized Error Handling
    console.log('\n--- 7. Centralized 404 Route Verification ---');
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-endpoint`);
    const notFoundJson = await notFoundRes.json();
    assert(notFoundRes.status === 404, 'Unknown endpoint returns 404 Not Found');
    assert(notFoundJson.success === false, 'Error response includes success: false');
    assert(notFoundJson.error.includes('not found'), 'Error response contains clear message');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n======================================================');
  console.log(`HTTP API TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error('Fatal API test error:', err);
  if (server) server.close();
  process.exit(1);
});
