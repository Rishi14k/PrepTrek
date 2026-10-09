import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const DateRangeFilter = ({ period, onPeriodChange, customStart, customEnd, onCustomRangeChange }) => {
  const [showCustom, setShowCustom] = useState(period === 'custom');

  const options = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleSelect = (val) => {
    if (val === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPeriodChange(val);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === opt.value
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomRangeChange(e.target.value, customEnd)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomRangeChange(customStart, e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => onPeriodChange('custom')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
