/**
 * PEREGRINE — Redundancy Illusion Verification Suite (Module 5)
 * Verifies mathematical correctness of N-1 guaranteed channels, common-cause failure
 * detection, upstream dependency tracing, gateway failover, and scenario transitions.
 */

import { INITIAL_CONFIG } from '../../src/model/config';
import { 
  createEmptyInterventions, 
  createDefaultFailures,
  NetworkFailureState, 
  ActiveInterventions 
} from '../../src/model/graph';
import { 
  calculateRedundancyIllusion, 
  analyzeRedundancyIllusion, 
  compareScenariosRedundancy,
  explainNodeCascade,
  getChannelUpstreamNodes
} from '../../src/metrics/redundancy';

export function runRedundancyIllusionTests(
  assert: (cond: boolean, name: string, detail?: string) => void,
  _assertClose: (act: number, exp: number, tol: number, name: string) => void
) {
  console.log('\n--- Module 5: Redundancy Illusion & Dependency Analysis Verification ---');

  const emptyInterventions = createEmptyInterventions();
  const healthyFailures = createDefaultFailures();

  // Test 1: Independent versus shared dependencies in Healthy baseline
  const healthyStatus = calculateRedundancyIllusion(INITIAL_CONFIG, healthyFailures, emptyInterventions);
  const marina = healthyStatus.find(s => s.villageId === 'marina')!;
  const karai = healthyStatus.find(s => s.villageId === 'karai')!;
  const uppalam = healthyStatus.find(s => s.villageId === 'uppalam')!;
  const sagar = healthyStatus.find(s => s.villageId === 'sagar')!;
  const kovalam = healthyStatus.find(s => s.villageId === 'kovalam')!;
  const pazhaya = healthyStatus.find(s => s.villageId === 'pazhaya')!;

  assert(marina.nominalCount === 3, 'Marina has 3 nominal channels (Cell, FM, Mesh)');
  assert(marina.availableCount === 3, 'Marina has 3 available channels in healthy baseline');
  assert(marina.n1Guaranteed === 2, 'Marina N-1 guaranteed is 2 (independent failure cut-sets)');
  assert(marina.commonCauseNodes.length === 0, 'Marina has 0 common-cause nodes in healthy baseline');

  assert(kovalam.n1Guaranteed === 2, 'Kovalam (Tower A) has N-1 guaranteed of 2 in healthy baseline');
  assert(pazhaya.n1Guaranteed === 2, 'Pazhaya (Tower A) has N-1 guaranteed of 2 in healthy baseline');

  // Tower B settlements: Cell and FM both rely on East Power Substation
  assert(karai.nominalCount === 3, 'Karai has 3 nominal channels (Cell, FM, Mesh)');
  assert(karai.availableCount === 3, 'Karai has 3 available channels in healthy baseline');
  assert(karai.n1Guaranteed === 1, 'Karai N-1 guaranteed is 1 (drops to 1 on East Power cut)');
  assert(karai.commonCauseNodes.includes('power_east'), 'Karai identifies power_east as a Common-Cause node');

  assert(uppalam.n1Guaranteed === 1, 'Uppalam N-1 guaranteed is 1');
  assert(uppalam.commonCauseNodes.includes('power_east'), 'Uppalam identifies power_east as Common-Cause node');

  assert(sagar.n1Guaranteed === 1, 'Sagar N-1 guaranteed is 1');
  assert(sagar.commonCauseNodes.includes('power_east'), 'Sagar identifies power_east as Common-Cause node');

  // Test 2: Upstream dependency tracing
  const karaiVillage = INITIAL_CONFIG.villages.find(v => v.id === 'karai')!;
  const cellUpstream = getChannelUpstreamNodes('cell', karaiVillage, emptyInterventions);
  const fmUpstream = getChannelUpstreamNodes('fm', karaiVillage, emptyInterventions);
  const meshUpstream = getChannelUpstreamNodes('mesh', karaiVillage, emptyInterventions);

  assert(cellUpstream.includes('power_east'), 'Karai Cell depends on power_east');
  assert(cellUpstream.includes('tower_B'), 'Karai Cell depends on tower_B');
  assert(cellUpstream.includes('fibre'), 'Karai Cell depends on fibre');
  assert(fmUpstream.includes('power_east'), 'Karai FM depends on power_east');
  assert(fmUpstream.includes('fm_tx'), 'Karai FM depends on fm_tx');
  assert(meshUpstream.includes('gateway'), 'Karai Mesh depends on gateway');

  // Test 3: Shared power failure impact
  const eastPowerCut: NetworkFailureState = {
    ...healthyFailures,
    power_east: true
  };
  const eastCutStatus = calculateRedundancyIllusion(INITIAL_CONFIG, eastPowerCut, emptyInterventions);
  const karaiEastCut = eastCutStatus.find(s => s.villageId === 'karai')!;
  const marinaEastCut = eastCutStatus.find(s => s.villageId === 'marina')!;

  assert(karaiEastCut.cell === false, 'Karai Cell drops on East Power failure');
  assert(karaiEastCut.fm === false, 'Karai FM drops on East Power failure');
  assert(karaiEastCut.mesh === true, 'Karai Mesh survives East Power failure');
  assert(karaiEastCut.availableCount === 1, 'Karai collapses from 3 available channels to 1 (mesh only)');

  assert(marinaEastCut.cell === true, 'Marina Cell survives East Power failure (on Tower A / West Power)');
  assert(marinaEastCut.fm === false, 'Marina FM drops on East Power failure (transmitter unpowered)');
  assert(marinaEastCut.mesh === true, 'Marina Mesh survives East Power failure');
  assert(marinaEastCut.availableCount === 2, 'Marina retains 2 channels (Cell + Mesh)');

  // Test 4: Mitigating shared power failure with Substation Backup Generator
  const generatorInterventions: ActiveInterventions = {
    ...emptyInterventions,
    backup_generation: true
  };
  const genMitigatedStatus = calculateRedundancyIllusion(INITIAL_CONFIG, healthyFailures, generatorInterventions);
  const karaiMitigated = genMitigatedStatus.find(s => s.villageId === 'karai')!;

  assert(karaiMitigated.commonCauseNodes.length === 0, 'Backup generator eliminates power_east common-cause vulnerability');
  assert(karaiMitigated.n1Guaranteed === 2, 'Karai N-1 guaranteed rises from 1 to 2 when backup generator is enabled');

  // Test 5: Shared gateway failure under compound Cyclone outage
  const cycloneFailures: NetworkFailureState = {
    ...healthyFailures,
    power_west: true,
    power_east: true,
    fibre: true
  };
  const cycloneStatus = calculateRedundancyIllusion(INITIAL_CONFIG, cycloneFailures, emptyInterventions);
  const marinaCyclone = cycloneStatus.find(s => s.villageId === 'marina')!;

  assert(marinaCyclone.availableCount === 1, 'Marina has 1 available channel (Mesh) under Cyclone');
  assert(marinaCyclone.n1Guaranteed === 0, 'Marina N-1 is 0 under Cyclone (single-point cut to blackout)');
  assert(
    Boolean(marinaCyclone.singlePointsOfFailure?.includes('gateway')),
    'Marina identifies gateway as a Single Point of Failure'
  );

  // Trigger Gateway Loss
  const gatewayLossFailures: NetworkFailureState = {
    ...cycloneFailures,
    gateway: true
  };
  const gatewayLossStatus = calculateRedundancyIllusion(INITIAL_CONFIG, gatewayLossFailures, emptyInterventions);
  const marinaGatewayLoss = gatewayLossStatus.find(s => s.villageId === 'marina')!;
  const karaiGatewayLoss = gatewayLossStatus.find(s => s.villageId === 'karai')!;

  assert(marinaGatewayLoss.availableCount === 0, 'Marina loses all channels when gateway fails (0 active)');
  assert(karaiGatewayLoss.availableCount === 0, 'Karai loses all channels when gateway fails (0 active)');

  // Test 6: Redundant gateway recovery
  const secondGatewayInterventions: ActiveInterventions = {
    ...emptyInterventions,
    second_gateway: true
  };
  const recoveredGatewayStatus = calculateRedundancyIllusion(INITIAL_CONFIG, gatewayLossFailures, secondGatewayInterventions);
  const marinaRecovered = recoveredGatewayStatus.find(s => s.villageId === 'marina')!;
  const karaiRecovered = recoveredGatewayStatus.find(s => s.villageId === 'karai')!;

  assert(marinaRecovered.mesh === true, 'Secondary gateway at Pazhaya restores Marina mesh feed');
  assert(karaiRecovered.mesh === true, 'Secondary gateway at Pazhaya restores Karai mesh feed');
  assert(marinaRecovered.availableCount === 1, 'Marina available channels restored to 1');
  assert(karaiRecovered.availableCount === 1, 'Karai available channels restored to 1');

  // Redundant gateway resilience: under Cyclone with 2nd gateway, N-1 guaranteed improves
  const cycloneWith2ndGateway = calculateRedundancyIllusion(INITIAL_CONFIG, cycloneFailures, secondGatewayInterventions);
  const marinaWith2ndGateway = cycloneWith2ndGateway.find(s => s.villageId === 'marina')!;
  assert(
    !marinaWith2ndGateway.singlePointsOfFailure?.includes('gateway'),
    'Secondary gateway eliminates gateway as a Single Point of Failure'
  );

  // Test 7: Disconnected settlements (Thoni & Hill Camp)
  const thoni = healthyStatus.find(s => s.villageId === 'thoni')!;
  const hillcamp = healthyStatus.find(s => s.villageId === 'hillcamp')!;

  assert(thoni.nominalCount === 0, 'Thoni has 0 nominal channels');
  assert(thoni.availableCount === 0, 'Thoni has 0 available channels');
  assert(thoni.n1Guaranteed === 0, 'Thoni N-1 guaranteed is 0');
  assert(hillcamp.nominalCount === 0, 'Hill Camp has 0 nominal channels');
  assert(hillcamp.availableCount === 0, 'Hill Camp has 0 available channels');

  // Deploying community kit to Thoni
  const thoniKitInterventions: ActiveInterventions = {
    ...emptyInterventions,
    community_kits: ['thoni']
  };
  const thoniAnalyses = analyzeRedundancyIllusion(INITIAL_CONFIG, healthyFailures, thoniKitInterventions);
  const thoniWithKit = thoniAnalyses.find(a => a.villageId === 'thoni')!;
  assert(
    thoniWithKit.channelDetails.some(c => c.channel === 'kit' && c.available),
    'Deploying Community Kit adds active off-grid channel to Thoni'
  );

  // Test 8: Node cascade explanation details
  const eastDetail = explainNodeCascade('power_east');
  assert(eastDetail.category === 'POWER', 'East Power cascade categorized as POWER');
  assert(eastDetail.affectedChannels.includes('cell'), 'East Power cascade impacts Cell');
  assert(eastDetail.affectedChannels.includes('fm'), 'East Power cascade impacts FM');
  assert(eastDetail.affectedVillages.includes('Karai'), 'East Power cascade documents Karai impact');

  const fibreDetail = explainNodeCascade('fibre');
  assert(fibreDetail.category === 'BACKHAUL', 'Fibre cascade categorized as BACKHAUL');
  assert(fibreDetail.affectedVillages.length === 6, 'Fibre cascade silences all 6 covered villages');

  // Test 9: Scenario transitions and comparative summaries
  const comparisons = compareScenariosRedundancy(INITIAL_CONFIG, emptyInterventions);
  assert(comparisons.length === 3, 'Evaluates 3 canonical scenarios (Healthy, Cyclone, Gateway Loss)');
  const healthyComp = comparisons.find(c => c.scenarioId === 'healthy')!;
  const cycloneComp = comparisons.find(c => c.scenarioId === 'cyclone')!;
  const gatewayLossComp = comparisons.find(c => c.scenarioId === 'gateway_loss')!;

  assert(healthyComp.summary.villagesAtIllusionRisk === 3, 'Healthy baseline has 3 villages at illusion risk (Karai, Uppalam, Sagar)');
  assert(cycloneComp.summary.villagesAtSinglePointCut === 6, 'Cyclone scenario has 6 villages at N-1 = 0 single-point cut risk');
  assert(gatewayLossComp.summary.villagesCompletelySevered === 8, 'Gateway loss scenario has all 8 settlements completely severed');
}
