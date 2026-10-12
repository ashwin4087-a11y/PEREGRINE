import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../../model/config';
import { NetworkFailureState, ActiveInterventions } from '../../model/types';
import { 
  compareRecoveryStrategies, 
  calculatePriceOfFairnessFrontier,
  evaluateOptimizerBenchmarking,
  PlannerScenarioMode,
  candidatesToActiveInterventions
} from '../../planner/engine';
import { 
  Coins, 
  HeartHandshake, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  Cpu, 
  Sliders, 
  ChevronDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface DecisionEngineViewProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  autoTune?: number;
  onApplyPlan?: (interventions: ActiveInterventions, planName: string) => void;
}

export const DecisionEngineView: React.FC<DecisionEngineViewProps> = ({
  config,
  failures,
  autoTune = 0.5,
  onApplyPlan
}) => {
  const [budget, setBudget] = useState<number>(50);
  const [fairnessFloor, setFairnessFloor] = useState<number>(0.23); // Default feasible floor (23%)
  const [scenarioMode, setScenarioMode] = useState<PlannerScenarioMode>('S72');

  // Active failures label
  const activeFailureList = Object.entries(failures)
    .filter(([_, failed]) => failed)
    .map(([node]) => node.replace('_', ' '));

  const failureSummary = activeFailureList.length > 0 
    ? activeFailureList.join(', ')
    : 'Healthy Baseline (Zero Failures)';

  // Run dynamic comparison on identical scenario, budget, and failures
  const { planReach, planFairness, disadvantaged, comparisonInsight } = useMemo(() => {
    return compareRecoveryStrategies(
      config,
      failures,
      budget,
      fairnessFloor,
      scenarioMode,
      autoTune
    );
  }, [config, failures, budget, fairnessFloor, scenarioMode, autoTune]);

  // Price-of-Fairness frontier sweep
  const frontierSummary = useMemo(() => {
    return calculatePriceOfFairnessFrontier(config, failures, budget, scenarioMode, autoTune);
  }, [config, failures, budget, scenarioMode, autoTune]);

  // Heuristics and exhaustive 2^N benchmark
  const benchmarkResult = useMemo(() => {
    return evaluateOptimizerBenchmarking(config, failures, budget, scenarioMode, autoTune);
  }, [config, failures, budget, scenarioMode, autoTune]);

  return (
    <div className="space-y-6">
      {/* 1 & 2. Scenario Constraints, Budget & Fairness Controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#172033]">
              Planning Constraints & Resource Controls
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure capital budget and community equity threshold for automated recovery.
            </p>
          </div>

          {/* Scenario Mode Switcher (S72 vs S30) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-md text-xs">
            <span className="text-[#64748B] px-1.5 font-medium">Evaluation Horizon:</span>
            <button
              onClick={() => setScenarioMode('S72')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                scenarioMode === 'S72'
                  ? 'bg-white text-[#172033] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              72h Outage (S72)
            </button>
            <button
              onClick={() => setScenarioMode('S30')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                scenarioMode === 'S30'
                  ? 'bg-white text-[#172033] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              30m Alert Window (S30)
            </button>
          </div>
        </div>

        {/* Active Failures Summary Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 rounded-md">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#172033]">Active Fault State:</span>
            <span className="text-slate-800 font-medium">
              {failureSummary}
            </span>
          </div>
          <div>
            Modeled Scope: <span className="font-medium text-[#172033]">{scenarioMode === 'S72' ? '72h Utility Outage (FM, Power, Kits)' : '30-Min Rapid Broadcast (Cell, FM, Mesh, Sirens)'}</span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <label className="font-semibold text-[#172033] flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#D97706]" />
                Recovery Capital Budget
              </label>
              <span className="font-bold text-sm text-[#172033] font-mono-numbers px-2.5 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                {budget} Units
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#64748B] mt-1.5">
              <span>10u (austere)</span>
              <span>50u (standard reserve)</span>
              <span>100u (full reserve)</span>
            </div>
          </div>

          {/* Fairness Floor Slider & Presets */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <label className="font-semibold text-[#172033] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Minimum Community Fairness Floor
              </label>
              <span className="font-bold text-sm text-emerald-700 font-mono-numbers px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                {(fairnessFloor * 100).toFixed(0)}% Min Reach
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.55"
              step="0.01"
              value={fairnessFloor}
              onChange={e => setFairnessFloor(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            
            {/* Quick Floor Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
              <button
                onClick={() => setFairnessFloor(Number((frontierSummary.bestAchievableMinVillageReach / 100).toFixed(3)) || 0.229)}
                className={`px-2.5 py-1 rounded border font-medium transition-all ${
                  fairnessFloor <= (frontierSummary.bestAchievableMinVillageReach / 100 + 0.01) && fairnessFloor >= (frontierSummary.bestAchievableMinVillageReach / 100 - 0.02)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                Max Feasible ({frontierSummary.bestAchievableMinVillageReach.toFixed(1)}%)
              </button>
              <button
                onClick={() => setFairnessFloor(0.35)}
                className={`px-2.5 py-1 rounded border font-medium transition-all ${
                  Math.abs(fairnessFloor - 0.35) < 0.01
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                Standard (35%)
              </button>
              <button
                onClick={() => setFairnessFloor(0.50)}
                className={`px-2.5 py-1 rounded border font-medium transition-all ${
                  Math.abs(fairnessFloor - 0.50) < 0.01
                    ? 'bg-red-50 border-red-300 text-red-900 font-semibold shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                High Equity (50%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recommended Recovery Plan Banner */}
      <div className={`p-5 rounded-lg border shadow-xs space-y-3 ${
        disadvantaged
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-blue-50/70 border-blue-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-sm text-[#172033]">
              Recommended Policy: {disadvantaged ? 'Plan B (Fairness-Floor Optimizer)' : 'Plan A (Reach Maximizer)'}
            </h4>
          </div>
          <StatusBadge
            status="operational"
            label={disadvantaged ? 'Equity Floor Enforced' : 'Maximum Reach Achieved'}
          />
        </div>

        <p className="text-xs text-[#334155] leading-relaxed">
          {comparisonInsight}
        </p>

        {/* Selected Interventions Preview */}
        <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-[#172033]">Deployed Hardware ({planFairness.chosenInterventions.length} items):</span>
          {planFairness.chosenInterventions.map(c => (
            <span key={c.id} className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-900 font-medium">
              {c.label} ({c.cost}u)
            </span>
          ))}
          {planFairness.chosenInterventions.length === 0 && (
            <span className="text-[#64748B] italic">No interventions deployed within budget.</span>
          )}
        </div>
      </div>

      {/* 4. Plan Comparison (Side-by-Side: Plan A vs Plan B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan A: Reach Maximiser */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#172033]" />
                <h3 className="font-bold text-sm text-[#172033]">
                  Plan A: Reach Maximizer
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded font-medium">
                Average-Driven
              </span>
            </div>

            <p className="text-xs text-[#64748B] my-3 leading-relaxed">
              Greedy allocation targeting highest population-weighted gain per budget unit.
            </p>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Overall Reach:</span>
                <span className="text-2xl font-bold text-[#172033] font-mono-numbers">
                  {planReach.overallReachAfter}%
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  (+{(planReach.overallReachAfter - planReach.overallReachBefore).toFixed(1)}% gained)
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Weakest Settlement:</span>
                <span className="text-2xl font-bold text-red-700 font-mono-numbers">
                  {planReach.minVillageReachAfter.value}%
                </span>
                <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                  ({planReach.minVillageReachAfter.name})
                </span>
              </div>
            </div>

            <div className="text-xs space-y-2 text-[#475569] py-2 border-y border-[#E2E8F0]">
              <div className="flex justify-between">
                <span>Budget Spent:</span>
                <span className="font-semibold text-[#172033] font-mono-numbers">{planReach.totalCost} / {budget} units</span>
              </div>
              <div className="flex justify-between">
                <span>Marginal Efficiency:</span>
                <span className="font-semibold text-[#172033] font-mono-numbers">+{planReach.gainPerCost} pts / unit</span>
              </div>
              <div className="flex justify-between">
                <span>Fairness Floor Status:</span>
                <span className={`font-semibold ${planReach.floorMet ? 'text-emerald-700' : 'text-red-700'}`}>
                  {planReach.floorMet ? 'Satisfied' : `Deficit (${planReach.villagesBelowFloor.length} settlements neglected)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block mb-2 font-medium">
              Deployed Actions ({planReach.chosenInterventions.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {planReach.chosenInterventions.map(c => (
                <span key={c.id} className="text-[11px] px-2 py-0.5 bg-[#F1F5F9] text-[#172033] rounded border border-[#E2E8F0] font-medium">
                  {c.label} ({c.cost}u)
                </span>
              ))}
              {planReach.chosenInterventions.length === 0 && (
                <span className="text-xs text-[#94A3B8] italic">None within budget</span>
              )}
            </div>

            {onApplyPlan && planReach.chosenInterventions.length > 0 && (
              <button
                onClick={() => onApplyPlan(candidatesToActiveInterventions(planReach.chosenInterventions), 'Plan A: Reach Maximiser')}
                className="mt-3 w-full py-2 px-3 bg-[#172033] hover:bg-slate-800 text-white font-mono-numbers text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Apply Plan A to Network</span>
              </button>
            )}
          </div>
        </div>

        {/* Plan B: Fairness-Floor Optimizer */}
        <div className="bg-white border-2 border-emerald-500 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-emerald-700">
                  Plan B: Fairness-Floor Optimizer
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
                Protected Floor
              </span>
            </div>

            <p className="text-xs text-[#64748B] my-3 leading-relaxed">
              Guarantees reach &ge; {(fairnessFloor * 100).toFixed(0)}% across all communities before allocating surplus budget.
            </p>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Overall Reach:</span>
                <span className="text-2xl font-bold text-[#172033] font-mono-numbers">
                  {planFairness.overallReachAfter}%
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  (+{(planFairness.overallReachAfter - planFairness.overallReachBefore).toFixed(1)}% gained)
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[11px] text-[#64748B] block">Weakest Settlement:</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono-numbers">
                  {planFairness.minVillageReachAfter.value}%
                </span>
                <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                  ({planFairness.minVillageReachAfter.name})
                </span>
              </div>
            </div>

            <div className="text-xs space-y-2 text-[#475569] py-2 border-y border-[#E2E8F0]">
              <div className="flex justify-between">
                <span>Budget Spent:</span>
                <span className="font-semibold text-[#172033] font-mono-numbers">{planFairness.totalCost} / {budget} units</span>
              </div>
              <div className="flex justify-between">
                <span>Floor Protection Level:</span>
                <span className="font-semibold text-emerald-700 font-mono-numbers">&ge; {(fairnessFloor * 100).toFixed(0)}% Target</span>
              </div>
              <div className="flex justify-between">
                <span>Fairness Status:</span>
                <span className={`font-semibold ${planFairness.floorMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {planFairness.floorMet ? 'All 8 Settlements Protected' : `Partial Compliance (${planFairness.villagesBelowFloor.length} below floor)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block mb-2 font-medium">
              Deployed Actions ({planFairness.chosenInterventions.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {planFairness.chosenInterventions.map(c => (
                <span key={c.id} className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 font-medium">
                  {c.label} ({c.cost}u)
                </span>
              ))}
              {planFairness.chosenInterventions.length === 0 && (
                <span className="text-xs text-[#94A3B8] italic">None within budget</span>
              )}
            </div>

            {onApplyPlan && planFairness.chosenInterventions.length > 0 && (
              <button
                onClick={() => onApplyPlan(candidatesToActiveInterventions(planFairness.chosenInterventions), 'Plan B: Fairness-Floor Optimizer')}
                className="mt-3 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono-numbers text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Apply Plan B to Network</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Before-and-After Community Impact Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[#172033]">
            Community Warning Reach: Baseline vs Plan A vs Plan B
          </h4>
          <span className="text-xs text-[#64748B]">
            Fairness Target Floor: <strong className="font-mono-numbers text-[#172033]">{(fairnessFloor * 100).toFixed(0)}%</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#FAFCFE] font-medium">
                <th className="p-3">Community</th>
                <th className="p-3">Population</th>
                <th className="p-3">Unmitigated Baseline</th>
                <th className="p-3">Plan A (Reach Max)</th>
                <th className="p-3 text-emerald-700">Plan B (Fairness Floor)</th>
                <th className="p-3">Fairness Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {planFairness.perVillageOutcomes.map((v, i) => {
                const reachA = planReach.perVillageOutcomes[i]?.reachAfter ?? 0;
                const reachB = v.reachAfter;
                const meetsFloorB = v.meetsFloor;

                return (
                  <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3 font-semibold text-[#172033]">
                      {v.name}
                      {['thoni', 'hillcamp'].includes(v.id) && (
                        <span className="ml-2 text-[11px] text-red-600 font-normal">
                          (Isolated)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#64748B] font-mono-numbers">
                      {v.pop.toLocaleString()}
                    </td>
                    <td className="p-3 text-[#64748B] font-mono-numbers">
                      {v.reachBefore}%
                    </td>
                    <td className="p-3 font-semibold text-[#172033] font-mono-numbers">
                      {reachA}%
                    </td>
                    <td className="p-3 font-bold text-emerald-700 font-mono-numbers">
                      {reachB}%
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        status={meetsFloorB ? 'operational' : 'severed'}
                        label={meetsFloorB ? 'Floor Met' : `Deficit (-${v.shortfall}%)`}
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

      {/* 6. Expandable Algorithm Audit, Tradeoff Frontier & Optimization Proof */}
      <details className="border border-[#E2E8F0] rounded-lg bg-white shadow-xs group overflow-hidden">
        <summary className="p-4 bg-[#F8FAFC] flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-[#172033] hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <span>Algorithm Audit, Price-of-Fairness Curve & Optimization Proof</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
        </summary>

        <div className="p-5 sm:p-6 space-y-6 text-xs border-t border-[#E2E8F0]">
          {/* Native SVG Chart */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-[#172033]">Price-of-Fairness Tradeoff Curve</span>
              <span className="text-[11px] text-[#64748B]">Capital Budget: {budget} Units</span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg 
                viewBox="0 0 480 200" 
                className="w-full h-auto max-h-[220px] select-none text-[10px] font-mono-numbers"
              >
                {/* Background Grid Lines & Y-Labels */}
                {[0, 10, 20, 30, 40].map((val) => {
                  const y = 170 - (val / 40) * 145;
                  return (
                    <g key={val}>
                      <line x1="45" y1={y} x2="465" y2={y} stroke="#E2E8F0" strokeDasharray="3,3" />
                      <text x="38" y={y + 3} textAnchor="end" fill="#64748B">{val}%</text>
                    </g>
                  );
                })}

                {/* X-Grid Lines & Labels */}
                {[0, 10, 20, 30].map((val) => {
                  const x = 45 + (val / 35) * 420;
                  return (
                    <g key={val}>
                      <line x1={x} y1="25" x2={x} y2="170" stroke="#E2E8F0" strokeDasharray="3,3" />
                      <text x={x} y="185" textAnchor="middle" fill="#64748B">{val}%</text>
                    </g>
                  );
                })}

                {/* Axes */}
                <line x1="45" y1="170" x2="465" y2="170" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="45" y1="25" x2="45" y2="170" stroke="#94A3B8" strokeWidth="1.5" />

                {/* Frontier Curve Points */}
                {(() => {
                  const sortedFrontier = [...frontierSummary.frontier].sort((a, b) => a.minVillageReach - b.minVillageReach);
                  const pointsStr = sortedFrontier.map(p => {
                    const cx = 45 + (Math.min(35, p.minVillageReach) / 35) * 420;
                    const cy = 170 - (Math.min(40, p.overallReach) / 40) * 145;
                    return `${cx},${cy}`;
                  }).join(' ');

                  return (
                    <polyline
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                  );
                })()}

                {/* Individual Frontier Dots */}
                {frontierSummary.frontier.map((p, idx) => {
                  const cx = 45 + (Math.min(35, p.minVillageReach) / 35) * 420;
                  const cy = 170 - (Math.min(40, p.overallReach) / 40) * 145;
                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r="3"
                      fill={p.floorMet ? "#059669" : "#D97706"}
                    />
                  );
                })}

                {/* Marker Plan A: ReachMax */}
                {(() => {
                  const ax = 45 + (Math.min(35, planReach.minVillageReachAfter.value) / 35) * 420;
                  const ay = 170 - (Math.min(40, planReach.overallReachAfter) / 40) * 145;
                  return (
                    <g>
                      <circle cx={ax} cy={ay} r="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
                      <rect x={ax + 8} y={ay - 14} width="95" height="18" fill="#1E293B" rx="3" />
                      <text x={ax + 12} y={ay - 1} fill="#FFFFFF" fontWeight="bold">
                        PLAN A: {planReach.overallReachAfter}%
                      </text>
                    </g>
                  );
                })()}

                {/* Marker Plan B: Fairness */}
                {(() => {
                  const bx = 45 + (Math.min(35, planFairness.minVillageReachAfter.value) / 35) * 420;
                  const by = 170 - (Math.min(40, planFairness.overallReachAfter) / 40) * 145;
                  return (
                    <g>
                      <circle cx={bx} cy={by} r="6" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
                      <rect x={bx - 105} y={by - 14} width="98" height="18" fill="#059669" rx="3" />
                      <text x={bx - 101} y={by - 1} fill="#FFFFFF" fontWeight="bold">
                        PLAN B: {planFairness.overallReachAfter}%
                      </text>
                    </g>
                  );
                })()}

                {/* Axis Titles */}
                <text x="255" y="198" textAnchor="middle" fill="#64748B" fontWeight="600">
                  Minimum Community Reach (Weakest Settlement %) →
                </text>
                <text x="14" y="98" textAnchor="middle" transform="rotate(-90 14 98)" fill="#64748B" fontWeight="600">
                  Overall Regional Reach (%) →
                </text>
              </svg>
            </div>

            <div className="mt-3 p-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#172033]">
              <span className="font-semibold text-[#2563EB]">Frontier Finding:</span> {frontierSummary.plainSentence}
            </div>
          </div>

          {/* Algorithm Benchmarking Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
              <div className="flex justify-between font-semibold text-[#172033]">
                <span>1. Exhaustive 2^N Optimal:</span>
                <span className="text-emerald-700 font-mono-numbers">{benchmarkResult.exhaustiveOptimal.maxReach}%</span>
              </div>
              <p className="text-[#64748B] text-[11px] mt-1">
                256 intervention subsets evaluated. Gap: <strong className="font-mono-numbers">{benchmarkResult.exhaustiveOptimal.optimalityGap}%</strong> ({benchmarkResult.exhaustiveOptimal.isPlanAOptimal ? 'Provably Optimal' : 'Near-Optimal'}).
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
              <div className="flex justify-between font-semibold text-[#172033]">
                <span>2. Highest-Pop First:</span>
                <span className="font-mono-numbers">{benchmarkResult.highestPopFirst.reach}%</span>
              </div>
              <p className="text-[#64748B] text-[11px] mt-1">
                Spends {benchmarkResult.highestPopFirst.cost}u on largest coastal centres.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
              <div className="flex justify-between font-semibold text-[#172033]">
                <span>3. Cheapest First:</span>
                <span className="font-mono-numbers">{benchmarkResult.cheapestFirst.reach}%</span>
              </div>
              <p className="text-[#64748B] text-[11px] mt-1">
                Spends {benchmarkResult.cheapestFirst.cost}u on cheapest assets. Falls {(planReach.overallReachAfter - benchmarkResult.cheapestFirst.reach).toFixed(1)} pts short.
              </p>
            </div>
          </div>

          {/* Step-by-Step Reason Log */}
          <div className="space-y-2">
            <h5 className="font-semibold text-xs text-[#172033]">
              Plan B Step-by-Step Allocation Reason Log
            </h5>
            {planFairness.steps.map((st) => (
              <div key={st.stepNumber} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#172033] text-white text-[11px] font-semibold rounded">
                    Step {st.stepNumber}
                  </span>
                  <span className="font-semibold text-[#172033]">
                    {st.label}
                  </span>
                  <span className="text-[#64748B]">
                    (-{st.cost}u, {st.remainingBudget}u remaining)
                  </span>
                </div>
                <p className="text-[11px] text-[#475569] md:text-right">
                  {st.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
};
