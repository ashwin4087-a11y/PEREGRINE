/**
 * PEREGRINE — Network Topology Map & Cut-Path Graph (Section 6 & 14.4)
 * Schematic coastal & hinterland network diagram showing infrastructure nodes,
 * villages, transmission radiuses, mesh hops, and severed links.
 */

import React from 'react';
import { VillageConfig } from '../../model/config';
import { NetworkFailureState, ActiveInterventions } from '../../model/graph';
import { Radio, Zap, Wifi, Signal } from 'lucide-react';

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
    power_west: { x: 80, y: 120, label: 'Power Grid West', failed: failures.power_west },
    power_east: { x: 80, y: 380, label: 'Power Grid East', failed: failures.power_east },
    fibre: { x: 260, y: 260, label: 'Core Fibre Backhaul', failed: failures.fibre },
    tower_A: { x: 220, y: 130, label: 'Cell Tower A (North)', failed: failures.tower_A },
    tower_B: { x: 220, y: 390, label: 'Cell Tower B (South)', failed: failures.tower_B },
    fm_tx: { x: 120, y: 250, label: 'FM High-Power Tx', failed: failures.fm_tx },
    gateway: { x: 250, y: 200, label: 'Marina Sat Gateway', failed: failures.gateway }
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
    <div className="utility-card p-5 sm:p-6 space-y-5 rounded-[4px] border border-[var(--border)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-[var(--navy)] uppercase tracking-wide">
              Topological Network &amp; Cut-Path Map
            </h3>
            <span className="stamp-label stamp-simulation">TOPOLOGY MODEL</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Click nodes directly on the map or use the failure switches below to simulate cascading outages.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-mono-numbers">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)]" /> Active Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)]" /> Cut / Broken
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amber)]" /> Mesh Hop
          </span>
        </div>
      </div>

      {/* SVG Canvas Map (High-visibility retro-utility console) */}
      <div className="relative w-full bg-[#081D33] border border-[#17436D] rounded-[3px] overflow-hidden">
        <svg
          viewBox="0 0 540 520"
          className="w-full h-auto select-none min-h-[440px] md:min-h-[490px]"
        >
          <defs>
            <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
            <linearGradient id="coastGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#081D33" />
              <stop offset="60%" stopColor="#0A243D" />
              <stop offset="100%" stopColor="#0E3255" />
            </linearGradient>
          </defs>

          {/* Background & Schematic Terrain */}
          <rect width="540" height="520" fill="url(#coastGradient)" />
          <rect width="540" height="520" fill="url(#gridPattern)" />

          {/* Coastline indication (dashed curve) */}
          <path
            d="M 190 0 C 210 140, 240 260, 210 380 C 190 450, 210 520, 220 520"
            fill="none"
            stroke="rgba(86,166,122,0.25)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="30" y="25" fill="#5B6B80" fontSize="10" fontFamily="'Azeret Mono', monospace" letterSpacing="0.1em">
            [COASTAL SECTOR]
          </text>
          <text x="390" y="25" fill="#5B6B80" fontSize="10" fontFamily="'Azeret Mono', monospace" letterSpacing="0.1em">
            [HINTERLAND / HILLS]
          </text>

          {/* Infrastructure Power Lines */}
          <line
            x1={nodes.power_west.x}
            y1={nodes.power_west.y}
            x2={nodes.tower_A.x}
            y2={nodes.tower_A.y}
            stroke={failures.power_west ? '#C95C5C' : '#56A67A'}
            strokeWidth={failures.power_west ? 2 : 2.5}
            strokeDasharray={failures.power_west ? '4 4' : 'none'}
          />

          <line
            x1={nodes.power_east.x}
            y1={nodes.power_east.y}
            x2={nodes.tower_B.x}
            y2={nodes.tower_B.y}
            stroke={failures.power_east && !interventions.backup_generation ? '#C95C5C' : '#56A67A'}
            strokeWidth={2.5}
            strokeDasharray={failures.power_east && !interventions.backup_generation ? '4 4' : 'none'}
          />
          <line
            x1={nodes.power_east.x}
            y1={nodes.power_east.y}
            x2={nodes.fm_tx.x}
            y2={nodes.fm_tx.y}
            stroke={failures.power_east && !interventions.backup_generation ? '#C95C5C' : '#56A67A'}
            strokeWidth={2.5}
            strokeDasharray={failures.power_east && !interventions.backup_generation ? '4 4' : 'none'}
          />

          {/* Fibre to Towers */}
          <line
            x1={nodes.fibre.x}
            y1={nodes.fibre.y}
            x2={nodes.tower_A.x}
            y2={nodes.tower_A.y}
            stroke={failures.fibre ? '#C95C5C' : '#38BDF8'}
            strokeWidth={failures.fibre ? 2 : 2.5}
            strokeDasharray={failures.fibre ? '4 4' : 'none'}
          />
          <line
            x1={nodes.fibre.x}
            y1={nodes.fibre.y}
            x2={nodes.tower_B.x}
            y2={nodes.tower_B.y}
            stroke={failures.fibre ? '#C95C5C' : '#38BDF8'}
            strokeWidth={failures.fibre ? 2 : 2.5}
            strokeDasharray={failures.fibre ? '4 4' : 'none'}
          />

          {/* Tower Cell Broadcast Cones */}
          {!failures.tower_A && !failures.power_west && !failures.fibre && (
            <circle cx={nodes.tower_A.x} cy={nodes.tower_A.y} r="130" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.2)" strokeDasharray="3 3" />
          )}
          {!failures.tower_B && (!failures.power_east || interventions.backup_generation) && !failures.fibre && (
            <circle cx={nodes.tower_B.x} cy={nodes.tower_B.y} r="130" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.2)" strokeDasharray="3 3" />
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
                stroke={gatewayAlive ? '#F4B942' : 'rgba(201,92,92,0.45)'}
                strokeWidth="1.8"
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
            <circle r="15" fill={failures.power_west ? '#C95C5C' : '#123B63'} stroke="#FFFFFF" strokeWidth="2" />
            <Zap x="-7" y="-7" width="14" height="14" color="#FFFFFF" />
            <text x="20" y="4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              West Grid {failures.power_west ? '[CUT]' : '[OK]'}
            </text>
          </g>

          {/* Power East Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('power_east')}
            transform={`translate(${nodes.power_east.x}, ${nodes.power_east.y})`}
          >
            <circle r="15" fill={failures.power_east ? '#C95C5C' : '#123B63'} stroke="#FFFFFF" strokeWidth="2" />
            <Zap x="-7" y="-7" width="14" height="14" color="#FFFFFF" />
            <text x="20" y="4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              East Grid {failures.power_east ? '[CUT]' : '[OK]'}
            </text>
          </g>

          {/* Fibre Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('fibre')}
            transform={`translate(${nodes.fibre.x}, ${nodes.fibre.y})`}
          >
            <circle r="15" fill={failures.fibre ? '#C95C5C' : '#0369A1'} stroke="#FFFFFF" strokeWidth="2" />
            <Wifi x="-7" y="-7" width="14" height="14" color="#FFFFFF" />
            <text x="20" y="4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              Fibre {failures.fibre ? '[SEVERED]' : '[ACTIVE]'}
            </text>
          </g>

          {/* Tower A */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('tower_A')}
            transform={`translate(${nodes.tower_A.x}, ${nodes.tower_A.y})`}
          >
            <rect x="-12" y="-12" width="24" height="24" rx="2" fill={failures.tower_A ? '#C95C5C' : '#1E40AF'} stroke="#FFFFFF" strokeWidth="2" />
            <Signal x="-6" y="-6" width="12" height="12" color="#FFFFFF" />
            <text x="18" y="-4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Tower A
            </text>
            <text x="18" y="8" fill="#93C5FD" fontSize="8" fontFamily="'Azeret Mono', monospace">
              {failures.tower_A ? 'COLLAPSED' : 'ON-AIR'}
            </text>
          </g>

          {/* Tower B */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('tower_B')}
            transform={`translate(${nodes.tower_B.x}, ${nodes.tower_B.y})`}
          >
            <rect x="-12" y="-12" width="24" height="24" rx="2" fill={failures.tower_B ? '#C95C5C' : '#1E40AF'} stroke="#FFFFFF" strokeWidth="2" />
            <Signal x="-6" y="-6" width="12" height="12" color="#FFFFFF" />
            <text x="18" y="-4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Tower B
            </text>
            <text x="18" y="8" fill="#93C5FD" fontSize="8" fontFamily="'Azeret Mono', monospace">
              {failures.tower_B ? 'COLLAPSED' : 'ON-AIR'}
            </text>
          </g>

          {/* FM Transmitter */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('fm_tx')}
            transform={`translate(${nodes.fm_tx.x}, ${nodes.fm_tx.y})`}
          >
            <circle r="15" fill={failures.fm_tx ? '#C95C5C' : '#15803D'} stroke="#FFFFFF" strokeWidth="2" />
            <Radio x="-7" y="-7" width="14" height="14" color="#FFFFFF" />
            <text x="20" y="4" fill="#FFFFFF" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="600">
              FM Tx {failures.fm_tx ? '[OFF]' : '[ON]'}
            </text>
          </g>

          {/* Satellite Gateway at Marina */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onToggleFailure('gateway')}
            transform={`translate(${nodes.gateway.x}, ${nodes.gateway.y})`}
          >
            <circle r="15" fill={failures.gateway ? '#C95C5C' : '#D97706'} stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
            <text x="20" y="4" fill="#FEF3C7" fontSize="10" fontFamily="'Azeret Mono', monospace" fontWeight="bold">
              Sat Gateway {failures.gateway ? '[LOST]' : '[FEEDING]'}
            </text>
          </g>

          {/* Village Nodes */}
          {villages.map(v => {
            const isSelected = selectedVillageId === v.id;
            const isIsolated = !v.tower && !v.fm;

            return (
              <g
                key={v.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectVillage && onSelectVillage(v.id)}
                transform={`translate(${v.x}, ${v.y})`}
              >
                {isSelected && (
                  <circle r="17" fill="none" stroke="#F4B942" strokeWidth="2.5" strokeDasharray="3 3" />
                )}

                <circle
                  r={isSelected ? 10 : 8}
                  fill={isIsolated ? '#C95C5C' : '#FFFFFF'}
                  stroke={isIsolated ? '#FFFFFF' : '#123B63'}
                  strokeWidth="2.5"
                />

                <rect
                  x="13"
                  y="-11"
                  width={v.name.length * 7.5 + 14}
                  height="20"
                  rx="2"
                  fill="rgba(12, 42, 71, 0.88)"
                  stroke={isSelected ? '#F4B942' : 'rgba(255,255,255,0.18)'}
                  strokeWidth="1"
                />
                <text
                  x="19"
                  y="3"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontFamily="'Bricolage Grotesque', sans-serif"
                  fontWeight="bold"
                >
                  {v.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Structured Operational Control Groups */}
      <div className="pt-2 space-y-3">
        <div className="text-[0.68rem] font-mono-numbers text-[var(--muted)] font-semibold uppercase tracking-wider">
          Infrastructure Failure Toggles:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono-numbers">
          {/* Group 1: Power Subsystems */}
          <div className="p-3.5 bg-slate-50 border border-[var(--border)] rounded-[4px] space-y-2">
            <span className="text-[0.68rem] font-bold text-[var(--navy)] block uppercase tracking-wide">
              Power Grid Substations
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleFailure('power_west')}
                className={`p-2.5 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.power_west
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">WEST GRID</span>
                <span className="font-bold">{failures.power_west ? 'FAILED' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('power_east')}
                className={`p-2.5 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.power_east
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">EAST GRID</span>
                <span className="font-bold">{failures.power_east ? 'FAILED' : 'NORMAL'}</span>
              </button>
            </div>
          </div>

          {/* Group 2: Backbone & Gateway */}
          <div className="p-3.5 bg-slate-50 border border-[var(--border)] rounded-[4px] space-y-2">
            <span className="text-[0.68rem] font-bold text-[var(--navy)] block uppercase tracking-wide">
              Backbone &amp; Feed
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleFailure('fibre')}
                className={`p-2.5 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.fibre
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">FIBRE BACKHAUL</span>
                <span className="font-bold">{failures.fibre ? 'SEVERED' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('gateway')}
                className={`p-2.5 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.gateway
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">SAT GATEWAY</span>
                <span className="font-bold">{failures.gateway ? 'LOST' : 'NORMAL'}</span>
              </button>
            </div>
          </div>

          {/* Group 3: Broadcast Transmitters */}
          <div className="p-3.5 bg-slate-50 border border-[var(--border)] rounded-[4px] space-y-2">
            <span className="text-[0.68rem] font-bold text-[var(--navy)] block uppercase tracking-wide">
              Broadcast Transmitters
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onToggleFailure('tower_A')}
                className={`p-2 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.tower_A
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">TOWER A</span>
                <span className="font-bold">{failures.tower_A ? 'DOWN' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('tower_B')}
                className={`p-2 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.tower_B
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">TOWER B</span>
                <span className="font-bold">{failures.tower_B ? 'DOWN' : 'NORMAL'}</span>
              </button>
              <button
                onClick={() => onToggleFailure('fm_tx')}
                className={`p-2 rounded-[3px] border font-semibold transition-all text-left flex flex-col justify-between ${
                  failures.fm_tx
                    ? 'bg-red-50 border-red-300 text-[var(--red-text)] shadow-xs'
                    : 'bg-white border-[var(--border)] text-[var(--navy)] hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[0.65rem] text-[var(--muted)]">FM TX</span>
                <span className="font-bold">{failures.fm_tx ? 'FAULT' : 'NORMAL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
