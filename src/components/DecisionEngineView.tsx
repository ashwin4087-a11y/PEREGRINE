/**
 * PEREGRINE — Decision Engine View (Section 10)
 * Dual-Objective Recovery Planner: Reach Maximiser vs Fairness-Constrained Floor
 * Enforces fairness floors algorithmically, evaluates real failures, and reports insights honestly.
 */

import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../model/config';
import { NetworkFailureState, ActiveInterventions } from '../model/graph';
import { 
  compareRecoveryStrategies, 
  PlannerScenarioMode,
  CandidateIntervention,
  candidatesToActiveInterventions
} from '../planner/engine';
import { 
  Scale, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  TrendingUp, 
  HeartHandshake, 
  Info, 
  Clock, 
  Sparkles,
  Zap
} from 'lucide-react';

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
  const [fairnessFloor, setFairnessFloor] = useState<number>(0.35); // 35% reach floor
  const [scenarioMode, setScenarioMode] = useState<PlannerScenarioMode>('S72');

  // Active failures label
  const activeFailureList = Object.entries(failures)
    .filter(([_, failed]) => failed)
    .map(([node]) => node.replace('_', ' ').toUpperCase());

  const failureSummary = activeFailureList.length > 0 
    ? activeFailureList.join(', ')
    : 'NONE (HEALTHY BASELINE)';

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

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-xl text-[var(--navy)] tracking-tight">
              Recovery Decision Engine
            </h2>
            <span className="stamp-label stamp-simulation text-[0.6rem]">
              OPTIMIZATION ALGORITHM
            </span>
          </div>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Compares reach-maximising investment against a strictly enforced community fairness floor.
          </p>
        </div>

        {/* Scenario Mode Switcher (S72 vs S30) */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded border border-[var(--border)]">
          <button
            onClick={() => setScenarioMode('S72')}
            className={`px-3 py-1 text-xs font-mono-numbers font-semibold rounded transition-colors ${
              scenarioMode === 'S72'
                ? 'bg-white text-[var(--navy)] shadow-sm font-bold'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            S72: 72h Outage Plan
          </button>
          <button
            onClick={() => setScenarioMode('S30')}
            className={`px-3 py-1 text-xs font-mono-numbers font-semibold rounded transition-colors ${
              scenarioMode === 'S30'
                ? 'bg-white text-[var(--navy)] shadow-sm font-bold'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            S30: 30-Min Alert Window
          </button>
        </div>
      </div>

      {/* Control Bench: Budget, Floor & Active Failure Context */}
      <div className="utility-card p-5 sm:p-6 space-y-4 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono-numbers pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)]">ACTIVE FAILURE SCENARIO:</span>
            <span className="font-bold text-[var(--navy)] px-2.5 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md">
              {failureSummary}
            </span>
          </div>
          <div className="text-[var(--muted)]">
            EVALUATED HORIZON: <span className="font-bold text-[var(--ink)]">{scenarioMode === 'S72' ? '72 Hours (FM & Backup Kits)' : '30 Minutes (Cell, FM, Mesh, Sirens)'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono-numbers mb-2">
              <label className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[var(--amber-text)]" />
                TOTAL RECOVERY BUDGET:
              </label>
              <span className="font-bold text-sm text-[var(--navy-deep)] px-2.5 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md">
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
              className="w-full accent-[var(--navy)] cursor-pointer"
            />
            <div className="flex justify-between text-[0.7rem] text-[var(--muted)] font-mono-numbers mt-1">
              <span>10 units (austere)</span>
              <span>50 units (balanced)</span>
              <span>100 units (full reserve)</span>
            </div>
          </div>

          {/* Fairness Floor Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono-numbers mb-2">
              <label className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[var(--green-text)]" />
                MINIMUM COMMUNITY FAIRNESS FLOOR (F):
              </label>
              <span className="font-bold text-sm text-[var(--green-text)] px-2.5 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md">
                {(fairnessFloor * 100).toFixed(0)}% Reach
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.55"
              step="0.05"
              value={fairnessFloor}
              onChange={e => setFairnessFloor(Number(e.target.value))}
              className="w-full accent-[var(--green)] cursor-pointer"
            />
            <div className="flex justify-between text-[0.7rem] text-[var(--muted)] font-mono-numbers mt-1">
              <span>15% minimum safety</span>
              <span>35% standard floor</span>
              <span>55% strict equity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Insight Discovery Callout (Requirement 3: Proven Insight) */}
      <div className={`p-4 rounded-lg border text-xs leading-relaxed flex items-start gap-3 ${
        disadvantaged
          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
          : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
      }`}>
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${
          disadvantaged ? 'text-[var(--amber-text)]' : 'text-[var(--green-text)]'
        }`} />
        <div>
          <h4 className="font-heading font-bold text-sm uppercase tracking-wide mb-1">
            Calculated Model Insight:
          </h4>
          <p className="font-mono-numbers text-[0.8rem]">
            {comparisonInsight}
          </p>
        </div>
      </div>

      {/* Comparative Plans: Side-by-Side Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan A: Reach Maximiser */}
        <div className="utility-card p-5 sm:p-6 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--navy)]" />
                <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase">
                  Plan A: Reach Maximiser
                </h3>
              </div>
              <span className="stamp-label stamp-simulation text-[0.6rem]">AVERAGE-DRIVEN</span>
            </div>

            <p className="text-xs text-[var(--muted)] my-3 leading-relaxed">
              Greedy algorithm selecting interventions with highest marginal population reach per cost unit.
            </p>

            <div className="grid grid-cols-2 gap-3 my-4 font-mono-numbers">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                <span className="text-[0.68rem] text-[var(--muted)] block uppercase">Overall Reach:</span>
                <span className="text-2xl font-extrabold text-[var(--navy)]">
                  {planReach.overallReachAfter}%
                </span>
                <span className="text-[0.7rem] text-[var(--green-text)] font-semibold block mt-0.5">
                  (+{(planReach.overallReachAfter - planReach.overallReachBefore).toFixed(1)}% gained)
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                <span className="text-[0.68rem] text-[var(--muted)] block uppercase">Lowest Community:</span>
                <span className="text-2xl font-extrabold text-[var(--red-text)]">
                  {planReach.minVillageReachAfter.value}%
                </span>
                <span className="text-[0.7rem] text-[var(--muted)] truncate block mt-0.5">
                  ({planReach.minVillageReachAfter.name})
                </span>
              </div>
            </div>

            <div className="text-xs font-mono-numbers space-y-2 text-slate-700 py-2 border-y border-slate-100">
              <div className="flex justify-between">
                <span>Budget Consumed:</span>
                <span className="font-bold text-[var(--ink)]">{planReach.totalCost} / {budget} units</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency Ratio:</span>
                <span className="font-bold text-[var(--navy)]">+{planReach.gainPerCost} pts / unit</span>
              </div>
              <div className="flex justify-between">
                <span>Fairness Floor Status:</span>
                <span className={`font-bold ${planReach.floorMet ? 'text-[var(--green-text)]' : 'text-[var(--red-text)]'}`}>
                  {planReach.floorMet ? 'SATISFIED' : `FAILED (${planReach.villagesBelowFloor.length} villages neglected)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[0.7rem] text-[var(--muted)] font-mono-numbers block mb-2 font-bold uppercase">
              Selected Interventions ({planReach.chosenInterventions.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {planReach.chosenInterventions.map(c => (
                <span key={c.id} className="text-[0.7rem] px-2 py-0.5 bg-slate-100 text-[var(--navy)] font-mono-numbers rounded border border-slate-200 font-semibold">
                  {c.label} ({c.cost}u)
                </span>
              ))}
              {planReach.chosenInterventions.length === 0 && (
                <span className="text-xs text-slate-400 italic">None affordable within budget</span>
              )}
            </div>

            {onApplyPlan && planReach.chosenInterventions.length > 0 && (
              <button
                onClick={() => onApplyPlan(candidatesToActiveInterventions(planReach.chosenInterventions), 'Plan A: Reach Maximiser')}
                className="mt-3 w-full py-2 px-3 bg-[var(--navy)] hover:bg-slate-800 text-white font-mono-numbers text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Apply Plan A to Network</span>
              </button>
            )}
          </div>
        </div>

        {/* Plan B: Fairness-Floor Optimizer */}
        <div className="utility-card p-5 sm:p-6 rounded-lg border-2 border-emerald-500/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[var(--green-text)]" />
                <h3 className="font-heading font-bold text-base text-[var(--green-text)] uppercase">
                  Plan B: Fairness-Floor Optimizer
                </h3>
              </div>
              <span className="stamp-label stamp-verified text-[0.6rem]">EQUITY-PROTECTED</span>
            </div>

            <p className="text-xs text-[var(--muted)] my-3 leading-relaxed">
              Enforces MinReach &ge; {(fairnessFloor * 100).toFixed(0)}% across all communities before allocating remaining budget.
            </p>

            <div className="grid grid-cols-2 gap-3 my-4 font-mono-numbers">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                <span className="text-[0.68rem] text-[var(--muted)] block uppercase">Overall Reach:</span>
                <span className="text-2xl font-extrabold text-[var(--navy)]">
                  {planFairness.overallReachAfter}%
                </span>
                <span className="text-[0.7rem] text-[var(--green-text)] font-semibold block mt-0.5">
                  (+{(planFairness.overallReachAfter - planFairness.overallReachBefore).toFixed(1)}% gained)
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[0.68rem] text-[var(--muted)] block uppercase">Lowest Community:</span>
                <span className="text-2xl font-extrabold text-[var(--green-text)]">
                  {planFairness.minVillageReachAfter.value}%
                </span>
                <span className="text-[0.7rem] text-[var(--muted)] truncate block mt-0.5">
                  ({planFairness.minVillageReachAfter.name})
                </span>
              </div>
            </div>

            <div className="text-xs font-mono-numbers space-y-2 text-slate-700 py-2 border-y border-slate-100">
              <div className="flex justify-between">
                <span>Budget Consumed:</span>
                <span className="font-bold text-[var(--ink)]">{planFairness.totalCost} / {budget} units</span>
              </div>
              <div className="flex justify-between">
                <span>Floor Protection Level:</span>
                <span className="font-bold text-[var(--green-text)]">&ge; {(fairnessFloor * 100).toFixed(0)}% Target</span>
              </div>
              <div className="flex justify-between">
                <span>Fairness Floor Status:</span>
                <span className={`font-bold ${planFairness.floorMet ? 'text-[var(--green-text)]' : 'text-[var(--amber-text)]'}`}>
                  {planFairness.floorMet ? 'ALL 8 COMMUNITIES PROTECTED' : `PARTIAL COMPLIANCE (${planFairness.villagesBelowFloor.length} below)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[0.7rem] text-[var(--muted)] font-mono-numbers block mb-2 font-bold uppercase">
              Selected Interventions ({planFairness.chosenInterventions.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {planFairness.chosenInterventions.map(c => (
                <span key={c.id} className="text-[0.7rem] px-2 py-0.5 bg-emerald-50 text-[var(--green-text)] font-mono-numbers rounded border border-emerald-200 font-semibold">
                  {c.label} ({c.cost}u)
                </span>
              ))}
              {planFairness.chosenInterventions.length === 0 && (
                <span className="text-xs text-slate-400 italic">None affordable within budget</span>
              )}
            </div>

            {onApplyPlan && planFairness.chosenInterventions.length > 0 && (
              <button
                onClick={() => onApplyPlan(candidatesToActiveInterventions(planFairness.chosenInterventions), 'Plan B: Fairness-Floor Optimizer')}
                className="mt-3 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono-numbers text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Apply Plan B to Network</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Community-by-Community Comparison Table */}
      <div className="utility-card rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase">
            Community Reach Comparison Under Both Plans
          </h4>
          <span className="text-xs font-mono-numbers text-[var(--muted)]">
            Fairness Target Floor: {(fairnessFloor * 100).toFixed(0)}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono-numbers text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[var(--navy)] bg-slate-50/50">
                <th className="p-3 font-bold">Community</th>
                <th className="p-3 font-bold">Population</th>
                <th className="p-3 font-bold">Unmitigated Baseline</th>
                <th className="p-3 font-bold">Plan A (Reach Max)</th>
                <th className="p-3 font-bold text-[var(--green-text)]">Plan B (Fairness Floor)</th>
                <th className="p-3 font-bold">Fairness Status</th>
              </tr>
            </thead>
            <tbody>
              {planFairness.perVillageOutcomes.map((v, i) => {
                const reachA = planReach.perVillageOutcomes[i]?.reachAfter ?? 0;
                const reachB = v.reachAfter;
                const meetsFloorB = v.meetsFloor;

                return (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-heading font-bold text-sm text-[var(--navy)]">
                      {v.name}
                      {['thoni', 'hillcamp'].includes(v.id) && (
                        <span className="ml-2 text-[0.65rem] text-[var(--red-text)] font-mono-numbers font-normal">
                          [ISOLATED]
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {v.pop.toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-500">
                      {v.reachBefore}%
                    </td>
                    <td className="p-3 font-bold text-[var(--navy)]">
                      {reachA}%
                    </td>
                    <td className="p-3 font-extrabold text-[var(--green-text)]">
                      {reachB}%
                    </td>
                    <td className="p-3">
                      {meetsFloorB ? (
                        <span className="stamp-label stamp-verified text-[0.6rem]">FLOOR MET</span>
                      ) : (
                        <span className="stamp-label stamp-critical text-[0.6rem]">
                          DEFICIT (-{v.shortfall}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Audit Log (Why each intervention was chosen step-by-step) */}
      <div className="utility-card p-5 sm:p-6 rounded-lg space-y-3">
        <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase flex items-center gap-1.5">
          <ChevronRight className="w-4 h-4 text-[var(--amber-text)]" />
          Plan B Algorithmic Decision Audit (Step-by-Step Reason Log)
        </h4>

        <div className="space-y-2 font-mono-numbers text-xs">
          {planFairness.steps.map((st) => (
            <div key={st.stepNumber} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[var(--navy)] text-white text-[0.7rem] font-bold rounded">
                  Step {st.stepNumber}
                </span>
                <span className="font-bold text-[var(--ink)]">
                  {st.label}
                </span>
                <span className="text-[var(--muted)] font-semibold">
                  (-{st.cost}u, {st.remainingBudget}u left)
                </span>
              </div>
              <p className="text-[0.75rem] text-slate-600 md:text-right">
                {st.reason}
              </p>
            </div>
          ))}

          {planFairness.steps.length === 0 && (
            <div className="text-slate-400 italic text-xs p-3">
              No interventions could be selected within the available budget.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
