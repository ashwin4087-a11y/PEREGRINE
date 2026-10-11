/**
 * PEREGRINE — Sensitivity Analysis Engine (Section 11.3)
 * "Challenge Our Assumptions": Evaluates if ranking conclusions hold under ±30% parameter perturbation.
 */

import { SystemConfig } from '../model/config';
import { simulateS72, createEmptyInterventions } from '../model/graph';
import { SensitivityParameters, SensitivityTrialResult } from './types';

/**
 * Runs a 3-way restoration sensitivity trial (Generator vs Mobile Unit vs Combined)
 * with perturbed configuration parameters.
 */
export function evaluateSensitivityTrial(
  baseConfig: SystemConfig,
  params: SensitivityParameters,
  autoTune: number = 0.5
): SensitivityTrialResult {
  const dynamicConfig: SystemConfig = {
    ...baseConfig,
    channels: {
      ...baseConfig.channels,
      fm: {
        ...baseConfig.channels.fm,
        radioShare: params.radioShare,
        existingListenerShare: params.existingListenerShare
      }
    },
    s72: {
      ...baseConfig.s72,
      generatorRuntimeH: params.generatorRuntimeH,
      mobileUnitArrivalH: params.mobileUnitArrivalH,
      gridReturnH: params.gridReturnH
    }
  };

  const empty = createEmptyInterventions();
  const simGenOnly = simulateS72(dynamicConfig, { ...empty, backup_generation: true }, autoTune);
  const simMobileOnly = simulateS72(dynamicConfig, { ...empty, mobile_broadcast_unit: true }, autoTune);
  const simBoth = simulateS72(dynamicConfig, { ...empty, backup_generation: true, mobile_broadcast_unit: true }, autoTune);

  return {
    params,
    genOnlyOverallReach: simGenOnly.overallReach,
    mobileOnlyOverallReach: simMobileOnly.overallReach,
    bothOverallReach: simBoth.overallReach
  };
}

export interface HeadlineRobustnessTrial {
  sirenReach: number;
  kitReach: number;
  radioShare: number;
  genRuntime: number;
  planAReach: number;
  planBReach: number;
  thoniPlanAReach: number;
  thoniPlanBReach: number;
  fairnessCost: number;
}

export interface HeadlineRobustnessResult {
  totalTrials: number;
  smallestVillagesAbandonedCount: number;
  conclusionHolds: boolean;
  fairnessCostMin: number;
  fairnessCostMax: number;
  averageFairnessCost: number;
  trials: HeadlineRobustnessTrial[];
}

import { runPlanner } from '../planner/engine';
import { NetworkFailureState } from '../model/types';

/**
 * Robustness check: varies siren reach, community-kit reach, radio share,
 * and generator runtime by ±30% and tests whether Plan A always leaves smallest villages behind.
 */
export function evaluateHeadlineFairnessRobustness(
  baseConfig: SystemConfig,
  cycloneFailures: NetworkFailureState,
  budget: number = 50,
  autoTune: number = 0.5
): HeadlineRobustnessResult {
  const sirenVals = [
    Number((baseConfig.channels.siren.reachS72 * 0.7).toFixed(3)),
    Number((baseConfig.channels.siren.reachS72 * 1.3).toFixed(3))
  ];
  const kitVals = [
    Number((baseConfig.channels.communityKit.reachS72 * 0.7).toFixed(3)),
    Number((baseConfig.channels.communityKit.reachS72 * 1.3).toFixed(3))
  ];
  const radioVals = [
    Number((baseConfig.channels.fm.radioShare * 0.7).toFixed(3)),
    Number((baseConfig.channels.fm.radioShare * 1.3).toFixed(3))
  ];
  const genVals = [
    Math.round(baseConfig.s72.generatorRuntimeH * 0.7),
    Math.round(baseConfig.s72.generatorRuntimeH * 1.3)
  ];

  const trials: HeadlineRobustnessTrial[] = [];
  let minCost = Infinity;
  let maxCost = -Infinity;
  let sumCost = 0;
  let abandonedCount = 0;

  for (const sReach of sirenVals) {
    for (const kReach of kitVals) {
      for (const rShare of radioVals) {
        for (const gRun of genVals) {
          const cfg: SystemConfig = {
            ...baseConfig,
            channels: {
              ...baseConfig.channels,
              siren: { ...baseConfig.channels.siren, reachS72: sReach },
              communityKit: { ...baseConfig.channels.communityKit, reachS72: kReach },
              fm: { ...baseConfig.channels.fm, radioShare: rShare }
            },
            s72: {
              ...baseConfig.s72,
              generatorRuntimeH: gRun
            }
          };

          const planA = runPlanner(cfg, cycloneFailures, budget, 'REACH_MAX', 0, 'S72', autoTune);
          const planB = runPlanner(cfg, cycloneFailures, budget, 'FAIRNESS_FLOOR', 0.23, 'S72', autoTune);

          const thoniA = planA.perVillageOutcomes.find(v => v.id === 'thoni')?.reachAfter ?? 0;
          const thoniB = planB.perVillageOutcomes.find(v => v.id === 'thoni')?.reachAfter ?? 0;

          if (thoniA <= 0.001) {
            abandonedCount++;
          }

          const cost = Number((planA.overallReachAfter - planB.overallReachAfter).toFixed(2));
          if (cost < minCost) minCost = cost;
          if (cost > maxCost) maxCost = cost;
          sumCost += cost;

          trials.push({
            sirenReach: sReach,
            kitReach: kReach,
            radioShare: rShare,
            genRuntime: gRun,
            planAReach: planA.overallReachAfter,
            planBReach: planB.overallReachAfter,
            thoniPlanAReach: thoniA,
            thoniPlanBReach: thoniB,
            fairnessCost: cost
          });
        }
      }
    }
  }

  const totalTrials = trials.length;
  return {
    totalTrials,
    smallestVillagesAbandonedCount: abandonedCount,
    conclusionHolds: abandonedCount === totalTrials,
    fairnessCostMin: Number(minCost.toFixed(1)),
    fairnessCostMax: Number(maxCost.toFixed(1)),
    averageFairnessCost: Number((sumCost / totalTrials).toFixed(1)),
    trials
  };
}
