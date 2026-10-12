/**
 * PEREGRINE — 72-Hour Outage Plan Matrix (Section 6.5 & 6.6)
 * Compares infrastructure restoration options across auto-tune adoption levels.
 * Reproduces exact test vectors verified in Section 6.6 (Acceptance test T-S72-01).
 */

import React from 'react';
import { SystemConfig } from '../model/config';
import { simulateS72, createEmptyInterventions, ActiveInterventions } from '../model/graph';
import { Calendar, Radio, Sparkles } from 'lucide-react';

interface OutagePlanMatrixProps {
  config: SystemConfig;
  selectedPlanIndex?: number;
  onSelectPlan?: (interventions: ActiveInterventions, planName: string) => void;
}

export const OutagePlanMatrix: React.FC<OutagePlanMatrixProps> = ({
  config,
  selectedPlanIndex = 0,
  onSelectPlan
}) => {
  // Candidate plans
  const plans = [
    {
      id: 'none',
      name: 'No Investment (Grid Only)',
      onAirHours: 24,
      onAirDesc: 'FM on-air hours [48-72] once grid power returns',
      interventions: createEmptyInterventions()
    },
    {
      id: 'gen',
      name: 'Backup Generators',
      onAirHours: 49,
      onAirDesc: 'Hours [0-25] on generator + [48-72] on grid',
      interventions: {
        ...createEmptyInterventions(),
        backup_generation: true
      }
    },
    {
      id: 'mobile',
      name: 'Mobile Broadcast Unit',
      onAirHours: 48,
      onAirDesc: 'Rapid deploy arriving hour 24 [24-72]',
      interventions: {
        ...createEmptyInterventions(),
        mobile_broadcast_unit: true
      }
    },
    {
      id: 'combined',
      name: 'Generator + Mobile Unit',
      onAirHours: 72,
      onAirDesc: 'Continuous broadcast coverage [0-72]',
      interventions: {
        ...createEmptyInterventions(),
        backup_generation: true,
        mobile_broadcast_unit: true
      }
    }
  ];

  // Auto-tune levels: 0 (none), 0.5 (half), 1.0 (all)
  const autoTuneLevels = [
    { value: 0, label: 'a = 0 (None)' },
    { value: 0.5, label: 'a = 0.5 (Half)' },
    { value: 1.0, label: 'a = 1.0 (All)' }
  ];

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                72-Hour Outage Plan Matrix
              </h3>
              <span className="stamp-label stamp-simulation">S72 MODEL</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Population-weighted, time-averaged expected reception over a 72-hour power blackout window.
            </p>
          </div>
        </div>

        <span className="text-[0.7rem] font-mono-numbers px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-md text-[var(--navy)] font-semibold shadow-xs">
          Reproduced Test Vectors (Section 6.6)
        </span>
      </div>

      {/* 12-cell matrix table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
        <table className="w-full text-xs font-mono-numbers text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[var(--navy)]">
              <th className="p-3 font-bold">Intervention Strategy</th>
              <th className="p-3 font-bold text-center">On-Air Duration</th>
              <th className="p-3 font-bold text-center">a = 0 (No Auto-Tune)</th>
              <th className="p-3 font-bold text-center bg-blue-50/50">a = 0.5 (Half Auto-Tune)</th>
              <th className="p-3 font-bold text-center">a = 1.0 (All Auto-Tune)</th>
              <th className="p-3 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, idx) => {
              // Compute each cell using pure model
              const res0 = simulateS72(config, plan.interventions, 0);
              const resHalf = simulateS72(config, plan.interventions, 0.5);
              const resAll = simulateS72(config, plan.interventions, 1.0);

              const isSelected = selectedPlanIndex === idx;

              return (
                <tr
                  key={plan.id}
                  className={`border-b border-slate-100 transition-colors ${
                    isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="p-3">
                    <div className="font-heading font-bold text-sm text-[var(--navy)]">
                      {plan.name}
                    </div>
                    <div className="text-[0.68rem] text-[var(--muted)] mt-0.5">
                      {plan.onAirDesc}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded-md font-bold text-[var(--ink)]">
                      {plan.onAirHours} / 72h
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-sm font-bold text-[var(--navy)]">
                      {res0.overallReach}%
                    </span>
                  </td>

                  <td className="p-3 text-center bg-blue-50/30">
                    <span className="text-sm font-bold text-[var(--navy-deep)]">
                      {resHalf.overallReach}%
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-sm font-bold text-[var(--green-text)]">
                      {resAll.overallReach}%
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelectPlan && onSelectPlan(plan.interventions, plan.name)}
                      className="btn-tactile-secondary text-xs px-2.5 py-1.5 rounded-md"
                    >
                      Inspect Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Model Footnote & Assumption Inspection */}
      <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-[var(--muted)] flex items-start gap-2.5 leading-relaxed">
        <Radio className="w-4 h-4 text-[var(--navy)] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--ink)]">Inspectable Formula:</span> Expected reach = Radio Share (55%) × [a + (1 - a) × 25% listeners] × (FM Pop 18,400 / 19,900) × (Hours On-Air / 72).
          Notice that Thoni (900) &amp; Hill Camp (600) have NO tower and NO FM coverage, remaining at 72h silence unless localized receiver kits or responder patrols are deployed.
        </div>
      </div>
    </div>
  );
};
