/**
 * PEREGRINE — AppShell Layout Component
 * Unifies the responsive layout, header controls, breadcrumbs,
 * main scrollable viewport, village modal inspector, and footer.
 */

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { NAV_ITEMS, NavTabId } from '../routes';
import { NetworkFailureState, S72VillageSummary, VillageChannelStatus } from '../../model/types';
import { VillageConfig } from '../../model/config';
import { ArrowRight, X } from 'lucide-react';

interface AppShellProps {
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  failures: NetworkFailureState;
  onToggleFailure: (nodeKey: keyof NetworkFailureState) => void;
  onPresetHealthy: () => void;
  onPresetCyclone: () => void;
  onPresetGatewayLost: () => void;
  onResetDefaults?: () => void;
  scenarioFeedback?: { message: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
  onClearFeedback?: () => void;
  selectedVillage?: VillageConfig;
  selectedVillageS72?: S72VillageSummary;
  selectedVillageIllusion?: VillageChannelStatus;
  onCloseVillageModal: () => void;
  isDemoActive?: boolean;
  onStartDemo?: () => void;
  demoTourNode?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onSelectTab,
  failures,
  onToggleFailure,
  onPresetHealthy,
  onPresetCyclone,
  onPresetGatewayLost,
  onResetDefaults,
  scenarioFeedback,
  onClearFeedback,
  selectedVillage,
  selectedVillageS72,
  selectedVillageIllusion,
  onCloseVillageModal,
  isDemoActive,
  onStartDemo,
  demoTourNode,
  children
}) => {
  const currentNavItem = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0];
  const CurrentNavIcon = currentNavItem.icon;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F7FAFC] text-[#17212B]">
      {/* 1. Header with branding, presets, fault controls, and navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        failures={failures}
        onToggleFailure={onToggleFailure}
        onPresetHealthy={onPresetHealthy}
        onPresetCyclone={onPresetCyclone}
        onPresetGatewayLost={onPresetGatewayLost}
        onResetDefaults={onResetDefaults}
        isDemoActive={isDemoActive}
        onStartDemo={onStartDemo}
      />

      {/* 1.1 Guided Demo Tour Ribbon (Active only during Evaluator Demo) */}
      {demoTourNode}

      {/* 1.2 Feedback Banner for Scenario & Reset Actions */}
      {scenarioFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`border-b px-4 py-2 text-xs font-mono-numbers transition-colors ${
            scenarioFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : scenarioFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : scenarioFeedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full shrink-0 bg-current" />
              <span>{scenarioFeedback.message}</span>
            </span>
            {onClearFeedback && (
              <button
                onClick={onClearFeedback}
                aria-label="Dismiss feedback notification"
                className="text-slate-500 hover:text-slate-800 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Mobile Breadcrumb Sub-bar (< lg) */}
      <div className="lg:hidden bg-slate-100 border-b border-[var(--border)] px-4 py-2 flex items-center justify-between text-xs font-mono-numbers">
        <div className="flex items-center gap-2 text-[var(--navy)] font-bold truncate">
          <CurrentNavIcon className="w-3.5 h-3.5 text-[var(--amber-text)] shrink-0" />
          <span className="truncate">View: {currentNavItem.label}</span>
        </div>
        <div className="text-[var(--navy)] font-semibold flex items-center gap-1 text-[0.72rem] bg-white border border-[var(--border)] px-2 py-0.5 rounded-[2px] shrink-0">
          <span>{currentNavItem.shortLabel}</span>
          <ArrowRight className="w-3 h-3 text-[var(--amber-text)]" />
        </div>
      </div>

      {/* 3. Primary Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {children}
      </main>

      {/* 4. Village Details Modal Inspector */}
      {selectedVillage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--border)] shadow-xl rounded-[4px] max-w-lg w-full p-6 font-mono-numbers text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--border)]">
              <div>
                <span className="stamp-label stamp-simulation text-[0.6rem] mb-1">
                  COMMUNITY INSPECTOR
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[var(--navy)]">
                  {selectedVillage.name}
                </h3>
                <span className="text-slate-500 text-[0.75rem]">
                  Population: {selectedVillage.pop.toLocaleString()} residents
                </span>
              </div>
              <button
                onClick={onCloseVillageModal}
                aria-label="Close modal"
                className="p-1 hover:bg-slate-100 rounded-[2px] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                <span className="font-bold text-[var(--navy)] block mb-0.5">Topographic Context:</span>
                <span className="text-[var(--muted)] leading-relaxed">{selectedVillage.description}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                  <span className="text-[0.68rem] text-[var(--muted)] block">72h SILENCE DURATION:</span>
                  <span className="text-lg font-bold text-[var(--navy)]">
                    {selectedVillageS72?.silenceHours || 0} Hours
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                  <span className="text-[0.68rem] text-[var(--muted)] block">N-1 GUARANTEED:</span>
                  <span className="text-lg font-bold text-[var(--green-text)]">
                    {selectedVillageIllusion?.n1Guaranteed || 0} Channels
                  </span>
                </div>
              </div>

              <div className="p-3 border border-[var(--border)] rounded-[3px] space-y-1.5 text-[0.72rem]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cellular Tower:</span>
                  <span className="font-bold">{selectedVillage.tower ? `Tower ${selectedVillage.tower}` : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">FM Broadcast:</span>
                  <span className="font-bold">{selectedVillage.fm ? 'Active coverage' : 'No reception'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shelter Mesh Node:</span>
                  <span className="font-bold">{selectedVillage.meshNode ? 'Installed' : 'None'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onCloseVillageModal}
              className="btn-tactile w-full py-2.5 text-xs rounded-[3px]"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* 5. Footer */}
      <Footer />
    </div>
  );
};
