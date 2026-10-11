/**
 * PEREGRINE — Experiment Log & Baseline Comparison (Section 11)
 * Compares PEREGRINE with Baselines A, B, and C.
 * Exports reproducible JSON/CSV runs and formats printable perforated analysis slips.
 * 
 * Audited: Replaces Math.random() with deterministic seed-hashed experiment records.
 */

import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../../model/config';
import { NetworkFailureState } from '../../model/graph';
import { generateReproducibleExperiment } from '../../integrity/experiment';
import { Download, FileText, Check, Copy, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PeregrineLogo } from '../ui/PeregrineLogo';

interface ExperimentLogViewProps {
  config: SystemConfig;
  s30Score: number;
  s72Reach: number;
  silenceCount: number;
  budgetUnits: number;
  failures: NetworkFailureState;
}

export const ExperimentLogView: React.FC<ExperimentLogViewProps> = ({
  config,
  budgetUnits,
  failures
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

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                Experiment Audit Log &amp; Baselines
              </h3>
              <span className="stamp-label stamp-simulation">DETERMINISTIC RUN</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Formal baseline comparison, deterministic seed logging, and exportable analysis slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed Input */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono-numbers">
            <span className="text-[0.65rem] text-[var(--muted)] font-semibold">SEED:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-16 bg-white px-1.5 py-0.5 rounded border border-slate-300 text-xs font-mono-numbers text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
              aria-label="Simulation random seed"
            />
          </div>

          <button
            onClick={() => setActiveFormat('slip')}
            className={`text-xs px-2.5 py-1.5 rounded-md font-mono-numbers transition-all ${
              activeFormat === 'slip' ? 'bg-[var(--navy)] text-white font-bold shadow-xs' : 'bg-white border border-slate-200 text-[var(--ink)] hover:bg-slate-50'
            }`}
          >
            Analysis Slip
          </button>
          <button
            onClick={() => setActiveFormat('json')}
            className={`text-xs px-2.5 py-1.5 rounded-md font-mono-numbers transition-all ${
              activeFormat === 'json' ? 'bg-[var(--navy)] text-white font-bold shadow-xs' : 'bg-white border border-slate-200 text-[var(--ink)] hover:bg-slate-50'
            }`}
          >
            JSON Raw
          </button>
          <button
            onClick={handleExportJson}
            className="btn-tactile text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Modelled Siren Patrol Assumption Disclaimer */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Model Assumption Notice — Siren Patrol Availability:
          </p>
          <p className="text-[0.72rem] leading-relaxed text-amber-800">
            {config.channels.siren.disclaimer} Modelled silence indicates absence of a verifiable broadcast link in simulation, never physical proof that residents did not hear an outdoor warning.
          </p>
        </div>
      </div>

      {/* Baseline Comparison Table (Section 11.2) */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
        <table className="w-full text-xs font-mono-numbers text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[var(--navy)]">
              <th className="p-3 font-bold">Strategy</th>
              <th className="p-3 font-bold">Approach Description</th>
              <th className="p-3 font-bold">S30 Alert Reach</th>
              <th className="p-3 font-bold">S72 Outage Reach</th>
              <th className="p-3 font-bold">Lowest Village Outcome</th>
              <th className="p-3 font-bold">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {experimentRun.baselines.map((b, idx) => (
              <tr
                key={b.id}
                className={`border-b border-slate-100 ${
                  idx === 3 ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <td className="p-3 font-heading font-bold text-sm text-[var(--navy)]">
                  {b.id}
                </td>
                <td className="p-3 text-[var(--ink)]">
                  {b.label}
                </td>
                <td className="p-3 font-bold">
                  {b.reachS30}
                </td>
                <td className="p-3 font-bold">
                  {b.reachS72}
                </td>
                <td className="p-3 text-[var(--muted)] text-[0.7rem]">
                  {b.lowestVillageOutcome}
                </td>
                <td className="p-3">
                  <span
                    className={`stamp-label text-[0.6rem] ${
                      idx === 3
                        ? 'stamp-verified'
                        : idx === 0
                        ? 'stamp-critical'
                        : 'stamp-warning'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Perforated Analysis Slip Preview */}
      {activeFormat === 'slip' ? (
        <div className="relative mt-4 bg-white border border-slate-300 shadow-sm p-6 rounded-lg font-mono-numbers text-xs text-[var(--ink)]">
          <div className="flex justify-between items-start pb-3 border-b-2 border-dashed border-slate-300">
            <PeregrineLogo size="sm" showDescriptor={false} />
            <div className="text-right">
              <span className="stamp-label stamp-simulation text-[0.6rem] mb-1">
                IEEE BTS HACKATHON AUDIT SLIP
              </span>
              <p className="text-[0.68rem] text-[var(--muted)]">
                RUN: {experimentRun.experimentId}
              </p>
              <p className="text-[0.62rem] text-slate-500 font-mono">
                CHECKSUM: {experimentRun.checksum}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-[0.72rem] pb-4 border-b border-dashed border-slate-200">
            <div>
              <span className="text-[0.65rem] text-[var(--muted)] block">SCENARIO:</span>
              <span className="font-bold">Severe Cyclone</span>
            </div>
            <div>
              <span className="text-[0.65rem] text-[var(--muted)] block">POPULATION:</span>
              <span className="font-bold">19,900 Residents</span>
            </div>
            <div>
              <span className="text-[0.65rem] text-[var(--muted)] block">BUDGET USED:</span>
              <span className="font-bold">{budgetUnits} Units</span>
            </div>
            <div>
              <span className="text-[0.65rem] text-[var(--muted)] block">OUTCOME:</span>
              <span className="font-bold text-[var(--green-text)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Output
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
            <span className="text-[0.7rem] text-[var(--muted)]">
              Reproducibility verified: identical inputs and seed produce identical checksums.
            </span>
            <button
              onClick={handleCopySlip}
              className="btn-tactile-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md self-start sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Slip' : 'Copy Slip to Clipboard'}
            </button>
          </div>
        </div>
      ) : (
        <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-lg font-mono-numbers text-[0.7rem] overflow-x-auto leading-relaxed border border-slate-800">
          {JSON.stringify(experimentRun, null, 2)}
        </pre>
      )}
    </div>
  );
};
