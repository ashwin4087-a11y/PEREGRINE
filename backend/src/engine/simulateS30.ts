/**
 * PEREGRINE — S30 Simulation Engine (Sections 6.3, 7.1)
 * Simulates 30-minute rapid alert window with Euclidean mesh pathing, arrival timings, and time decay.
 * 
 * Integrity Guarantees:
 * 1. Zero arbitrary multipliers: planResilience matches authentic simulation result
 * 2. Unified scoring path for baseline and interventions
 * 3. Deterministic BFS hop calculation
 */

import { SystemConfig } from './config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  S30Result, 
  ChannelType,
  S30VillageMetric
} from './types';
import { computeMeshTopology, isChannelAvailable } from './graph';
import { computeTimeDecay, computeResilienceScore } from '../metrics/resilience';
import { computeIndependentUnionReach } from '../metrics/reach';

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

  const villageMetrics: S30VillageMetric[] = config.villages.map(v => {
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
    const combinedReach = computeIndependentUnionReach([rCell, rFM, rMesh, rSiren, rKit, rRelay]);

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
    const timeDecay = computeTimeDecay(minArrival, windowMin);
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
  const resilienceScore = computeResilienceScore(totalContribution, totalPop);

  // Unified cell-only calculation using the same decay path
  const cellContribution = config.villages.reduce((sum, v) => {
    const cellUp = isChannelAvailable('cell', v, failures, interventions, null, config);
    if (!cellUp) return sum;
    const timeDecay = computeTimeDecay(config.channels.cell.arrivalMin, windowMin);
    return sum + (v.pop * config.channels.cell.reach * timeDecay);
  }, 0);
  const cellOnlyResilience = computeResilienceScore(cellContribution, totalPop);

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
