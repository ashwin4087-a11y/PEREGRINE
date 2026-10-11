/**
 * PEREGRINE — Interventions Catalogue & Mutator (Sections 10.3, 12.3)
 * Defines available emergency recovery assets, candidate filtering, and state application.
 */

import { SystemConfig } from '../model/config';
import { ActiveInterventions } from '../model/types';
import { PlannerScenarioMode } from './objectives';

export interface CandidateIntervention {
  id: string;
  label: string;
  type: keyof ActiveInterventions;
  targetVillageId?: string;
  cost: number;
  description: string;
  appliesTo: ('S72' | 'S30')[];
}

/**
 * Generates available candidate interventions derived directly from centralised configuration.
 */
export function getCandidateInterventions(
  config: SystemConfig,
  scenarioMode: PlannerScenarioMode = 'S72'
): CandidateIntervention[] {
  const costs = config.interventionCosts;

  const allCandidates: CandidateIntervention[] = [
    {
      id: 'backup_generation',
      label: 'Backup Generators (FM Tx & Tower B)',
      type: 'backup_generation',
      cost: costs.backup_generation, // 20 units
      description: 'Powers FM transmitter and Tower B for 25h after grid failure (serves 6 coastal FM villages)',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'mobile_broadcast_unit',
      label: 'Mobile Broadcast Unit',
      type: 'mobile_broadcast_unit',
      cost: costs.mobile_broadcast_unit, // 30 units
      description: 'Rapid-deploy mobile FM transmitter arriving at hour 24 (serves 6 coastal FM villages)',
      appliesTo: ['S72']
    },
    {
      id: 'second_gateway',
      label: 'Redundant Satellite Gateway',
      type: 'second_gateway',
      cost: costs.second_gateway, // 40 units
      description: 'Protects Shelter Mesh network feed against single-point failure at Marina satellite gateway',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'kit_thoni',
      label: 'Community Receiver Kit: Thoni',
      type: 'community_kits',
      targetVillageId: 'thoni',
      cost: costs.community_kit, // 20 units
      description: 'Self-powered satellite/FM direct warning kit for isolated Thoni (900 residents)',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'kit_hillcamp',
      label: 'Community Receiver Kit: Hill Camp',
      type: 'community_kits',
      targetVillageId: 'hillcamp',
      cost: costs.community_kit, // 20 units
      description: 'Self-powered solar/satellite receiver kit for isolated ridge community (600 residents)',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'siren_thoni',
      label: 'Siren Patrol: Thoni',
      type: 'siren_responders',
      targetVillageId: 'thoni',
      cost: costs.siren_responder, // 10 units
      description: 'Dispatches all-terrain responder with acoustic siren to Thoni',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'siren_hillcamp',
      label: 'Siren Patrol: Hill Camp',
      type: 'siren_responders',
      targetVillageId: 'hillcamp',
      cost: costs.siren_responder, // 10 units
      description: 'Dispatches responder unit with acoustic siren to Hill Camp ridge',
      appliesTo: ['S72', 'S30']
    },
    {
      id: 'relay_pazhaya',
      label: 'Shelter Mesh Relay: Pazhaya',
      type: 'relay_nodes',
      targetVillageId: 'pazhaya',
      cost: costs.relay_node, // 15 units
      description: 'Relay booster node bridging inland mesh cluster to Pazhaya',
      appliesTo: ['S72', 'S30']
    }
  ];

  return allCandidates.filter(c => c.appliesTo.includes(scenarioMode));
}

/**
 * Pure state mutator: applies a chosen intervention candidate to the active set.
 */
export function applyCandidateToInterventions(
  current: ActiveInterventions,
  candidate: CandidateIntervention
): ActiveInterventions {
  const next: ActiveInterventions = {
    ...current,
    relay_nodes: [...current.relay_nodes],
    siren_responders: [...current.siren_responders],
    community_kits: [...current.community_kits]
  };

  if (candidate.type === 'backup_generation') next.backup_generation = true;
  else if (candidate.type === 'mobile_broadcast_unit') next.mobile_broadcast_unit = true;
  else if (candidate.type === 'second_gateway') next.second_gateway = true;
  else if (candidate.type === 'community_kits' && candidate.targetVillageId) {
    if (!next.community_kits.includes(candidate.targetVillageId)) {
      next.community_kits.push(candidate.targetVillageId);
    }
  } else if (candidate.type === 'siren_responders' && candidate.targetVillageId) {
    if (!next.siren_responders.includes(candidate.targetVillageId)) {
      next.siren_responders.push(candidate.targetVillageId);
    }
  } else if (candidate.type === 'relay_nodes' && candidate.targetVillageId) {
    if (!next.relay_nodes.includes(candidate.targetVillageId)) {
      next.relay_nodes.push(candidate.targetVillageId);
    }
  }

  return next;
}
