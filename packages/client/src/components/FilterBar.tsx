import React from 'react';
import { Search, Filter } from 'lucide-react';
import { StandardPlatform } from '../types';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedPlatform: StandardPlatform | '';
  onPlatformChange: (p: StandardPlatform | '') => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  totalGames: number;
}

const PLATFORM_OPTIONS: Array<{ label: string; value: StandardPlatform | '' }> = [
  { label: 'All Platforms', value: '' },
  { label: 'PC', value: StandardPlatform.PC },
  { label: 'PlayStation 5', value: StandardPlatform.PS5 },
  { label: 'Xbox Series X/S', value: StandardPlatform.XBOX_SERIES },
  { label: 'Nintendo Switch', value: StandardPlatform.SWITCH },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  selectedYear,
  onYearChange,
  totalGames,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 backdrop-blur-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search games by title, genre, publisher..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Platform & Year Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Platform Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPlatformChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedPlatform === opt.value
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Year Dropdown */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className="bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>

        {/* Total Badge */}
        <div className="text-xs text-slate-400 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg whitespace-nowrap">
          <span className="font-semibold text-purple-400">{totalGames}</span> games
        </div>
      </div>
    </div>
  );
};
