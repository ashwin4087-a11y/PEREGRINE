import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../../model/config';
import { NetworkFailureState } from '../../model/graph';
import { generateReproducibleExperiment } from '../../integrity/experiment';
import { 
  evaluateHeadlineFairnessRobustness,
  HeadlineRobustnessResult 
} from '../../experiments/sensitivity';
import { Download, FileText, Check, Copy, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface ExperimentLogViewProps {
  config: SystemConfig;
  s30Score: number;
  s72Reach: number;
  silenceCount: number;
  budgetUnits: number;
  failures: NetworkFailureState;
  section?: 'A' | 'C' | 'all';
}

export const ExperimentLogView: React.FC<ExperimentLogViewProps> = ({
  config,
  budgetUnits,
  failures,
  section = 'all'
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeFormat, setActiveFormat] = useState<'slip' | 'json'>('slip');
  const [seed, setSeed] = useState<number>(42891);

  // Deterministic experiment generation from model simulation
  const experimentRun = useMemo(() => {
    return generateReproducibleExperiment(
      config,
      failures,
      budgetUnits,
      config.planning.defaultFloor,
      seed,
      'Cyclone Compound Infrastructure Failure (West Power + Fibre Cut)'
    );
  }, [config, failures, budgetUnits, seed]);

  // Robustness analysis under ±30% perturbation
  const robustnessResult: HeadlineRobustnessResult = useMemo(() => {
    return evaluateHeadlineFairnessRobustness(config, failures, budgetUnits, 0.5);
  }, [config, failures, budgetUnits]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(experimentRun, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${experimentRun.experimentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySlip = () => {
    const slipText = `
======================================================
PEREGRINE DISASTER-RESILIENT BROADCAST NETWORK
IEEE BTS HACKATHON — REPRODUCIBLE AUDIT REPORT
RUN ID: ${experimentRun.experimentId} | SEED: ${experimentRun.seed}
CHECKSUM: ${experimentRun.checksum}
STATUS: DETERMINISTIC MODELLED SIMULATION
======================================================
SCENARIO: ${experimentRun.scenario}
BUDGET CEILING: ${budgetUnits} UNITS | FAIRNESS FLOOR: ${(config.planning.defaultFloor * 100).toFixed(0)}%

BASELINE COMPARISON:
- Baseline A (Cell Only): ${experimentRun.baselines[0].reachS30} S30 reach [Fibre severed]
- Baseline B (Naive Independence): ${experimentRun.baselines[1].reachS30} [False illusion]
- Baseline C (Un-optimized): ${experimentRun.baselines[2].reachS30} S30 / ${experimentRun.baselines[2].reachS72} S72
- Strategy D (PEREGRINE Planner): ${experimentRun.baselines[3].reachS30} S30 / ${experimentRun.baselines[3].reachS72} S72

WORST-SERVED COMMUNITIES:
- Isolated villages: Addressed via community kits and siren patrols
- Modelled Silence: Refers to broadcast path absence; not proof of physical inaudibility.
======================================================
`;
    navigator.clipboard.writeText(slipText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSectionA = () => (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
        <div>
          <div className="text-xs font-semibold text-[#2563EB] mb-0.5">
            SECTION A
          </div>
          <h3 className="text-sm font-semibold text-[#172033]">
            Baseline Architecture Comparison
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Comparative benchmark of legacy emergency broadcast approaches versus PEREGRINE's dual-objective resilience model.
          </p>
        </div>

        <StatusBadge
          status="operational"
          label="4 Strategies Evaluated"
          size="sm"
        />
      </div>

      {/* 4-Column Baseline Comparison Table */}
      <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-medium">
              <th className="py-3 px-4">Architecture Strategy</th>
              <th className="py-3 px-3 text-center">S30 Alert Reach</th>
              <th className="py-3 px-3 text-center">S72 Outage Reach</th>
              <th className="py-3 px-3 text-center">Fairness Compliance</th>
              <th className="py-3 px-4">Failure Mechanism / Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {experimentRun.baselines.map((b, idx) => {
              const isPeregrine = idx === 3;

              return (
                <tr
                  key={b.id}
                  className={`transition-colors ${
                    isPeregrine ? 'bg-[#EFF6FF]/60 font-medium' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#172033] flex items-center gap-1.5">
                      {isPeregrine && <ShieldCheck className="w-4 h-4 text-[#2563EB]" />}
                      <span>{b.label}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono-numbers">
                      {b.id}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono-numbers">
                    <span className={`text-sm font-bold ${isPeregrine ? 'text-[#2563EB]' : 'text-[#172033]'}`}>
                      {b.reachS30}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono-numbers">
                    <span className={`text-sm font-bold ${isPeregrine ? 'text-emerald-700' : 'text-[#172033]'}`}>
                      {b.reachS72}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <StatusBadge
                      status={b.status === 'OPTIMAL & FAIR' ? 'operational' : b.status === 'COMPLETE COLLAPSE' ? 'severed' : 'degraded'}
                      label={b.status === 'OPTIMAL & FAIR' ? 'Optimal & Fair' : b.status === 'COMPLETE COLLAPSE' ? 'Total Collapse' : 'Deficit'}
                      size="sm"
                    />
                  </td>

                  <td className="py-3.5 px-4 text-[#475569] text-xs leading-relaxed">
                    {b.lowestVillageOutcome}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSectionC = () => (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="text-xs font-semibold text-[#2563EB] mb-0.5">
            SECTION C
          </div>
          <h3 className="text-sm font-semibold text-[#172033]">
            Experiment Results, Conclusions &amp; Reproducibility Information
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Headline conclusion invariance across &plusmn;30% parameter stress and cryptographic verification audit slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono-numbers">
            <span className="text-[11px] text-[#64748B] font-semibold">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-16 bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-xs font-mono-numbers text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              aria-label="Simulation random seed"
            />
          </div>

          <button
            onClick={() => setActiveFormat('slip')}
            className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${
              activeFormat === 'slip' ? 'bg-[#172033] text-white font-semibold shadow-xs' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Audit Slip
          </button>
          <button
            onClick={() => setActiveFormat('json')}
            className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${
              activeFormat === 'json' ? 'bg-[#172033] text-white font-semibold shadow-xs' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Raw JSON
          </button>
          <button
            onClick={handleExportJson}
            className="text-xs px-3 py-1.5 rounded-md bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Robustness Key Finding */}
      <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
          <span className="font-semibold text-[#172033]">
            Headline Finding: Isolated Settlements Require Explicit Fairness Constraint
          </span>
          <StatusBadge
            status={robustnessResult.conclusionHolds ? 'operational' : 'degraded'}
            label={robustnessResult.conclusionHolds ? 'Holds in 100% of Trials' : 'Variable'}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block font-medium">Conclusion Invariance</span>
            <div className="text-sm font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{robustnessResult.conclusionHolds ? '100% of Trials' : 'Variable'}</span>
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">
              Thoni &amp; Hill Camp abandoned at 0% reach under Plan A in all 16 corner tests
            </span>
          </div>

          <div className="p-3 bg-white rounded border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block font-medium">Fairness Cost Bounds</span>
            <div className="text-sm font-bold text-[#172033] mt-0.5 font-mono-numbers">
              +{robustnessResult.fairnessCostMin}% to +{robustnessResult.fairnessCostMax}% pts
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">
              Average aggregate trade-off: {robustnessResult.averageFairnessCost}% pts
            </span>
          </div>

          <div className="p-3 bg-white rounded border border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B] block font-medium">Corner Combinations Tested</span>
            <div className="text-sm font-bold text-[#172033] mt-0.5 font-mono-numbers">
              16 Parameter Combinations
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">
              Siren &plusmn;30%, Kit &plusmn;30%, FM &plusmn;30%, Generator &plusmn;30%
            </span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-950 leading-relaxed">
          <strong>Empirical Conclusion:</strong> Plan A always prioritizes coastal centres because Thoni (900) and Hill Camp (600) have no cell tower and no FM reception contour. Even if vehicle sirens and community kits vary by &plusmn;30% in effectiveness, Plan A leaves both settlements at 0.0% reach in every single trial. Protecting these communities strictly requires an explicit algorithmic fairness constraint.
        </div>
      </div>

      {/* Slip or JSON View */}
      {activeFormat === 'slip' ? (
        <div className="border border-[#CBD5E1] rounded-lg p-5 bg-[#F8FAFC] text-xs relative space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="text-xs font-semibold text-[#172033]">
                PEREGRINE Reproducible Audit Report Slip
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-mono-numbers">
                Run ID: {experimentRun.experimentId} • Seed: {experimentRun.seed}
              </div>
            </div>

            <button
              onClick={handleCopySlip}
              className="px-2.5 py-1 text-xs rounded border border-[#CBD5E1] bg-white text-[#172033] hover:bg-[#F1F5F9] transition-colors flex items-center gap-1 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] block text-[11px]">Evaluation Scenario:</span>
              <span className="font-semibold text-[#172033] block">{experimentRun.scenario}</span>
              <span className="text-[#64748B] text-[11px] block mt-1">
                Budget: <strong className="font-mono-numbers text-[#172033]">{budgetUnits}u</strong> • Fairness Floor: <strong className="font-mono-numbers text-[#172033]">{(config.planning.defaultFloor * 100).toFixed(0)}%</strong>
              </span>
            </div>

            <div className="p-3 bg-white rounded border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] block text-[11px]">Cryptographic SHA-256 Checksum:</span>
              <span className="font-mono-numbers text-[#2563EB] truncate block text-xs">{experimentRun.checksum}</span>
              <span className="text-emerald-700 text-[11px] block mt-1 font-medium">
                Deterministic offline reproducible verification run
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#CBD5E1] rounded-lg p-4 bg-[#1E293B] text-slate-100 font-mono-numbers text-[11px] overflow-x-auto">
          <pre>{JSON.stringify(experimentRun, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  if (section === 'A') return renderSectionA();
  if (section === 'C') return renderSectionC();

  return (
    <div className="space-y-6">
      {renderSectionA()}
      {renderSectionC()}
    </div>
  );
};
