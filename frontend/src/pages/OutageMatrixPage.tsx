import React from 'react';
import { SystemConfig } from '../model/config';
import { ActiveInterventions } from '../model/types';
import { OutagePlanMatrix } from '../components/outage-matrix/OutagePlanMatrix';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

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
      <PageHeader
        title="72-Hour Outage Plan Matrix"
        category="Restoration Analysis"
        description="12-cell restoration benchmark evaluating emergency generation, mobile broadcast units, and listener auto-tune adoption curves across an extended 72-hour utility failure."
        statusBadge={
          <StatusBadge
            status="operational"
            label="S72 Benchmark"
          />
        }
      />

      <OutagePlanMatrix
        config={config}
        onSelectPlan={onSelectPlan}
      />
    </div>
  );
};
