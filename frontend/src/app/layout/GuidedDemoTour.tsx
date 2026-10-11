/**
 * PEREGRINE — Guided Demo Tour Component
 * 6-step structured walkthrough for evaluators and judges.
 * Provides live dynamic captions (<= 2 sentences), progress bar,
 * keyboard navigation (Left/Right/Space/Esc), and prefers-reduced-motion support.
 */

import React, { useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  Play, 
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Scale
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
    // Ignore if typing inside input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
      return;
    }
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
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
      className="bg-[var(--navy)] text-white border-b-2 border-[var(--amber)] shadow-md transition-all duration-150 motion-reduce:transition-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        {/* Top Control Bar: Step Pill & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[var(--amber)] text-[var(--deep-navy)] font-mono-numbers text-[0.72rem] font-extrabold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              GUIDED DEMO · STEP {currentStep + 1} OF {totalSteps}
            </span>

            <span className="font-heading font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <Icon className="w-4 h-4 text-[var(--amber)] inline-block shrink-0" />
              <span>{stepDef.title}</span>
            </span>
          </div>

          {/* Stepper Dots & Action Buttons */}
          <div className="flex items-center gap-2 font-mono-numbers text-xs self-end md:self-auto">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onGoToStep(idx)}
                  title={`Jump to Step ${idx + 1}`}
                  aria-label={`Jump to Step ${idx + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-[var(--amber)] ${
                    idx === currentStep
                      ? 'bg-[var(--amber)] ring-2 ring-[var(--amber)]/50 scale-125'
                      : idx < currentStep
                      ? 'bg-emerald-400'
                      : 'bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            {/* Back Button */}
            <button
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous step"
              className={`px-3 py-1.5 rounded-[3px] border border-slate-600 flex items-center gap-1 transition-all ${
                isFirst 
                  ? 'opacity-40 cursor-not-allowed text-slate-400' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Next / Finish Button */}
            <button
              onClick={onNext}
              aria-label={isLast ? 'Finish tour' : 'Next step'}
              className="px-3.5 py-1.5 rounded-[3px] bg-[var(--amber)] hover:bg-[#F0A928] text-[var(--deep-navy)] font-bold flex items-center gap-1 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span>{isLast ? 'Complete Demo' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Exit Button */}
            <button
              onClick={onExit}
              aria-label="Exit guided tour"
              title="Exit guided tour (Esc)"
              className="p-1.5 rounded-[3px] hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Live Caption Box */}
        <div className="bg-[#0C2A47]/90 border border-slate-700/80 rounded-[4px] p-3 text-xs sm:text-sm font-mono-numbers text-slate-100 flex items-start gap-2.5 shadow-inner">
          <Sparkles className="w-4 h-4 text-[var(--amber)] shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p>{stepDef.getCaption()}</p>
          </div>
          <span className="hidden lg:inline text-[0.68rem] text-slate-400 self-center shrink-0 border border-slate-700 px-2 py-0.5 rounded-[2px]">
            Keys: ← / → or Space
          </span>
        </div>
      </div>
    </div>
  );
};
