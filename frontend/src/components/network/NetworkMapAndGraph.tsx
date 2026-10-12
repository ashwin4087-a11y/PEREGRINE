import React from 'react';
import { VillageConfig } from '../../model/config';
import { NetworkFailureState, ActiveInterventions } from '../../model/graph';
import { 
  Zap, 
  Wifi, 
  Signal, 
  Radio, 
  Satellite, 
  CheckCircle2, 
  AlertOctagon, 
  Info,
  MapPin
} from 'lucide-react';

interface NetworkMapAndGraphProps {
  villages: VillageConfig[];
  failures: NetworkFailureState;
  interventions: ActiveInterventions;
  onToggleFailure: (key: keyof NetworkFailureState) => void;
  selectedVillageId?: string | null;
  onSelectVillage?: (id: string) => void;
}

export const NetworkMapAndGraph: React.FC<NetworkMapAndGraphProps> = ({
  villages,
  failures,
  interventions,
  onToggleFailure,
  selectedVillageId,
  onSelectVillage
}) => {
  // Key infrastructure node positions on the 540x520 canvas
  const nodes = {
    power_west: { x: 75, y: 110, label: 'West Substation', failed: failures.power_west },
    power_east: { x: 75, y: 390, label: 'East Substation', failed: failures.power_east },
    fibre: { x: 260, y: 250, label: 'Core Fibre', failed: failures.fibre },
    tower_A: { x: 220, y: 120, label: 'Tower A (North)', failed: failures.tower_A },
    tower_B: { x: 220, y: 390, label: 'Tower B (South)', failed: failures.tower_B },
    fm_tx: { x: 120, y: 250, label: 'FM Transmitter', failed: failures.fm_tx },
    gateway: { x: 250, y: 190, label: 'Marina Gateway', failed: failures.gateway }
  };

  // Mesh hop connections between villages with mesh capability
  const meshLinks = [
    ['marina', 'kovalam'],
    ['kovalam', 'pazhaya'],
    ['marina', 'karai'],
    ['karai', 'uppalam'],
    ['uppalam', 'sagar']
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
      {/* Topology Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFCFE]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033] tracking-tight">
              Coastal Network Topology &amp; Cut Paths
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded font-semibold">
              Interactive
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select settlements to inspect warning paths. Click infrastructure nodes or toggles below to simulate cuts.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Intact Link
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cut / Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Fibre Backhaul
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Shelter Mesh Hop
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden">
        <svg
          viewBox="0 0 540 520"
          className="w-full h-auto select-none min-h-[440px] md:min-h-[490px]"
        >
          <defs>
            <pattern id="lightGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="540" height="520" fill="#F8FAFC" />
          <rect width="540" height="520" fill="url(#lightGrid)" opacity="0.7" />

          {/* Coastline indication */}
          <path
            d="M 190 0 C 210 140, 240 260, 210 380 C 190 450, 210 520, 220 520"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="25" y="24" fill="#94A3B8" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600" letterSpacing="0.08em">
            [WESTERN COASTLINE]
          </text>
          <text x="390" y="24" fill="#94A3B8" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600" letterSpacing="0.08em">
            [INLAND / HINTERLAND]
          </text>

          {/* Power West Feed to Tower A */}
          <line
            x1={nodes.power_west.x}
            y1={nodes.power_west.y}
            x2={nodes.tower_A.x}
            y2={nodes.tower_A.y}
            stroke={failures.power_west ? '#EF4444' : '#10B981'}
            strokeWidth={failures.power_west ? 2 : 2.5}
            strokeDasharray={failures.power_west ? '4 4' : 'none'}
          />

          {/* Power East Feed to Tower B & FM Tx */}
          <line
            x1={nodes.power_east.x}
            y1={nodes.power_east.y}
            x2={nodes.tower_B.x}
            y2={nodes.tower_B.y}
            stroke={failures.power_east && !interventions.backup_generation ? '#EF4444' : '#10B981'}
            strokeWidth={2.5}
            strokeDasharray={failures.power_east && !interventions.backup_generation ? '4 4' : 'none'}
          />
          <line
            x1={nodes.power_east.x}
            y1={nodes.power_east.y}
            x2={nodes.fm_tx.x}
            y2={nodes.fm_tx.y}
            stroke={failures.power_east && !interventions.backup_generation ? '#EF4444' : '#10B981'}
            strokeWidth={2.5}
            strokeDasharray={failures.power_east && !interventions.backup_generation ? '4 4' : 'none'}
          />

          {/* Fibre to Towers */}
          <line
            x1={nodes.fibre.x}
            y1={nodes.fibre.y}
            x2={nodes.tower_A.x}
            y2={nodes.tower_A.y}
            stroke={failures.fibre ? '#EF4444' : '#2563EB'}
            strokeWidth={failures.fibre ? 2 : 2.5}
            strokeDasharray={failures.fibre ? '4 4' : 'none'}
          />
          <line
            x1={nodes.fibre.x}
            y1={nodes.fibre.y}
            x2={nodes.tower_B.x}
            y2={nodes.tower_B.y}
            stroke={failures.fibre ? '#EF4444' : '#2563EB'}
            strokeWidth={failures.fibre ? 2 : 2.5}
            strokeDasharray={failures.fibre ? '4 4' : 'none'}
          />

          {/* Tower Cell Broadcast Coverage Rings */}
          {!failures.tower_A && !failures.power_west && !failures.fibre && (
            <circle cx={nodes.tower_A.x} cy={nodes.tower_A.y} r="130" fill="rgba(37,99,235,0.04)" stroke="rgba(37,99,235,0.2)" strokeDasharray="3 3" />
          )}
          {!failures.tower_B && (!failures.power_east || interventions.backup_generation) && !failures.fibre && (
            <circle cx={nodes.tower_B.x} cy={nodes.tower_B.y} r="130" fill="rgba(37,99,235,0.04)" stroke="rgba(37,99,235,0.2)" strokeDasharray="3 3" />
          )}

          {/* Shelter Mesh Links */}
          {meshLinks.map(([fromId, toId], idx) => {
            const vFrom = villages.find(v => v.id === fromId);
            const vTo = villages.find(v => v.id === toId);
            if (!vFrom || !vTo) return null;
            const gatewayAlive = !failures.gateway || interventions.second_gateway;

            return (
              <line
                key={`mesh-${idx}`}
                x1={vFrom.x}
                y1={vFrom.y}
                x2={vTo.x}
                y2={vTo.y}
                stroke={gatewayAlive ? '#D97706' : '#EF4444'}
                strokeWidth="2"
                strokeDasharray={gatewayAlive ? '2 2' : '4 4'}
              />
            );
          })}

          {/* Power West Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('power_west')}
            transform={`translate(${nodes.power_west.x}, ${nodes.power_west.y})`}
          >
            <circle r="15" fill={failures.power_west ? '#FEE2E2' : '#EFF6FF'} stroke={failures.power_west ? '#DC2626' : '#2563EB'} strokeWidth="2" />
            <Zap x="-7" y="-7" width="14" height="14" color={failures.power_west ? '#DC2626' : '#2563EB'} />
            <text x="20" y="4" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              West Grid {failures.power_west ? '[CUT]' : '[OK]'}
            </text>
          </g>

          {/* Power East Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('power_east')}
            transform={`translate(${nodes.power_east.x}, ${nodes.power_east.y})`}
          >
            <circle r="15" fill={failures.power_east ? '#FEE2E2' : '#EFF6FF'} stroke={failures.power_east ? '#DC2626' : '#2563EB'} strokeWidth="2" />
            <Zap x="-7" y="-7" width="14" height="14" color={failures.power_east ? '#DC2626' : '#2563EB'} />
            <text x="20" y="4" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              East Grid {failures.power_east ? '[CUT]' : '[OK]'}
            </text>
          </g>

          {/* Fibre Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('fibre')}
            transform={`translate(${nodes.fibre.x}, ${nodes.fibre.y})`}
          >
            <circle r="15" fill={failures.fibre ? '#FEE2E2' : '#F0FDF4'} stroke={failures.fibre ? '#DC2626' : '#16A34A'} strokeWidth="2" />
            <Wifi x="-7" y="-7" width="14" height="14" color={failures.fibre ? '#DC2626' : '#16A34A'} />
            <text x="20" y="4" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              Fibre {failures.fibre ? '[SEVERED]' : '[ACTIVE]'}
            </text>
          </g>

          {/* Tower A */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('tower_A')}
            transform={`translate(${nodes.tower_A.x}, ${nodes.tower_A.y})`}
          >
            <rect x="-12" y="-12" width="24" height="24" rx="4" fill={failures.tower_A ? '#FEE2E2' : '#EFF6FF'} stroke={failures.tower_A ? '#DC2626' : '#2563EB'} strokeWidth="2" />
            <Signal x="-6" y="-6" width="12" height="12" color={failures.tower_A ? '#DC2626' : '#2563EB'} />
            <text x="18" y="-3" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Tower A
            </text>
            <text x="18" y="8" fill={failures.tower_A ? '#DC2626' : '#16A34A'} fontSize="8" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              {failures.tower_A ? 'COLLAPSED' : 'ON-AIR'}
            </text>
          </g>

          {/* Tower B */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('tower_B')}
            transform={`translate(${nodes.tower_B.x}, ${nodes.tower_B.y})`}
          >
            <rect x="-12" y="-12" width="24" height="24" rx="4" fill={failures.tower_B ? '#FEE2E2' : '#EFF6FF'} stroke={failures.tower_B ? '#DC2626' : '#2563EB'} strokeWidth="2" />
            <Signal x="-6" y="-6" width="12" height="12" color={failures.tower_B ? '#DC2626' : '#2563EB'} />
            <text x="18" y="-3" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Tower B
            </text>
            <text x="18" y="8" fill={failures.tower_B ? '#DC2626' : '#16A34A'} fontSize="8" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              {failures.tower_B ? 'COLLAPSED' : 'ON-AIR'}
            </text>
          </g>

          {/* FM Transmitter */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('fm_tx')}
            transform={`translate(${nodes.fm_tx.x}, ${nodes.fm_tx.y})`}
          >
            <circle r="15" fill={failures.fm_tx ? '#FEE2E2' : '#F0FDF4'} stroke={failures.fm_tx ? '#DC2626' : '#16A34A'} strokeWidth="2" />
            <Radio x="-7" y="-7" width="14" height="14" color={failures.fm_tx ? '#DC2626' : '#16A34A'} />
            <text x="20" y="4" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              FM Tx {failures.fm_tx ? '[FAULT]' : '[ONLINE]'}
            </text>
          </g>

          {/* Satellite Gateway at Marina */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('gateway')}
            transform={`translate(${nodes.gateway.x}, ${nodes.gateway.y})`}
          >
            <circle r="15" fill={failures.gateway ? '#FEE2E2' : '#FEF3C7'} stroke={failures.gateway ? '#DC2626' : '#D97706'} strokeWidth="2" />
            <Satellite x="-7" y="-7" width="14" height="14" color={failures.gateway ? '#DC2626' : '#D97706'} />
            <text x="20" y="4" fill="#172033" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Sat Gateway {failures.gateway ? '[LOST]' : '[INGESTING]'}
            </text>
          </g>

          {/* Applied Interventions Overlays */}
          {interventions.backup_generation && (
            <g transform="translate(130, 420)">
              <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
              <text x="14" y="4" fill="#065F46" fontSize="9" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
                ⚡🔋 Diesel Gen (20u)
              </text>
            </g>
          )}

          {interventions.mobile_broadcast_unit && (
            <g transform="translate(260, 290)">
              <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
              <text x="14" y="4" fill="#0369A1" fontSize="9" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
                🚚 Mobile FM (30u)
              </text>
            </g>
          )}

          {interventions.second_gateway && (
            <g transform="translate(320, 110)">
              <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
              <text x="14" y="4" fill="#92400E" fontSize="9" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
                🛰 2nd Sat Gateway (40u)
              </text>
            </g>
          )}

          {/* Village Settlement Nodes */}
          {villages.map(v => {
            const isSelected = selectedVillageId === v.id;
            const hasSiren = Boolean(interventions.siren_responders?.includes(v.id));
            const hasKit = Boolean(interventions.community_kits?.includes(v.id));
            const isIsolated = !v.tower && !v.fm && !hasSiren && !hasKit;

            const circleFill = hasSiren ? '#FDE68A' : hasKit ? '#A7F3D0' : isIsolated ? '#EF4444' : '#FFFFFF';
            const circleStroke = hasSiren ? '#D97706' : hasKit ? '#059669' : isIsolated ? '#DC2626' : isSelected ? '#2563EB' : '#475569';

            return (
              <g
                key={v.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectVillage && onSelectVillage(v.id)}
                transform={`translate(${v.x}, ${v.y})`}
              >
                {isSelected && (
                  <circle r="18" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
                )}

                {hasSiren && (
                  <circle r="22" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                )}

                <circle
                  r={isSelected ? 10 : 8}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth="2.5"
                />

                <rect
                  x="13"
                  y="-11"
                  width={v.name.length * 7.5 + (hasSiren || hasKit ? 55 : 16)}
                  height="20"
                  rx="4"
                  fill="#FFFFFF"
                  stroke={isSelected ? '#2563EB' : hasSiren ? '#F59E0B' : '#CBD5E1'}
                  strokeWidth={isSelected || hasSiren ? '1.5' : '1'}
                  className="shadow-xs"
                />
                <text
                  x="19"
                  y="3"
                  fill="#172033"
                  fontSize="11"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="600"
                >
                  {v.name} {hasSiren ? '📢' : hasKit ? '📦' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Operational Failure Switches Grid */}
      <div className="p-4 sm:p-5 bg-white">
        <div className="text-xs font-mono-numbers text-[#64748B] font-semibold uppercase tracking-wider mb-3">
          Component Fault Toggles (Cascade Simulation):
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono-numbers">
          {/* Group 1: Power Subsystems */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
            <span className="text-[11px] font-bold text-[#172033] block uppercase tracking-wide">
              Power Substations
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleFailure('power_west')}
                className={`p-2 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.power_west
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] text-[#64748B]">WEST GRID</span>
                <span className="font-bold">{failures.power_west ? 'SEVERED' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('power_east')}
                className={`p-2 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.power_east
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] text-[#64748B]">EAST GRID</span>
                <span className="font-bold">{failures.power_east ? 'SEVERED' : 'NORMAL'}</span>
              </button>
            </div>
          </div>

          {/* Group 2: Backhaul & Gateway */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
            <span className="text-[11px] font-bold text-[#172033] block uppercase tracking-wide">
              Fibre &amp; Gateway
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleFailure('fibre')}
                className={`p-2 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.fibre
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] text-[#64748B]">CORE FIBRE</span>
                <span className="font-bold">{failures.fibre ? 'SEVERED' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('gateway')}
                className={`p-2 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.gateway
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] text-[#64748B]">SAT GATEWAY</span>
                <span className="font-bold">{failures.gateway ? 'LOST' : 'NORMAL'}</span>
              </button>
            </div>
          </div>

          {/* Group 3: Broadcast Towers */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2">
            <span className="text-[11px] font-bold text-[#172033] block uppercase tracking-wide">
              Transmitters
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onToggleFailure('tower_A')}
                className={`p-1.5 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.tower_A
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[9px] text-[#64748B]">TOWER A</span>
                <span className="font-bold text-[11px]">{failures.tower_A ? 'CUT' : 'OK'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('tower_B')}
                className={`p-1.5 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.tower_B
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[9px] text-[#64748B]">TOWER B</span>
                <span className="font-bold text-[11px]">{failures.tower_B ? 'CUT' : 'OK'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('fm_tx')}
                className={`p-1.5 rounded border font-medium transition-all text-left flex flex-col justify-between ${
                  failures.fm_tx
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                }`}
              >
                <span className="text-[9px] text-[#64748B]">FM TX</span>
                <span className="font-bold text-[11px]">{failures.fm_tx ? 'OFF' : 'OK'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
