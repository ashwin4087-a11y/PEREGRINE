import React, { useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Compass, 
  Info
} from 'lucide-react';
import { NavTabId } from '../routes';
import { NetworkFailureState } from '../../model/types';

export interface DemoStepDefinition {
  stepIndex: number;
  title: string;
  tab: NavTabId;
  targetFailures: NetworkFailureState;
  icon: React.ComponentType<{ className?: string }>;
  getCaption: () => string;
}

interface GuidedDemoTourProps {
  currentStep: number;
  totalSteps: number;
  stepDef: DemoStepDefinition;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
  onExit: () => void;
}

export const GuidedDemoTour: React.FC<GuidedDemoTourProps> = ({
  currentStep,
  totalSteps,
  stepDef,
  onNext,
  onPrev,
  onGoToStep,
  onExit,
}) => {
  const Icon = stepDef.icon;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
      return;
    }
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onExit();
    }
  }, [onNext, onPrev, onExit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div 
      role="region" 
      aria-label="Interactive Evaluator Demo Tour"
      className="bg-[#172033] text-white border-b border-[#334155] shadow-md select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2563EB] text-white font-mono-numbers text-[11px] font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5" />
              STEP {currentStep + 1} OF {totalSteps}
            </span>

            <span className="font-semibold text-sm text-white flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#60A5FA]" />
              <span>{stepDef.title}</span>
            </span>
          </div>

          {/* Stepper Dots & Buttons */}
          <div className="flex items-center gap-2 font-mono-numbers text-xs self-end sm:self-auto">
            {/* Dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onGoToStep(idx)}
                  title={`Jump to Step ${idx + 1}`}
                  aria-label={`Jump to Step ${idx + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-[#60A5FA] ring-2 ring-[#60A5FA]/40 scale-125'
                      : idx < currentStep
                      ? 'bg-emerald-400'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {/* Back Button */}
            <button
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous step"
              className={`px-2.5 py-1 rounded text-xs border border-slate-700 flex items-center gap-1 transition-colors ${
                isFirst 
                  ? 'opacity-30 cursor-not-allowed text-slate-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Next Button */}
            <button
              onClick={onNext}
              aria-label={isLast ? 'Complete Demo' : 'Next step'}
              className="px-3 py-1 rounded text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 shadow-xs transition-colors"
            >
              <span>{isLast ? 'Complete' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Exit */}
            <button
              onClick={onExit}
              aria-label="Exit walkthrough"
              title="Exit walkthrough (Esc)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Caption Card */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-xs font-mono-numbers text-slate-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p>{stepDef.getCaption()}</p>
          </div>
          <span className="hidden md:inline text-[10px] text-slate-400 shrink-0 border border-slate-700 px-1.5 py-0.5 rounded">
            Keys: ← / → or Space
          </span>
        </div>
      </div>
    </div>
  );
};
