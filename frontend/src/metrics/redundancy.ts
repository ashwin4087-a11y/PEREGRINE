/**
 * PEREGRINE — Redundancy Illusion Metric & Dependency Audit (Section 9)
 * Detects hidden single points of failure across nominally diverse channels.
 * Calculates: Nominal Channels vs Available Channels vs N-1 Guaranteed Channels.
 * 
 * Formal Definition of N-1 Guaranteed:
 * min over each currently-operational infrastructure component n of the number of 
 * warning channels that remain available to village i after component n additionally fails.
 */

import { SystemConfig, VillageConfig } from '../model/config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  VillageChannelStatus, 
  ChannelType, 
  NodeId 
} from '../model/types';
import { isChannelAvailable } from '../model/graph';

export const CRITICAL_FAILURE_NODES: NodeId[] = [
  'power_west',
  'power_east',
  'fibre',
  'tower_A',
  'tower_B',
  'fm_tx',
  'gateway'
];

export interface ChannelDependencyInfo {
  channel: ChannelType | 'kit' | 'siren';
  channelName: string;
  nominal: boolean;
  available: boolean;
  upstreamNodes: NodeId[];
  failedUpstreamNodes: NodeId[];
  mitigations: string[];
  statusReason: string;
}

export interface VillageRedundancyAnalysis {
  villageId: string;
  villageName: string;
  population: number;
  tower: string | null;
  hasFm: boolean;
  hasMeshNode: boolean;
  nominalCount: number;
  availableCount: number;
  n1Guaranteed: number;
  nominalChannels: ChannelType[];
  availableChannels: ChannelType[];
  channelDetails: ChannelDependencyInfo[];
  commonCauseNodes: string[];
  singlePointsOfFailure: string[];
  worstCaseNode: string | null;
  worstCaseRemainingCount: number;
  hasRedundancyIllusion: boolean;
  isCompletelyVulnerable: boolean;
  isCompletelySevered: boolean;
  explanation: string;
}

export interface RedundancySummary {
  totalVillages: number;
  villagesAtIllusionRisk: number;
  villagesAtSinglePointCut: number;
  villagesCompletelySevered: number;
  islandAvgNominalChannels: number;
  islandAvgAvailableChannels: number;
  islandAvgN1Guaranteed: number;
}

export interface NodeCascadeDetail {
  nodeId: string;
  name: string;
  category: 'POWER' | 'BACKHAUL' | 'TRANSMITTER' | 'GATEWAY';
  impactDescription: string;
  vulnerabilityType: string;
  affectedChannels: ChannelType[];
  affectedVillages: string[];
  mitigatingIntervention?: string;
}

/**
 * Returns the physical upstream infrastructure components required by a channel for a specific village.
 */
export function getChannelUpstreamNodes(
  channel: ChannelType,
  village: VillageConfig,
  _interventions: ActiveInterventions
): NodeId[] {
  if (channel === 'cell') {
    if (!village.tower) return [];
    if (village.tower === 'A') return ['power_west', 'tower_A', 'fibre'];
    if (village.tower === 'B') return ['power_east', 'tower_B', 'fibre'];
    return [];
  }

  if (channel === 'fm') {
    if (!village.fm) return [];
    return ['power_east', 'fm_tx'];
  }

  if (channel === 'mesh') {
    if (!village.meshNode) return [];
    return ['gateway'];
  }

  return [];
}

/**
 * Explains how a specific node failure cascades through the warning channels.
 */
export function explainNodeCascade(nodeId: string): NodeCascadeDetail {
  switch (nodeId) {
    case 'power_west':
      return {
        nodeId: 'power_west',
        name: 'West Grid Substation (66kV)',
        category: 'POWER',
        impactDescription: 'Powers Tower A cell equipment. Failure silences Cellular Broadcast for Marina, Kovalam, and Pazhaya (11,200 pop).',
        vulnerabilityType: 'Sub-regional Power SPOF',
        affectedChannels: ['cell'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya']
      };

    case 'power_east':
      return {
        nodeId: 'power_east',
        name: 'East Grid Substation (110kV)',
        category: 'POWER',
        impactDescription: 'Powers Tower B cell equipment and the central 15 kW FM Transmitter. A single substation fault drops BOTH Cellular Broadcast and FM Radio simultaneously for Karai, Uppalam, and Sagar.',
        vulnerabilityType: 'Common-Cause Failure (CCF) Root',
        affectedChannels: ['cell', 'fm'],
        affectedVillages: ['Karai', 'Uppalam', 'Sagar'],
        mitigatingIntervention: 'Substation Backup Generator'
      };

    case 'fibre':
      return {
        nodeId: 'fibre',
        name: 'Core Fibre-Optic Backhaul',
        category: 'BACKHAUL',
        impactDescription: 'Distributes Common Alerting Protocol (CAP) IP packets to both Tower A and Tower B. A physical cable sever immediately downs Cellular Broadcast across all 6 covered settlements.',
        vulnerabilityType: 'Island-Wide Backhaul SPOF',
        affectedChannels: ['cell'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya', 'Karai', 'Uppalam', 'Sagar']
      };

    case 'tower_A':
      return {
        nodeId: 'tower_A',
        name: 'Tower A (West Coastal Mast)',
        category: 'TRANSMITTER',
        impactDescription: 'Broadcasts cellular alerts to the western quadrant. Structural or hardware failure silences Marina, Kovalam, and Pazhaya.',
        vulnerabilityType: 'Cellular Mast SPOF',
        affectedChannels: ['cell'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya']
      };

    case 'tower_B':
      return {
        nodeId: 'tower_B',
        name: 'Tower B (East Inshore Mast)',
        category: 'TRANSMITTER',
        impactDescription: 'Broadcasts cellular alerts to the eastern quadrant. Structural or hardware failure silences Karai, Uppalam, and Sagar.',
        vulnerabilityType: 'Cellular Mast SPOF',
        affectedChannels: ['cell'],
        affectedVillages: ['Karai', 'Uppalam', 'Sagar']
      };

    case 'fm_tx':
      return {
        nodeId: 'fm_tx',
        name: 'Central 15 kW FM Transmitter',
        category: 'TRANSMITTER',
        impactDescription: 'Transmits analog emergency audio across VHF broadcast contour. Exciter or amplifier failure disables FM radio reception island-wide.',
        vulnerabilityType: 'Broadcast Transmitter SPOF',
        affectedChannels: ['fm'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya', 'Karai', 'Uppalam', 'Sagar'],
        mitigatingIntervention: 'Mobile Broadcast Unit (500W vehicle-mounted)'
      };

    case 'gateway':
      return {
        nodeId: 'gateway',
        name: 'Marina Satellite Gateway',
        category: 'GATEWAY',
        impactDescription: 'Ingests external satellite emergency feeds and feeds the shelter LoRa mesh. Downlink dish misalignment or electronics failure disconnects all 6 shelter mesh nodes unless a backup gateway is active.',
        vulnerabilityType: 'Mesh Ingestion Gateway SPOF',
        affectedChannels: ['mesh'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya', 'Karai', 'Uppalam', 'Sagar'],
        mitigatingIntervention: 'Secondary Satellite Gateway at Pazhaya'
      };

    case 'gateway_backup':
      return {
        nodeId: 'gateway_backup',
        name: 'Pazhaya Secondary Gateway',
        category: 'GATEWAY',
        impactDescription: 'Redundant satellite terminal providing secondary mesh alert ingestion.',
        vulnerabilityType: 'Redundant Gateway Failover',
        affectedChannels: ['mesh'],
        affectedVillages: ['Marina', 'Kovalam', 'Pazhaya', 'Karai', 'Uppalam', 'Sagar']
      };

    default:
      return {
        nodeId,
        name: nodeId,
        category: 'BACKHAUL',
        impactDescription: 'Infrastructure node in the alert broadcast path.',
        vulnerabilityType: 'Network Component',
        affectedChannels: [],
        affectedVillages: []
      };
  }
}

/**
 * Calculates Redundancy Illusion for each village (Section 9)
 * Evaluates nominal_i vs available_i vs n1_guaranteed_i
 */
export function calculateRedundancyIllusion(
  config: SystemConfig,
  failures: NetworkFailureState,
  interventions: ActiveInterventions
): VillageChannelStatus[] {
  return config.villages.map(village => {
    const nominalChannels: ChannelType[] = [];
    if (village.tower) nominalChannels.push('cell');
    if (village.fm) nominalChannels.push('fm');
    if (village.meshNode) nominalChannels.push('mesh');

    // Available now under current failures & interventions
    const cellNow = isChannelAvailable('cell', village, failures, interventions, null, config);
    const fmNow = isChannelAvailable('fm', village, failures, interventions, null, config);
    const meshNow = isChannelAvailable('mesh', village, failures, interventions, null, config);

    const availableList: ChannelType[] = [];
    if (cellNow && nominalChannels.includes('cell')) availableList.push('cell');
    if (fmNow && nominalChannels.includes('fm')) availableList.push('fm');
    if (meshNow && nominalChannels.includes('mesh')) availableList.push('mesh');

    // Assemble candidate failure nodes to test (including gateway_backup if second_gateway is active)
    const testNodes: string[] = [...CRITICAL_FAILURE_NODES];
    if (interventions.second_gateway && !failures.gateway_backup) {
      testNodes.push('gateway_backup');
    }

    const currentlyUpNodes = testNodes.filter(n => !failures[n as keyof NetworkFailureState]);

    // Compute N-1 guaranteed: min available channels after 1 additional active node failure
    let worstRemaining = availableList.length;
    let worstCaseNode: string | null = null;
    const singlePointsOfFailure: string[] = [];
    const commonCauseNodes: string[] = [];

    for (const testNode of currentlyUpNodes) {
      const simulatedFailures: NetworkFailureState = { ...failures, [testNode]: true };
      const testCell = isChannelAvailable('cell', village, simulatedFailures, interventions, null, config);
      const testFM = isChannelAvailable('fm', village, simulatedFailures, interventions, null, config);
      const testMesh = isChannelAvailable('mesh', village, simulatedFailures, interventions, null, config);

      let remCount = 0;
      if (testCell && nominalChannels.includes('cell')) remCount++;
      if (testFM && nominalChannels.includes('fm')) remCount++;
      if (testMesh && nominalChannels.includes('mesh')) remCount++;

      if (remCount < worstRemaining) {
        worstRemaining = remCount;
        worstCaseNode = testNode;
      }

      // Check if removing testNode drops available channels to 0 (SPOF)
      if (availableList.length > 0 && remCount === 0) {
        singlePointsOfFailure.push(testNode);
      }

      // Check if removing testNode drops >= 2 channels simultaneously (Common-Cause Failure)
      if (availableList.length - remCount >= 2) {
        commonCauseNodes.push(testNode);
      }
    }

    return {
      villageId: village.id,
      cell: cellNow,
      fm: fmNow,
      mesh: meshNow,
      nominalCount: nominalChannels.length,
      availableCount: availableList.length,
      n1Guaranteed: worstRemaining,
      commonCauseNodes,
      singlePointsOfFailure,
      worstCaseNode,
      nominalChannels,
      availableChannels: availableList
    };
  });
}

/**
 * Produces deep-dive Redundancy Illusion and channel dependency analysis for every settlement.
 */
export function analyzeRedundancyIllusion(
  config: SystemConfig,
  failures: NetworkFailureState,
  interventions: ActiveInterventions
): VillageRedundancyAnalysis[] {
  const baseStatus = calculateRedundancyIllusion(config, failures, interventions);

  return config.villages.map(village => {
    const st = baseStatus.find(s => s.villageId === village.id)!;

    const nominalChannels: ChannelType[] = [];
    if (village.tower) nominalChannels.push('cell');
    if (village.fm) nominalChannels.push('fm');
    if (village.meshNode) nominalChannels.push('mesh');

    // Build channel dependency details
    const channelDetails: ChannelDependencyInfo[] = [];

    // Cell Broadcast
    const cellUpstream = getChannelUpstreamNodes('cell', village, interventions);
    const cellFailedNodes = cellUpstream.filter(n => failures[n as keyof NetworkFailureState]);
    const cellAvailable = st.cell;
    let cellReason = '';
    const cellMitigations: string[] = [];
    if (!village.tower) {
      cellReason = 'No cellular base station coverage in settlement';
    } else if (failures.fibre) {
      cellReason = 'Backhaul fibre cut severs CAP distribution to tower';
    } else if (village.tower === 'A' && (failures.tower_A || failures.power_west)) {
      cellReason = failures.power_west ? 'West power substation down' : 'Tower A mast disabled';
    } else if (village.tower === 'B' && failures.tower_B) {
      cellReason = 'Tower B mast hardware disabled';
    } else if (village.tower === 'B' && failures.power_east) {
      if (interventions.backup_generation) {
        cellReason = 'Operating on Substation Backup Generator';
        cellMitigations.push('Backup Generator active');
      } else {
        cellReason = 'East power grid down without backup generator';
      }
    } else {
      cellReason = 'Operational via Tower ' + village.tower;
    }

    if (village.tower) {
      channelDetails.push({
        channel: 'cell',
        channelName: `Cell Broadcast (Tower ${village.tower})`,
        nominal: true,
        available: cellAvailable,
        upstreamNodes: cellUpstream,
        failedUpstreamNodes: cellFailedNodes,
        mitigations: cellMitigations,
        statusReason: cellReason
      });
    }

    // FM Radio
    const fmUpstream = getChannelUpstreamNodes('fm', village, interventions);
    const fmFailedNodes = fmUpstream.filter(n => failures[n as keyof NetworkFailureState]);
    const fmAvailable = st.fm;
    let fmReason = '';
    const fmMitigations: string[] = [];
    if (!village.fm) {
      fmReason = 'Outside 15 kW FM broadcast reception contour';
    } else if (interventions.mobile_broadcast_unit) {
      fmReason = 'Operating via Mobile Broadcast Unit (500W vehicle-mounted transmitter)';
      fmMitigations.push('Mobile Unit on-air');
    } else if (failures.fm_tx) {
      fmReason = 'Central FM transmitter disabled';
    } else if (failures.power_east) {
      if (interventions.backup_generation) {
        fmReason = 'Fixed FM transmitter powered by Substation Generator';
        fmMitigations.push('Backup Generator running');
      } else {
        fmReason = 'East power grid down; transmitter unpowered';
      }
    } else {
      fmReason = 'Operational via fixed 15 kW transmitter';
    }

    if (village.fm) {
      channelDetails.push({
        channel: 'fm',
        channelName: 'VHF FM Radio (Central 15 kW)',
        nominal: true,
        available: fmAvalailable(fmAvailable),
        upstreamNodes: fmUpstream,
        failedUpstreamNodes: fmFailedNodes,
        mitigations: fmMitigations,
        statusReason: fmReason
      });
    }

    // Shelter Mesh
    const meshUpstream = getChannelUpstreamNodes('mesh', village, interventions);
    const meshFailedNodes = meshUpstream.filter(n => failures[n as keyof NetworkFailureState]);
    const meshAvailable = st.mesh;
    let meshReason = '';
    const meshMitigations: string[] = [];
    if (!village.meshNode && !interventions.relay_nodes.includes(village.id)) {
      meshReason = 'No shelter radio node configured';
    } else if (failures.gateway && !interventions.second_gateway) {
      meshReason = 'Marina satellite gateway severed; mesh feed down';
    } else if (failures.gateway && interventions.second_gateway && failures.gateway_backup) {
      meshReason = 'Both primary and secondary satellite gateways down';
    } else if (failures.gateway && interventions.second_gateway) {
      meshReason = 'Operating via Pazhaya Secondary Backup Gateway';
      meshMitigations.push('Secondary Gateway failover');
    } else if (!meshAvailable) {
      meshReason = 'Disconnected from gateway (no viable radio hops within 190 units)';
    } else {
      meshReason = 'Connected to satellite gateway via multi-hop mesh';
    }

    if (village.meshNode || interventions.relay_nodes.includes(village.id)) {
      channelDetails.push({
        channel: 'mesh',
        channelName: 'Shelter LoRa Mesh (Multi-Hop)',
        nominal: Boolean(village.meshNode),
        available: meshAvailable,
        upstreamNodes: meshUpstream,
        failedUpstreamNodes: meshFailedNodes,
        mitigations: meshMitigations,
        statusReason: meshReason
      });
    }

    // Check optional off-grid interventions
    if (interventions.community_kits.includes(village.id)) {
      channelDetails.push({
        channel: 'kit',
        channelName: 'Community Satellite Receiver Kit',
        nominal: false,
        available: true,
        upstreamNodes: [],
        failedUpstreamNodes: [],
        mitigations: ['Direct off-grid satellite transceiver'],
        statusReason: 'Independent off-grid satellite terminal deployed at community shelter'
      });
    }

    if (interventions.siren_responders.includes(village.id)) {
      channelDetails.push({
        channel: 'siren',
        channelName: 'Acoustic Siren Responder',
        nominal: false,
        available: true,
        upstreamNodes: [],
        failedUpstreamNodes: [],
        mitigations: ['Dedicated manual acoustic alert team'],
        statusReason: 'First-responder dispatched with acoustic siren system'
      });
    }

    // Explanatory narrative
    let narrative = '';
    const hasIllusion = st.availableCount > 1 && (st.n1Guaranteed <= 1 || st.commonCauseNodes.length > 0);
    const isVulnerable = st.availableCount > 0 && st.n1Guaranteed === 0;
    const isSevered = st.availableCount === 0;

    if (isSevered) {
      narrative = `${village.name} currently has 0 available warning channels. Every modeled broadcast path is down.`;
    } else if (isVulnerable) {
      narrative = `${village.name} has ${st.availableCount} active channel(s), but N-1 guaranteed is 0. A single additional component cut (e.g. ${st.worstCaseNode || 'critical node'}) causes complete silence.`;
    } else if (hasIllusion) {
      if (st.commonCauseNodes.includes('power_east')) {
        narrative = `${village.name} appears to have multiple diverse channels on paper (${st.nominalCount} nominal), but Cell and FM both depend on the East Power Substation. An East Power trip drops 2 channels simultaneously, reducing survival to 1 channel (Mesh only).`;
      } else {
        narrative = `${village.name} exhibits redundancy illusion: ${st.availableCount} channels are currently operational, but single-point fragility drops N-1 protection to ${st.n1Guaranteed}.`;
      }
    } else {
      narrative = `${village.name} has genuinely independent failure paths. No single component removal drops available channels below ${st.n1Guaranteed}.`;
    }

    return {
      villageId: village.id,
      villageName: village.name,
      population: village.pop,
      tower: village.tower,
      hasFm: village.fm,
      hasMeshNode: village.meshNode,
      nominalCount: st.nominalCount,
      availableCount: st.availableCount,
      n1Guaranteed: st.n1Guaranteed,
      nominalChannels: st.nominalChannels || nominalChannels,
      availableChannels: st.availableChannels || [],
      channelDetails,
      commonCauseNodes: st.commonCauseNodes,
      singlePointsOfFailure: st.singlePointsOfFailure || [],
      worstCaseNode: st.worstCaseNode || null,
      worstCaseRemainingCount: st.n1Guaranteed,
      hasRedundancyIllusion: hasIllusion,
      isCompletelyVulnerable: isVulnerable,
      isCompletelySevered: isSevered,
      explanation: narrative
    };
  });
}

// Helper to keep typing clean
function fmAvalailable(val: boolean): boolean {
  return val;
}

/**
 * Calculates summary statistics for the redundancy illusion state across the entire island.
 */
export function calculateRedundancySummary(
  analyses: VillageRedundancyAnalysis[]
): RedundancySummary {
  const total = analyses.length;
  if (total === 0) {
    return {
      totalVillages: 0,
      villagesAtIllusionRisk: 0,
      villagesAtSinglePointCut: 0,
      villagesCompletelySevered: 0,
      islandAvgNominalChannels: 0,
      islandAvgAvailableChannels: 0,
      islandAvgN1Guaranteed: 0
    };
  }

  const atIllusion = analyses.filter(a => a.hasRedundancyIllusion).length;
  const atSingleCut = analyses.filter(a => a.isCompletelyVulnerable).length;
  const severed = analyses.filter(a => a.isCompletelySevered).length;

  const avgNom = analyses.reduce((s, a) => s + a.nominalCount, 0) / total;
  const avgAvail = analyses.reduce((s, a) => s + a.availableCount, 0) / total;
  const avgN1 = analyses.reduce((s, a) => s + a.n1Guaranteed, 0) / total;

  return {
    totalVillages: total,
    villagesAtIllusionRisk: atIllusion,
    villagesAtSinglePointCut: atSingleCut,
    villagesCompletelySevered: severed,
    islandAvgNominalChannels: Number(avgNom.toFixed(2)),
    islandAvgAvailableChannels: Number(avgAvail.toFixed(2)),
    islandAvgN1Guaranteed: Number(avgN1.toFixed(2))
  };
}

export interface ScenarioRedundancyComparison {
  scenarioId: 'healthy' | 'cyclone' | 'gateway_loss';
  scenarioName: string;
  failures: NetworkFailureState;
  summary: RedundancySummary;
  analyses: VillageRedundancyAnalysis[];
  keyFinding: string;
}

/**
 * Evaluates Redundancy Illusion across the three canonical scenarios (Healthy, Cyclone, Gateway Loss).
 */
export function compareScenariosRedundancy(
  config: SystemConfig,
  interventions: ActiveInterventions
): ScenarioRedundancyComparison[] {
  // Scenario 1: Healthy Baseline
  const healthyFailures: NetworkFailureState = {
    power_west: false,
    power_east: false,
    power_east_permanent: false,
    fibre: false,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false,
    gateway_backup: false,
    mesh_nodes_down: []
  };
  const healthyAnalyses = analyzeRedundancyIllusion(config, healthyFailures, interventions);
  const healthySummary = calculateRedundancySummary(healthyAnalyses);

  // Scenario 2: Cyclone Landfall
  const cycloneFailures: NetworkFailureState = {
    ...healthyFailures,
    power_west: true,
    power_east: true,
    fibre: true
  };
  const cycloneAnalyses = analyzeRedundancyIllusion(config, cycloneFailures, interventions);
  const cycloneSummary = calculateRedundancySummary(cycloneAnalyses);

  // Scenario 3: Gateway Loss
  const gatewayLossFailures: NetworkFailureState = {
    ...cycloneFailures,
    gateway: true
  };
  const gatewayLossAnalyses = analyzeRedundancyIllusion(config, gatewayLossFailures, interventions);
  const gatewayLossSummary = calculateRedundancySummary(gatewayLossAnalyses);

  return [
    {
      scenarioId: 'healthy',
      scenarioName: 'Healthy Baseline',
      failures: healthyFailures,
      summary: healthySummary,
      analyses: healthyAnalyses,
      keyFinding: 'Tower B villages (Karai, Uppalam, Sagar) show N-1 = 1 due to shared East Power substation dependency between Cell and FM.'
    },
    {
      scenarioId: 'cyclone',
      scenarioName: 'Cyclone Landfall',
      failures: cycloneFailures,
      summary: cycloneSummary,
      analyses: cycloneAnalyses,
      keyFinding: 'Power and fibre collapse leaves mesh as the sole surviving channel for 6 villages; all 6 drop to N-1 = 0 single-point gateway vulnerability.'
    },
    {
      scenarioId: 'gateway_loss',
      scenarioName: 'Gateway Loss',
      failures: gatewayLossFailures,
      summary: gatewayLossSummary,
      analyses: gatewayLossAnalyses,
      keyFinding: interventions.second_gateway
        ? 'Secondary backup gateway at Pazhaya absorbs primary gateway loss, maintaining mesh connectivity.'
        : 'Primary gateway cut eliminates the last surviving channel, plunging all 8 settlements into complete silence.'
    }
  ];
}
