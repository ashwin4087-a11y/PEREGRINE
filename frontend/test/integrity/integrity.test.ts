/**
 * PEREGRINE — Integrity Layer Verification Suite
 * Tests deterministic experiment reproducibility, seeds, hash digest, and checksums.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { NetworkFailureState } from '../../src/model/types';
import { generateReproducibleExperiment } from '../../src/integrity/experiment';

export function runIntegrityTests(
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

  console.log('\n--- Integrity Layer: Deterministic Experiment Reproducibility ---');
  const exp1 = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 42891);
  const exp2 = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 42891);
  assert(exp1.experimentId === exp2.experimentId, 'Identical inputs produce identical experiment ID');
  assert(exp1.checksum === exp2.checksum, 'Identical inputs produce identical checksum');
  assert(JSON.stringify(exp1) === JSON.stringify(exp2), 'Entire experiment records match deterministically');

  const expDifferentSeed = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, 99999);
  assert(exp1.experimentId !== expDifferentSeed.experimentId, 'Different seed produces distinct unique experiment ID');

  console.log('\n--- Integrity Layer: Deterministic Experiment Replays & Audit Slips ---');
  const seed = 88412;
  const replayA = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, seed);
  const replayB = generateReproducibleExperiment(INITIAL_CONFIG, cycloneFailures, 50, 0.35, seed);
  assert(replayA.experimentId === replayB.experimentId, 'Experiment ID is strictly deterministic');
  assert(replayA.checksum === replayB.checksum, 'Payload cryptographic checksum matches across replays');
  assert(replayA.checksum.startsWith('SHA256-SIM-'), 'Checksum contains SHA256-SIM prefix');
}
