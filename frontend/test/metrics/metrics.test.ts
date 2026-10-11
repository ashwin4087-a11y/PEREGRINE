/**
 * PEREGRINE — Metrics Layer Verification Suite
 * Tests Redundancy Illusion, S72 dynamic derivation, and mathematical score limits.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createEmptyInterventions, 
  NetworkFailureState 
} from '../../src/model/graph';
import { calculateRedundancyIllusion } from '../../src/metrics/redundancy';
import { simulateS72 } from '../../src/model/simulateS72';
import { simulateS30 } from '../../src/model/simulateS30';

export function runMetricsTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Metrics Layer: S72 Summary Metrics Dynamically Derived from Graph ---');
  const cycloneFailures: NetworkFailureState = {
    power_west: true,
    power_east: true,
    fibre: true,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false
  };
  const emptyInterventions = createEmptyInterventions();
  const s72Cyclone = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  const illusion = calculateRedundancyIllusion(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
  const marinaStatus = illusion.find(s => s.villageId === 'marina')!;
  const thoniStatus = illusion.find(s => s.villageId === 'thoni')!;

  assert(marinaStatus.availableCount === 1, 'Marina has 1 available channel (mesh via gateway) under cyclone');
  assert(marinaStatus.n1Guaranteed === 0, 'Marina N-1 guaranteed is 0 under single-point cut');
  assert(thoniStatus.availableCount === 0, 'Thoni has 0 available channels under cyclone');

  const s72SummaryMarina = s72Cyclone.villages.find(v => v.id === 'marina')!;
  assert(
    s72SummaryMarina.availableChannelsNow === marinaStatus.availableCount,
    'S72 summary availableChannelsNow matches graph illusion status'
  );
  assert(
    s72SummaryMarina.n1Guaranteed === marinaStatus.n1Guaranteed,
    'S72 summary n1Guaranteed matches graph illusion status'
  );

  console.log('\n--- Metrics Layer: S30 Baseline Mathematical Derivation (53.95% vs 54.26%) ---');
  const naiveSum = (5200 * 0.6 * (29.7 / 30)) + ((4200 + 1800 + 2600 + 3100 + 1500) * 0.6 * (29.2 / 30));
  const naiveReach = (naiveSum / 19900) * 100;
  assertClose(naiveReach, 54.26, 0.01, 'Naive 1-hop mesh model produces 54.26%');

  const s30Cyclone = simulateS30(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
  const actualS30Baseline = s30Cyclone.resilienceScore;
  assertClose(actualS30Baseline, 53.95, 0.05, 'Authoritative multi-hop BFS model produces 53.95%');
  assertClose(actualS30Baseline, 54.0, 0.1, 'Authoritative S30 baseline rounds honestly to 54.0%');
}
