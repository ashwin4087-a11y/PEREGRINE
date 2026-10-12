import React from 'react';
import { VillageConfig } from '../../model/config';
import { S72VillageSummary, VillageChannelStatus } from '../../model/types';
import { StatusBadge } from './StatusBadge';
import { 
  X, 
  MapPin, 
  Users, 
  Wifi, 
  Radio, 
  Signal, 
  ShieldAlert, 
  Clock, 
  Info
} from 'lucide-react';

interface VillageInspectorDrawerProps {
  village?: VillageConfig;
  s72Summary?: S72VillageSummary;
  illusionSummary?: VillageChannelStatus;
  onClose: () => void;
}

export const VillageInspectorDrawer: React.FC<VillageInspectorDrawerProps> = ({
  village,
  s72Summary,
  illusionSummary,
  onClose
}) => {
  if (!village) return null;

  const isIsolated = s72Summary ? s72Summary.silenceHours === 72 : false;
  const isDegraded = s72Summary ? s72Summary.silenceHours > 0 && s72Summary.silenceHours < 72 : false;
  const hasCCFRisk = illusionSummary ? illusionSummary.commonCauseNodes.length > 0 : false;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-village-title"
    >
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-[#E2E8F0] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-start justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono-numbers">
                SETTLEMENT AUDIT
              </span>
              <StatusBadge
                status={isIsolated ? 'severed' : isDegraded ? 'degraded' : 'operational'}
                label={isIsolated ? '72h OUTAGE' : isDegraded ? 'DEGRADED REACH' : 'NORMAL REACH'}
                size="sm"
              />
            </div>
            <h2 id="inspector-village-title" className="text-xl font-bold text-[#172033] mt-1">
              {village.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#64748B] font-mono-numbers mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                Grid ({village.x}, {village.y})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                {village.pop.toLocaleString()} residents
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 flex-1 text-sm text-[#172033]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono-numbers">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] font-medium text-[#64748B] uppercase">72h Total Silence</span>
              <div className="text-lg font-bold text-[#172033] mt-0.5">
                {s72Summary ? `${s72Summary.silenceHours}h` : '0h'}
              </div>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] font-medium text-[#64748B] uppercase">72h Time-Avg Reach</span>
              <div className="text-lg font-bold text-[#172033] mt-0.5">
                {s72Summary ? `${(s72Summary.timeAvgReach * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] font-medium text-[#64748B] uppercase">Nominal Channels</span>
              <div className="text-lg font-bold text-[#172033] mt-0.5">
                {illusionSummary ? illusionSummary.nominalCount : (s72Summary?.nominalChannels ?? 0)} paths
              </div>
            </div>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <span className="text-[11px] font-medium text-[#64748B] uppercase">N-1 Guaranteed</span>
              <div className="text-lg font-bold text-[#172033] mt-0.5">
                {illusionSummary ? illusionSummary.n1Guaranteed : (s72Summary?.n1Guaranteed ?? 0)} paths
              </div>
            </div>
          </div>

          {/* Description */}
          {village.description && (
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#64748B] leading-relaxed">
              <span className="font-semibold text-[#172033] block mb-0.5">Settlement Context:</span>
              {village.description}
            </div>
          )}

          {/* Warning Channels Breakdown */}
          {illusionSummary && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Modeled Warning Channels
              </h3>
              <div className="space-y-2">
                {/* Cell Channel */}
                <div className={`p-3 rounded-md border flex items-center justify-between text-xs font-mono-numbers ${
                  illusionSummary.cell ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded ${illusionSummary.cell ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      <Signal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#172033]">Cellular Broadcast</div>
                      <div className="text-[11px] text-[#64748B]">
                        {village.tower ? `Tower ${village.tower}` : 'No Tower Coverage'}
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold ${illusionSummary.cell ? 'text-emerald-700' : 'text-red-700'}`}>
                    {illusionSummary.cell ? 'ONLINE' : 'CUT'}
                  </span>
                </div>

                {/* FM Channel */}
                <div className={`p-3 rounded-md border flex items-center justify-between text-xs font-mono-numbers ${
                  illusionSummary.fm ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded ${illusionSummary.fm ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#172033]">FM High-Power Radio</div>
                      <div className="text-[11px] text-[#64748B]">
                        {village.fm ? 'Coastal FM Transmitter' : 'Outside FM Primary Contour'}
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold ${illusionSummary.fm ? 'text-emerald-700' : 'text-red-700'}`}>
                    {illusionSummary.fm ? 'ONLINE' : 'CUT'}
                  </span>
                </div>

                {/* Mesh Relay Channel */}
                <div className={`p-3 rounded-md border flex items-center justify-between text-xs font-mono-numbers ${
                  illusionSummary.mesh ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded ${illusionSummary.mesh ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#172033]">Shelter Mesh Relay</div>
                      <div className="text-[11px] text-[#64748B]">
                        {village.meshNode ? 'Battery-buffered Mesh Node' : 'No Mesh Hardware'}
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold ${illusionSummary.mesh ? 'text-emerald-700' : 'text-red-700'}`}>
                    {illusionSummary.mesh ? 'ONLINE' : 'CUT'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Redundancy Illusion Risk Notice */}
          {hasCCFRisk && illusionSummary && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4" />
                <span>Common-Cause Cut Risk Detected</span>
              </div>
              <p className="leading-relaxed">
                Nominally configured with {illusionSummary.nominalCount} channels, but shared upstream dependencies ({illusionSummary.commonCauseNodes.join(', ')}) cut multiple broadcast paths simultaneously. N-1 guaranteed resilience is only {illusionSummary.n1Guaranteed}.
              </p>
            </div>
          )}

          {/* Single Point of Failure Notice */}
          {illusionSummary?.singlePointsOfFailure && illusionSummary.singlePointsOfFailure.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-md space-y-1.5 text-xs text-red-900">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <ShieldAlert className="w-4 h-4" />
                <span>Single Point of Failure (SPOF)</span>
              </div>
              <p className="leading-relaxed">
                Loss of [{illusionSummary.singlePointsOfFailure.join(', ')}] causes a complete blackout for this community (N-1 guaranteed drops to 0).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
