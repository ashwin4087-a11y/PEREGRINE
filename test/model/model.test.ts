/**
 * PEREGRINE — Model Layer Verification Suite
 * Tests configuration, S30 window simulation, S72 restoration timeline, and mesh BFS topology.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createDefaultFailures, 
  createEmptyInterventions, 
  computeMeshTopology,
  isChannelAvailable,
  NetworkFailureState
} from '../../src/model/graph';
import { simulateS30 } from '../../src/model/simulateS30';
import { simulateS72 } from '../../src/model/simulateS72';
import { computeTimeDecay } from '../../src/metrics/resilience';
import { computeIndependentUnionReach } from '../../src/metrics/reach';

export function runModelTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Model Layer: Integrity & Multiplier Audit ---');
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

  console.log('\n--- Model Layer: S30 Baseline Scoring (Unified Path) ---');
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
  assert(s30Cyclone.cellOnlyResilience === 0, 'Cell-only resilience collapses to 0.00% under severed fibre');
  assertClose(s30Cyclone.resilienceScore, 54.0, 0.5, 'S30 Cyclone baseline reach with operational gateway');

  console.log('\n--- Model Layer: Gateway Loss Demonstration ---');
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

  console.log('\n--- Model Layer: Gateway Operational vs Failed & Redundant Gateway ---');
  const backupGatewayInterventions = {
    ...emptyInterventions,
    second_gateway: true
  };
  const topoBackupGateway = computeMeshTopology(INITIAL_CONFIG, gatewayLostFailures, backupGatewayInterventions);
  assert(
    topoBackupGateway.gatewayOperational && topoBackupGateway.nodes['marina'].connectedToGateway,
    'Redundant satellite gateway restores mesh feed when primary gateway fails'
  );
  assert(
    topoBackupGateway.nodes['uppalam'].connectedToGateway && topoBackupGateway.nodes['uppalam'].hopCount === 2,
    'Uppalam regains 2-hop mesh connectivity via redundant satellite gateway'
  );

  const bothGatewaysFailedFailures: NetworkFailureState = {
    ...gatewayLostFailures,
    gateway_backup: true
  };
  const topoBothGatewaysLost = computeMeshTopology(INITIAL_CONFIG, bothGatewaysFailedFailures, backupGatewayInterventions);
  assert(
    !topoBothGatewaysLost.gatewayOperational,
    'Mesh feed is down when both primary and redundant gateways fail'
  );

  console.log('\n--- Model Layer: Individual Tower and Power Failures ---');
  const towerAFailed = { ...healthyFailures, tower_A: true };
  const towerBFailed = { ...healthyFailures, tower_B: true };
  const kovalam = INITIAL_CONFIG.villages.find(v => v.id === 'kovalam')!;
  const karai = INITIAL_CONFIG.villages.find(v => v.id === 'karai')!;

  assert(!isChannelAvailable('cell', kovalam, towerAFailed, emptyInterventions, null, INITIAL_CONFIG), 'Tower A failure drops cell at Kovalam');
  assert(isChannelAvailable('cell', karai, towerAFailed, emptyInterventions, null, INITIAL_CONFIG), 'Tower A failure leaves Tower B village Karai operational');
  assert(!isChannelAvailable('cell', karai, towerBFailed, emptyInterventions, null, INITIAL_CONFIG), 'Tower B failure drops cell at Karai');
  assert(isChannelAvailable('cell', kovalam, towerBFailed, emptyInterventions, null, INITIAL_CONFIG), 'Tower B failure leaves Tower A village Kovalam operational');

  const westPowerFailed = { ...healthyFailures, power_west: true };
  assert(!isChannelAvailable('cell', kovalam, westPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'West power cut drops cell at Tower A villages');
  assert(isChannelAvailable('cell', karai, westPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'West power cut leaves Tower B village Karai operational');
  assert(isChannelAvailable('fm', kovalam, westPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'West power cut does not affect FM transmitter on eastern grid');

  const eastPowerFailed = { ...healthyFailures, power_east: true };
  assert(!isChannelAvailable('cell', karai, eastPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'East power cut drops cell at Tower B villages');
  assert(!isChannelAvailable('fm', kovalam, eastPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'East power cut drops fixed FM transmitter (common-cause failure)');
  assert(isChannelAvailable('cell', kovalam, eastPowerFailed, emptyInterventions, null, INITIAL_CONFIG), 'East power cut leaves Tower A village Kovalam operational');

  const backupGenActive = { ...emptyInterventions, backup_generation: true };
  assert(isChannelAvailable('cell', karai, eastPowerFailed, backupGenActive, null, INITIAL_CONFIG), 'Backup generation sustains Tower B cell under east power cut');
  assert(isChannelAvailable('fm', kovalam, eastPowerFailed, backupGenActive, null, INITIAL_CONFIG), 'Backup generation sustains FM transmitter under east power cut');

  const fmTxFailed = { ...healthyFailures, fm_tx: true };
  assert(!isChannelAvailable('fm', kovalam, fmTxFailed, emptyInterventions, null, INITIAL_CONFIG), 'FM transmitter failure drops FM for all villages');
  assert(isChannelAvailable('cell', kovalam, fmTxFailed, emptyInterventions, null, INITIAL_CONFIG), 'FM transmitter failure does not affect cell broadcast');

  const mobileUnitActive = { ...emptyInterventions, mobile_broadcast_unit: true };
  assert(isChannelAvailable('fm', kovalam, fmTxFailed, mobileUnitActive, null, INITIAL_CONFIG), 'Mobile broadcast unit restores FM reception when fixed FM transmitter fails');

  console.log('\n--- Model Layer: Fibre Failure and Correlated Channel Loss ---');
  const fibreFailed = { ...healthyFailures, fibre: true };
  const towerVillages = INITIAL_CONFIG.villages.filter(v => v.tower !== null);
  const allTowersLostCell = towerVillages.every(v => !isChannelAvailable('cell', v, fibreFailed, emptyInterventions, null, INITIAL_CONFIG));
  assert(allTowersLostCell, 'Fibre failure simultaneously drops cell broadcast across all 6 tower-covered villages (18,400 people)');
  assert(isChannelAvailable('fm', kovalam, fibreFailed, emptyInterventions, null, INITIAL_CONFIG), 'Fibre cut does not disrupt FM broadcast');
  assert(isChannelAvailable('mesh', INITIAL_CONFIG.villages.find(v => v.id === 'marina')!, fibreFailed, emptyInterventions, null, INITIAL_CONFIG), 'Fibre cut does not disrupt Shelter Mesh');

  console.log('\n--- Model Layer: S72 Power Outage Timeline & Hour-48 Recovery ---');
  const s72Cyclone = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  const preRestorationFM = s72Cyclone.steps.slice(0, 48).every(s => !s.gridPowerUp && !s.fmOnAir);
  assert(preRestorationFM, 'Grid power and fixed FM are down during pre-restoration (h 0..47)');

  const postRestorationFM = s72Cyclone.steps.slice(48).every(s => s.gridPowerUp && s.fmOnAir);
  assert(postRestorationFM, 'Grid power returns at hour 48 and fixed FM comes on-air (h 48..71)');
  assert(s72Cyclone.overallReach > 0, 'S72 baseline reflects hour-48 power recovery (honest time-dependent reach)');

  console.log('\n--- Model Layer: S72 All 4 Canonical Plans Hour-by-Hour Availability ---');
  // 1. No investment (grid returns h=48)
  const s72NoInvest = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5);
  const noInvestFMHours = s72NoInvest.steps.filter(s => s.fmOnAir).length;
  assert(noInvestFMHours === 24, 'No investment plan has exactly 24 on-air hours [48..71]');
  assert(s72NoInvest.silenceByVillage['kovalam'] === 48, 'No investment gives 48 hours silence for Kovalam');
  assert(s72NoInvest.silenceByVillage['thoni'] === 72, 'No investment gives 72 hours silence for unserved Thoni');

  // 2. Backup generators (gen [0..24], grid [48..71])
  const s72GenOnly = simulateS72(INITIAL_CONFIG, { ...emptyInterventions, backup_generation: true }, 0.5);
  const genOnlyFMHours = s72GenOnly.steps.filter(s => s.fmOnAir).length;
  assert(genOnlyFMHours === 49, 'Backup generator plan has exactly 49 on-air hours [0..24] U [48..71]');
  assert(s72GenOnly.silenceByVillage['kovalam'] === 23, 'Backup generator gives 23 hours silence for Kovalam');

  // 3. Mobile broadcast unit (mobile [24..71])
  const s72MobileOnly = simulateS72(INITIAL_CONFIG, { ...emptyInterventions, mobile_broadcast_unit: true }, 0.5);
  const mobileOnlyFMHours = s72MobileOnly.steps.filter(s => s.fmOnAir).length;
  assert(mobileOnlyFMHours === 48, 'Mobile broadcast unit plan has exactly 48 on-air hours [24..71]');
  assert(s72MobileOnly.silenceByVillage['kovalam'] === 24, 'Mobile broadcast unit gives 24 hours silence for Kovalam');

  // 4. Generator + Mobile broadcast unit ([0..71])
  const s72Both = simulateS72(INITIAL_CONFIG, { ...emptyInterventions, backup_generation: true, mobile_broadcast_unit: true }, 0.5);
  const bothFMHours = s72Both.steps.filter(s => s.fmOnAir).length;
  assert(bothFMHours === 72, 'Generator + mobile unit achieves complete 72-hour continuous on-air coverage');
  assert(s72Both.silenceByVillage['kovalam'] === 0, 'Generator + mobile unit eliminates silence completely for FM villages (0h)');
  assert(s72Both.silenceByVillage['thoni'] === 72, 'Unserved Thoni remains at 72 hours silence without localized interventions');

  // Community kits reduce Thoni and Hill Camp silence to 0
  const s72Kits = simulateS72(INITIAL_CONFIG, { ...emptyInterventions, community_kits: ['thoni', 'hillcamp'] }, 0.5);
  assert(s72Kits.silenceByVillage['thoni'] === 0, 'Community kit eliminates silence for Thoni (0h)');
  assert(s72Kits.silenceByVillage['hillcamp'] === 0, 'Community kit eliminates silence for Hill Camp (0h)');

  console.log('\n--- Model Layer: Permanent Power Failure Handling ---');
  const permanentPowerFailures: NetworkFailureState = {
    ...cycloneFailures,
    power_east_permanent: true
  };
  const s72Permanent = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, permanentPowerFailures);
  const allStepsDead = s72Permanent.steps.every(s => !s.gridPowerUp && !s.fmOnAir);
  assert(allStepsDead, 'Permanently failed power dependency never recovers at hour 48');
  assert(s72Permanent.overallReach === 0, 'Permanent power outage with no interventions yields 0.00% reach');

  console.log('\n--- Model Layer: Mesh Distance & Valid Hop Calculations ---');
  const topo = computeMeshTopology(INITIAL_CONFIG, healthyFailures, emptyInterventions);
  assert(topo.nodes['marina'].isGateway && topo.nodes['marina'].hopCount === 0, 'Marina hosts gateway (0 hops)');
  assert(topo.nodes['kovalam'].hopCount === 1, 'Kovalam is directly connected to Marina (1 hop)');
  assert(topo.nodes['pazhaya'].hopCount === 1, 'Pazhaya is directly connected to Marina (1 hop)');
  assert(topo.nodes['karai'].hopCount === 1, 'Karai is directly connected to Marina (1 hop)');
  assert(topo.nodes['uppalam'].hopCount === 2, 'Uppalam is 2 hops from Marina (via Karai)');
  assert(topo.nodes['sagar'].hopCount === 3, 'Sagar is 3 hops from Marina (via Karai -> Uppalam)');
  assert(!topo.nodes['thoni'].hasHardware && !topo.nodes['thoni'].connectedToGateway, 'Thoni has no mesh node');
  assert(!topo.nodes['hillcamp'].hasHardware && !topo.nodes['hillcamp'].connectedToGateway, 'Hill Camp has no mesh node');

  console.log('\n--- Model Layer: Mesh Relay Deployment to Disconnected Villages ---');
  const thoniRelayInterventions = {
    ...emptyInterventions,
    relay_nodes: ['thoni']
  };
  const topoThoniRelay = computeMeshTopology(INITIAL_CONFIG, healthyFailures, thoniRelayInterventions);
  assert(
    topoThoniRelay.nodes['thoni'].connectedToGateway && topoThoniRelay.nodes['thoni'].hopCount === 2,
    'Deploying relay node connects Thoni to gateway in 2 hops via Pazhaya'
  );
  assert(
    JSON.stringify(topoThoniRelay.nodes['thoni'].path) === JSON.stringify(['marina', 'pazhaya', 'thoni']),
    'Thoni shortest path traverses Marina -> Pazhaya -> Thoni'
  );

  console.log('\n--- Model Layer: Intermediate Relay Failure vs Leaf Node Failure ---');
  const karaiDownFailures: NetworkFailureState = {
    ...healthyFailures,
    mesh_nodes_down: ['karai']
  };
  const topoKaraiDown = computeMeshTopology(INITIAL_CONFIG, karaiDownFailures, emptyInterventions);
  assert(!topoKaraiDown.nodes['karai'].connectedToGateway, 'Failed intermediate node Karai is disconnected');
  assert(!topoKaraiDown.nodes['uppalam'].connectedToGateway, 'Uppalam loses gateway connection when relay Karai fails');
  assert(!topoKaraiDown.nodes['sagar'].connectedToGateway, 'Sagar loses gateway connection when relay Karai fails');
  assert(topoKaraiDown.nodes['kovalam'].connectedToGateway, 'Kovalam remains connected to gateway when Karai fails');
  assert(topoKaraiDown.nodes['pazhaya'].connectedToGateway, 'Pazhaya remains connected to gateway when Karai fails');

  const sagarDownFailures: NetworkFailureState = {
    ...healthyFailures,
    mesh_nodes_down: ['sagar']
  };
  const topoSagarDown = computeMeshTopology(INITIAL_CONFIG, sagarDownFailures, emptyInterventions);
  assert(!topoSagarDown.nodes['sagar'].connectedToGateway, 'Leaf node Sagar is disconnected when its mesh node fails');
  assert(topoSagarDown.nodes['uppalam'].connectedToGateway, 'Relay Uppalam remains connected when leaf Sagar fails');
  assert(topoSagarDown.nodes['karai'].connectedToGateway, 'Relay Karai remains connected when leaf Sagar fails');

  console.log('\n--- Model Layer: S30 Arrival-Window and Multi-Hop Arrival Timing ---');
  assertClose(s30Healthy.cellOnlyResilience, 78.07, 0.05, 'S30 healthy cell-only resilience matches reproduced 78.07%');
  const meshOnlyCyclone = simulateS30(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
  const marinaMetric = meshOnlyCyclone.villageMetrics.find(v => v.id === 'marina')!;
  const kovalamMetric = meshOnlyCyclone.villageMetrics.find(v => v.id === 'kovalam')!;
  const uppalamMetric = meshOnlyCyclone.villageMetrics.find(v => v.id === 'uppalam')!;
  const sagarMetric = meshOnlyCyclone.villageMetrics.find(v => v.id === 'sagar')!;

  assertClose(marinaMetric.arrivalMin, 0.3, 0.001, 'Marina 0-hop mesh arrival is 0.3 min');
  assertClose(kovalamMetric.arrivalMin, 0.8, 0.001, 'Kovalam 1-hop mesh arrival is 0.8 min (0.3 + 1*0.5)');
  assertClose(uppalamMetric.arrivalMin, 1.3, 0.001, 'Uppalam 2-hop mesh arrival is 1.3 min (0.3 + 2*0.5)');
  assertClose(sagarMetric.arrivalMin, 1.8, 0.001, 'Sagar 3-hop mesh arrival is 1.8 min (0.3 + 3*0.5)');

  const timeDecay20Min = computeTimeDecay(10, 30);
  assertClose(timeDecay20Min, 20 / 30, 0.0001, 'Time decay factor for 10 min arrival is exactly (30-10)/30');
  const unionReach = computeIndependentUnionReach([0.85, 0.60]);
  assertClose(unionReach, 0.94, 0.0001, 'Independent union reach of 85% cell and 60% mesh is 94.0%');

  console.log('\n--- Model Layer: Empty Interventions and Reset Scenarios ---');
  const baselineS30 = simulateS30(INITIAL_CONFIG, healthyFailures, emptyInterventions);
  const stressFailures: NetworkFailureState = {
    power_west: true,
    power_east: true,
    fibre: true,
    tower_A: true,
    tower_B: true,
    fm_tx: true,
    gateway: true,
    gateway_backup: true,
    mesh_nodes_down: ['karai', 'uppalam']
  };
  const stressInterventions = {
    backup_generation: true,
    mobile_broadcast_unit: true,
    second_gateway: true,
    relay_nodes: ['thoni'],
    siren_responders: ['hillcamp'],
    community_kits: ['kovalam']
  };
  const stressedResult = simulateS30(INITIAL_CONFIG, stressFailures, stressInterventions);
  assert(stressedResult.resilienceScore !== baselineS30.resilienceScore, 'Stressed simulation produces distinct altered resilience');

  const resetFailures = createDefaultFailures();
  const resetInterventions = createEmptyInterventions();
  const resetS30 = simulateS30(INITIAL_CONFIG, resetFailures, resetInterventions);
  assert(resetS30.resilienceScore === baselineS30.resilienceScore, 'Resetting failures and interventions restores baseline resilienceScore exactly');
  assert(resetS30.cellOnlyResilience === baselineS30.cellOnlyResilience, 'Resetting restores cellOnlyResilience exactly');
  assert(resetS30.totalReachedEst === baselineS30.totalReachedEst, 'Resetting restores totalReachedEst exactly');
  assert(resetS30.unreachedBeforeExpiry === baselineS30.unreachedBeforeExpiry, 'Resetting restores unreachedBeforeExpiry exactly');

  console.log('\n--- Model Layer: Deterministic Results for Identical Inputs ---');
  const run1S30 = simulateS30(INITIAL_CONFIG, cycloneFailures, emptyInterventions, 0.5);
  const run2S30 = simulateS30(INITIAL_CONFIG, cycloneFailures, emptyInterventions, 0.5);
  assert(JSON.stringify(run1S30) === JSON.stringify(run2S30), 'simulateS30 produces bit-for-bit identical outputs on successive runs');

  const run1S72 = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  const run2S72 = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  assert(JSON.stringify(run1S72) === JSON.stringify(run2S72), 'simulateS72 produces bit-for-bit identical outputs on successive runs');

  console.log('\n--- Model Layer: Centralised Assumptions in Configuration ---');
  assert(INITIAL_CONFIG.channels.siren.reachS30 === 0.80, 'S30 siren reach is centralised at 0.80');
  assert(INITIAL_CONFIG.channels.siren.reachS72 === 0.50, 'S72 siren reach is centralised at 0.50');
  assert(INITIAL_CONFIG.channels.relay.reachS72 === 0.40, 'Relay S72 reach is centralised at 0.40');
  assert(INITIAL_CONFIG.channels.communityKit.reachS72 === 0.70, 'Community kit reach is centralised at 0.70');
  assert(INITIAL_CONFIG.channels.communityKit.arrivalMin === 2.0, 'Community kit arrival time is 2.0 min');
  assert(INITIAL_CONFIG.channels.mesh.rangeUnits === 190, 'Mesh range is centralised at 190 units');

  console.log('\n--- Model Layer: Complete Mesh Topology & Distance Cutoffs ---');
  const vMap = new Map(INITIAL_CONFIG.villages.map(v => [v.id, v]));
  const dist = (id1: string, id2: string) => {
    const v1 = vMap.get(id1)!;
    const v2 = vMap.get(id2)!;
    return Math.hypot(v1.x - v2.x, v1.y - v2.y);
  };
  assert(dist('marina', 'kovalam') < 190, 'Marina to Kovalam distance is within 190 units');
  assert(dist('marina', 'pazhaya') < 190, 'Marina to Pazhaya distance is within 190 units');
  assert(dist('marina', 'karai') < 190, 'Marina to Karai distance is within 190 units');
  assert(dist('karai', 'uppalam') < 190, 'Karai to Uppalam distance is within 190 units');
  assert(dist('uppalam', 'sagar') < 190, 'Uppalam to Sagar distance is within 190 units');
  assert(dist('marina', 'uppalam') > 190, 'Marina to Uppalam exceeds 190 units (requires Karai relay)');
  assert(dist('marina', 'sagar') > 190, 'Marina to Sagar exceeds 190 units (requires multi-hop)');
  assert(dist('karai', 'sagar') > 190, 'Karai to Sagar exceeds 190 units (requires Uppalam relay)');
}

