import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { VillageInspectorDrawer } from '../../components/ui/VillageInspectorDrawer';
import { NavTabId } from '../routes';
import { NetworkFailureState, S72VillageSummary, VillageChannelStatus } from '../../model/types';
import { VillageConfig } from '../../model/config';

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
  isBackendConnected?: boolean | null;
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
  isBackendConnected = null,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F7F9FC] text-[#172033] font-sans-ui">
      {/* 1. Persistent Left Navigation Rail (Desktop) & Drawer (Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isDemoActive={isDemoActive}
        onStartDemo={onStartDemo}
        isBackendConnected={isBackendConnected}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Top Header */}
        <Header
          activeTab={activeTab}
          failures={failures}
          onPresetHealthy={onPresetHealthy}
          onPresetCyclone={onPresetCyclone}
          onPresetGatewayLost={onPresetGatewayLost}
          onResetDefaults={onResetDefaults}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* 2.1 Guided Demo Tour Ribbon (Active during Walkthrough) */}
        {demoTourNode}

        {/* 2.2 Operational Feedback Notification */}
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
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span className="font-medium">{scenarioFeedback.message}</span>
              </div>
              {onClearFeedback && (
                <button
                  onClick={onClearFeedback}
                  className="text-slate-400 hover:text-slate-700 underline text-[11px]"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2.3 Page View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Subtle Engineering Footer */}
        <Footer />
      </div>

      {/* 3. Global Settlement Inspection Drawer */}
      <VillageInspectorDrawer
        village={selectedVillage}
        s72Summary={selectedVillageS72}
        illusionSummary={selectedVillageIllusion}
        onClose={onCloseVillageModal}
      />
    </div>
  );
};
