/**
 * PEREGRINE — Application Navigation Routes & Views Specification
 * Defines tab identifiers, labels, icons, and descriptions for all 7 application modules.
 */

import { 
  Activity, 
  Clock, 
  Layers, 
  Scale, 
  Calendar, 
  Key, 
  Sliders,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS = [
  { 
    id: 'overview', 
    label: 'Overview & Topology', 
    shortLabel: 'Overview', 
    description: 'Infrastructure network, cut-path diagram & cascading fault toggles',
    icon: Activity 
  },
  { 
    id: 'silence', 
    label: 'Silence Clock', 
    shortLabel: 'Silence Clock', 
    description: 'Human impact metric & per-village warning blackout durations',
    icon: Clock 
  },
  { 
    id: 'illusion', 
    label: 'Redundancy Illusion', 
    shortLabel: 'Redundancy', 
    description: 'Dependency graph audit uncovering single-point common-cause cuts',
    icon: Layers 
  },
  { 
    id: 'planner', 
    label: 'Decision Engine', 
    shortLabel: 'Decision Engine', 
    description: 'Algorithmic recovery planner with enforced community fairness floor',
    icon: Scale 
  },
  { 
    id: 'matrix', 
    label: '72h Outage Matrix', 
    shortLabel: 'Outage Matrix', 
    description: '12-cell restoration benchmark across auto-tune adoption curves',
    icon: Calendar 
  },
  { 
    id: 'audit', 
    label: 'Cryptography', 
    shortLabel: 'Cryptography', 
    description: 'Real ECDSA P-256 signatures, SHA-256 verification & siren alerts',
    icon: Key 
  },
  { 
    id: 'experiments', 
    label: 'Stress & Baselines', 
    shortLabel: 'Stress & Baselines', 
    description: 'Reproducible experiment runs, sensitivity sliders & audit slips',
    icon: Sliders 
  },
] as const;

export type NavTabId = (typeof NAV_ITEMS)[number]['id'];
