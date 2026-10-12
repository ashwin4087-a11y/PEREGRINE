import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] py-4 text-xs font-mono-numbers text-[#64748B] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#172033]">PEREGRINE v2.2</span>
          <span>•</span>
          <span>Disaster-Resilient Broadcast Network</span>
          <span>•</span>
          <span>IEEE BTS Hackathon</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px]">
            DECISION-SUPPORT SIMULATION · FICTIONAL DATA
          </span>
        </div>
      </div>
    </footer>
  );
};
