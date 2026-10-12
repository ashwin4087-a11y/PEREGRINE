/**
 * PEREGRINE — Comprehensive Model Integrity & Algorithmic Audit Test Suite
 * Validates Sections 6, 7, 8, 9, 10, 11 of Project Bible
 * 
 * Verifies:
 * 1. Removal of arbitrary planner multiplier (* 1.03)
 * 2. S30 baseline and intervention scoring (unified path)
 * 3. Gateway loss demonstration (S30 reach collapses from ~54% to 0.00%)
 * 4. S72 power outage and hour-48 scheduled recovery
 * 5. Permanent power failure (reach remains 0% for all 72h)
 * 6. Centralised siren, relay, community kit reach and arrival timings
 * 7. Mesh distance and hop calculations (<= 190 units, intermediate node loss)
 * 8. S72 summary metrics dynamically derived from dependency graph state
 * 9. Deterministic experiment identifiers and seeded reproducible runs
 * 10. S72 Budget-50 Planner comparison (Reach Max: 31.8% vs Fairness: 25.0%)
 * 11. Infeasible fairness floor detection and honest shortfall reporting
 * 12. Budget 80 & 100 convergence (lowest village at 34.4%)
 * 13. Dashboard metrics consistency with detailed simulation outputs
 */

import { INITIAL_CONFIG } from '../src/model/config';
import { 
  createDefaultFailures, 
  createEmptyInterventions, 
  applyHealthyPreset,
  applyCyclonePreset,
  applyGatewayLostPreset,
  simulateS30, 
  simulateS72, 
  computeMeshTopology, 
  calculateRedundancyIllusion, 
  NetworkFailureState 
} from '../src/model/graph';
import { runPlanner, compareRecoveryStrategies } from '../src/planner/engine';
import { generateReproducibleExperiment } from '../src/integrity/experiment';

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

// -----------------------------------------------------------------------------
// Test 1: Removal of arbitrary planner multiplier (* 1.03)
// -----------------------------------------------------------------------------
console.log('--- Test 1: Removal of Fabricated Planner Multiplier ---');
const healthyFailures = createDefaultFailures();
const emptyInterventions = createEmptyInterventions();
const s30Healthy = simulateS30(INITIAL_CONFIG, healthyFailures, emptyInterventions);
assert(
  s30Healthy.planResilience === s30Healthy.resilienceScore,
  'planResilience matches actual resilienceScore without multiplier',
  `planResilience: ${s30Healthy.planResilience}, resilienceScore: ${s30Healthy.resilienceScore}`
);
assert(
  s30Healthy.planResilience !== Number((s30Healthy.resilienceScore * 1.03).toFixed(2)),
  'No arbitrary 1.03 multiplier applied',
  'planResilience is an honest reflection of simulation state'
);

// -----------------------------------------------------------------------------
// Test 2: S30 baseline scoring under Cyclone & Healthy Grid (unified path)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: S30 Baseline Scoring (Unified Path) ---');
const cycloneFailures: NetworkFailureState = {
  power_west: true,
  power_east: true,
  fibre: true,
  tower_A: false,
  tower_B: false,
  fm_tx: false,
  gateway: false
};
const s30Cyclone = simulateS30(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
// Under cyclone without interventions, cell is dead (fibre cut), FM is dead (power down).
// Only Mesh remains operational across the 6 mesh-connected villages via Marina Gateway.
assert(s30Cyclone.cellOnlyResilience === 0, 'Cell-only resilience collapses to 0.00% under severed fibre');
assertClose(s30Cyclone.resilienceScore, 54.0, 0.5, 'S30 Cyclone baseline reach with operational gateway');

// -----------------------------------------------------------------------------
// Test 3: Gateway Loss Demonstration (Single-Point Collapse)
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Gateway Loss Demonstration ---');
const gatewayLostFailures: NetworkFailureState = {
  ...cycloneFailures,
  gateway: true
};
const s30GatewayLost = simulateS30(INITIAL_CONFIG, gatewayLostFailures, emptyInterventions);
assert(
  s30GatewayLost.resilienceScore === 0,
  'S30 reach collapses completely from ~54% to 0.00% upon gateway loss',
  `Result was ${s30GatewayLost.resilienceScore}`
);

// -----------------------------------------------------------------------------
// Test 4: S72 Power Outage and Hour-48 Scheduled Recovery
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: S72 Power Outage Timeline & Hour-48 Recovery ---');
const s72Cyclone = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
// Pre-restoration (hours 0..47): grid power is down, FM transmitter is unpowered
const preRestorationFM = s72Cyclone.steps.slice(0, 48).every(s => !s.gridPowerUp && !s.fmOnAir);
assert(preRestorationFM, 'Grid power and fixed FM are down during pre-restoration (h 0..47)');

// Post-restoration (hours 48..71): grid power returns, FM transmitter is on air
const postRestorationFM = s72Cyclone.steps.slice(48).every(s => s.gridPowerUp && s.fmOnAir);
assert(postRestorationFM, 'Grid power returns at hour 48 and fixed FM comes on-air (h 48..71)');
assert(s72Cyclone.overallReach > 0, 'S72 baseline reflects hour-48 power recovery (honest time-dependent reach)');

// -----------------------------------------------------------------------------
// Test 5: Permanent Power Failure Handling
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Permanent Power Failure Handling ---');
const permanentPowerFailures: NetworkFailureState = {
  ...cycloneFailures,
  power_east_permanent: true
};
const s72Permanent = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, permanentPowerFailures);
const allStepsDead = s72Permanent.steps.every(s => !s.gridPowerUp && !s.fmOnAir);
assert(allStepsDead, 'Permanently failed power dependency never recovers at hour 48');
assert(s72Permanent.overallReach === 0, 'Permanent power outage with no interventions yields 0.00% reach');

// -----------------------------------------------------------------------------
// Test 6: Mesh Distance and Hop Calculations
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Mesh Distance & Valid Hop Calculations ---');
const topo = computeMeshTopology(INITIAL_CONFIG, healthyFailures, emptyInterventions);

// Marina is Gateway host
assert(topo.nodes['marina'].isGateway && topo.nodes['marina'].hopCount === 0, 'Marina hosts gateway (0 hops)');

// Direct links within 190 units
// Kovalam (160, 110) to Marina (230, 220): dist ≈ 130.4 <= 190
assert(topo.nodes['kovalam'].hopCount === 1, 'Kovalam is directly connected to Marina (1 hop)');
// Pazhaya (320, 90) to Marina: dist ≈ 158.1 <= 190
assert(topo.nodes['pazhaya'].hopCount === 1, 'Pazhaya is directly connected to Marina (1 hop)');
// Karai (180, 350) to Marina: dist ≈ 139.3 <= 190
assert(topo.nodes['karai'].hopCount === 1, 'Karai is directly connected to Marina (1 hop)');

// Multi-hop links
// Uppalam (290, 410) to Marina (230, 220): dist ≈ 199.2 > 190. Via Karai (dist 125.3 <= 190)
assert(topo.nodes['uppalam'].hopCount === 2, 'Uppalam is 2 hops from Marina (via Karai)');

// Sagar (360, 460) to Uppalam: dist ≈ 86.0 <= 190
assert(topo.nodes['sagar'].hopCount === 3, 'Sagar is 3 hops from Marina (via Karai -> Uppalam)');

// Thoni & Hill Camp lack mesh hardware by default
assert(!topo.nodes['thoni'].hasHardware && !topo.nodes['thoni'].connectedToGateway, 'Thoni has no mesh node');
assert(!topo.nodes['hillcamp'].hasHardware && !topo.nodes['hillcamp'].connectedToGateway, 'Hill Camp has no mesh node');

// Intermediate node failure: If Karai fails, Uppalam and Sagar lose mesh connectivity
const karaiFailedInterventions = createEmptyInterventions();
const karaiFailedConfig = {
  ...INITIAL_CONFIG,
  villages: INITIAL_CONFIG.villages.map(v => v.id === 'karai' ? { ...v, meshNode: false } : v)
};
const topoNoKarai = computeMeshTopology(karaiFailedConfig, healthyFailures, karaiFailedInterventions);
assert(
  !topoNoKarai.nodes['uppalam'].connectedToGateway && topoNoKarai.nodes['uppalam'].hopCount === null,
  'Uppalam loses mesh connectivity when intermediate node Karai is unavailable'
);
assert(
  !topoNoKarai.nodes['sagar'].connectedToGateway && topoNoKarai.nodes['sagar'].hopCount === null,
  'Sagar loses mesh connectivity when intermediate node Karai is unavailable'
);

// -----------------------------------------------------------------------------
// Test 7: Centralised Channel Reach & Timing Assumptions
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Centralised Assumptions in Configuration ---');
assert(INITIAL_CONFIG.channels.siren.reachS30 === 0.80, 'S30 siren reach is centralised at 0.80');
assert(INITIAL_CONFIG.channels.siren.reachS72 === 0.50, 'S72 siren reach is centralised at 0.50');
assert(INITIAL_CONFIG.channels.relay.reachS72 === 0.40, 'Relay S72 reach is centralised at 0.40');
assert(INITIAL_CONFIG.channels.communityKit.reachS72 === 0.70, 'Community kit reach is centralised at 0.70');
assert(INITIAL_CONFIG.channels.communityKit.arrivalMin === 2.0, 'Community kit arrival time is 2.0 min');
assert(INITIAL_CONFIG.channels.mesh.rangeUnits === 190, 'Mesh range is centralised at 190 units');

// -----------------------------------------------------------------------------
// Test 8: S72 Summary Metrics Derived from Dependency Graph State
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: S72 Summary Metrics Dynamically Derived from Graph ---');
const illusion = calculateRedundancyIllusion(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
const marinaStatus = illusion.find(s => s.villageId === 'marina')!;
const thoniStatus = illusion.find(s => s.villageId === 'thoni')!;

assert(marinaStatus.availableCount === 1, 'Marina has 1 available channel (mesh via gateway) under cyclone');
assert(marinaStatus.n1Guaranteed === 0, 'Marina N-1 guaranteed is 0 under single-point cut');
assert(thoniStatus.availableCount === 0, 'Thoni has 0 available channels under cyclone');

// Verify S72 summary matches illusion calculations
const s72SummaryMarina = s72Cyclone.villages.find(v => v.id === 'marina')!;
assert(
  s72SummaryMarina.availableChannelsNow === marinaStatus.availableCount,
  'S72 summary availableChannelsNow matches graph illusion status'
);
assert(
  s72SummaryMarina.n1Guaranteed === marinaStatus.n1Guaranteed,
  'S72 summary n1Guaranteed matches graph illusion status'
);

// -----------------------------------------------------------------------------
// Test 9: Deterministic Experiment Identifiers & Seeded Reproducibility
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Deterministic Experiment Reproducibility ---');
const exp1 = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 42891);
const exp2 = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 42891);
assert(exp1.experimentId === exp2.experimentId, 'Identical inputs produce identical experiment ID');
assert(exp1.checksum === exp2.checksum, 'Identical inputs produce identical checksum');
assert(JSON.stringify(exp1) === JSON.stringify(exp2), 'Entire experiment records match deterministically');

const expDifferentSeed = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 99999);
assert(exp1.experimentId !== expDifferentSeed.experimentId, 'Different seed produces distinct unique experiment ID');

// -----------------------------------------------------------------------------
// Test 10: S72 Budget-50 Planner Comparison (Reach Max vs Fairness Floor)
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: S72 Budget-50 Planner Comparison ---');
const comparison50 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 'S72', 0.5);

// Reach Maximiser Plan: Generator (20) + Mobile Unit (30) = 50 units
// Serves 6 coastal FM villages. Overall reach = 31.8%. Lowest village: Thoni at 0%.
assertClose(comparison50.planReach.overallReachAfter, 31.8, 0.5, 'Reach maximiser achieves ~31.8% overall reach');
assert(comparison50.planReach.minVillageReachAfter.value === 0, 'Reach maximiser leaves Thoni & Hill Camp at 0%');

// Fairness-Constrained Plan: Mobile Unit (30) + 2 Sirens (20) = 50 units
// Serves Thoni & Hill Camp with sirens, plus mobile FM. Overall reach = 25.0%. Lowest village: Kovalam at 22.9%.
assertClose(comparison50.planFairness.overallReachAfter, 25.0, 0.5, 'Fairness-constrained plan achieves ~25.0% overall reach');
assertClose(comparison50.planFairness.minVillageReachAfter.value, 22.9, 0.5, 'Fairness-constrained plan raises lowest village to ~22.9%');
assert(
  comparison50.disadvantaged,
  'Planner confirms that aggregate-maximizing plan disadvantages smaller villages'
);

// -----------------------------------------------------------------------------
// Test 11: Infeasible Fairness Floor Detection & Shortfall Reporting
// -----------------------------------------------------------------------------
console.log('\n--- Test 11: Infeasible Fairness Floor Detection ---');
assert(
  !comparison50.planFairness.floorMet,
  'Planner honestly reports that 35% fairness floor is NOT met at budget 50 (floorMet = false)'
);
assert(
  comparison50.planFairness.villagesBelowFloor.length > 0,
  'Planner records specific villages below floor with honest shortfalls'
);

// -----------------------------------------------------------------------------
// Test 12: Budgets 80 and 100 Convergence
// -----------------------------------------------------------------------------
console.log('\n--- Test 12: Budgets 80 & 100 Convergence ---');
const comparison80 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 80, 0.35, 'S72', 0.5);
const comparison100 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 100, 0.35, 'S72', 0.5);

// At budgets 80 and 100, both plans converge on Generator (20) + Mobile Unit (30) + 2 Sirens (20) = 70 units
assertClose(comparison80.planFairness.minVillageReachAfter.value, 34.4, 0.5, 'At budget 80, lowest village is at ~34.4%');
assertClose(comparison100.planFairness.minVillageReachAfter.value, 34.4, 0.5, 'At budget 100, lowest village is still at ~34.4% (35% floor missed)');
assert(
  !comparison100.planFairness.floorMet,
  'At budget 100, 35% floor is still honestly reported as missed (34.4% < 35.0%)'
);

// -----------------------------------------------------------------------------
// Test 13: S30 Planned Recovery Fresh Simulation Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 13: S30 Planned Recovery (Fresh Simulation Verification) ---');
const s30Plan = runPlanner(INITIAL_CONFIG, cycloneFailures, 50, 'REACH_MAX', 0.35, 'S30', 0.5);
assert(
  s30Plan.chosenInterventions.some(c => c.id === 'backup_generation') &&
  s30Plan.chosenInterventions.some(c => c.id === 'siren_thoni') &&
  s30Plan.chosenInterventions.some(c => c.id === 'siren_hillcamp'),
  'S30 planner at budget 50 selects backup generation and sirens for Thoni and Hill Camp'
);
assert(s30Plan.totalCost === 40, 'Total cost for backup generator (20) + 2 sirens (20) is 40 <= 50 units');

// Fresh independent simulation using the chosen interventions directly
const activeInterventionsS30 = {
  ...createEmptyInterventions(),
  backup_generation: true,
  siren_responders: ['thoni', 'hillcamp']
};
const s30FreshSim = simulateS30(INITIAL_CONFIG, cycloneFailures, activeInterventionsS30, 0.5);
assertClose(s30FreshSim.resilienceScore, 71.7, 0.1, 'Fresh simulation of chosen S30 interventions achieves 71.7%');
assert(
  s30Plan.overallReachAfter === s30FreshSim.resilienceScore,
  'Planner reported overall reach matches independent fresh simulation exactly',
  `planner: ${s30Plan.overallReachAfter}, fresh: ${s30FreshSim.resilienceScore}`
);

// -----------------------------------------------------------------------------
// Test 14: S30 Baseline Mathematical Derivation (53.95% vs 54.26%)
// -----------------------------------------------------------------------------
console.log('\n--- Test 14: S30 Baseline Mathematical Derivation (53.95% vs 54.26%) ---');
// Under the naive 1-hop assumption where all 5 non-gateway mesh nodes are at 1 hop:
// Marina (0 hops): 5200 * 0.6 * (29.7 / 30) = 3088.8
// 5 other mesh villages (1 hop): (4200 + 1800 + 2600 + 3100 + 1500) * 0.6 * (29.2 / 30) = 7708.8
// Total = 10,797.6 / 19,900 = 54.259% ≈ 54.26%
const naiveSum = (5200 * 0.6 * (29.7 / 30)) + ((4200 + 1800 + 2600 + 3100 + 1500) * 0.6 * (29.2 / 30));
const naiveReach = (naiveSum / 19900) * 100;
assertClose(naiveReach, 54.26, 0.01, 'Naive 1-hop mesh model produces 54.26%');

// Under authoritative BFS Euclidean model, Uppalam is 2 hops (1.3 min) and Sagar is 3 hops (1.8 min):
// Total = 10,736.6 / 19,900 = 53.9528% ≈ 53.95% (54.0%)
const actualS30Baseline = s30Cyclone.resilienceScore;
assertClose(actualS30Baseline, 53.95, 0.05, 'Authoritative multi-hop BFS model produces 53.95%');
assertClose(actualS30Baseline, 54.0, 0.1, 'Authoritative S30 baseline rounds honestly to 54.0%');

// -----------------------------------------------------------------------------
// Test 15: All 12 S72 Planner Combinations Matrix Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 15: All 12 S72 Planner Combinations Verification ---');
const testBudgets = [20, 50, 80, 100];
const testAutoTunes = [0.0, 0.5, 1.0];
let combinationsTested = 0;

for (const budget of testBudgets) {
  for (const autoTune of testAutoTunes) {
    const comp = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, budget, 0.35, 'S72', autoTune);
    
    // 1. Budget constraint strictly respected
    assert(comp.planReach.totalCost <= budget, `Combination B=${budget} A=${autoTune} ReachMax respects budget constraint`);
    assert(comp.planFairness.totalCost <= budget, `Combination B=${budget} A=${autoTune} Fairness respects budget constraint`);
    
    // 2. Monotonic reach gain (reach after >= reach before)
    assert(
      comp.planReach.overallReachAfter >= comp.planReach.overallReachBefore - 0.01,
      `Combination B=${budget} A=${autoTune} ReachMax achieves non-negative reach improvement`
    );
    assert(
      comp.planFairness.overallReachAfter >= comp.planFairness.overallReachBefore - 0.01,
      `Combination B=${budget} A=${autoTune} Fairness achieves non-negative reach improvement`
    );

    // 3. At budget 50, ReachMax always disadvantages smaller villages compared to Fairness
    if (budget === 50) {
      assert(
        comp.disadvantaged,
        `Combination B=50 A=${autoTune} accurately detects and confirms disadvantage to isolated villages`
      );
    }
    
    combinationsTested++;
  }
}
assert(combinationsTested === 12, 'Successfully verified all 12 S72 planner matrix combinations');

// -----------------------------------------------------------------------------
// Test 16: Complete Mesh Topology and Distance Cutoffs
// -----------------------------------------------------------------------------
console.log('\n--- Test 16: Complete Mesh Topology and Distance Cutoffs ---');
// Verify Euclidean distances against 190-unit range threshold:
const vMap = new Map(INITIAL_CONFIG.villages.map(v => [v.id, v]));
const dist = (id1: string, id2: string) => {
  const v1 = vMap.get(id1)!;
  const v2 = vMap.get(id2)!;
  return Math.hypot(v1.x - v2.x, v1.y - v2.y);
};
// Direct links <= 190
assert(dist('marina', 'kovalam') < 190, 'Marina to Kovalam distance is within 190 units');
assert(dist('marina', 'pazhaya') < 190, 'Marina to Pazhaya distance is within 190 units');
assert(dist('marina', 'karai') < 190, 'Marina to Karai distance is within 190 units');
assert(dist('karai', 'uppalam') < 190, 'Karai to Uppalam distance is within 190 units');
assert(dist('uppalam', 'sagar') < 190, 'Uppalam to Sagar distance is within 190 units');

// Non-direct links > 190
assert(dist('marina', 'uppalam') > 190, 'Marina to Uppalam exceeds 190 units (requires Karai relay)');
assert(dist('marina', 'sagar') > 190, 'Marina to Sagar exceeds 190 units (requires multi-hop)');
assert(dist('karai', 'sagar') > 190, 'Karai to Sagar exceeds 190 units (requires Uppalam relay)');

// -----------------------------------------------------------------------------
// Test 17: Deterministic Experiment Replays & Audit Slips
// -----------------------------------------------------------------------------
console.log('\n--- Test 17: Deterministic Experiment Replays & Audit Slips ---');
const seed = 88412;
const replayA = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, seed);
const replayB = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, seed);
assert(replayA.experimentId === replayB.experimentId, 'Experiment ID is strictly deterministic');
assert(replayA.checksum === replayB.checksum, 'Payload cryptographic checksum matches across replays');
assert(replayA.checksum.startsWith('SHA256-SIM-'), 'Checksum contains SHA256-SIM prefix');

// -----------------------------------------------------------------------------
// Test 18: Deterministic Scenario State Transitions & Cross-Tab Invariants
// -----------------------------------------------------------------------------
console.log('\n--- Test 18: Deterministic Scenario Transitions & Cross-Tab Invariants ---');

// Step 1: Healthy Baseline
const baselineFailures = applyHealthyPreset();
const baselineInterventions = createEmptyInterventions();
const s30Baseline = simulateS30(INITIAL_CONFIG, baselineFailures, baselineInterventions, 0.5);
const s72Baseline = simulateS72(INITIAL_CONFIG, baselineInterventions, 0.5, baselineFailures);
const illusionBaseline = calculateRedundancyIllusion(INITIAL_CONFIG, baselineFailures, baselineInterventions);

assert(s30Baseline.resilienceScore === 88.23, 'Healthy S30 total reach is exactly 88.23%');
assert(s30Baseline.cellOnlyResilience === 78.07, 'Healthy S30 cell-only reach is exactly 78.07%');
assert(s72Baseline.overallReach === 10.59, 'Healthy S72 time-averaged reach is exactly 10.59%');
const silentPopBaseline = s72Baseline.villages.filter(v => v.silenceHours === 72).reduce((s, v) => s + v.pop, 0);
assert(silentPopBaseline === 1500, 'Healthy S72 silent population under 72h blackout is exactly 1,500 (Thoni + Hill Camp)');

// Check East Power common cause in baseline
const karaiBaseline = illusionBaseline.find(v => v.villageId === 'karai');
const uppalamBaseline = illusionBaseline.find(v => v.villageId === 'uppalam');
const sagarBaseline = illusionBaseline.find(v => v.villageId === 'sagar');
assert(karaiBaseline?.n1Guaranteed === 1, 'Karai N-1 guaranteed is strictly 1 in healthy baseline');
assert(uppalamBaseline?.n1Guaranteed === 1, 'Uppalam N-1 guaranteed is strictly 1 in healthy baseline');
assert(sagarBaseline?.n1Guaranteed === 1, 'Sagar N-1 guaranteed is strictly 1 in healthy baseline');
assert(karaiBaseline?.commonCauseNodes.includes('power_east') === true, 'Karai identifies power_east as common-cause vulnerability');

// Step 2: Transition to Severe Cyclone
const cyclonePreset = applyCyclonePreset();
assert(cyclonePreset.power_west && cyclonePreset.power_east && cyclonePreset.fibre && !cyclonePreset.gateway, 'Cyclone preset configures compound failure');
const s30CycloneRun = simulateS30(INITIAL_CONFIG, cyclonePreset, baselineInterventions, 0.5);
assert(s30CycloneRun.cellOnlyResilience === 0.0, 'Cyclone collapses cell-only reach to 0.00%');
assertClose(s30CycloneRun.resilienceScore, 54.0, 0.5, 'Cyclone reach is ~54.0% via active mesh');

// Step 3: Transition to Gateway Lost
const gatewayLostPreset1 = applyGatewayLostPreset();
const gatewayLostPreset2 = applyGatewayLostPreset();
assert(gatewayLostPreset1.gateway === true, 'Gateway Lost sets gateway failure flag');
assert(gatewayLostPreset2.gateway === true, 'Gateway Lost is idempotent and does not toggle off on repeated call');
const s30GatewayRun = simulateS30(INITIAL_CONFIG, gatewayLostPreset1, baselineInterventions, 0.5);
assert(s30GatewayRun.resilienceScore === 0.0, 'Gateway Lost collapses S30 reach to strictly 0.00%');

// Step 4: Return to Healthy Grid
const restoredFailures = applyHealthyPreset();
const restoredInterventions = createEmptyInterventions();
const s30Restored = simulateS30(INITIAL_CONFIG, restoredFailures, restoredInterventions, 0.5);
const s72Restored = simulateS72(INITIAL_CONFIG, restoredInterventions, 0.5, restoredFailures);
const illusionRestored = calculateRedundancyIllusion(INITIAL_CONFIG, restoredFailures, restoredInterventions);

assert(s30Restored.resilienceScore === s30Baseline.resilienceScore, 'Healthy restoration achieves identical S30 resilience score (88.23%)');
assert(s30Restored.cellOnlyResilience === s30Baseline.cellOnlyResilience, 'Healthy restoration achieves identical S30 cell-only resilience (78.07%)');
assert(s72Restored.overallReach === s72Baseline.overallReach, 'Healthy restoration achieves identical S72 overall reach (10.59%)');
const silentPopRestored = s72Restored.villages.filter(v => v.silenceHours === 72).reduce((s, v) => s + v.pop, 0);
assert(silentPopRestored === silentPopBaseline, 'Healthy restoration restores silent population to 1,500');
const karaiRestored = illusionRestored.find(v => v.villageId === 'karai');
assert(karaiRestored?.n1Guaranteed === 1, 'Healthy restoration restores Karai N-1 guaranteed to 1');

// -----------------------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
