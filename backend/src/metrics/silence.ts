/**
 * PEREGRINE — Silence Clock Metrics (Section 8)
 * Quantifies blackout duration: cumulative hours where communities have zero surviving broadcast paths.
 */

/**
 * Calculates silence hours for a village given total scenario hours and active path hours.
 */
export function computeSilenceHours(totalScenarioHours: number, pathAvailableHours: number): number {
  return Math.max(0, totalScenarioHours - pathAvailableHours);
}

/**
 * Calculates total population experiencing complete communication blackout for all scenario hours.
 */
export function computeTotalSilentPopulation(
  villages: Array<{ pop: number; silenceHours: number }>,
  totalScenarioHours: number = 72
): number {
  return villages
    .filter(v => v.silenceHours >= totalScenarioHours)
    .reduce((sum, v) => sum + v.pop, 0);
}

/**
 * Calculates hours where expected reach falls below low-service threshold.
 */
export function computeLowServiceHours(
  stepReaches: number[],
  lowServiceThreshold: number = 0.25
): number {
  return stepReaches.filter(reach => reach < lowServiceThreshold).length;
}

export interface OutageInterval {
  startHour: number; // 0..71
  endHour: number;   // 1..72
  durationHours: number;
  label?: string;
}

export interface HourlyTimelineSlot {
  hour: number;
  pathAvailable: boolean;
  expectedReach: number;
  status: 'AVAILABLE' | 'DEGRADED' | 'SILENCE';
}

export interface VillageSilenceTimelineAnalysis {
  villageId: string;
  totalSilenceHours: number;
  continuousSilenceDuration: number;
  longestSilencePeriod: number;
  outageIntervals: OutageInterval[];
  hourlyStatus: HourlyTimelineSlot[];
}

/**
 * Computes contiguous silence outage intervals from hourly path availability flags.
 */
export function computeOutageIntervals(pathAvailable: boolean[]): OutageInterval[] {
  const intervals: OutageInterval[] = [];
  let inOutage = false;
  let startHour = 0;

  for (let h = 0; h < pathAvailable.length; h++) {
    const isSilent = !pathAvailable[h];
    if (isSilent && !inOutage) {
      inOutage = true;
      startHour = h;
    } else if (!isSilent && inOutage) {
      inOutage = false;
      intervals.push({
        startHour,
        endHour: h,
        durationHours: h - startHour
      });
    }
  }

  if (inOutage) {
    intervals.push({
      startHour,
      endHour: pathAvailable.length,
      durationHours: pathAvailable.length - startHour
    });
  }

  return intervals;
}

/**
 * Analyzes the complete 72-hour timeline for a village:
 * - Distinguishes AVAILABLE, DEGRADED, and SILENCE periods
 * - Calculates total silence hours, continuous initial silence duration, and longest uninterrupted silence period
 * - Identifies boundaries of each modeled outage interval
 */
export function analyzeVillageSilenceTimeline(
  villageId: string,
  pathAvailable: boolean[],
  expectedReach: number[],
  lowServiceThreshold: number = 0.25
): VillageSilenceTimelineAnalysis {
  const intervals = computeOutageIntervals(pathAvailable);

  const totalSilenceHours = intervals.reduce((sum, inv) => sum + inv.durationHours, 0);
  const longestSilencePeriod = intervals.length > 0
    ? Math.max(...intervals.map(inv => inv.durationHours))
    : 0;

  // Continuous silence starting at hour 0 (initial uninterrupted outage duration until first recovery)
  const continuousSilenceDuration = intervals.length > 0 && intervals[0].startHour === 0
    ? intervals[0].durationHours
    : 0;

  const hourlyStatus: HourlyTimelineSlot[] = pathAvailable.map((avail, hour) => {
    const reach = expectedReach[hour] ?? 0;
    let status: 'AVAILABLE' | 'DEGRADED' | 'SILENCE';
    if (!avail || reach <= 0) {
      status = 'SILENCE';
    } else if (reach < lowServiceThreshold) {
      status = 'DEGRADED';
    } else {
      status = 'AVAILABLE';
    }
    return { hour, pathAvailable: avail, expectedReach: reach, status };
  });

  return {
    villageId,
    totalSilenceHours,
    continuousSilenceDuration,
    longestSilencePeriod,
    outageIntervals: intervals,
    hourlyStatus
  };
}

export interface VillageInterventionEffect {
  type: 'community_kit' | 'siren_responder' | 'relay_node' | 'backup_generation' | 'mobile_broadcast_unit' | 'second_gateway';
  label: string;
  isActive: boolean;
  effectDescription: string;
  applicableToVillage: boolean;
}

export interface VillageIsolationExplanation {
  villageId: string;
  villageName: string;
  population: number;
  tier: 'TIER_1_INFRASTRUCTURE' | 'TIER_2_ISOLATED';
  tierLabel: string;
  isCompletelySilent: boolean;
  isolationSummary: string;
  underlyingDependencies: string[];
  activeMitigations: string[];
  supportedInterventions: VillageInterventionEffect[];
}

/**
 * Derives a traceable explanation of why a settlement experiences silence
 * and which implemented interventions can mitigate it.
 */
export function explainVillageIsolation(
  village: { id: string; name: string; pop: number; tower: 'A' | 'B' | null; fm: boolean; meshNode: boolean },
  failures: { power_west: boolean; power_east: boolean; fibre: boolean; fm_tx: boolean; gateway: boolean; power_east_permanent?: boolean },
  interventions: {
    backup_generation: boolean;
    mobile_broadcast_unit: boolean;
    second_gateway: boolean;
    community_kits: string[];
    siren_responders: string[];
    relay_nodes: string[];
  },
  silenceHours: number
): VillageIsolationExplanation {
  const isTier2 = !village.tower && !village.fm && !village.meshNode;
  const isCompletelySilent = silenceHours >= 72;

  const underlyingDependencies: string[] = [];
  const activeMitigations: string[] = [];
  const supportedInterventions: VillageInterventionEffect[] = [];

  if (isTier2) {
    underlyingDependencies.push(
      'Zero Cellular Coverage: High ridge terrain shadowing prevents line-of-sight reception from Cell Towers A & B.'
    );
    underlyingDependencies.push(
      'Outside FM Broadcast Contour: Settlement coordinates lie outside the primary 102.4 MHz transmitter coverage footprint.'
    );
    underlyingDependencies.push(
      'No Shelter Mesh Infrastructure: Hamlet lacks a pre-positioned digital mesh radio node and auxiliary battery bank.'
    );

    // Interventions applicable to Tier 2:
    const hasKit = interventions.community_kits.includes(village.id);
    const hasSiren = interventions.siren_responders.includes(village.id);
    const hasRelay = interventions.relay_nodes.includes(village.id);

    if (hasKit) activeMitigations.push('Targeted Community Satellite Kit deployed: Restores 50% reach across all 72 hours.');
    if (hasSiren) activeMitigations.push('Acoustic Siren Responder patrol assigned: Guarantees 25% physical acoustic reach.');
    if (hasRelay) activeMitigations.push('Solar Mesh Relay node deployed: Extends coastal mesh relay reach to 35%.');

    supportedInterventions.push({
      type: 'community_kit',
      label: 'Community Satellite Receiver Kit (15u)',
      isActive: hasKit,
      applicableToVillage: true,
      effectDescription: 'Deploys autonomous satellite receiver; eliminates 72h blackout by restoring 50% reach throughout the 72h window.'
    });

    supportedInterventions.push({
      type: 'siren_responder',
      label: 'Acoustic Siren Responder Patrol (10u)',
      isActive: hasSiren,
      applicableToVillage: true,
      effectDescription: 'Dispatches vehicular siren patrols providing 25% verified acoustic warning reach across 72 hours.'
    });

    supportedInterventions.push({
      type: 'relay_node',
      label: 'Solar Mesh Relay Node (10u)',
      isActive: hasRelay,
      applicableToVillage: true,
      effectDescription: 'Extends shelter mesh radio network to settlement, providing 35% S72 reach.'
    });
  } else {
    // Tier 1 Infrastructure Community
    if (failures.power_east) {
      underlyingDependencies.push(
        'East Power Grid Common-Cause Dependency: The fixed 102.4 MHz FM transmitter depends strictly on East Grid substation power.'
      );
    }
    if (village.tower === 'A' && failures.power_west) {
      underlyingDependencies.push(
        'West Power Grid Dependency: Cell Tower A depends on West Grid substation power.'
      );
    }
    if (village.tower === 'B' && failures.power_east) {
      underlyingDependencies.push(
        'East Power Grid Tower Dependency: Cell Tower B depends on East Grid substation power.'
      );
    }
    if (failures.fibre) {
      underlyingDependencies.push(
        'Core Fibre Severance: Terrestrial backhaul cut prevents Cell Broadcast emergency warnings.'
      );
    }
    if (failures.power_east_permanent) {
      underlyingDependencies.push(
        'Permanent Power Collapse: Substation failure remains unrecovered beyond hour 48 without auxiliary generators.'
      );
    }

    // Interventions applicable to Tier 1:
    const hasGen = interventions.backup_generation;
    const hasMobile = interventions.mobile_broadcast_unit;
    const hasGw2 = interventions.second_gateway;

    if (hasGen) activeMitigations.push('Backup Generator deployed: Powers FM transmitter from 00:00 to 25:00 (fuel exhaustion).');
    if (hasMobile) activeMitigations.push('Mobile FM Broadcast Unit active: Operates on-air from 24:00 through 72:00.');
    if (hasGw2 && failures.gateway) activeMitigations.push('Redundant Satellite Gateway active: Preserves mesh alert ingestion.');

    supportedInterventions.push({
      type: 'backup_generation',
      label: 'Substation Backup Generator (20u)',
      isActive: hasGen,
      applicableToVillage: Boolean(village.fm),
      effectDescription: 'Powers East Grid transmitter during initial 25 hours, reducing blackout from 48h to 23h.'
    });

    supportedInterventions.push({
      type: 'mobile_broadcast_unit',
      label: 'Mobile Broadcast FM Truck (30u)',
      isActive: hasMobile,
      applicableToVillage: Boolean(village.fm),
      effectDescription: 'Arrives at hour 24 and broadcasts on-air through hour 72, ensuring continuous warning coverage.'
    });

    supportedInterventions.push({
      type: 'second_gateway',
      label: 'Redundant Satellite Gateway (40u)',
      isActive: hasGw2,
      applicableToVillage: Boolean(village.meshNode),
      effectDescription: 'Preserves mesh digital alert ingestion if primary satellite uplink at Marina is severed.'
    });
  }

  const isolationSummary = isTier2
    ? isCompletelySilent
      ? `${village.name} is in complete 72-hour blackout. It has no cell tower, no FM reception, and no shelter mesh node. Without localized satellite kits or siren patrols, 100% of residents are without modeled electronic warning paths.`
      : `${village.name} is topographically isolated, but active emergency interventions (satellite kit, siren patrol, or mesh relay) provide modeled warning coverage.`
    : isCompletelySilent
    ? `${village.name} is in complete 72-hour blackout due to compound infrastructure failure (power loss, severed fibre backhaul, or transmitter fault) extending through the entire evaluation window.`
    : silenceHours > 0
    ? `${village.name} experiences ${silenceHours} hours of blackout while utility power is offline. Warning reception resumes when grid power returns at hour 48 (or when backup generation / mobile units operate).`
    : `${village.name} has continuous warning coverage across the 72-hour window thanks to active auxiliary generation or mobile broadcast deployments.`;

  return {
    villageId: village.id,
    villageName: village.name,
    population: village.pop,
    tier: isTier2 ? 'TIER_2_ISOLATED' : 'TIER_1_INFRASTRUCTURE',
    tierLabel: isTier2 ? 'Tier 2: Topographically Isolated Settlement' : 'Tier 1: Coastal Infrastructure Hub',
    isCompletelySilent,
    isolationSummary,
    underlyingDependencies,
    activeMitigations,
    supportedInterventions
  };
}

