/**
 * PEREGRINE — Graph Dependencies and Simulation Engine
 * Pure deterministic functions implementing Sections 6, 7, 8, 9, 10
 * 
 * Model Integrity Standards:
 * 1. Zero fabricated multipliers (planResilience derived from genuine simulation)
 * 2. Mesh topology computed from Euclidean coordinates and configured range
 * 3. Power outage and hour-48 restoration modeled explicitly
 * 4. Summary metrics dynamically derived from dependency graph state
 * 5. Single unified scoring path for baselines and interventions
 */

import { SystemConfig, VillageConfig } from './config';

export type NodeId = 
  | 'power_west' 
  | 'power_east' 
  | 'fibre' 
  | 'tower_A' 
  | 'tower_B' 
  | 'fm_tx' 
  | 'gateway' 
  | 'gateway_backup';

export type ChannelType = 'cell' | 'fm' | 'mesh';

export interface NetworkFailureState {
  power_west: boolean;    // true = failed/down
  power_east: boolean;
  power_east_permanent?: boolean; // if true, grid never returns at hour 48
  fibre: boolean;
  tower_A: boolean;
  tower_B: boolean;
  fm_tx: boolean;
  gateway: boolean;
  gateway_backup?: boolean;
}

export function createDefaultFailures(): NetworkFailureState {
  return {
    power_west: false,
    power_east: false,
    power_east_permanent: false,
    fibre: false,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false,
    gateway_backup: false
  };
}

/**
 * 1. Healthy Network Baseline: Clears all failures to pristine state.
 */
export function applyHealthyPreset(): NetworkFailureState {
  return createDefaultFailures();
}

/**
 * 2. Cyclone Landfall: Power West, Power East, and Core Fibre severed.
 */
export function applyCyclonePreset(): NetworkFailureState {
  return {
    ...createDefaultFailures(),
    power_west: true,
    power_east: true,
    fibre: true
  };
}

/**
 * 3. Gateway Loss: Cyclone landfall plus loss of primary satellite gateway at Marina.
 */
export function applyGatewayLostPreset(): NetworkFailureState {
  return {
    ...createDefaultFailures(),
    power_west: true,
    power_east: true,
    fibre: true,
    gateway: true
  };
}

export interface ActiveInterventions {
  backup_generation: boolean;
  mobile_broadcast_unit: boolean;
  second_gateway: boolean;
  relay_nodes: string[];       // village IDs
  siren_responders: string[];   // village IDs
  community_kits: string[];     // village IDs (Thoni, Hill Camp)
}

export function createEmptyInterventions(): ActiveInterventions {
  return {
    backup_generation: false,
    mobile_broadcast_unit: false,
    second_gateway: false,
    relay_nodes: [],
    siren_responders: [],
    community_kits: []
  };
}

export interface MeshNodeStatus {
  villageId: string;
  hasHardware: boolean;
  operational: boolean;
  isGateway: boolean;
  connectedToGateway: boolean;
  hopCount: number | null;
  path: string[];
  neighbors: string[];
}

export interface MeshTopology {
  rangeUnits: number;
  gatewayOperational: boolean;
  activeGatewayIds: string[];
  nodes: Record<string, MeshNodeStatus>;
  links: Array<{ from: string; to: string; distance: number }>;
}

/**
 * Computes exact Shelter Mesh topology from node coordinates, link ranges, and gateway status.
 * Replaces hardcoded 0/1 hops with Breadth-First Search (BFS) graph pathing.
 */
export function computeMeshTopology(
  config: SystemConfig,
  failures: NetworkFailureState,
  interventions: ActiveInterventions
): MeshTopology {
  const range = config.channels.mesh.rangeUnits;
  const nodesRecord: Record<string, MeshNodeStatus> = {};
  const links: Array<{ from: string; to: string; distance: number }> = [];

  // Determine active gateways
  // Primary gateway is in Marina
  const primaryGatewayUp = !failures.gateway;
  // Redundant satellite gateway
  const backupGatewayUp = interventions.second_gateway && !failures.gateway_backup;
  const gatewayOperational = primaryGatewayUp || backupGatewayUp;

  const activeGatewayIds: string[] = [];
  if (primaryGatewayUp) {
    const marina = config.villages.find(v => v.hostsGateway);
    if (marina) activeGatewayIds.push(marina.id);
  } else if (backupGatewayUp) {
    // Redundant gateway acts as feed at Marina terminal or secondary hub
    const marina = config.villages.find(v => v.hostsGateway);
    if (marina) activeGatewayIds.push(marina.id);
  }

  // Initialise node statuses
  for (const v of config.villages) {
    const hasHardware = Boolean(v.meshNode || interventions.relay_nodes.includes(v.id));
    const isGateway = activeGatewayIds.includes(v.id);
    nodesRecord[v.id] = {
      villageId: v.id,
      hasHardware,
      operational: hasHardware,
      isGateway,
      connectedToGateway: false,
      hopCount: null,
      path: [],
      neighbors: []
    };
  }

  // Discover valid bidirectional radio links where dist <= rangeUnits
  const villages = config.villages;
  for (let i = 0; i < villages.length; i++) {
    for (let j = i + 1; j < villages.length; j++) {
      const u = villages[i];
      const v = villages[j];
      const dist = Math.hypot(u.x - v.x, u.y - v.y);
      if (dist <= range) {
        // Link physically viable in line-of-sight
        const uStatus = nodesRecord[u.id];
        const vStatus = nodesRecord[v.id];
        if (uStatus.hasHardware && vStatus.hasHardware) {
          uStatus.neighbors.push(v.id);
          vStatus.neighbors.push(u.id);
          links.push({
            from: u.id,
            to: v.id,
            distance: Number(dist.toFixed(1))
          });
        }
      }
    }
  }

  // If no gateway is operational, no node has mesh feed
  if (!gatewayOperational || activeGatewayIds.length === 0) {
    return {
      rangeUnits: range,
      gatewayOperational: false,
      activeGatewayIds: [],
      nodes: nodesRecord,
      links
    };
  }

  // Run BFS from active gateway(s) to compute shortest path hop counts
  const queue: string[] = [];
  for (const gId of activeGatewayIds) {
    if (nodesRecord[gId]?.hasHardware) {
      nodesRecord[gId].connectedToGateway = true;
      nodesRecord[gId].hopCount = 0;
      nodesRecord[gId].path = [gId];
      queue.push(gId);
    }
  }

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodesRecord[currId];
    const currHops = currNode.hopCount ?? 0;

    for (const neighborId of currNode.neighbors) {
      const neighbor = nodesRecord[neighborId];
      if (neighbor.hasHardware && neighbor.hopCount === null) {
        neighbor.connectedToGateway = true;
        neighbor.hopCount = currHops + 1;
        neighbor.path = [...currNode.path, neighborId];
        queue.push(neighborId);
      }
    }
  }

  return {
    rangeUnits: range,
    gatewayOperational: true,
    activeGatewayIds,
    nodes: nodesRecord,
    links
  };
}

export interface VillageChannelStatus {
  villageId: string;
  cell: boolean;
  fm: boolean;
  mesh: boolean;
  nominalCount: number;
  availableCount: number;
  n1Guaranteed: number;
  commonCauseNodes: string[];
}

export interface S30Result {
  resilienceScore: number;       // 0 to 100%
  cellOnlyResilience: number;    // 0 to 100%
  allChannelsResilience: number; // 0 to 100%
  planResilience: number;        // 0 to 100% (honest fresh evaluation, NO arbitrary multiplier)
  villageMetrics: Array<{
    id: string;
    name: string;
    pop: number;
    effectiveReach: number;
    arrivalMin: number;
    contribution: number;
    activeChannels: ChannelType[];
    meshHops: number | null;
  }>;
  totalReachedEst: number;
  unreachedBeforeExpiry: number;
}

export interface S72HourlyStep {
  hour: number;
  gridPowerUp: boolean;
  generatorUp: boolean;
  mobileUnitUp: boolean;
  fmOnAir: boolean;
  villagePaths: Record<string, boolean>; // pathAvailable
  villageReach: Record<string, number>;  // expectedReach 0..1
}

export interface S72VillageSummary {
  id: string;
  name: string;
  pop: number;
  pathAvailableHours: number;
  silenceHours: number;
  lowServiceHours: number;
  timeAvgReach: number;
  nominalChannels: number;
  availableChannelsNow: number;
  n1Guaranteed: number;
}

export interface S72Result {
  overallReach: number;          // 0 to 100%
  minVillageReach: { id: string; name: string; value: number };
  steps: S72HourlyStep[];
  villages: S72VillageSummary[];
  silenceByVillage: Record<string, number>;
  sirenPatrolAssumption: string;
}

/**
 * Evaluates whether a channel is available for a given village given failures and active interventions
 */
export function isChannelAvailable(
  channel: ChannelType,
  village: VillageConfig,
  failures: NetworkFailureState,
  interventions: ActiveInterventions,
  hourInS72: number | null = null,
  config: SystemConfig
): boolean {
  if (channel === 'cell') {
    if (!village.tower) return false;
    if (failures.fibre) return false;

    if (village.tower === 'A') {
      if (failures.tower_A || failures.power_west) return false;
      return true;
    }
    if (village.tower === 'B') {
      if (failures.tower_B) return false;
      // East power or backup generator
      if (failures.power_east && !interventions.backup_generation) return false;
      return true;
    }
    return false;
  }

  if (channel === 'fm') {
    if (!village.fm) return false;
    if (failures.fm_tx) return false;

    // Fixed transmitter power check
    const hasFixedPower = !failures.power_east || interventions.backup_generation;

    // If simulating S72 at a specific hour
    if (hourInS72 !== null) {
      const gridBack = (hourInS72 >= config.s72.gridReturnH) && !failures.power_east_permanent;
      const genRunning = interventions.backup_generation && (hourInS72 < config.s72.generatorRuntimeH);
      const mobileActive = interventions.mobile_broadcast_unit && (hourInS72 >= config.s72.mobileUnitArrivalH);
      return mobileActive || ((gridBack || genRunning) && !failures.fm_tx);
    }

    // Default static evaluation (e.g. S30)
    return hasFixedPower || interventions.mobile_broadcast_unit;
  }

  if (channel === 'mesh') {
    // Dynamic topology check: must have physical node and reachable path to active gateway
    const topo = computeMeshTopology(config, failures, interventions);
    const nodeStatus = topo.nodes[village.id];
    return Boolean(nodeStatus && nodeStatus.connectedToGateway);
  }

  return false;
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
  const criticalNodes: NodeId[] = [
    'power_west',
    'power_east',
    'fibre',
    'tower_A',
    'tower_B',
    'fm_tx',
    'gateway'
  ];

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

    // Compute N-1 guaranteed: min available channels after 1 additional active node failure
    let worstRemaining = availableList.length;
    const currentlyUpNodes = criticalNodes.filter(n => !failures[n as keyof NetworkFailureState]);

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
      }
    }

    // Common-cause nodes (nodes whose single failure drops >= 2 channels simultaneously)
    const commonCauseNodes: string[] = [];
    for (const testNode of currentlyUpNodes) {
      const simFailures: NetworkFailureState = { ...failures, [testNode]: true };
      const testCell = isChannelAvailable('cell', village, simFailures, interventions, null, config);
      const testFM = isChannelAvailable('fm', village, simFailures, interventions, null, config);
      const testMesh = isChannelAvailable('mesh', village, simFailures, interventions, null, config);

      let remCount = 0;
      if (testCell && nominalChannels.includes('cell')) remCount++;
      if (testFM && nominalChannels.includes('fm')) remCount++;
      if (testMesh && nominalChannels.includes('mesh')) remCount++;

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
      commonCauseNodes
    };
  });
}

/**
 * Simulates S30 30-Minute Alert Window
 * Time-arrival decay model: (window - arrival) / window
 * 
 * Uses unified scoring: cell-only baseline is computed from the same decay formula.
 * planResilience is the authentic simulation result with selected interventions (no fabricated multiplier).
 */
export function simulateS30(
  config: SystemConfig,
  failures: NetworkFailureState,
  interventions: ActiveInterventions,
  autoTuneShare: number = 0.5
): S30Result {
  const windowMin = config.s30.windowMin;
  const totalPop = config.villages.reduce((sum, v) => sum + v.pop, 0);

  // Precalculate exact mesh topology
  const meshTopo = computeMeshTopology(config, failures, interventions);

  const villageMetrics = config.villages.map(v => {
    const cellUp = isChannelAvailable('cell', v, failures, interventions, null, config);
    const fmUp = isChannelAvailable('fm', v, failures, interventions, null, config);
    const meshUp = isChannelAvailable('mesh', v, failures, interventions, null, config);
    const hasSiren = interventions.siren_responders.includes(v.id);
    const hasCommunityKit = interventions.community_kits.includes(v.id);
    const hasRelay = interventions.relay_nodes.includes(v.id);

    const activeChannels: ChannelType[] = [];
    if (cellUp) activeChannels.push('cell');
    if (fmUp) activeChannels.push('fm');
    if (meshUp) activeChannels.push('mesh');

    // Reach per channel
    const rCell = cellUp ? config.channels.cell.reach : 0;
    const rFM = fmUp 
      ? config.channels.fm.radioShare * (autoTuneShare + (1 - autoTuneShare) * config.channels.fm.existingListenerShare)
      : 0;
    const rMesh = meshUp ? config.channels.mesh.reach : 0;
    const rSiren = hasSiren ? config.channels.siren.reachS30 : 0;
    const rKit = hasCommunityKit ? config.channels.communityKit.reachS30 : 0;
    const rRelay = (hasRelay && meshUp) ? config.channels.relay.reachS30 : 0;

    // Independent union combination rule: 1 - Π(1 - reach_c)
    let combinedReach = 1 - (
      (1 - rCell) * 
      (1 - rFM) * 
      (1 - rMesh) * 
      (1 - rSiren) * 
      (1 - rKit) *
      (1 - rRelay)
    );
    if (combinedReach < 0) combinedReach = 0;
    if (combinedReach > 1) combinedReach = 1;

    // Arrival time in minutes
    const arrivalCandidates: number[] = [];
    if (cellUp) {
      arrivalCandidates.push(config.channels.cell.arrivalMin);
    }
    if (fmUp) {
      const fmArrival = autoTuneShare > 0 ? config.channels.fm.autoTuneArrivalMin : config.channels.fm.listenerArrivalMin;
      arrivalCandidates.push(fmArrival);
    }
    const nodeStatus = meshTopo.nodes[v.id];
    const meshHops = nodeStatus?.hopCount ?? null;
    if (meshUp && meshHops !== null) {
      arrivalCandidates.push(config.channels.mesh.baseMin + meshHops * config.channels.mesh.perHopMin);
    }
    if (hasSiren) {
      const dist = Math.hypot(v.x - 230, v.y - 220) / 10;
      arrivalCandidates.push(config.planner.sirenBaseMin + config.planner.sirenPerUnitMin * dist);
    }
    if (hasCommunityKit) {
      arrivalCandidates.push(config.planner.communityKitArrivalMin);
    }

    const minArrival = arrivalCandidates.length > 0 ? Math.min(...arrivalCandidates) : windowMin;
    const timeDecay = Math.max(0, windowMin - minArrival) / windowMin;
    const contribution = v.pop * combinedReach * timeDecay;

    return {
      id: v.id,
      name: v.name,
      pop: v.pop,
      effectiveReach: combinedReach,
      arrivalMin: minArrival,
      contribution,
      activeChannels,
      meshHops
    };
  });

  const totalContribution = villageMetrics.reduce((sum, v) => sum + v.contribution, 0);
  const resilienceScore = (totalContribution / (totalPop * 1.0)) * 100;

  // Unified cell-only calculation using the same decay path
  const cellContribution = config.villages.reduce((sum, v) => {
    const cellUp = isChannelAvailable('cell', v, failures, interventions, null, config);
    if (!cellUp) return sum;
    const timeDecay = Math.max(0, windowMin - config.channels.cell.arrivalMin) / windowMin;
    return sum + (v.pop * config.channels.cell.reach * timeDecay);
  }, 0);
  const cellOnlyResilience = (cellContribution / totalPop) * 100;

  const totalReachedEst = Math.round(villageMetrics.reduce((s, v) => s + (v.pop * v.effectiveReach), 0));
  const unreachedBeforeExpiry = totalPop - totalReachedEst;

  return {
    resilienceScore: Number(resilienceScore.toFixed(2)),
    cellOnlyResilience: Number(cellOnlyResilience.toFixed(2)),
    allChannelsResilience: Number(resilienceScore.toFixed(2)),
    // Removal of fabricated multiplier: planResilience matches actual simulated score
    planResilience: Number(resilienceScore.toFixed(2)),
    villageMetrics,
    totalReachedEst,
    unreachedBeforeExpiry
  };
}

/**
 * Simulates S72 72-Hour Outage Plan Matrix and Hourly Series (Sections 6.5, 6.6)
 * Explicitly models the power outage and hour-48 restoration timeline.
 * Dynamically computes N-1 and available channels from graph status.
 */
export function simulateS72(
  config: SystemConfig,
  interventions: ActiveInterventions,
  autoTuneLevel: number = 0.5,
  failures?: NetworkFailureState,
  options?: { permanentPowerLoss?: boolean }
): S72Result {
  const hours = config.s72.hours;
  const totalPop = config.villages.reduce((s, v) => s + v.pop, 0);
  const steps: S72HourlyStep[] = [];

  const effectiveFailures: NetworkFailureState = failures ?? createDefaultFailures();
  const isPermanentPower = Boolean(options?.permanentPowerLoss || effectiveFailures.power_east_permanent);

  const villageSeries: Record<string, { pathAvailable: boolean[]; expectedReach: number[] }> = {};
  config.villages.forEach(v => {
    villageSeries[v.id] = { pathAvailable: [], expectedReach: [] };
  });

  // Calculate FM village reach based on documented formula:
  // reach_FM_village(a) = 0.55 * (a + (1 - a) * 0.25)
  const fmVillageReach = config.channels.fm.radioShare * (
    autoTuneLevel + (1 - autoTuneLevel) * config.channels.fm.existingListenerShare
  );

  for (let h = 0; h < hours; h++) {
    // Grid power outage is modeled explicitly:
    // Out from h=0 to h=48. Recovers at h >= 48 UNLESS marked as permanent failure.
    const gridPowerUp = (h >= config.s72.gridReturnH) && !isPermanentPower;
    // Generator runs for generatorRuntimeH if deployed
    const generatorUp = interventions.backup_generation && (h < config.s72.generatorRuntimeH);
    // Mobile broadcast unit arrives at hour 24 and stays on-air
    const mobileUnitUp = interventions.mobile_broadcast_unit && (h >= config.s72.mobileUnitArrivalH);

    // FM transmitter is on-air if:
    // 1) Mobile broadcast unit is active (independent of fixed FM Tx & grid power), OR
    // 2) Fixed FM Tx is operational (!effectiveFailures.fm_tx) AND has power (gridPowerUp OR generatorUp)
    const fixedTxWorking = !effectiveFailures.fm_tx;
    const fixedTxPowered = gridPowerUp || generatorUp;
    const fmOnAir = mobileUnitUp || (fixedTxWorking && fixedTxPowered);

    const villagePaths: Record<string, boolean> = {};
    const villageReach: Record<string, number> = {};

    config.villages.forEach(v => {
      let pathAvailable = false;
      let reach = 0;

      // FM broadcast coverage
      if (v.fm && fmOnAir) {
        pathAvailable = true;
        reach = Math.max(reach, fmVillageReach);
      }

      // Community receiver kit deployment (Thoni & Hill Camp)
      if (interventions.community_kits.includes(v.id)) {
        pathAvailable = true;
        reach = Math.max(reach, config.channels.communityKit.reachS72);
      }

      // Siren responder patrol
      if (interventions.siren_responders.includes(v.id)) {
        pathAvailable = true;
        reach = Math.max(reach, config.channels.siren.reachS72);
      }

      // Mesh relay node deployment
      if (interventions.relay_nodes.includes(v.id)) {
        pathAvailable = true;
        reach = Math.max(reach, config.channels.relay.reachS72);
      }

      villagePaths[v.id] = pathAvailable;
      villageReach[v.id] = reach;

      villageSeries[v.id].pathAvailable.push(pathAvailable);
      villageSeries[v.id].expectedReach.push(reach);
    });

    steps.push({
      hour: h,
      gridPowerUp,
      generatorUp,
      mobileUnitUp,
      fmOnAir,
      villagePaths,
      villageReach
    });
  }

  // Derive summary metrics dynamically from the actual dependency graph status
  const illusionStatuses = calculateRedundancyIllusion(config, effectiveFailures, interventions);
  const illusionMap = new Map(illusionStatuses.map(s => [s.villageId, s]));

  const villagesSummary: S72VillageSummary[] = config.villages.map(v => {
    const availableSteps = villageSeries[v.id].pathAvailable.filter(Boolean).length;
    const silenceHours = hours - availableSteps;
    const avgReach = villageSeries[v.id].expectedReach.reduce((s, r) => s + r, 0) / hours;
    const lowServiceHours = villageSeries[v.id].expectedReach.filter(r => r < config.metrics.lowServiceThreshold).length;

    const st = illusionMap.get(v.id);
    const nominalChannels = st?.nominalCount ?? ((v.tower ? 1 : 0) + (v.fm ? 1 : 0) + (v.meshNode ? 1 : 0));
    const availableChannelsNow = st?.availableCount ?? (v.fm ? 1 : 0);
    const n1Guaranteed = st?.n1Guaranteed ?? 0;

    return {
      id: v.id,
      name: v.name,
      pop: v.pop,
      pathAvailableHours: availableSteps,
      silenceHours,
      lowServiceHours,
      timeAvgReach: avgReach,
      nominalChannels,
      availableChannelsNow,
      n1Guaranteed
    };
  });

  // Population-weighted average reach across entire 72h window
  const totalWeightedReach = villagesSummary.reduce((s, v) => s + (v.pop * v.timeAvgReach), 0);
  const overallReach = (totalWeightedReach / totalPop) * 100;

  // Find lowest served village
  let lowest = villagesSummary[0];
  villagesSummary.forEach(v => {
    if (v.timeAvgReach < lowest.timeAvgReach) {
      lowest = v;
    }
  });

  const silenceByVillage: Record<string, number> = {};
  villagesSummary.forEach(v => {
    silenceByVillage[v.id] = v.silenceHours;
  });

  return {
    overallReach: Number(overallReach.toFixed(2)),
    minVillageReach: { id: lowest.id, name: lowest.name, value: Number((lowest.timeAvgReach * 100).toFixed(2)) },
    steps,
    villages: villagesSummary,
    silenceByVillage,
    sirenPatrolAssumption: config.channels.siren.disclaimer
  };
}
