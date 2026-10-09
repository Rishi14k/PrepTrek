import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  comparison,
  unit = '',
  color = 'indigo',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
      </div>
    );
  }

  const iconColors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
  };

  const isPositive = comparison?.difference > 0;
  const isNegative = comparison?.difference < 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[color] || iconColors.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value !== null && value !== undefined ? value : 'N/A'}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>

      {comparison && (
        <div className="mt-3 flex items-center text-xs">
          {comparison.hasHistoricalData ? (
            <>
              {isPositive && (
                <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{comparison.difference}
                  {comparison.percentageChange !== null && ` (+${comparison.percentageChange}%)`}
                </span>
              )}
              {isNegative && (
                <span className="inline-flex items-center font-medium text-rose-600 dark:text-rose-400 gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {comparison.difference}
                  {comparison.percentageChange !== null && ` (${comparison.percentageChange}%)`}
                </span>
              )}
              {!isPositive && !isNegative && (
                <span className="inline-flex items-center font-medium text-slate-500 dark:text-slate-400 gap-0.5">
                  <Minus className="w-3.5 h-3.5" />
                  0.0 change
                </span>
              )}
              <span className="ml-1.5 text-slate-400 dark:text-slate-500">vs prev period</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">No prior period data</span>
          )}
        </div>
      )}

      {subtitle && !comparison && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;
