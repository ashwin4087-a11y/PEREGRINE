/**
 * PEREGRINE — Stress Benchmarks & Sensitivity Analysis Page (Section 11)
 * Baseline comparisons (A, B, C vs PEREGRINE), ±30% input sensitivity stress-testing,
 * and reproducible audit slips with cryptographic checksums.
 */

import React from 'react';
import { SystemConfig } from '../model/config';
import { NetworkFailureState, S30Result, S72Result } from '../model/types';
import { ExperimentLogView } from '../components/experiments/ExperimentLogView';
import { SensitivityPanel } from '../components/experiments/SensitivityPanel';

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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-[var(--navy)] tracking-tight">
              Stress Benchmarks &amp; Sensitivity Analysis
            </h2>
            <span className="stamp-label stamp-simulation">STRESS BENCH</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            Formal baseline comparisons (A, B, C vs PEREGRINE), ±30% input sensitivity stress-testing, and reproducible audit slips.
          </p>
        </div>
      </div>

      <ExperimentLogView
        config={config}
        s30Score={s30Result.resilienceScore}
        s72Reach={s72Result.overallReach}
        silenceCount={s72Result.villages.filter(v => v.silenceHours === 72).length}
        budgetUnits={config.planning.defaultBudget}
        failures={failures}
      />

      <SensitivityPanel config={config} onUpdateConfig={onUpdateConfig} />
    </div>
  );
};
