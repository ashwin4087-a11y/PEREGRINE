/**
 * PEREGRINE Full-Stack Architecture & Integration Acceptance Test
 * Verifies repository architecture and tests frontend-to-backend communication.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Server } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

async function runFullStackVerification() {
  console.log('\n======================================================');
  console.log('PEREGRINE FULL-STACK REFACTOR ACCEPTANCE TEST');
  console.log('======================================================\n');

  // --- 1. Target Architecture Inspection ---
  console.log('--- 1. Target Architecture Structure Inspection ---');
  const requiredDirs = [
    'frontend',
    'backend',
    'tests',
    'docs',
    'scripts'
  ];

  for (const dir of requiredDirs) {
    const fullPath = path.join(rootDir, dir);
    assert(fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(), `Directory exists: ${dir}/`);
  }

  const requiredFiles = [
    'package.json',
    'README.md',
    '.gitignore'
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(rootDir, file);
    assert(fs.existsSync(fullPath) && fs.statSync(fullPath).isFile(), `Root file exists: ${file}`);
  }

  // Frontend Structure Inspection
  console.log('\n--- 1.1 Frontend Structure Inspection ---');
  const frontendRequired = [
    'src/app',
    'src/pages',
    'src/components',
    'src/services/api.ts',
    'src/model',
    'src/metrics',
    'src/planner',
    'src/integrity',
    'src/experiments',
    'src/styles',
    'public',
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    '.env.example'
  ];

  for (const item of frontendRequired) {
    const fullPath = path.join(rootDir, 'frontend', item);
    assert(fs.existsSync(fullPath), `Frontend contains: frontend/${item}`);
  }

  // Backend Structure Inspection
  console.log('\n--- 1.2 Backend Structure Inspection ---');
  const backendRequired = [
    'src/server.ts',
    'src/app.ts',
    'src/routes',
    'src/controllers',
    'src/services',
    'src/engine',
    'src/metrics',
    'src/planner',
    'src/integrity',
    'src/experiments',
    'src/middleware',
    'src/config',
    'src/types',
    'test',
    'package.json',
    'tsconfig.json',
    '.env.example'
  ];

  for (const item of backendRequired) {
    const fullPath = path.join(rootDir, 'backend', item);
    assert(fs.existsSync(fullPath), `Backend contains: backend/${item}`);
  }

  // --- 2. Live HTTP Integration Verification ---
  console.log('\n--- 2. Live HTTP Backend-to-Frontend Integration ---');
  const { createApp } = await import('../backend/src/app.js');
  const { PeregrineApiClient } = await import('../frontend/src/services/api.js');

  const app = createApp();
  let server: Server;
  let testPort: number;

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        testPort = address.port;
      }
      resolve();
    });
  });

  try {
    const client = new PeregrineApiClient(`http://127.0.0.1:${testPort}/api`);

    // Health
    const health = await client.getHealth();
    assert(health.status === 'healthy', 'Frontend client successfully connects to live backend /health');
    assert(client.isConnected() === true, 'Frontend client recognizes connection status as online');

    // Scenarios
    const scenarios = await client.getScenarios();
    assert(scenarios.length === 3, 'Frontend client retrieves 3 canonical disaster scenarios');

    // Simulation
    const sim = await client.runSimulation({
      failures: { power_east: true, fibre: true }
    });
    assert(typeof sim.s30.resilienceScore === 'number', 'Frontend client receives live calculated S30 resilience score');
    assert(sim.s72.villages.length === 8, 'Frontend client receives live 72h outage calculations for all 8 settlements');

    // Redundancy Analysis
    const redundancy = await client.analyzeRedundancy({ failures: {} });
    assert(redundancy.analyses.length === 8, 'Frontend client receives redundancy illusion analysis');
    assert(redundancy.summary.totalVillages === 8, 'Redundancy summary confirms 8 settlements');
    const karai = redundancy.analyses.find(a => a.villageId === 'karai')!;
    assert(karai.hasRedundancyIllusion === true, 'Karai East Power CCF detected in live API response');

    // Planner Recommendation
    const plan = await client.recommendPlan({
      budget: 50,
      fairnessFloor: 23,
      failures: { power_east: true, fibre: true }
    });
    assert(plan.planA.totalCost <= 50, 'Planner recommendation respects budget ceiling');
    assert(plan.planB.totalCost <= 50, 'Fairness plan recommendation respects budget ceiling');

    // Seeded Reproducible Experiment
    const exp = await client.runExperiment({
      seed: 'IEEE-BTS-2026',
      budget: 50
    });
    assert(typeof exp.experiment.experimentId === 'string', 'Experiment returns deterministic ID');
    assert(typeof exp.experiment.checksum === 'string', 'Experiment returns SHA256-SIM checksum');
    assert(exp.sensitivity.totalTrials === 16, 'Sensitivity analysis checks 16 corner combinations');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n======================================================');
  console.log(`FULL-STACK ACCEPTANCE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFullStackVerification().catch((err) => {
  console.error('Fatal full stack test error:', err);
  process.exit(1);
});
