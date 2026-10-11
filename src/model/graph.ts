/**
 * PEREGRINE — Graph Dependencies and Network Topology
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
import { 
  NodeId, 
  ChannelType, 
  NetworkFailureState, 
  ActiveInterventions, 
  MeshNodeStatus, 
  MeshTopology 
} from './types';

// Re-export all types for clean API access
export * from './types';

// Re-export simulation engines and metrics for backward-compatible consumption
export { simulateS30 } from './simulateS30';
export { simulateS72 } from './simulateS72';
export * from '../metrics/redundancy';
export * from './scenario';
export * from '../metrics/silence';

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
    gateway_backup: false,
    mesh_nodes_down: []
  };
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
    const isNodeFailed = Boolean(failures.mesh_nodes_down?.includes(v.id));
    const hasHardware = Boolean(v.meshNode || interventions.relay_nodes.includes(v.id)) && !isNodeFailed;
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

    // If simulating S72 at a specific hour
    if (hourInS72 !== null) {
      const gridBack = (hourInS72 >= config.s72.gridReturnH) && !failures.power_east_permanent;
      const genRunning = interventions.backup_generation && (hourInS72 < config.s72.generatorRuntimeH);
      const mobileActive = interventions.mobile_broadcast_unit && (hourInS72 >= config.s72.mobileUnitArrivalH);
      const fixedWorking = !failures.fm_tx && (gridBack || genRunning);
      return Boolean(mobileActive || fixedWorking);
    }

    // Default static evaluation (e.g. S30 or Redundancy Illusion)
    const fixedWorking = !failures.fm_tx && (!failures.power_east || interventions.backup_generation);
    return Boolean(fixedWorking || interventions.mobile_broadcast_unit);
  }

  if (channel === 'mesh') {
    // Dynamic topology check: must have physical node and reachable path to active gateway
    const topo = computeMeshTopology(config, failures, interventions);
    const nodeStatus = topo.nodes[village.id];
    return Boolean(nodeStatus && nodeStatus.connectedToGateway);
  }

  return false;
}
