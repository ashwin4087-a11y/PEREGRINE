/**
 * PEREGRINE — Decision Engine View (Section 10)
 * Dual-Objective Recovery Planner: Reach Maximiser vs Fairness-Constrained Floor
 * Enforces fairness floors algorithmically, evaluates real failures, and reports insights honestly.
 */

import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../../model/config';
import { NetworkFailureState } from '../../model/graph';
import { 
  compareRecoveryStrategies, 
  calculatePriceOfFairnessFrontier,
  evaluateOptimizerBenchmarking,
  PlannerScenarioMode,
  CandidateIntervention
} from '../../planner/engine';
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
  BarChart3,
  Cpu
} from 'lucide-react';

interface DecisionEngineViewProps {
  config: SystemConfig;
  failures: NetworkFailureState;
  autoTune?: number;
}

export const DecisionEngineView: React.FC<DecisionEngineViewProps> = ({
  config,
  failures,
  autoTune = 0.5
}) => {
  const [budget, setBudget] = useState<number>(50);
  const [fairnessFloor, setFairnessFloor] = useState<number>(0.23); // Default to highest feasible floor (23%) at budget 50
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

          {/* Fairness Floor Slider & Presets */}
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
              min="0.10"
              max="0.55"
              step="0.01"
              value={fairnessFloor}
              onChange={e => setFairnessFloor(Number(e.target.value))}
              className="w-full accent-[var(--green)] cursor-pointer"
            />
            
            {/* Quick Floor Selectors: Feasible vs Infeasible */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono-numbers text-[0.7rem]">
              <button
                onClick={() => setFairnessFloor(Number((frontierSummary.bestAchievableMinVillageReach / 100).toFixed(3)) || 0.229)}
                className={`px-2 py-1 rounded-[3px] border font-bold transition-all ${
                  fairnessFloor <= (frontierSummary.bestAchievableMinVillageReach / 100 + 0.01) && fairnessFloor >= (frontierSummary.bestAchievableMinVillageReach / 100 - 0.02)
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ✓ Max Feasible ({frontierSummary.bestAchievableMinVillageReach.toFixed(1)}%)
              </button>
              <button
                onClick={() => setFairnessFloor(0.35)}
                className={`px-2 py-1 rounded-[3px] border font-bold transition-all ${
                  Math.abs(fairnessFloor - 0.35) < 0.01
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ⚠ Standard 35% Floor (Shows Infeasible Shortfall)
              </button>
              <button
                onClick={() => setFairnessFloor(0.50)}
                className={`px-2 py-1 rounded-[3px] border font-bold transition-all ${
                  Math.abs(fairnessFloor - 0.50) < 0.01
                    ? 'bg-red-100 border-red-400 text-red-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Strict 50%
              </button>
            </div>
          </div>
        </div>

        {/* Assumed vs Computed Legend Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[0.7rem] font-mono-numbers text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700 uppercase">Assumed:</span>
            <span>Channel benchmarks (cell 85%, FM 55%), vehicle speeds, resource unit costs.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700 uppercase">Computed:</span>
            <span>BFS hop latencies, correlated cascading outages, Pareto frontiers.</span>
          </div>
        </div>
      </div>

      {/* Price of Fairness Frontier Section (SVG Chart & Benchmark Cards) */}
      <div className="utility-card p-5 sm:p-6 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--navy)]" />
            <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase">
              Price-of-Fairness Frontier & Optimizer Proof
            </h3>
          </div>
          <span className="stamp-label stamp-simulation text-[0.6rem]">
            PARETO TRADEOFF ANALYSIS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Native SVG Chart */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-[4px] p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2 text-xs font-mono-numbers">
              <span className="font-bold text-[var(--navy)]">Overall Regional Reach vs Minimum Community Reach</span>
              <span className="text-[0.68rem] text-slate-500">Budget: {budget} Units</span>
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
                      stroke="#123B63"
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
                      <circle cx={ax} cy={ay} r="6" fill="#123B63" stroke="#FFFFFF" strokeWidth="2" />
                      <rect x={ax + 8} y={ay - 14} width="95" height="18" fill="#123B63" rx="2" />
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
                      <rect x={bx - 105} y={by - 14} width="98" height="18" fill="#059669" rx="2" />
                      <text x={bx - 101} y={by - 1} fill="#FFFFFF" fontWeight="bold">
                        PLAN B: {planFairness.overallReachAfter}%
                      </text>
                    </g>
                  );
                })()}

                {/* Axis Titles */}
                <text x="255" y="198" textAnchor="middle" fill="#475569" fontWeight="600">
                  Minimum Community Reach (Weakest Village %) →
                </text>
                <text x="14" y="98" textAnchor="middle" transform="rotate(-90 14 98)" fill="#475569" fontWeight="600">
                  Overall Regional Reach (%) →
                </text>
              </svg>
            </div>

            {/* Crucial Plain Sentence Summary */}
            <div className="mt-3 p-3 bg-white border border-slate-200 rounded text-xs font-mono-numbers text-[var(--navy)] font-semibold shadow-2xs">
              📊 <strong>Frontier Finding:</strong> {frontierSummary.plainSentence}
            </div>
          </div>

          {/* Optimizer Rigour Proof & Benchmarking Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-4 font-mono-numbers text-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 text-[var(--navy)] font-bold">
              <Cpu className="w-4 h-4 text-[var(--amber-text)]" />
              <span>ALGORITHM BENCHMARKING</span>
            </div>

            <p className="text-[0.72rem] text-slate-600 leading-relaxed">
              To prove the optimizer is doing genuine work rather than naive selection, we benchmark Plan A against standard baseline heuristics and exhaustive 2<sup>N</sup> search:
            </p>

            <div className="space-y-2 text-[0.72rem]">
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>1. Exhaustive Global Optimum:</span>
                  <span className="text-emerald-700">{benchmarkResult.exhaustiveOptimal.maxReach}%</span>
                </div>
                <div className="text-slate-500 text-[0.68rem] mt-0.5">
                  Evaluated all 256 intervention combinations. Optimality gap: <strong>{benchmarkResult.exhaustiveOptimal.optimalityGap}%</strong> ({benchmarkResult.exhaustiveOptimal.isPlanAOptimal ? 'Provably Optimal' : 'Near-Optimal'}).
                </div>
              </div>

              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>2. Highest-Population-First:</span>
                  <span>{benchmarkResult.highestPopFirst.reach}%</span>
                </div>
                <div className="text-slate-500 text-[0.68rem] mt-0.5">
                  Spends {benchmarkResult.highestPopFirst.cost}u on largest coastal centres.
                </div>
              </div>

              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>3. Cheapest-First Heuristic:</span>
                  <span>{benchmarkResult.cheapestFirst.reach}%</span>
                </div>
                <div className="text-slate-500 text-[0.68rem] mt-0.5">
                  Spends {benchmarkResult.cheapestFirst.cost}u on smallest cost assets. Falls {(planReach.overallReachAfter - benchmarkResult.cheapestFirst.reach).toFixed(1)} pts short of optimizer.
                </div>
              </div>
            </div>

            <div className="text-[0.68rem] text-slate-500 pt-1 border-t border-slate-200">
              * SIMULATION · FICTIONAL DATA · Deterministic evaluation verified offline.
            </div>
          </div>
        </div>
      </div>

      {/* Model Insight Discovery Callout */}
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
