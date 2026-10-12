import React from 'react';
import { SystemConfig } from '../model/config';
import { NetworkFailureState, ActiveInterventions } from '../model/types';
import { DecisionEngineView } from '../components/planner/DecisionEngineView';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

interface DecisionEnginePageProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  autoTune?: number;
  onApplyPlan?: (interventions: ActiveInterventions, planName: string) => void;
}

export const DecisionEnginePage: React.FC<DecisionEnginePageProps> = ({
  config,
  failures,
  autoTune = 0.5,
  onApplyPlan
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery Decision Engine: Dual-Objective Optimizer"
        category="Optimization & Resource Allocation"
        description="Dual-objective recovery planner evaluating unconstrained reach maximization against an enforced community fairness floor, backed by 2^N combinatorial optimization."
        statusBadge={
          <StatusBadge
            status="operational"
            label="Pareto Optimizer"
          />
        }
      />

      <DecisionEngineView 
        config={config} 
        failures={failures} 
        autoTune={autoTune}
        onApplyPlan={onApplyPlan}
      />
    </div>
  );
};
