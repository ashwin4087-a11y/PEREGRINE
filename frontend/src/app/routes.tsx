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
    id: 'failure_analysis', 
    label: 'Failure Analysis', 
    shortLabel: 'Failure Analysis', 
    description: 'Dependency graph audit, common-cause cuts & stress experiments',
    icon: Layers 
  },
  { 
    id: 'recovery_planner', 
    label: 'Recovery Planner', 
    shortLabel: 'Recovery Planner', 
    description: 'Fairness-constrained decision engine & 72h outage restoration matrix',
    icon: Scale 
  },
] as const;

export type NavTabId = (typeof NAV_ITEMS)[number]['id'];
