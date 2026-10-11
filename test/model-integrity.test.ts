/**
 * PEREGRINE — Comprehensive Model Integrity & Algorithmic Audit Test Suite
 * Master Verification Suite connecting test/model, test/metrics, test/planner, and test/integrity.
 * Validates Sections 6, 7, 8, 9, 10, 11 of Project Bible (178 assertions).
 */

import { runModelTests } from './model/model.test';
import { runMetricsTests } from './metrics/metrics.test';
import { runPlannerTests } from './planner/planner.test';
import { runIntegrityTests } from './integrity/integrity.test';
import { runIntegrationTests } from './integration/integration.test';
import { runScenarioControlsTests } from './model/scenario-controls.test';
import { runSilenceClockTests } from './metrics/silence-clock.test';
import { runRedundancyIllusionTests } from './metrics/redundancy-illusion.test';

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

console.log('\n======================================================');
console.log('PEREGRINE MODEL INTEGRITY & AUDIT VERIFICATION');
console.log('======================================================\n');

// 1. Model Layer (Tests 1-7, 16)
runModelTests(assert, assertClose);

// 2. Metrics Layer (Tests 8, 14)
runMetricsTests(assert, assertClose);

// 3. Planner Layer (Tests 10, 11, 12, 13, 15)
runPlannerTests(assert, assertClose);

// 4. Integrity Layer (Tests 9, 17)
runIntegrityTests(assert, assertClose);

// 5. Integration Layer (End-to-End Pipeline)
runIntegrationTests(assert, assertClose);

// 6. Scenario Controls Layer (Module 3 Presets & Transitions)
runScenarioControlsTests(assert, assertClose);

// 7. Silence Clock & Outage Analysis Layer (Module 4)
runSilenceClockTests(assert, assertClose);

// 8. Redundancy Illusion & Dependency Audit Layer (Module 5)
runRedundancyIllusionTests(assert, assertClose);

// Final Summary
console.log('\n======================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
