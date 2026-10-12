import React from 'react';
import { NAV_ITEMS, NavTabId } from '../routes';
import { NetworkFailureState } from '../../model/types';
import { 
  Menu, 
  RotateCcw, 
  ShieldCheck, 
  CloudLightning, 
  AlertTriangle, 
  Zap, 
  Radio
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTabId;
  failures: NetworkFailureState;
  onPresetHealthy: () => void;
  onPresetCyclone: () => void;
  onPresetGatewayLost: () => void;
  onResetDefaults?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  failures,
  onPresetHealthy,
  onPresetCyclone,
  onPresetGatewayLost,
  onResetDefaults,
  onOpenMobileMenu
}) => {
  const currentNav = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0];
  const CurrentIcon = currentNav.icon;

  // Compute active failures count
  const activeFailureCount = Object.values(failures).filter(Boolean).length;

  // Active scenario preset identification
  const isHealthy = activeFailureCount === 0;
  const isCyclone = failures.power_west && failures.power_east && failures.fibre && !failures.gateway;
  const isGatewayLost = failures.power_west && failures.power_east && failures.fibre && failures.gateway;

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] hidden sm:inline font-medium">PEREGRINE</span>
            <span className="text-[#CBD5E1] hidden sm:inline">/</span>
            <div className="flex items-center gap-1.5 font-bold text-[#172033]">
              <CurrentIcon className="w-4 h-4 text-[#2563EB]" />
              <span className="truncate">{currentNav.label}</span>
            </div>
          </div>
        </div>

        {/* Right: Scenario Controls & Active Failure Tally */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Scenario Selector Group */}
          <div className="flex items-center p-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs">
            <button
              onClick={onPresetHealthy}
              aria-pressed={isHealthy}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-all flex items-center gap-1.5 ${
                isHealthy
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Healthy</span>
            </button>

            <button
              onClick={onPresetCyclone}
              aria-pressed={isCyclone}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-all flex items-center gap-1.5 ${
                isCyclone
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cyclone</span>
            </button>

            <button
              onClick={onPresetGatewayLost}
              aria-pressed={isGatewayLost}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-all flex items-center gap-1.5 ${
                isGatewayLost
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Gateway Loss</span>
            </button>
          </div>

          {/* Active Fault Status Chip */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-[#E2E8F0] bg-white">
            {activeFailureCount === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Grid Intact</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="font-mono-numbers font-bold">{activeFailureCount}</span>
                <span>cuts active</span>
              </span>
            )}
          </div>

          {/* Reset Action */}
          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              title="Reset scenario configuration and clear all failures"
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-colors"
              aria-label="Reset scenario defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
