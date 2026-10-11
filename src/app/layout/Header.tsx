/**
 * PEREGRINE — Primary Header Component
 * Contains official vector branding, scenario preset triggers, fault toggle drawer, and navigation tabs.
 */

import React, { useState } from 'react';
import { PeregrineLogo } from '../../components/ui/PeregrineLogo';
import { NAV_ITEMS, NavTabId } from '../routes';
import { NetworkFailureState } from '../../model/types';
import { 
  CloudLightning, 
  RotateCcw, 
  ShieldAlert, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Compass
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  failures: NetworkFailureState;
  onToggleFailure: (nodeKey: keyof NetworkFailureState) => void;
  onPresetHealthy: () => void;
  onPresetCyclone: () => void;
  onPresetGatewayLost: () => void;
  isDemoActive?: boolean;
  onStartDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  failures,
  onToggleFailure,
  onPresetHealthy,
  onPresetCyclone,
  onPresetGatewayLost,
  isDemoActive = false,
  onStartDemo
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFaultDrawerOpen, setIsFaultDrawerOpen] = useState(false);

  const activeFailureCount = Object.values(failures).filter(Boolean).length;
  const isHealthyPreset = activeFailureCount === 0;
  const isCyclonePreset = failures.power_west && failures.power_east && failures.fibre && !failures.gateway;
  const isGatewayLostPreset = failures.power_west && failures.power_east && failures.fibre && failures.gateway;

  const handleTabClick = (tabId: NavTabId) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-[var(--border)] relative z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Brand Lockup & Mobile Toggle */}
        <div className="flex items-center justify-between">
          <PeregrineLogo size="md" variant="lockup-horizontal" />

          {/* Mobile / Tablet Menu Button (< lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-[3px] border border-[var(--border)] bg-slate-50 text-[var(--navy)] text-xs font-mono-numbers font-semibold hover:bg-slate-100 min-h-[44px] min-w-[44px] justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        {/* Tactical Scenario Quick-Presets & Fault State Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono-numbers text-xs">
          <span className="text-[var(--muted)] text-[0.7rem] uppercase tracking-wider hidden sm:inline font-semibold">
            SCENARIO PRESETS:
          </span>

          {/* Guided Evaluator Demo Walkthrough Button */}
          {onStartDemo && (
            <button
              onClick={onStartDemo}
              title="Launch 6-step guided walkthrough for evaluators and judges"
              className={`px-3 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 font-bold transition-all ${
                isDemoActive
                  ? 'bg-[var(--amber)] border-[#D9822B] text-[var(--deep-navy)] shadow-sm ring-2 ring-[var(--amber)]/50'
                  : 'bg-[var(--navy)] border-[var(--navy)] text-white hover:bg-[#1B4B79] shadow-xs'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[var(--amber)]" />
              <span>{isDemoActive ? 'Demo Active' : 'Demo Tour'}</span>
            </button>
          )}

          {/* Preset: Healthy Grid */}
          <button
            onClick={onPresetHealthy}
            title="Reset all infrastructure to healthy, baseline operational state"
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 transition-all font-semibold ${
              isHealthyPreset
                ? 'bg-emerald-50 border-emerald-300 text-[var(--green-text)] shadow-xs'
                : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Healthy Grid</span>
          </button>

          {/* Preset: Cyclone Compound Failure */}
          <button
            onClick={onPresetCyclone}
            title="Simulate correlated landfall: Power West + Power East + Core Fibre cut"
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 transition-all font-semibold ${
              isCyclonePreset
                ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs ring-1 ring-red-300'
                : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5 text-red-600" />
            <span>Cyclone Hits</span>
          </button>

          {/* Preset: Gateway Lost */}
          <button
            onClick={onPresetGatewayLost}
            title="Simulate complete satellite feed loss: Cyclone + Marina Gateway offline"
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 transition-all font-semibold ${
              isGatewayLostPreset
                ? 'bg-amber-50 border-amber-300 text-[var(--amber-text)] shadow-xs ring-1 ring-amber-300'
                : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Gateway Lost</span>
          </button>

          {/* Active Fault Indicator / Drawer Toggle */}
          <button
            onClick={() => setIsFaultDrawerOpen(!isFaultDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 font-semibold transition-all ${
              activeFailureCount > 0
                ? 'bg-amber-50 border-amber-300 text-[var(--amber-text)]'
                : 'bg-slate-50 border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{activeFailureCount} Faults Active</span>
          </button>
        </div>
      </div>

      {/* Fault Drawer Popover */}
      {isFaultDrawerOpen && (
        <div className="border-t border-b border-[var(--border)] bg-slate-50 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono-numbers">
            <span className="text-[var(--navy)] font-bold">MANUAL FAULT INJECTION TOGGLES:</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(failures) as Array<keyof NetworkFailureState>).map(key => {
                if (key === 'power_east_permanent' || key === 'gateway_backup') return null;
                const isFailed = failures[key];
                return (
                  <button
                    key={key}
                    onClick={() => onToggleFailure(key)}
                    className={`px-2 py-1 rounded-[2px] border text-[0.7rem] font-bold transition-all ${
                      isFailed
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {key.toUpperCase()}: {isFailed ? 'FAILED [CUT]' : 'UP'}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsFaultDrawerOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Technical Stripe */}
      <div className="technical-header-stripe" />

      {/* Primary Navigation Tabs — Desktop (>= lg) */}
      <nav aria-label="Primary" className="hidden lg:block bg-slate-50 border-t border-[var(--border-light)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 py-1.5 min-w-max">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[3px] text-xs font-mono-numbers transition-all ${
                  isActive
                    ? 'bg-[var(--navy)] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-[var(--navy)] hover:bg-white/80 font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--amber)]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Drawer (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[var(--border)] px-4 py-3 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono-numbers text-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-[3px] text-left transition-all ${
                    isActive
                      ? 'bg-[var(--navy)] text-white font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--amber)]' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-[0.68rem] ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                      {item.shortLabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
