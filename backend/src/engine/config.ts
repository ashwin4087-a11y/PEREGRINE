/**
 * PEREGRINE — Source of Truth Model Configuration
 * Centralised parameter repository as specified in Sections 6, 7, 8, 9, 10, 12.3
 * 
 * Every parameter is explicitly typed and annotated with its empirical / design status:
 * - ASSUMED: modelled scenario planning assumption (explicitly inspectable; uncited fictional simulation parameters)
 * - IMPLEMENTED: verified algorithmic implementation in PEREGRINE engine (e.g. Euclidean BFS mesh routing)
 * - MEASURED: empirically grounded benchmark with cited source (none claimed without external citations)
 */

export interface VillageConfig {
  id: string;
  name: string;
  pop: number;
  tower: 'A' | 'B' | null;
  fm: boolean;
  meshNode: boolean;
  x: number;
  y: number;
  hostsGateway?: boolean;
  description: string;
}

export interface AssumptionParam<T> {
  value: T;
  status: 'MEASURED' | 'IMPLEMENTED' | 'ASSUMED';
  rationale: string;
}

export interface SystemConfig {
  meta: {
    dataLabel: string;
    version: string;
    northStar: string;
    unresolvedDecisions: {
      q2_judging_criteria: string;
      q4_demonstration_time_limit: string;
      q19_tagline: string;
    };
  };
  villages: VillageConfig[];
  channels: {
    cell: {
      reach: number;
      arrivalMin: number;
      status: 'ASSUMED';
    };
    fm: {
      radioShare: number;
      existingListenerShare: number;
      autoTuneArrivalMin: number;
      listenerArrivalMin: number;
      status: 'ASSUMED';
    };
    mesh: {
      reach: number;
      baseMin: number;
      perHopMin: number;
      rangeUnits: number;
      status: 'IMPLEMENTED';
    };
    siren: {
      reachS30: number;
      reachS72: number;
      arrivalBaseMin: number;
      arrivalPerUnitMin: number;
      patrolIntervalHours: number;
      isContinuousPatrolAssumed: boolean;
      status: 'ASSUMED';
      disclaimer: string;
    };
    relay: {
      reachS30: number;
      reachS72: number;
      arrivalMin: number;
      status: 'ASSUMED';
    };
    communityKit: {
      reachS30: number;
      reachS72: number;
      arrivalMin: number;
      status: 'ASSUMED';
    };
  };
  planner: {
    relayArrivalMin: number;
    sirenBaseMin: number;
    sirenPerUnitMin: number;
    communityKitArrivalMin: number;
    topN: number;
  };
  s30: {
    windowMin: number;
  };
  s72: {
    hours: number;
    stepHours: number;
    generatorRuntimeH: number;
    mobileUnitArrivalH: number;
    gridReturnH: number;
    autoTuneLevels: number[];
  };
  metrics: {
    lowServiceThreshold: number;
  };
  interventionCosts: {
    _label: string;
    backup_generation: number;
    mobile_broadcast_unit: number;
    second_gateway: number;
    relay_node: number;
    siren_responder: number;
    community_kit: number;
  };
  planning: {
    defaultBudget: number;
    defaultFloor: number;
  };
}

export const INITIAL_CONFIG: SystemConfig = {
  meta: {
    dataLabel: 'FICTIONAL / MODELLED PLANNING SIMULATION',
    version: '2.2',
    northStar: 'Understand how warnings degrade, identify critical weak points, and compare recovery interventions using inspectable assumptions.',
    unresolvedDecisions: {
      q2_judging_criteria: 'Pending final IEEE BTS rubric weighting between raw reach and fairness floor equity.',
      q4_demonstration_time_limit: 'Preserving modular demo timing (3-min pitch vs 7-min deep technical review).',
      q19_tagline: 'Preserving core working title "Disaster-Resilient Broadcast Network" pending team branding sign-off.'
    }
  },
  villages: [
    {
      id: 'kovalam',
      name: 'Kovalam',
      pop: 4200,
      tower: 'A',
      fm: true,
      meshNode: true,
      x: 160,
      y: 110,
      description: 'North coastal fishing hub; primary coverage under Tower A'
    },
    {
      id: 'pazhaya',
      name: 'Pazhaya',
      pop: 1800,
      tower: 'A',
      fm: true,
      meshNode: true,
      x: 320,
      y: 90,
      description: 'North inland agricultural settlement; covered by Tower A & FM'
    },
    {
      id: 'marina',
      name: 'Marina',
      pop: 5200,
      tower: 'A',
      fm: true,
      meshNode: true,
      hostsGateway: true,
      x: 230,
      y: 220,
      description: 'Central coastal administrative centre; hosts Primary Satellite Gateway'
    },
    {
      id: 'thoni',
      name: 'Thoni',
      pop: 900,
      tower: null,
      fm: false,
      meshNode: false,
      x: 430,
      y: 170,
      description: 'Isolated tidal creek village; NO cell tower, NO FM radio reception'
    },
    {
      id: 'karai',
      name: 'Karai',
      pop: 2600,
      tower: 'B',
      fm: true,
      meshNode: true,
      x: 180,
      y: 350,
      description: 'South coastal settlement; covered by Tower B & FM'
    },
    {
      id: 'uppalam',
      name: 'Uppalam',
      pop: 3100,
      tower: 'B',
      fm: true,
      meshNode: true,
      x: 290,
      y: 410,
      description: 'South port & salt pan community; covered by Tower B & FM'
    },
    {
      id: 'hillcamp',
      name: 'Hill Camp',
      pop: 600,
      tower: null,
      fm: false,
      meshNode: false,
      x: 460,
      y: 330,
      description: 'High ridge community; terrain blocked; NO cell tower, NO FM reception'
    },
    {
      id: 'sagar',
      name: 'Sagar',
      pop: 1500,
      tower: 'B',
      fm: true,
      meshNode: true,
      x: 360,
      y: 460,
      description: 'South foothills village; covered by Tower B & FM'
    }
  ],
  channels: {
    cell: {
      reach: 0.85,
      arrivalMin: 0.2,
      status: 'ASSUMED'
    },
    fm: {
      radioShare: 0.55,
      existingListenerShare: 0.25,
      autoTuneArrivalMin: 0.2,
      listenerArrivalMin: 1.0,
      status: 'ASSUMED'
    },
    mesh: {
      reach: 0.60,
      baseMin: 0.3,
      perHopMin: 0.5,
      rangeUnits: 190,
      status: 'IMPLEMENTED'
    },
    siren: {
      reachS30: 0.80,
      reachS72: 0.50,
      arrivalBaseMin: 8,
      arrivalPerUnitMin: 0.1,
      patrolIntervalHours: 1,
      isContinuousPatrolAssumed: true,
      status: 'ASSUMED',
      disclaimer: 'Acoustic siren patrol provides high-urgency outdoor alerting. Continuous availability assumption models round-the-clock responder readiness; this does not prove indoor audibility across every dwelling.'
    },
    relay: {
      reachS30: 0.60,
      reachS72: 0.40,
      arrivalMin: 10,
      status: 'ASSUMED'
    },
    communityKit: {
      reachS30: 0.70,
      reachS72: 0.70,
      arrivalMin: 2.0,
      status: 'ASSUMED'
    }
  },
  planner: {
    relayArrivalMin: 10,
    sirenBaseMin: 8,
    sirenPerUnitMin: 0.1,
    communityKitArrivalMin: 2.0,
    topN: 3
  },
  s30: {
    windowMin: 30
  },
  s72: {
    hours: 72,
    stepHours: 1,
    generatorRuntimeH: 25,
    mobileUnitArrivalH: 24,
    gridReturnH: 48,
    autoTuneLevels: [0, 0.5, 1.0]
  },
  metrics: {
    lowServiceThreshold: 0.25
  },
  interventionCosts: {
    _label: 'Standard planning resource units (non-currency)',
    backup_generation: 20,
    mobile_broadcast_unit: 30,
    second_gateway: 40,
    relay_node: 15,
    siren_responder: 10,
    community_kit: 20
  },
  planning: {
    defaultBudget: 50,
    defaultFloor: 0.35
  }
};
