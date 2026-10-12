import React, { useState } from 'react';
import { 
  VillageChannelStatus, 
  NodeId, 
  NetworkFailureState, 
  ActiveInterventions 
} from '../../model/types';
import { VillageConfig } from '../../model/config';
import { 
  analyzeRedundancyIllusion, 
  explainNodeCascade, 
  calculateRedundancySummary,
  CRITICAL_FAILURE_NODES
} from '../../metrics/redundancy';
import { 
  Layers, 
  ChevronRight,
  ChevronDown,
  GitFork,
  HelpCircle
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface RedundancyIllusionPanelProps {
  statusList: VillageChannelStatus[];
  villages: VillageConfig[];
  onSelectVillage?: (id: string) => void;
  selectedVillageId?: string | null;
  failures?: NetworkFailureState;
  interventions?: ActiveInterventions;
  onToggleFailure?: (node: keyof NetworkFailureState) => void;
  setInterventions?: React.Dispatch<React.SetStateAction<ActiveInterventions>>;
}

export const RedundancyIllusionPanel: React.FC<RedundancyIllusionPanelProps> = ({
  villages,
  onSelectVillage,
  selectedVillageId,
  failures = {
    power_west: false,
    power_east: false,
    power_east_permanent: false,
    fibre: false,
    tower_A: false,
    tower_B: false,
    fm_tx: false,
    gateway: false,
    gateway_backup: false,
    mesh_nodes_down: []
  },
  interventions = {
    backup_generation: false,
    second_gateway: false,
    mobile_broadcast_unit: false,
    community_kits: [],
    siren_responders: [],
    relay_nodes: []
  }
}) => {
  const [inspectedNode, setInspectedNode] = useState<NodeId | null>(null);

  // Full detailed analyses
  const analyses = React.useMemo(() => {
    return analyzeRedundancyIllusion({ villages } as any, failures, interventions);
  }, [villages, failures, interventions]);

  const summary = React.useMemo(() => {
    return calculateRedundancySummary(analyses);
  }, [analyses]);

  const getVillageName = (id: string) => villages.find(v => v.id === id)?.name || id;

  const nodeDetail = inspectedNode ? explainNodeCascade(inspectedNode) : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
        <div>
          <h3 className="text-sm font-semibold text-[#172033]">
            Settlement Redundancy Audit: Nominal Paths vs Guaranteed N-1
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Identifies shared upstream power and backhaul dependencies that cause multi-channel common-cause cuts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748B]">At Illusion Risk:</span>
          <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            {summary.villagesAtIllusionRisk} of {summary.totalVillages} Settlements
          </span>
        </div>
      </div>

      {/* Redundancy Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-medium">
              <th className="py-3 px-4">Settlement</th>
              <th className="py-3 px-3 text-center">Nominal (Paper)</th>
              <th className="py-3 px-3 text-center">Active Now</th>
              <th className="py-3 px-3 text-center">N-1 Guaranteed</th>
              <th className="py-3 px-4">Shared Upstream Dependencies</th>
              <th className="py-3 px-4 text-center">Resilience Status</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {analyses.map((analysis) => {
              const isSelected = selectedVillageId === analysis.villageId;
              const hasIllusion = analysis.hasRedundancyIllusion;
              const isZeroGuaranteed = analysis.n1Guaranteed === 0;

              return (
                <tr
                  key={analysis.villageId}
                  onClick={() => onSelectVillage && onSelectVillage(analysis.villageId)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#172033] flex items-center gap-1.5">
                      {getVillageName(analysis.villageId)}
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {analysis.channelDetails.map(c => c.channelName).join(', ')}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-semibold font-mono-numbers text-[#172033]">
                    {analysis.nominalCount}
                  </td>

                  <td className="py-3 px-3 text-center font-mono-numbers">
                    <span className={analysis.availableCount === 0 ? 'text-red-700 font-semibold' : 'text-[#172033]'}>
                      {analysis.availableCount}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono-numbers">
                    <span className={`inline-flex px-2 py-0.5 rounded font-semibold ${
                      isZeroGuaranteed
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : hasIllusion
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {analysis.n1Guaranteed}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#475569]">
                    {analysis.commonCauseNodes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {analysis.commonCauseNodes.map(node => (
                          <span
                            key={node}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedNode(node as NodeId);
                            }}
                            className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[11px] font-medium hover:bg-amber-100 transition-colors"
                          >
                            {node.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-medium">
                        Independent Paths (No Shared SPOF)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <StatusBadge
                      status={isZeroGuaranteed ? 'severed' : hasIllusion ? 'degraded' : 'operational'}
                      label={isZeroGuaranteed ? 'N-1 = 0 Cut Risk' : hasIllusion ? 'Illusion Risk' : 'Robust'}
                      size="sm"
                    />
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectVillage) onSelectVillage(analysis.villageId);
                      }}
                      className="text-[#2563EB] hover:text-[#1D4ED8] font-medium text-xs inline-flex items-center gap-0.5"
                    >
                      Audit <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expandable Technical Blast Radius Inspector */}
      <details className="border-t border-[#E2E8F0] group">
        <summary className="p-3.5 bg-[#F8FAFC] flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-[#172033] hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#2563EB]" />
            <span>Infrastructure Blast Radius Diagnostics & Common-Cause Matrix</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
        </summary>

        <div className="p-4 sm:p-5 bg-white space-y-4 text-xs">
          <p className="text-[#64748B]">
            Select an infrastructure node to simulate the catastrophic failure blast radius and trace severed communities.
          </p>

          {/* Node Selector */}
          <div className="flex flex-wrap gap-2">
            {CRITICAL_FAILURE_NODES.map((node) => {
              const isSelected = inspectedNode === node;
              const isFailed = failures[node as keyof NetworkFailureState];

              return (
                <button
                  key={node}
                  onClick={() => setInspectedNode(isSelected ? null : (node as NodeId))}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-transparent shadow-xs'
                      : isFailed
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{node.replace('_', ' ')}</span>
                  {isFailed && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                </button>
              );
            })}
          </div>

          {/* Detailed Node Cascade View */}
          {nodeDetail && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-semibold text-[#172033]">
                  Upstream Cut Impact: {nodeDetail.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#64748B] font-medium text-[11px]">
                  Category: {nodeDetail.category}
                </span>
              </div>

              <p className="text-[#475569] leading-relaxed text-xs">
                {nodeDetail.impactDescription}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] font-medium block text-[11px]">Direct Channel Impacts:</span>
                  <span className="text-[#172033] font-semibold">{nodeDetail.affectedChannels.join(', ')}</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] font-medium block text-[11px]">Severed Communities:</span>
                  <span className="text-[#172033] font-semibold">{nodeDetail.affectedVillages.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};
