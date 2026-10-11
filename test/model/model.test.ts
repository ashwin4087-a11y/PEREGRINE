/**
 * PEREGRINE — Model Layer Verification Suite
 * Tests configuration, S30 window simulation, S72 restoration timeline, and mesh BFS topology.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createDefaultFailures, 
  createEmptyInterventions, 
  computeMeshTopology,
  NetworkFailureState
} from '../../src/model/graph';
import { simulateS30 } from '../../src/model/simulateS30';
import { simulateS72 } from '../../src/model/simulateS72';

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

  console.log('\n--- Model Layer: S72 Power Outage Timeline & Hour-48 Recovery ---');
  const s72Cyclone = simulateS72(INITIAL_CONFIG, emptyInterventions, 0.5, cycloneFailures);
  const preRestorationFM = s72Cyclone.steps.slice(0, 48).every(s => !s.gridPowerUp && !s.fmOnAir);
  assert(preRestorationFM, 'Grid power and fixed FM are down during pre-restoration (h 0..47)');

  const postRestorationFM = s72Cyclone.steps.slice(48).every(s => s.gridPowerUp && s.fmOnAir);
  assert(postRestorationFM, 'Grid power returns at hour 48 and fixed FM comes on-air (h 48..71)');
  assert(s72Cyclone.overallReach > 0, 'S72 baseline reflects hour-48 power recovery (honest time-dependent reach)');

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
