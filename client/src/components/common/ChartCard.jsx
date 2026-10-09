import React from 'react';

const ChartCard = ({ title, subtitle, actions, children, loading = false, empty = false, emptyMessage = 'No data available for the selected period' }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-card flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      <div className="flex-1 w-full min-h-[280px]">
        {loading ? (
          <div className="w-full h-full min-h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : empty ? (
          <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
