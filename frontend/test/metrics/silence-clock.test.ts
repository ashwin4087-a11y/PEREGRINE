/**
 * PEREGRINE — Module 4 Silence Clock & Village-Level Outage Analysis Verification Suite
 * Tests 72-hour timeline boundaries, zero-silence, complete-silence, outage interval
 * boundaries, grid recovery, permanent power failure, interventions impact,
 * and traceable isolation explanations.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createDefaultFailures, 
  createEmptyInterventions,
  simulateS72,
  analyzeVillageSilenceTimeline,
  computeOutageIntervals,
  explainVillageIsolation
} from '../../src/model/graph';

export function runSilenceClockTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Module 4: Silence Clock & Village-Level Outage Analysis Verification ---');

  const defaultFailures = createDefaultFailures();
  const cycloneFailures = {
    ...defaultFailures,
    power_west: true,
    power_east: true,
    fibre: true
  };
  const emptyInterventions = createEmptyInterventions();

  // Test 1: S72 Simulation timeline contains exactly 72 hourly steps
  const s72Result = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  assert(s72Result.steps.length === 72, 'S72 simulation timeline contains exactly 72 hourly steps');
  assert(s72Result.villages.length === 8, 'S72 simulation covers all 8 documented settlements');

  // Test 2: Complete-silence case (Thoni in default cyclone)
  const thoniSteps = s72Result.steps;
  const thoniPath = thoniSteps.map(s => Boolean(s.villagePaths['thoni']));
  const thoniReach = thoniSteps.map(s => s.villageReach['thoni'] ?? 0);

  const thoniAnalysis = analyzeVillageSilenceTimeline('thoni', thoniPath, thoniReach);
  assert(thoniAnalysis.totalSilenceHours === 72, 'Complete-silence: Thoni has 72 total silence hours');
  assert(thoniAnalysis.continuousSilenceDuration === 72, 'Complete-silence: Thoni has 72 hours of continuous initial blackout');
  assert(thoniAnalysis.longestSilencePeriod === 72, 'Complete-silence: Thoni has longest silence period of 72 hours');
  assert(thoniAnalysis.outageIntervals.length === 1, 'Complete-silence: Thoni has exactly 1 contiguous outage interval');
  assert(
    thoniAnalysis.outageIntervals[0].startHour === 0 && thoniAnalysis.outageIntervals[0].endHour === 72,
    'Complete-silence: Thoni outage interval spans exactly [00:00 → 72:00]'
  );

  // Test 3: Standard 48-hour outage and recovery after grid return (Kovalam in cyclone)
  const kovalamPath = s72Result.steps.map(s => Boolean(s.villagePaths['kovalam']));
  const kovalamReach = s72Result.steps.map(s => s.villageReach['kovalam'] ?? 0);
  const kovalamAnalysis = analyzeVillageSilenceTimeline('kovalam', kovalamPath, kovalamReach);

  assert(kovalamAnalysis.totalSilenceHours === 48, 'Grid recovery: Kovalam experiences exactly 48 silence hours before grid return');
  assert(kovalamAnalysis.continuousSilenceDuration === 48, 'Grid recovery: Kovalam continuous initial blackout is 48 hours');
  assert(kovalamAnalysis.longestSilencePeriod === 48, 'Grid recovery: Kovalam longest silence period is 48 hours');
  assert(kovalamAnalysis.outageIntervals.length === 1, 'Grid recovery: Kovalam has 1 outage interval prior to grid return');
  assert(
    kovalamAnalysis.outageIntervals[0].startHour === 0 && kovalamAnalysis.outageIntervals[0].endHour === 48,
    'Grid recovery: Kovalam outage interval spans exactly [00:00 → 48:00]'
  );
  assert(
    kovalamAnalysis.hourlyStatus[47].status === 'SILENCE' && kovalamAnalysis.hourlyStatus[48].status !== 'SILENCE',
    'Grid recovery: Hour 47 is silent and Hour 48 recovers on-air'
  );

  // Test 4: Generator fuel exhaustion and split outage intervals
  // With generator, Kovalam is active h=0..24 (25h), fuel exhausts at h=25, grid returns at h=48
  const s72WithGen = simulateS72(
    INITIAL_CONFIG, 
    { ...emptyInterventions, backup_generation: true }, 
    0.5, 
    cycloneFailures
  );
  const kovalamGenPath = s72WithGen.steps.map(s => Boolean(s.villagePaths['kovalam']));
  const kovalamGenReach = s72WithGen.steps.map(s => s.villageReach['kovalam'] ?? 0);
  const kovalamGenAnalysis = analyzeVillageSilenceTimeline('kovalam', kovalamGenPath, kovalamGenReach);

  assert(kovalamGenAnalysis.continuousSilenceDuration === 0, 'Generator active at landfall: Continuous initial silence is 0h');
  assert(kovalamGenAnalysis.totalSilenceHours === 23, 'Generator active: Total silence drops from 48h to 23h (fuel exhaustion)');
  assert(kovalamGenAnalysis.longestSilencePeriod === 23, 'Generator active: Longest silence period is 23h');
  assert(kovalamGenAnalysis.outageIntervals.length === 1, 'Generator active: Exactly 1 outage interval from fuel exhaustion to grid return');
  assert(
    kovalamGenAnalysis.outageIntervals[0].startHour === 25 && kovalamGenAnalysis.outageIntervals[0].endHour === 48,
    'Generator active: Outage interval spans fuel-exhaustion window [25:00 → 48:00]'
  );

  // Test 5: Zero-silence case (Generator + Mobile FM Unit combined for Kovalam)
  const s72ZeroSilence = simulateS72(
    INITIAL_CONFIG,
    { ...emptyInterventions, backup_generation: true, mobile_broadcast_unit: true },
    0.5,
    cycloneFailures
  );
  const zeroKovalamPath = s72ZeroSilence.steps.map(s => Boolean(s.villagePaths['kovalam']));
  const zeroKovalamReach = s72ZeroSilence.steps.map(s => s.villageReach['kovalam'] ?? 0);
  const zeroAnalysis = analyzeVillageSilenceTimeline('kovalam', zeroKovalamPath, zeroKovalamReach);

  assert(zeroAnalysis.totalSilenceHours === 0, 'Zero-silence: Kovalam total silence is 0 hours');
  assert(zeroAnalysis.continuousSilenceDuration === 0, 'Zero-silence: Kovalam continuous silence is 0 hours');
  assert(zeroAnalysis.longestSilencePeriod === 0, 'Zero-silence: Kovalam longest silence period is 0 hours');
  assert(zeroAnalysis.outageIntervals.length === 0, 'Zero-silence: Kovalam has 0 outage intervals');

  // Test 6: Persistent outage with permanent power failure
  const permanentFailures = {
    ...cycloneFailures,
    power_east_permanent: true
  };
  const s72Permanent = simulateS72(
    INITIAL_CONFIG,
    emptyInterventions,
    0.5,
    permanentFailures
  );
  const permKovalamPath = s72Permanent.steps.map(s => Boolean(s.villagePaths['kovalam']));
  const permKovalamReach = s72Permanent.steps.map(s => s.villageReach['kovalam'] ?? 0);
  const permAnalysis = analyzeVillageSilenceTimeline('kovalam', permKovalamPath, permKovalamReach);

  assert(permAnalysis.totalSilenceHours === 72, 'Permanent power loss: Kovalam silence extends to all 72 hours');
  assert(
    permAnalysis.outageIntervals[0].startHour === 0 && permAnalysis.outageIntervals[0].endHour === 72,
    'Permanent power loss: Outage interval does not recover at hour 48 [00:00 → 72:00]'
  );

  // Test 7: Interventions enabled vs disabled for isolated hamlet (Thoni)
  const s72ThoniWithKit = simulateS72(
    INITIAL_CONFIG,
    { ...emptyInterventions, community_kits: ['thoni'] },
    0.5,
    cycloneFailures
  );
  const thoniKitSummary = s72ThoniWithKit.villages.find(v => v.id === 'thoni');
  assert(thoniKitSummary?.silenceHours === 0, 'Deploying community kit to Thoni eliminates all 72 silence hours (0h silence)');

  const s72ThoniWithSiren = simulateS72(
    INITIAL_CONFIG,
    { ...emptyInterventions, siren_responders: ['thoni'] },
    0.5,
    cycloneFailures
  );
  const thoniSirenSummary = s72ThoniWithSiren.villages.find(v => v.id === 'thoni');
  assert(thoniSirenSummary?.silenceHours === 0, 'Deploying siren responder to Thoni eliminates all 72 silence hours (0h silence)');

  // Test 8: Traceable Village Isolation Explanation
  const thoniVillage = INITIAL_CONFIG.villages.find(v => v.id === 'thoni')!;
  const thoniIsolation = explainVillageIsolation(
    thoniVillage,
    cycloneFailures,
    emptyInterventions,
    72
  );
  assert(thoniIsolation.tier === 'TIER_2_ISOLATED', 'Thoni is classified as TIER_2_ISOLATED');
  assert(thoniIsolation.isCompletelySilent === true, 'Thoni is marked as isCompletelySilent');
  assert(
    thoniIsolation.underlyingDependencies.some(d => d.includes('Zero Cellular Coverage')),
    'Thoni isolation explains zero cellular coverage'
  );
  assert(
    thoniIsolation.underlyingDependencies.some(d => d.includes('Outside FM Broadcast Contour')),
    'Thoni isolation explains outside FM broadcast contour'
  );
  assert(
    thoniIsolation.supportedInterventions.some(i => i.type === 'community_kit' && i.applicableToVillage),
    'Thoni lists Community Satellite Receiver Kit as applicable intervention'
  );

  const kovalamVillage = INITIAL_CONFIG.villages.find(v => v.id === 'kovalam')!;
  const kovalamIsolation = explainVillageIsolation(
    kovalamVillage,
    cycloneFailures,
    emptyInterventions,
    48
  );
  assert(kovalamIsolation.tier === 'TIER_1_INFRASTRUCTURE', 'Kovalam is classified as TIER_1_INFRASTRUCTURE');
  assert(
    kovalamIsolation.underlyingDependencies.some(d => d.includes('East Power Grid Common-Cause Dependency')),
    'Kovalam isolation explains East Power substation common-cause dependency'
  );
  assert(
    kovalamIsolation.supportedInterventions.some(i => i.type === 'backup_generation' && i.applicableToVillage),
    'Kovalam lists Substation Backup Generator as applicable intervention'
  );

  // Test 9: computeOutageIntervals helper handles multiple intermittent intervals
  const intermittentPattern = [
    false, false, // 0..2 silent (2h)
    true, true,   // 2..4 active
    false, false, false, // 4..7 silent (3h)
    true // 7..8 active
  ];
  const testIntervals = computeOutageIntervals(intermittentPattern);
  assert(testIntervals.length === 2, 'computeOutageIntervals identifies 2 discrete intervals');
  assert(testIntervals[0].startHour === 0 && testIntervals[0].endHour === 2 && testIntervals[0].durationHours === 2, 'First interval is [0..2] with 2h duration');
  assert(testIntervals[1].startHour === 4 && testIntervals[1].endHour === 7 && testIntervals[1].durationHours === 3, 'Second interval is [4..7] with 3h duration');
}
