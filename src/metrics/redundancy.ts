/**
 * PEREGRINE — Redundancy Illusion Metric (Section 9)
 * Detects hidden single points of failure across nominally diverse channels.
 * Calculates: Nominal Channels vs Available Channels vs N-1 Guaranteed Channels.
 */

import { SystemConfig } from '../model/config';
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

    // Compute N-1 guaranteed: min available channels after 1 additional active node failure
    let worstRemaining = availableList.length;
    const currentlyUpNodes = CRITICAL_FAILURE_NODES.filter(n => !failures[n as keyof NetworkFailureState]);

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
