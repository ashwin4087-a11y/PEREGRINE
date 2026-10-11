/**
 * PEREGRINE — Redundancy Illusion Page (Section 9)
 * Detects common-cause dependencies across nominally diverse broadcast channels.
 */

import React from 'react';
import { SystemConfig } from '../model/config';
import { VillageChannelStatus } from '../model/types';
import { RedundancyIllusionPanel } from '../components/redundancy-illusion/RedundancyIllusionPanel';

interface RedundancyPageProps {
  config: SystemConfig;
  statusList: VillageChannelStatus[];
  selectedVillageId: string | null;
  onSelectVillage: (id: string) => void;
}

export const RedundancyPage: React.FC<RedundancyPageProps> = ({
  config,
  statusList,
  selectedVillageId,
  onSelectVillage
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Redundancy Illusion Audit
            </h2>
            <span className="stamp-label stamp-warning">DEPENDENCY GRAPH AUDIT</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Counts channels honestly by inspecting shared upstream power, backhaul, and gateway dependencies.
          </p>
        </div>
      </div>

      <RedundancyIllusionPanel
        statusList={statusList}
        villages={config.villages}
        onSelectVillage={onSelectVillage}
        selectedVillageId={selectedVillageId}
      />

      <div className="utility-card p-5 sm:p-6 space-y-3 rounded-[4px] border border-[var(--border)]">
        <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase tracking-wide">
          Mathematical Graph Proof: The East Power Common-Cause Failure
        </h4>
        <div className="text-xs font-mono-numbers text-[var(--ink)] space-y-2.5 leading-relaxed">
          <p>
            1. <strong>Nominal Configuration</strong>: Karai, Uppalam, Sagar are listed with 3 channels: Cell Broadcast, FM Radio, and Shelter Mesh.
          </p>
          <p>
            2. <strong>Shared Dependency</strong>: Cell relies on Tower B powered by <code>power_east</code>. FM Transmitter relies on <code>power_east</code>.
          </p>
          <p>
            3. <strong>Cascade Impact</strong>: A single fault at East Power knocks out both Cell and FM simultaneously.
            The N-1 guaranteed channel count drops to strictly <strong>1</strong> (mesh only), showing that under these assumptions, having multiple nominal channel icons does not equal independent physical resilience.
          </p>
        </div>
      </div>
    </div>
  );
};
