import React, { useState } from 'react';
import { SystemConfig } from '../../model/config';
import { simulateS72, createEmptyInterventions, ActiveInterventions } from '../../model/graph';
import { Calendar, Radio, ChevronRight, ChevronDown, CheckCircle2, Info } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface OutagePlanMatrixProps {
  config: SystemConfig;
  selectedPlanIndex?: number;
  onSelectPlan?: (interventions: ActiveInterventions, planName: string) => void;
}

export const OutagePlanMatrix: React.FC<OutagePlanMatrixProps> = ({
  config,
  selectedPlanIndex: externalSelectedIndex,
  onSelectPlan
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(0);
  const activePlanIdx = externalSelectedIndex ?? internalSelectedIndex;

  // Candidate plans
  const plans = [
    {
      id: 'none',
      name: 'No Investment (Grid Only)',
      badge: 'Baseline',
      onAirHours: 24,
      onAirDesc: 'FM on-air hours [48-72] once utility grid power returns',
      interventions: createEmptyInterventions()
    },
    {
      id: 'gen',
      name: 'Substation Backup Generator',
      badge: 'Early On-Air',
      onAirHours: 49,
      onAirDesc: 'Hours [0-25] on generator fuel + [48-72] on restored grid power',
      interventions: {
        ...createEmptyInterventions(),
        backup_generation: true
      }
    },
    {
      id: 'mobile',
      name: 'Mobile FM Broadcast Unit',
      badge: 'Late On-Air',
      onAirHours: 48,
      onAirDesc: 'Rapid deployment truck arriving at hour 24, on-air [24-72]',
      interventions: {
        ...createEmptyInterventions(),
        mobile_broadcast_unit: true
      }
    },
    {
      id: 'combined',
      name: 'Generator + Mobile Unit',
      badge: 'Continuous 72h',
      onAirHours: 72,
      onAirDesc: 'Full 72-hour continuous broadcast coverage [0-72]',
      interventions: {
        ...createEmptyInterventions(),
        backup_generation: true,
        mobile_broadcast_unit: true
      }
    }
  ];

  const currentPlan = plans[activePlanIdx] || plans[0];
  const currentPlanDetail = simulateS72(config, currentPlan.interventions, 0.5);

  const handleSelect = (idx: number) => {
    setInternalSelectedIndex(idx);
    if (onSelectPlan) {
      onSelectPlan(plans[idx].interventions, plans[idx].name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Interface: 12-cell Restoration Benchmark Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <h3 className="text-sm font-semibold text-[#172033]">
              12-Cell Restoration Benchmark: Investment vs Listener Adoption Curve
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Population-weighted, time-averaged modeled warning reach across a 72-hour utility power blackout.
            </p>
          </div>

          <div className="text-xs text-[#64748B]">
            Active Plan: <strong className="text-[#172033] font-semibold">{currentPlan.name}</strong>
          </div>
        </div>

        {/* 12-cell matrix table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-medium">
                <th className="py-3 px-4">Intervention Strategy</th>
                <th className="py-3 px-3 text-center">On-Air Duration</th>
                <th className="py-3 px-3 text-center">a = 0 (No Auto-Tune)</th>
                <th className="py-3 px-3 text-center bg-[#EFF6FF] text-[#2563EB]">
                  a = 0.5 (Standard Adoption)
                </th>
                <th className="py-3 px-3 text-center">a = 1.0 (Full Auto-Tune)</th>
                <th className="py-3 px-4 text-right">Selection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {plans.map((plan, idx) => {
                // Compute each cell using pure model
                const res0 = simulateS72(config, plan.interventions, 0);
                const resHalf = simulateS72(config, plan.interventions, 0.5);
                const resAll = simulateS72(config, plan.interventions, 1.0);

                const isSelected = activePlanIdx === idx;

                return (
                  <tr
                    key={plan.id}
                    onClick={() => handleSelect(idx)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#172033]">
                          {plan.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-[#475569] font-medium">
                          {plan.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {plan.onAirDesc}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono-numbers text-[#172033]">
                      <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded font-medium">
                        {plan.onAirHours} / 72h
                      </span>
                    </td>

                    {/* Reach values corrected: already scaled 0..100 */}
                    <td className="py-3.5 px-3 text-center font-mono-numbers font-medium text-[#172033]">
                      {res0.overallReach.toFixed(1)}%
                    </td>

                    <td className="py-3.5 px-3 text-center bg-[#EFF6FF]/60 font-mono-numbers font-bold text-[#2563EB]">
                      {resHalf.overallReach.toFixed(1)}%
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono-numbers font-medium text-emerald-700">
                      {resAll.overallReach.toFixed(1)}%
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(idx);
                        }}
                        className={`text-xs px-2.5 py-1 rounded font-medium inline-flex items-center gap-1 transition-colors ${
                          isSelected
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Compact Legend Bar */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Benchmark evaluated across standard listener adoption rates: a = 0 (25% default), a = 0.5 (62.5%), a = 1.0 (100%).</span>
          </div>
          <div className="text-slate-500">
            Selected plan applies to all S72 network simulations.
          </div>
        </div>
      </div>

      {/* Secondary Section: Selected Plan Settlement-by-Settlement Impact */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B]">
                Selected Plan Breakdown
              </span>
              <StatusBadge
                status={currentPlan.onAirHours === 72 ? 'operational' : 'degraded'}
                label={`${currentPlan.onAirHours}h On-Air`}
              />
            </div>
            <h3 className="text-base font-bold text-[#172033] mt-0.5">
              {currentPlan.name} — Community Impact Breakdown (a = 0.5)
            </h3>
          </div>

          <div className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-md">
            <span>Overall Island Reach: <strong className="font-mono-numbers text-[#172033]">{currentPlanDetail.overallReach.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* 8-Settlement Breakdown Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-medium">
                <th className="py-3 px-4">Settlement</th>
                <th className="py-3 px-3 text-center">Population</th>
                <th className="py-3 px-3 text-center">Silence Duration</th>
                <th className="py-3 px-3 text-center">Available Hours</th>
                <th className="py-3 px-3 text-center">Time-Avg Reach</th>
                <th className="py-3 px-4 text-center">Outage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {currentPlanDetail.villages.map((v) => {
                const isZero = v.silenceHours === 72;
                const isFull = v.silenceHours === 0;

                return (
                  <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-[#172033]">
                        {v.name}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {['thoni', 'hillcamp'].includes(v.id) ? 'Topographically Isolated' : 'FM Broadcast Contour'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono-numbers text-[#64748B]">
                      {v.pop.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center font-mono-numbers font-medium">
                      <span className={isZero ? 'text-red-700' : isFull ? 'text-emerald-700' : 'text-amber-700'}>
                        {v.silenceHours}h
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono-numbers text-[#172033]">
                      {v.pathAvailableHours} / 72h
                    </td>

                    <td className="py-3 px-3 text-center font-mono-numbers font-bold text-[#172033]">
                      {(v.timeAvgReach * 100).toFixed(1)}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={isZero ? 'severed' : isFull ? 'operational' : 'degraded'}
                        label={isZero ? '72h Blackout' : isFull ? 'Continuous' : `${v.silenceHours}h Blackout`}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Model Formulas & Derivations */}
      <details className="border border-[#E2E8F0] rounded-lg bg-white shadow-xs group overflow-hidden">
        <summary className="p-4 bg-[#F8FAFC] flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-[#172033] hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB]" />
            <span>Mathematical Model Formulation & Parameter Assumptions</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
        </summary>

        <div className="p-5 text-xs text-[#475569] space-y-3 border-t border-[#E2E8F0] leading-relaxed">
          <p>
            The 12-cell outage matrix models population-weighted time-averaged warning reach under varying listener auto-tune adoption:
          </p>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-mono-numbers text-xs text-[#172033]">
            Reach(Plan, a) = 55% Radio Share × [a + (1 - a) × 25%] × (18,400 FM Pop / 19,900 Total) × (On-Air Hours / 72)
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>55% Radio Share:</strong> Assumed penetration of active FM receivers across the archipelago.</li>
            <li><strong>Auto-Tune Parameter (a):</strong> Represents proportion of receivers tuned to emergency frequencies vs default stations.</li>
            <li><strong>Topographical Boundary:</strong> Thoni (900 residents) and Hill Camp (600 residents) are shielded from the main FM transmitter and require off-grid satellite kits or acoustic siren patrols.</li>
          </ul>
        </div>
      </details>
    </div>
  );
};
