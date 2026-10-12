import React from 'react';
import { NAV_ITEMS, NavTabId } from '../routes';
import { 
  Radio, 
  HelpCircle, 
  CheckCircle2, 
  WifiOff, 
  Activity, 
  Clock, 
  Layers, 
  Scale, 
  Calendar, 
  Key, 
  Sliders,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  isDemoActive?: boolean;
  onStartDemo?: () => void;
  isBackendConnected?: boolean | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isDemoActive,
  onStartDemo,
  isBackendConnected,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navSections = [
    {
      title: 'OPERATIONAL COMMAND',
      items: NAV_ITEMS.filter(item => ['overview', 'silence', 'failure_analysis'].includes(item.id))
    },
    {
      title: 'RECOVERY PLANNING',
      items: NAV_ITEMS.filter(item => ['recovery_planner'].includes(item.id))
    },
    {
      title: 'INTEGRITY & VERIFICATION',
      items: NAV_ITEMS.filter(item => ['alert_integrity'].includes(item.id))
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] select-none">
      {/* Brand & System Identity */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[#172033] flex items-center gap-1.5">
              <span>PEREGRINE</span>
              <span className="text-[10px] font-mono-numbers px-1 py-0.2 bg-[#EFF6FF] text-[#2563EB] rounded font-semibold border border-[#DBEAFE]">
                v2.2
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] font-medium leading-none mt-0.5">
              Emergency Broadcast Network
            </div>
          </div>
        </div>
      </div>

      {/* Backend Mode Status Banner */}
      <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono-numbers">
        <span className="text-[#64748B] uppercase tracking-wider font-semibold">Engine:</span>
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendConnected === true
                ? 'bg-emerald-500'
                : isBackendConnected === false
                ? 'bg-blue-500'
                : 'bg-slate-400'
            }`}
          />
          <span className={isBackendConnected === true ? 'text-emerald-700' : 'text-blue-700'}>
            {isBackendConnected === true
              ? 'REST API (:3001)'
              : isBackendConnected === false
              ? 'Deterministic Engine'
              : 'Syncing...'}
          </span>
        </span>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto" aria-label="Main Navigation">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id as NavTabId);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#BFDBFE]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#172033] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Guided Walkthrough Launcher & System Footer */}
      <div className="p-3 border-t border-[#E2E8F0] space-y-2 bg-[#F8FAFC]">
        {onStartDemo && (
          <button
            onClick={onStartDemo}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md border transition-all ${
              isDemoActive
                ? 'bg-[#2563EB] text-white border-transparent shadow-xs'
                : 'bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isDemoActive ? 'Walkthrough Active' : 'Start Guided Demo'}</span>
          </button>
        )}

        <div className="px-1 text-[10px] text-[#94A3B8] font-mono-numbers flex justify-between items-center">
          <span>MODEL: S30 &amp; S72</span>
          <span>8 SETTLEMENTS</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Rail */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-100'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
