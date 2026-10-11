/**
 * PEREGRINE — Outage Matrix Page (Section 6.5 & 6.6)
 * 12-cell restoration benchmark comparing infrastructure recovery plans across auto-tune adoption curves.
 */

import React from 'react';
import { SystemConfig } from '../model/config';
import { ActiveInterventions } from '../model/types';
import { OutagePlanMatrix } from '../components/outage-matrix/OutagePlanMatrix';

interface OutageMatrixPageProps {
  config: SystemConfig;
  onSelectPlan: (interventions: ActiveInterventions, planName: string) => void;
}

export const OutageMatrixPage: React.FC<OutageMatrixPageProps> = ({
  config,
  onSelectPlan
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              72-Hour Outage Plan Matrix
            </h2>
            <span className="stamp-label stamp-simulation">S72 MODEL</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            12-cell restoration benchmark comparing backup generation, mobile transmission units, and auto-tune listener adoption.
          </p>
        </div>
      </div>

      <OutagePlanMatrix
        config={config}
        onSelectPlan={onSelectPlan}
      />
    </div>
  );
};
