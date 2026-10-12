import React from 'react';
import { SystemConfig } from '../model/config';
import { NetworkFailureState, S30Result, S72Result } from '../model/types';
import { ExperimentLogView } from '../components/experiments/ExperimentLogView';
import { SensitivityPanel } from '../components/experiments/SensitivityPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

interface StressBaselinesPageProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  s30Result: S30Result;
  s72Result: S72Result;
  onUpdateConfig: (updated: SystemConfig) => void;
}

export const StressBaselinesPage: React.FC<StressBaselinesPageProps> = ({
  config,
  failures,
  s30Result,
  s72Result,
  onUpdateConfig
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stress Benchmarks & Sensitivity Analysis"
        category="Robustness & Empirical Testing"
        description="Formal baseline comparisons (A, B, C vs PEREGRINE), ±30% multi-parameter input sensitivity stress-testing, and reproducible audit slips with cryptographic checksums."
        statusBadge={
          <StatusBadge
            status="operational"
            label="Deterministic Stress Bench"
          />
        }
      />

      {/* SECTION A: Baseline Architecture Comparison */}
      <ExperimentLogView
        section="A"
        config={config}
        s30Score={s30Result.resilienceScore}
        s72Reach={s72Result.overallReach}
        silenceCount={s72Result.villages.filter(v => v.silenceHours === 72).length}
        budgetUnits={config.planning.defaultBudget}
        failures={failures}
      />

      {/* SECTION B: Sensitivity Parameters and Scenario Execution */}
      <SensitivityPanel config={config} onUpdateConfig={onUpdateConfig} />

      {/* SECTION C: Experiment Results, Conclusions, and Reproducibility */}
      <ExperimentLogView
        section="C"
        config={config}
        s30Score={s30Result.resilienceScore}
        s72Reach={s72Result.overallReach}
        silenceCount={s72Result.villages.filter(v => v.silenceHours === 72).length}
        budgetUnits={config.planning.defaultBudget}
        failures={failures}
      />
    </div>
  );
};
