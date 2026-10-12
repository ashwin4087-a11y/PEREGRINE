import React from 'react';

interface PageHeaderProps {
  title: string;
  category?: string;
  description?: string;
  actions?: React.ReactNode;
  statusBadge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  category,
  description,
  actions,
  statusBadge
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-[#E2E8F0] gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <span className="text-xs font-semibold tracking-wide text-[#64748B] uppercase">
              {category}
            </span>
          )}
          {category && <span className="text-[#CBD5E1]">/</span>}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172033]">
            {title}
          </h1>
          {statusBadge}
        </div>
        {description && (
          <p className="text-xs text-[#64748B] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
