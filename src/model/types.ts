/**
 * PEREGRINE — Core System & Network Model Types
 * Defines data contracts for nodes, channels, topology, failures, and simulation outputs.
 */

import { VillageConfig } from './config';

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

export interface ActiveInterventions {
  backup_generation: boolean;
  mobile_broadcast_unit: boolean;
  second_gateway: boolean;
  relay_nodes: string[];       // village IDs
  siren_responders: string[];   // village IDs
  community_kits: string[];     // village IDs (Thoni, Hill Camp)
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

export interface S30VillageMetric {
  id: string;
  name: string;
  pop: number;
  effectiveReach: number;
  arrivalMin: number;
  contribution: number;
  activeChannels: ChannelType[];
  meshHops: number | null;
}

export interface S30Result {
  resilienceScore: number;       // 0 to 100%
  cellOnlyResilience: number;    // 0 to 100%
  allChannelsResilience: number; // 0 to 100%
  planResilience: number;        // 0 to 100% (honest fresh evaluation, NO arbitrary multiplier)
  villageMetrics: S30VillageMetric[];
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
