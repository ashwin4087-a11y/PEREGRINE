/**
 * PEREGRINE — Decision Engine Page (Section 10)
 * Dual-Objective Recovery Optimization: Reach Maximiser vs Fairness-Floor Optimizer.
 */

import React from 'react';
import { SystemConfig } from '../model/config';
import { NetworkFailureState } from '../model/types';
import { DecisionEngineView } from '../components/planner/DecisionEngineView';

interface DecisionEnginePageProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  autoTune?: number;
}

export const DecisionEnginePage: React.FC<DecisionEnginePageProps> = ({
  config,
  failures,
  autoTune = 0.5
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Recovery Decision Engine
            </h2>
            <span className="stamp-label stamp-simulation">OPTIMIZATION ALGORITHM</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Dual-objective recovery optimization comparing unconstrained reach maximization against an enforced community fairness floor.
          </p>
        </div>
      </div>

      <DecisionEngineView config={config} failures={failures} autoTune={autoTune} />
    </div>
  );
};
