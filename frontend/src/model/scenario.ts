/**
 * PEREGRINE — Scenario State Factories & Dependency Impact Analysis
 * Centralised, pure functions managing disaster scenario presets,
 * active failure enumeration, component status labels, and dependency summaries.
 */

import { NetworkFailureState, ActiveInterventions } from './types';
import { createDefaultFailures } from './graph';

export interface ActiveFailureDetail {
  key: keyof NetworkFailureState;
  label: string;
  category: 'POWER' | 'BACKBONE' | 'TRANSMITTER' | 'GATEWAY' | 'MESH';
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
  impact: string;
}

export interface ScenarioSummary {
  scenarioName: 'Healthy Baseline' | 'Cyclone Landfall' | 'Gateway Loss' | 'Custom Compound Outage';
  status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
  headline: string;
  activeFailureCount: number;
  causes: string[];
  mitigations: string[];
}

/**
 * 1. Healthy Network: Clears all simulated failures to pristine baseline.
 */
export function applyHealthyPreset(): NetworkFailureState {
  return createDefaultFailures();
}

/**
 * 2. Cyclone Scenario: Applies documented compound landfall (Power West + Power East + Fibre).
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
 * 3. Gateway Loss: Cyclone landfall plus loss of primary alert-ingestion satellite gateway.
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

/**
 * 4. Toggles a single failure key safely without mutating other fields.
 */
export function toggleFailureNode(
  failures: NetworkFailureState,
  key: keyof NetworkFailureState
): NetworkFailureState {
  return {
    ...failures,
    [key]: !failures[key]
  };
}

/**
 * 5. Returns a structured list of all currently active failures with categories and impacts.
 */
export function getActiveFailuresList(
  failures: NetworkFailureState,
  interventions?: ActiveInterventions
): ActiveFailureDetail[] {
  const list: ActiveFailureDetail[] = [];

  if (failures.power_west) {
    list.push({
      key: 'power_west',
      label: 'West Grid (Tower A)',
      category: 'POWER',
      status: 'UNAVAILABLE',
      impact: 'Trips Tower A grid power; severs Cell Broadcast for Kovalam, Pazhaya, and Marina.'
    });
  }

  if (failures.power_east) {
    const isMitigated = Boolean(interventions?.backup_generation);
    list.push({
      key: 'power_east',
      label: 'East Grid (Tower B / FM)',
      category: 'POWER',
      status: isMitigated ? 'DEGRADED' : 'UNAVAILABLE',
      impact: isMitigated
        ? 'East grid offline, but sustained by active backup generators.'
        : 'Common-cause cut: takes down Cell Tower B and fixed FM transmitter simultaneously.'
    });
  }

  if (failures.fibre) {
    list.push({
      key: 'fibre',
      label: 'Core Fibre Backhaul',
      category: 'BACKBONE',
      status: 'UNAVAILABLE',
      impact: 'Correlated backhaul failure: cuts Cell Broadcast across both Tower A and Tower B (18,400 people).'
    });
  }

  if (failures.tower_A) {
    list.push({
      key: 'tower_A',
      label: 'Cell Tower A (North)',
      category: 'TRANSMITTER',
      status: 'UNAVAILABLE',
      impact: 'Tower structure offline; drops Cell Broadcast for Kovalam, Pazhaya, and Marina.'
    });
  }

  if (failures.tower_B) {
    list.push({
      key: 'tower_B',
      label: 'Cell Tower B (South)',
      category: 'TRANSMITTER',
      status: 'UNAVAILABLE',
      impact: 'Tower structure offline; drops Cell Broadcast for Karai, Uppalam, and Sagar.'
    });
  }

  if (failures.fm_tx) {
    const isMitigated = Boolean(interventions?.mobile_broadcast_unit);
    list.push({
      key: 'fm_tx',
      label: 'Fixed FM Transmitter',
      category: 'TRANSMITTER',
      status: isMitigated ? 'DEGRADED' : 'UNAVAILABLE',
      impact: isMitigated
        ? 'Fixed transmitter faulted, but on-air coverage restored by Mobile Broadcast Unit.'
        : 'Fixed 102.4 MHz transmitter offline; all 6 covered settlements lose FM radio reception.'
    });
  }

  if (failures.gateway) {
    const isMitigated = Boolean(interventions?.second_gateway && !failures.gateway_backup);
    list.push({
      key: 'gateway',
      label: 'Marina Sat Gateway',
      category: 'GATEWAY',
      status: isMitigated ? 'DEGRADED' : 'UNAVAILABLE',
      impact: isMitigated
        ? 'Primary gateway offline, but mesh feed preserved by Redundant Satellite Gateway.'
        : 'Single point of failure: cuts external alert ingestion for all 6 mesh-connected shelters.'
    });
  }

  if (failures.mesh_nodes_down && failures.mesh_nodes_down.length > 0) {
    failures.mesh_nodes_down.forEach(nodeId => {
      list.push({
        key: 'mesh_nodes_down',
        label: `Shelter Mesh (${nodeId.toUpperCase()})`,
        category: 'MESH',
        status: 'UNAVAILABLE',
        impact: `Local mesh node offline; breaks hop relay continuity through ${nodeId}.`
      });
    });
  }

  return list;
}

/**
 * 6. Derives an authoritative scenario summary explaining root causes, status, and active mitigations.
 */
export function getScenarioSummary(
  failures: NetworkFailureState,
  interventions: ActiveInterventions
): ScenarioSummary {
  const activeList = getActiveFailuresList(failures, interventions);
  const activeFailureCount = activeList.length;

  const causes: string[] = [];
  const mitigations: string[] = [];

  // Identify scenario identity
  let scenarioName: ScenarioSummary['scenarioName'] = 'Custom Compound Outage';
  let status: ScenarioSummary['status'] = 'OPERATIONAL';
  let headline = 'All primary power grids, fibre backhaul, and broadcast transmitters are operating normally.';

  const isHealthy = activeFailureCount === 0;
  const isCyclone = failures.power_west && failures.power_east && failures.fibre && !failures.gateway && !failures.tower_A && !failures.tower_B && !failures.fm_tx;
  const isGatewayLoss = failures.power_west && failures.power_east && failures.fibre && failures.gateway;

  if (isHealthy) {
    scenarioName = 'Healthy Baseline';
    status = 'OPERATIONAL';
    headline = 'Healthy Baseline: 100% of nominal channels available with 0 silence hours across all 8 communities.';
  } else if (isGatewayLoss) {
    scenarioName = 'Gateway Loss';
    status = interventions.second_gateway ? 'DEGRADED' : 'CRITICAL';
    headline = interventions.second_gateway
      ? 'Gateway Loss Mitigated: Redundant gateway sustains mesh broadcast despite severed Marina primary link.'
      : 'Critical Alert Blackout: Primary satellite gateway severed. All 6 mesh shelters lose external feed (0% reach).';
  } else if (isCyclone) {
    scenarioName = 'Cyclone Landfall';
    status = 'DEGRADED';
    headline = 'Cyclone Landfall: Correlated terrestrial power cuts and fibre severed; network sustains warning reach via Shelter Mesh.';
  } else {
    scenarioName = 'Custom Compound Outage';
    status = failures.gateway && !interventions.second_gateway ? 'CRITICAL' : 'DEGRADED';
    headline = `Custom Fault State: ${activeFailureCount} infrastructure failure${activeFailureCount === 1 ? '' : 's'} active.`;
  }

  // Enumerate causes
  if (failures.power_west) causes.push('West Grid tripped: Tower A Cell Broadcast down');
  if (failures.power_east) {
    causes.push(
      interventions.backup_generation
        ? 'East Grid tripped (Mitigated: Backup generators active)'
        : 'East Grid tripped: Tower B Cell and FM transmitter cut simultaneously'
    );
  }
  if (failures.fibre) causes.push('Core Fibre severed: Cell Broadcast lost for both Tower A & Tower B');
  if (failures.tower_A) causes.push('Tower A structural collapse: Northern cell coverage lost');
  if (failures.tower_B) causes.push('Tower B structural collapse: Southern cell coverage lost');
  if (failures.fm_tx) {
    causes.push(
      interventions.mobile_broadcast_unit
        ? 'Fixed FM transmitter faulted (Mitigated: Mobile Unit deployed)'
        : 'Fixed FM transmitter offline: 102.4 MHz coverage lost'
    );
  }
  if (failures.gateway) {
    causes.push(
      interventions.second_gateway
        ? 'Marina Gateway lost (Mitigated: 2nd Gateway active)'
        : 'Marina Gateway lost: Mesh external broadcast ingestion collapsed'
    );
  }

  // Enumerate active mitigations
  if (interventions.backup_generation) mitigations.push('Backup generation: Powering East Grid transmitters');
  if (interventions.mobile_broadcast_unit) mitigations.push('Mobile FM unit: On-air replacement transmitter');
  if (interventions.second_gateway) mitigations.push('Redundant Gateway: Autonomous secondary satellite uplink');
  if (interventions.relay_nodes.length > 0) mitigations.push(`Relay nodes deployed: ${interventions.relay_nodes.join(', ')}`);
  if (interventions.siren_responders.length > 0) mitigations.push(`Acoustic siren responders active: ${interventions.siren_responders.join(', ')}`);
  if (interventions.community_kits.length > 0) mitigations.push(`Community satellite kits active: ${interventions.community_kits.join(', ')}`);

  return {
    scenarioName,
    status,
    headline,
    activeFailureCount,
    causes,
    mitigations
  };
}
