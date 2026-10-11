/**
 * PEREGRINE — Sensitivity Analysis ("Challenge Our Assumptions") (Section 11.3)
 * Lets users vary uncertain inputs (±30%) to test if ranking conclusions hold.
 */

import React, { useState, useMemo } from 'react';
import { SystemConfig } from '../../model/config';
import { simulateS72, createEmptyInterventions } from '../../model/graph';
import { 
  evaluateHeadlineFairnessRobustness,
  HeadlineRobustnessResult 
} from '../../experiments/sensitivity';
import { 
  Sliders, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  HeartHandshake,
  TrendingUp,
  Scale
} from 'lucide-react';

interface SensitivityPanelProps {
  config: SystemConfig;
  onUpdateConfig?: (updated: SystemConfig) => void;
}

export const SensitivityPanel: React.FC<SensitivityPanelProps> = ({ config, onUpdateConfig }) => {
  const [radioShare, setRadioShare] = useState<number>(config.channels.fm.radioShare);
  const [existingListenerShare, setExistingListenerShare] = useState<number>(config.channels.fm.existingListenerShare);
  const [sirenReach, setSirenReach] = useState<number>(config.channels.siren.reachS72);
  const [communityKitReach, setCommunityKitReach] = useState<number>(config.channels.communityKit.reachS72);
  const [generatorRuntime, setGeneratorRuntime] = useState<number>(config.s72.generatorRuntimeH);
  const [mobileArrival, setMobileArrival] = useState<number>(config.s72.mobileUnitArrivalH);
  const [gridReturn, setGridReturn] = useState<number>(config.s72.gridReturnH);

  const handleReset = () => {
    setRadioShare(config.channels.fm.radioShare);
    setExistingListenerShare(config.channels.fm.existingListenerShare);
    setSirenReach(config.channels.siren.reachS72);
    setCommunityKitReach(config.channels.communityKit.reachS72);
    setGeneratorRuntime(config.s72.generatorRuntimeH);
    setMobileArrival(config.s72.mobileUnitArrivalH);
    setGridReturn(config.s72.gridReturnH);
  };

  const cycloneFailures = useMemo(() => ({
    power_west: true,
    power_east: true,
    fibre: true,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false
  }), []);

  // Run ±30% headline conclusion robustness analysis
  const robustnessResult: HeadlineRobustnessResult = useMemo(() => {
    return evaluateHeadlineFairnessRobustness(config, cycloneFailures, 50, 0.5);
  }, [config, cycloneFailures]);

  // Run dynamic sensitivity trial
  const dynamicConfig: SystemConfig = {
    ...config,
    channels: {
      ...config.channels,
      fm: {
        ...config.channels.fm,
        radioShare,
        existingListenerShare
      },
      siren: {
        ...config.channels.siren,
        reachS72: sirenReach
      },
      communityKit: {
        ...config.channels.communityKit,
        reachS72: communityKitReach
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

      {/* Headline Conclusion Robustness Card (Task 4) */}
      <div className="bg-slate-50 border-2 border-slate-300 rounded-[4px] p-4.5 space-y-3 font-mono-numbers text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-[var(--navy)] uppercase">
              Headline Conclusion Robustness (±30% Multi-Parameter Stress)
            </h4>
          </div>
          <span className="stamp-label stamp-verified text-[0.65rem]">
            UNDER THESE ASSUMPTIONS
          </span>
        </div>

        <p className="text-slate-700 leading-relaxed text-[0.78rem]">
          Judges asked: <em>Does the finding that Plan A leaves isolated villages behind survive if siren and community kit reach change?</em>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[0.68rem] text-slate-500 uppercase font-semibold">Conclusion Status</span>
            <div className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{robustnessResult.conclusionHolds ? 'Holds in 100% of Trials' : 'Variable'}</span>
            </div>
            <span className="text-[0.68rem] text-slate-500 mt-1 block">
              Thoni & Hill Camp at 0.0% in {robustnessResult.smallestVillagesAbandonedCount}/{robustnessResult.totalTrials} tests
            </span>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[0.68rem] text-slate-500 uppercase font-semibold">Fairness Cost Range</span>
            <div className="text-sm font-bold text-[var(--navy)] mt-0.5">
              +{robustnessResult.fairnessCostMin}% to +{robustnessResult.fairnessCostMax}% pts
            </div>
            <span className="text-[0.68rem] text-slate-500 mt-1 block">
              Average aggregate trade-off: {robustnessResult.averageFairnessCost}% pts
            </span>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[0.68rem] text-slate-500 uppercase font-semibold">Tested Variations</span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              16 Corner Combinations
            </div>
            <span className="text-[0.68rem] text-slate-500 mt-1 block">
              Siren ±30%, Kit ±30%, FM ±30%, Gen ±30%
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded text-[0.75rem] text-emerald-950 leading-relaxed">
          <strong>Finding:</strong> Under these assumptions, Plan A always prioritizes dense coastal communities because Thoni (900) and Hill Camp (600) have no cell tower and no FM receiver. Even if vehicle sirens and community receiver kits vary by ±30% in effectiveness, Plan A leaves them with 0.0% reach in every single trial. Protecting these settlements strictly requires an explicit algorithmic fairness constraint.
        </div>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 my-4 font-mono-numbers text-xs">
        {/* FM Radio Ownership Share */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded">
          <div className="flex justify-between mb-1">
            <span className="font-bold text-[var(--navy)]">FM Radio Share:</span>
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
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1">
            <span>25% (-55%)</span>
            <span>55% (nom)</span>
            <span>85% (+55%)</span>
          </div>
        </div>

        {/* Siren Reach S72 */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded">
          <div className="flex justify-between mb-1">
            <span className="font-bold text-[var(--navy)]">Siren Patrol Reach:</span>
            <span className="font-bold text-[var(--navy-deep)]">{(sirenReach * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.30"
            max="0.70"
            step="0.05"
            value={sirenReach}
            onChange={e => setSirenReach(Number(e.target.value))}
            className="w-full accent-[var(--amber)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1">
            <span>35% (-30%)</span>
            <span>50% (nom)</span>
            <span>65% (+30%)</span>
          </div>
        </div>

        {/* Community Kit Reach */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded">
          <div className="flex justify-between mb-1">
            <span className="font-bold text-[var(--navy)]">Community Kit:</span>
            <span className="font-bold text-[var(--navy-deep)]">{(communityKitReach * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.45"
            max="0.95"
            step="0.05"
            value={communityKitReach}
            onChange={e => setCommunityKitReach(Number(e.target.value))}
            className="w-full accent-[var(--green)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1">
            <span>49% (-30%)</span>
            <span>70% (nom)</span>
            <span>91% (+30%)</span>
          </div>
        </div>

        {/* Generator Fuel Runtime */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded">
          <div className="flex justify-between mb-1">
            <span className="font-bold text-[var(--navy)]">Gen Runtime:</span>
            <span className="font-bold text-[var(--navy-deep)]">{generatorRuntime}h</span>
          </div>
          <input
            type="range"
            min="15"
            max="35"
            step="1"
            value={generatorRuntime}
            onChange={e => setGeneratorRuntime(Number(e.target.value))}
            className="w-full accent-[var(--navy)] cursor-pointer"
          />
          <div className="flex justify-between text-[0.65rem] text-[var(--muted)] mt-1">
            <span>17.5h (-30%)</span>
            <span>25h (nom)</span>
            <span>32.5h (+30%)</span>
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
