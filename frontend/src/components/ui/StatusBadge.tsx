import React from 'react';

export type StatusType = 'operational' | 'degraded' | 'severed' | 'neutral' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
  dot = true
}) => {
  const styles: Record<StatusType, { bg: string; border: string; text: string; dot: string }> = {
    operational: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-600'
    },
    degraded: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500'
    },
    severed: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-600'
    },
    neutral: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      dot: 'bg-slate-400'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-600'
    }
  };

  const current = styles[status] || styles.neutral;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border text-xs tracking-tight ${current.bg} ${current.border} ${current.text} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />}
      <span>{label}</span>
    </span>
  );
};
