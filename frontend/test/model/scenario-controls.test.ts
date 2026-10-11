/**
 * PEREGRINE — Module 3 Scenario Controls & State Transitions Verification Suite
 * Tests presets, individual failure toggles, active failures enumeration,
 * status labels, scenario summaries, and reactive simulation metrics.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createDefaultFailures, 
  createEmptyInterventions,
  applyHealthyPreset,
  applyCyclonePreset,
  applyGatewayLostPreset,
  toggleFailureNode,
  getActiveFailuresList,
  getScenarioSummary,
  simulateS30,
  simulateS72
} from '../../src/model/graph';

export function runScenarioControlsTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Module 3: Scenario Controls & Disaster Presets Verification ---');

  // Test 1: Healthy Preset clears all failures
  const healthy = applyHealthyPreset();
  assert(
    !healthy.power_west && 
    !healthy.power_east && 
    !healthy.fibre && 
    !healthy.tower_A && 
    !healthy.tower_B && 
    !healthy.fm_tx && 
    !healthy.gateway &&
    !healthy.gateway_backup &&
    !healthy.power_east_permanent &&
    (!healthy.mesh_nodes_down || healthy.mesh_nodes_down.length === 0),
    'Healthy preset clears all failure flags to false without omitting supported flags'
  );

  // Test 2: Cyclone Preset sets documented compound failures
  const cyclone = applyCyclonePreset();
  assert(
    cyclone.power_west === true &&
    cyclone.power_east === true &&
    cyclone.fibre === true &&
    cyclone.gateway === false &&
    cyclone.tower_A === false &&
    cyclone.tower_B === false &&
    cyclone.fm_tx === false,
    'Cyclone preset sets documented compound failures: power_west, power_east, fibre'
  );

  // Test 3: Gateway Loss Preset sets cyclone + gateway
  const gwLost = applyGatewayLostPreset();
  assert(
    gwLost.power_west === true &&
    gwLost.power_east === true &&
    gwLost.fibre === true &&
    gwLost.gateway === true,
    'Gateway Loss preset sets compound outage with primary gateway severed'
  );

  // Test 4: Individual failure toggles flip intended state without mutating others
  const defaultState = createDefaultFailures();
  
  const toggledWest = toggleFailureNode(defaultState, 'power_west');
  assert(
    toggledWest.power_west === true && 
    toggledWest.power_east === false && 
    toggledWest.fibre === false &&
    toggledWest.tower_A === false,
    'Toggling power_west flips only power_west'
  );

  const toggledEast = toggleFailureNode(toggledWest, 'power_east');
  assert(
    toggledEast.power_west === true && 
    toggledEast.power_east === true && 
    toggledEast.fibre === false,
    'Toggling power_east preserves existing power_west failure'
  );

  const toggledFibre = toggleFailureNode(toggledEast, 'fibre');
  assert(toggledFibre.fibre === true, 'Toggling fibre sets fibre cut');

  const toggledTowerA = toggleFailureNode(defaultState, 'tower_A');
  assert(toggledTowerA.tower_A === true && !toggledTowerA.tower_B, 'Toggling tower_A flips only tower_A');

  const toggledTowerB = toggleFailureNode(defaultState, 'tower_B');
  assert(toggledTowerB.tower_B === true && !toggledTowerB.tower_A, 'Toggling tower_B flips only tower_B');

  const toggledFm = toggleFailureNode(defaultState, 'fm_tx');
  assert(toggledFm.fm_tx === true, 'Toggling fm_tx flips only fm_tx');

  const toggledGw = toggleFailureNode(defaultState, 'gateway');
  assert(toggledGw.gateway === true, 'Toggling gateway flips only gateway');

  // Re-toggle back returns to false
  const untoggledWest = toggleFailureNode(toggledWest, 'power_west');
  assert(untoggledWest.power_west === false, 'Toggling back restores component to operational state');

  // Test 5: Active failures list enumerates active failures with categories and impact
  const emptyInterventions = createEmptyInterventions();
  const healthyList = getActiveFailuresList(healthy, emptyInterventions);
  assert(healthyList.length === 0, 'Healthy network has 0 active failures in enumeration');

  const cycloneList = getActiveFailuresList(cyclone, emptyInterventions);
  assert(cycloneList.length === 3, 'Cyclone preset produces exactly 3 active failure items');
  assert(
    cycloneList.some(item => item.key === 'power_west' && item.category === 'POWER'),
    'Active failures list contains West Grid categorized as POWER'
  );
  assert(
    cycloneList.some(item => item.key === 'power_east' && item.category === 'POWER'),
    'Active failures list contains East Grid categorized as POWER'
  );
  assert(
    cycloneList.some(item => item.key === 'fibre' && item.category === 'BACKBONE'),
    'Active failures list contains Core Fibre categorized as BACKBONE'
  );

  // Test 6: Component status labels: OPERATIONAL, DEGRADED, UNAVAILABLE
  // Without mitigations: East power cut is UNAVAILABLE
  const unmitigatedEast = cycloneList.find(i => i.key === 'power_east');
  assert(unmitigatedEast?.status === 'UNAVAILABLE', 'Unmitigated East Grid failure has status UNAVAILABLE');

  // With backup generation mitigation: East power cut is DEGRADED
  const mitigatedInterventions = { ...emptyInterventions, backup_generation: true };
  const mitigatedList = getActiveFailuresList(cyclone, mitigatedInterventions);
  const mitigatedEast = mitigatedList.find(i => i.key === 'power_east');
  assert(mitigatedEast?.status === 'DEGRADED', 'Mitigated East Grid failure with backup generator has status DEGRADED');

  // Gateway status label: UNAVAILABLE without 2nd gateway, DEGRADED with 2nd gateway
  const unmitigatedGwList = getActiveFailuresList(gwLost, emptyInterventions);
  const unmitigatedGw = unmitigatedGwList.find(i => i.key === 'gateway');
  assert(unmitigatedGw?.status === 'UNAVAILABLE', 'Unmitigated Marina Gateway loss has status UNAVAILABLE');

  const mitigatedGwInterventions = { ...emptyInterventions, second_gateway: true };
  const mitigatedGwList = getActiveFailuresList(gwLost, mitigatedGwInterventions);
  const mitigatedGw = mitigatedGwList.find(i => i.key === 'gateway');
  assert(mitigatedGw?.status === 'DEGRADED', 'Mitigated Marina Gateway loss with 2nd Gateway has status DEGRADED');

  // FM status label: UNAVAILABLE without mobile unit, DEGRADED with mobile unit
  const fmDown = { ...defaultState, fm_tx: true };
  const fmUnmitigated = getActiveFailuresList(fmDown, emptyInterventions);
  assert(fmUnmitigated.find(i => i.key === 'fm_tx')?.status === 'UNAVAILABLE', 'Fixed FM transmitter down without mobile unit is UNAVAILABLE');

  const fmMitigated = getActiveFailuresList(fmDown, { ...emptyInterventions, mobile_broadcast_unit: true });
  assert(fmMitigated.find(i => i.key === 'fm_tx')?.status === 'DEGRADED', 'Fixed FM transmitter down with mobile unit is DEGRADED');

  // Test 7: Scenario Summary derivation
  const healthySummary = getScenarioSummary(healthy, emptyInterventions);
  assert(healthySummary.scenarioName === 'Healthy Baseline', 'Healthy scenario name is Healthy Baseline');
  assert(healthySummary.status === 'OPERATIONAL', 'Healthy scenario status is OPERATIONAL');
  assert(healthySummary.activeFailureCount === 0, 'Healthy scenario active failure count is 0');
  assert(healthySummary.causes.length === 0, 'Healthy scenario has 0 causes');

  const cycloneSummary = getScenarioSummary(cyclone, emptyInterventions);
  assert(cycloneSummary.scenarioName === 'Cyclone Landfall', 'Cyclone scenario name is Cyclone Landfall');
  assert(cycloneSummary.status === 'DEGRADED', 'Cyclone scenario status is DEGRADED');
  assert(cycloneSummary.activeFailureCount === 3, 'Cyclone scenario active failure count is 3');
  assert(cycloneSummary.causes.length === 3, 'Cyclone scenario documents all 3 root causes');

  const gwLostSummary = getScenarioSummary(gwLost, emptyInterventions);
  assert(gwLostSummary.scenarioName === 'Gateway Loss', 'Gateway loss scenario name is Gateway Loss');
  assert(gwLostSummary.status === 'CRITICAL', 'Unmitigated gateway loss status is CRITICAL');
  assert(
    gwLostSummary.causes.some(c => c.includes('Marina Gateway lost')),
    'Gateway loss summary documents Marina Gateway root cause'
  );

  // Test 8: Live simulation metrics change across failure transitions
  const s30Healthy = simulateS30(INITIAL_CONFIG, healthy, emptyInterventions);
  const s30Cyclone = simulateS30(INITIAL_CONFIG, cyclone, emptyInterventions);
  const s30GwLost = simulateS30(INITIAL_CONFIG, gwLost, emptyInterventions);

  assert(s30Healthy.resilienceScore > s30Cyclone.resilienceScore, 'S30 resilience score drops from Healthy to Cyclone');
  assertClose(s30Cyclone.resilienceScore, 54.0, 0.1, 'S30 resilience under Cyclone is 54.0%');
  assertClose(s30GwLost.resilienceScore, 0.0, 0.01, 'S30 resilience under Gateway Loss collapses to 0.0%');

  // S72 baseline: Thoni and Hill Camp have no FM, so 1,500 residents suffer 72h total silence
  const s72Baseline = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cyclone);
  const silentPopBaseline = s72Baseline.villages.filter(v => v.silenceHours === 72).reduce((s, v) => s + v.pop, 0);
  assert(silentPopBaseline === 1500, 'Baseline cyclone outage has 1,500 residents (Thoni + Hill Camp) in 72h total silence');

  // When FM transmitter is faulted, all 8 communities experience total blackout
  const fmDownFailures = { ...cyclone, fm_tx: true };
  const s72FmDown = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, fmDownFailures);
  const silentPopFmDown = s72FmDown.villages.filter(v => v.silenceHours === 72).reduce((s, v) => s + v.pop, 0);
  assert(silentPopFmDown === 19900, 'Faulting FM transmitter plunges all 19,900 residents into 72h total silence');
  assert(s72FmDown.overallReach === 0, 'Faulting FM transmitter drops S72 overall reach to 0.0%');

  // When mobile broadcast unit is deployed, reach recovers
  const s72MobileUnit = simulateS72(INITIAL_CONFIG, { ...emptyInterventions, mobile_broadcast_unit: true }, 0.5, fmDownFailures);
  assert(s72MobileUnit.overallReach > 0, 'Deploying Mobile Broadcast Unit restores S72 reach from complete blackout');

  // When community kits are deployed to Thoni & Hill Camp, their 72h silence is eliminated
  const s72Kits = simulateS72(
    INITIAL_CONFIG, 
    { ...emptyInterventions, community_kits: ['thoni', 'hillcamp'] }, 
    0.5, 
    cyclone
  );
  const silentPopWithKits = s72Kits.villages.filter(v => v.silenceHours === 72).reduce((s, v) => s + v.pop, 0);
  assert(silentPopWithKits === 0, 'Deploying community kits to Thoni and Hill Camp eliminates 72h total silence (0 silent pop)');

  // Gateway redundancy mitigates gateway loss
  const s30GwLostMitigated = simulateS30(
    INITIAL_CONFIG, 
    gwLost, 
    { ...emptyInterventions, second_gateway: true }
  );
  assertClose(s30GwLostMitigated.resilienceScore, 54.0, 0.1, 'Deploying 2nd Gateway restores S30 reach back to 54.0% under gateway cut');

  // Test 9: Reset clears failures and interventions
  const resetFailures = createDefaultFailures();
  const resetInterventions = createEmptyInterventions();
  assert(
    Object.values(resetFailures).every(val => typeof val === 'boolean' ? val === false : val.length === 0),
    'Reset clears all failure flags to false'
  );
  assert(
    !resetInterventions.backup_generation &&
    !resetInterventions.mobile_broadcast_unit &&
    !resetInterventions.second_gateway &&
    resetInterventions.relay_nodes.length === 0 &&
    resetInterventions.siren_responders.length === 0 &&
    resetInterventions.community_kits.length === 0,
    'Reset clears all intervention flags and deployments'
  );
}
