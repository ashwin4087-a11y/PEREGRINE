import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  icon?: LucideIcon;
  status?: 'operational' | 'degraded' | 'severed' | 'neutral';
  badge?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  sublabel,
  icon: Icon,
  status,
  badge,
  className = ''
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'operational': return 'border-l-4 border-l-emerald-500';
      case 'degraded': return 'border-l-4 border-l-amber-500';
      case 'severed': return 'border-l-4 border-l-red-500';
      default: return '';
    }
  };

  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs flex flex-col justify-between ${getStatusBorder()} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {badge ? (
          badge
        ) : Icon ? (
          <span className="p-1 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            <Icon className="w-4 h-4" />
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5 font-mono-numbers">
        <span className="text-2xl font-bold tracking-tight text-[#172033]">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-[#64748B]">
            {unit}
          </span>
        )}
      </div>

      {sublabel && (
        <div className="mt-1.5 text-xs text-[#64748B] flex items-center gap-1.5">
          <span>{sublabel}</span>
        </div>
      )}
    </div>
  );
};
