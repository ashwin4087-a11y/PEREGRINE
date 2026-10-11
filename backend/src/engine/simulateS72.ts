/**
 * PEREGRINE — S72 Simulation Engine (Sections 6.5, 6.6, 8)
 * Models 72-hour extended infrastructure failure, power grid return at hour 48,
 * generator runtime, mobile broadcast unit deployment, and Silence Clock series.
 */

import { SystemConfig } from './config';
import { 
  NetworkFailureState, 
  ActiveInterventions, 
  S72Result, 
  S72HourlyStep, 
  S72VillageSummary 
} from './types';
import { createDefaultFailures } from './graph';
import { calculateRedundancyIllusion } from '../metrics/redundancy';
import { computeFmVillageReach } from '../metrics/reach';
import { computeSilenceHours, computeLowServiceHours } from '../metrics/silence';

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
  const fmVillageReach = computeFmVillageReach(
    config.channels.fm.radioShare,
    autoTuneLevel,
    config.channels.fm.existingListenerShare
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
    const silenceHours = computeSilenceHours(hours, availableSteps);
    const avgReach = villageSeries[v.id].expectedReach.reduce((s, r) => s + r, 0) / hours;
    const lowServiceHours = computeLowServiceHours(villageSeries[v.id].expectedReach, config.metrics.lowServiceThreshold);

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
