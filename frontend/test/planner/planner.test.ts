/**
 * PEREGRINE — Planner Layer Verification Suite
 * Tests greedy optimization, fairness floors, budget ceilings, and all 12 matrix combinations.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createEmptyInterventions, 
  NetworkFailureState 
} from '../../src/model/graph';
import { simulateS30 } from '../../src/model/simulateS30';
import { 
  runPlanner, 
  compareRecoveryStrategies, 
  calculatePriceOfFairnessFrontier 
} from '../../src/planner/engine';

export function runPlannerTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  const cycloneFailures: NetworkFailureState = {
    power_west: true,
    power_east: true,
    fibre: true,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false
  };

  console.log('\n--- Planner Layer: S72 Budget-50 Planner Comparison ---');
  const comparison50 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 'S72', 0.5);
  assertClose(comparison50.planReach.overallReachAfter, 31.8, 0.5, 'Reach maximiser achieves ~31.8% overall reach');
  assert(comparison50.planReach.minVillageReachAfter.value === 0, 'Reach maximiser leaves Thoni & Hill Camp at 0%');
  assertClose(comparison50.planFairness.overallReachAfter, 25.0, 0.5, 'Fairness-constrained plan achieves ~25.0% overall reach');
  assertClose(comparison50.planFairness.minVillageReachAfter.value, 22.9, 0.5, 'Fairness-constrained plan raises lowest village to ~22.9%');
  assert(
    comparison50.disadvantaged,
    'Planner confirms that aggregate-maximizing plan disadvantages smaller villages'
  );

  console.log('\n--- Planner Layer: Infeasible Fairness Floor Detection ---');
  assert(
    !comparison50.planFairness.floorMet,
    'Planner honestly reports that 35% fairness floor is NOT met at budget 50 (floorMet = false)'
  );
  assert(
    comparison50.planFairness.villagesBelowFloor.length > 0,
    'Planner records specific villages below floor with honest shortfalls'
  );

  console.log('\n--- Planner Layer: Budgets 80 & 100 Convergence ---');
  const comparison80 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 80, 0.35, 'S72', 0.5);
  const comparison100 = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, 100, 0.35, 'S72', 0.5);

  assertClose(comparison80.planFairness.minVillageReachAfter.value, 34.4, 0.5, 'At budget 80, lowest village is at ~34.4%');
  assertClose(comparison100.planFairness.minVillageReachAfter.value, 34.4, 0.5, 'At budget 100, lowest village is still at ~34.4% (35% floor missed)');
  assert(
    !comparison100.planFairness.floorMet,
    'At budget 100, 35% floor is still honestly reported as missed (34.4% < 35.0%)'
  );

  console.log('\n--- Planner Layer: S30 Planned Recovery (Fresh Simulation Verification) ---');
  const s30Plan = runPlanner(INITIAL_CONFIG, cycloneFailures, 50, 'REACH_MAX', 0.35, 'S30', 0.5);
  assert(
    s30Plan.chosenInterventions.some(c => c.id === 'backup_generation') &&
    s30Plan.chosenInterventions.some(c => c.id === 'siren_thoni') &&
    s30Plan.chosenInterventions.some(c => c.id === 'siren_hillcamp'),
    'S30 planner at budget 50 selects backup generation and sirens for Thoni and Hill Camp'
  );
  assert(s30Plan.totalCost === 40, 'Total cost for backup generator (20) + 2 sirens (20) is 40 <= 50 units');

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

  console.log('\n--- Planner Layer: All 12 S72 Planner Combinations Verification ---');
  const testBudgets = [20, 50, 80, 100];
  const testAutoTunes = [0.0, 0.5, 1.0];
  let combinationsTested = 0;

  for (const budget of testBudgets) {
    for (const autoTune of testAutoTunes) {
      const comp = compareRecoveryStrategies(INITIAL_CONFIG, cycloneFailures, budget, 0.35, 'S72', autoTune);
      
      assert(comp.planReach.totalCost <= budget, `Combination B=${budget} A=${autoTune} ReachMax respects budget constraint`);
      assert(comp.planFairness.totalCost <= budget, `Combination B=${budget} A=${autoTune} Fairness respects budget constraint`);
      
      assert(
        comp.planReach.overallReachAfter >= comp.planReach.overallReachBefore - 0.01,
        `Combination B=${budget} A=${autoTune} ReachMax achieves non-negative reach improvement`
      );
      assert(
        comp.planFairness.overallReachAfter >= comp.planFairness.overallReachBefore - 0.01,
        `Combination B=${budget} A=${autoTune} Fairness achieves non-negative reach improvement`
      );

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

  console.log('\n--- Planner Layer: Price-of-Fairness Frontier Verification ---');
  const frontierSummary1 = calculatePriceOfFairnessFrontier(INITIAL_CONFIG, cycloneFailures, 50, 'S72', 0.5);
  const frontierSummary2 = calculatePriceOfFairnessFrontier(INITIAL_CONFIG, cycloneFailures, 50, 'S72', 0.5);

  // 1. Budget ceiling respected at every sweep point
  const allPointsWithinBudget = frontierSummary1.frontier.every(p => p.totalCost <= 50);
  assert(allPointsWithinBudget, 'Price-of-fairness sweep strictly respects budget limit at every point');

  // 2. Monotonic non-increasing overall reach as fairness floor rises
  let isMonotonic = true;
  for (let i = 1; i < frontierSummary1.frontier.length; i++) {
    if (frontierSummary1.frontier[i].overallReach > frontierSummary1.frontier[i - 1].overallReach + 0.001) {
      isMonotonic = false;
      break;
    }
  }
  assert(isMonotonic, 'Overall reach is monotonic non-increasing as the fairness floor rises');

  // 3. Determinism across repeated runs
  const isDeterministic = JSON.stringify(frontierSummary1.frontier) === JSON.stringify(frontierSummary2.frontier);
  assert(isDeterministic, 'Price-of-fairness frontier calculation is strictly deterministic');

  // 4. Best achievable min village reach at budget 50
  assertClose(
    frontierSummary1.bestAchievableMinVillageReach,
    22.9,
    0.5,
    'Best achievable min village reach at budget 50 matches authoritative 22.9%'
  );
}
