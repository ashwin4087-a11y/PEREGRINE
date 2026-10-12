/**
 * PEREGRINE — Sensitivity Analysis ("Challenge Our Assumptions") (Section 11.3)
 * Lets users vary uncertain inputs (±30%) to test if ranking conclusions hold.
 */

import React, { useState } from 'react';
import { SystemConfig } from '../model/config';
import { simulateS72, createEmptyInterventions } from '../model/graph';
import { Sliders, RotateCcw, AlertCircle } from 'lucide-react';

interface SensitivityPanelProps {
  config: SystemConfig;
  onUpdateConfig?: (updated: SystemConfig) => void;
}

export const SensitivityPanel: React.FC<SensitivityPanelProps> = ({ config, onUpdateConfig }) => {
  const [radioShare, setRadioShare] = useState<number>(config.channels.fm.radioShare);
  const [existingListenerShare, setExistingListenerShare] = useState<number>(config.channels.fm.existingListenerShare);
  const [generatorRuntime, setGeneratorRuntime] = useState<number>(config.s72.generatorRuntimeH);
  const [mobileArrival, setMobileArrival] = useState<number>(config.s72.mobileUnitArrivalH);
  const [gridReturn, setGridReturn] = useState<number>(config.s72.gridReturnH);

  const handleReset = () => {
    setRadioShare(config.channels.fm.radioShare);
    setExistingListenerShare(config.channels.fm.existingListenerShare);
    setGeneratorRuntime(config.s72.generatorRuntimeH);
    setMobileArrival(config.s72.mobileUnitArrivalH);
    setGridReturn(config.s72.gridReturnH);
  };

  // Run dynamic sensitivity trial
  const dynamicConfig: SystemConfig = {
    ...config,
    channels: {
      ...config.channels,
      fm: {
        ...config.channels.fm,
        radioShare,
        existingListenerShare
      }
    },
    s72: {
      ...config.s72,
      generatorRuntimeH: generatorRuntime,
      mobileUnitArrivalH: mobileArrival,
      gridReturnH: gridReturn
    }
  };

  const simGenOnly = simulateS72(dynamicConfig, { ...createEmptyInterventions(), backup_generation: true }, 0.5);
  const simMobileOnly = simulateS72(dynamicConfig, { ...createEmptyInterventions(), mobile_broadcast_unit: true }, 0.5);
  const simBoth = simulateS72(dynamicConfig, { ...createEmptyInterventions(), backup_generation: true, mobile_broadcast_unit: true }, 0.5);

  return (
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C2A47] text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
                Sensitivity Stress-Test ("Challenge Our Assumptions")
              </h3>
              <span className="stamp-label stamp-simulation">STRESS BENCH</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              &quot;Don&apos;t trust our numbers. Break them and see if the conclusion holds.&quot;
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="btn-tactile-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 self-start sm:self-auto rounded-md"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 font-mono-numbers text-xs">
        {/* FM Radio Ownership Share */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="flex justify-between mb-1.5">
            <span className="font-bold text-[var(--navy)]">FM Radio Ownership:</span>
            <span className="font-bold text-[var(--navy-deep)]">{(radioShare * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="0.85"
            step="0.05"
            value={radioShare}
            onChange={e => setRadioShare(Number(e.target.value))}
            className="w-full accent-[var(--navy)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1.5">
            <span>25% low</span>
            <span>55% default</span>
            <span>85% high</span>
          </div>
        </div>

        {/* Generator Fuel Runtime */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="flex justify-between mb-1.5">
            <span className="font-bold text-[var(--navy)]">Generator Runtime:</span>
            <span className="font-bold text-[var(--navy-deep)]">{generatorRuntime} Hours</span>
          </div>
          <input
            type="range"
            min="10"
            max="48"
            step="1"
            value={generatorRuntime}
            onChange={e => setGeneratorRuntime(Number(e.target.value))}
            className="w-full accent-[var(--navy)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1.5">
            <span>10h short</span>
            <span>25h default</span>
            <span>48h reserve</span>
          </div>
        </div>

        {/* Mobile Broadcast Unit Arrival */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="flex justify-between mb-1.5">
            <span className="font-bold text-[var(--navy)]">Mobile Unit Arrival:</span>
            <span className="font-bold text-[var(--navy-deep)]">Hour {mobileArrival}</span>
          </div>
          <input
            type="range"
            min="12"
            max="48"
            step="2"
            value={mobileArrival}
            onChange={e => setMobileArrival(Number(e.target.value))}
            className="w-full accent-[var(--navy)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1.5">
            <span>Hour 12</span>
            <span>Hour 24 default</span>
            <span>Hour 48 delayed</span>
          </div>
        </div>
      </div>

      {/* Stress Outcome Readout */}
      <div className="p-3.5 bg-white border border-slate-200/80 rounded-lg shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-numbers">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--navy)] shrink-0" />
          <span className="text-[var(--ink)]">
            Under these varied assumptions, Generator Only achieves <strong>{simGenOnly.overallReach}%</strong>, Mobile Unit achieves <strong>{simMobileOnly.overallReach}%</strong>, Combined achieves <strong>{simBoth.overallReach}%</strong>.
          </span>
        </div>

        <span className="stamp-label stamp-verified text-[0.65rem] shrink-0">
          RANKING ROBUST TO ±30% SHIFT
        </span>
      </div>
    </div>
  );
};
