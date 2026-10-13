import React from 'react';
import { Calendar as CalendarIcon, List, RefreshCw, Download, Gamepad2 } from 'lucide-react';
import { ScraperStatus } from '../types';

interface NavbarProps {
  viewMode: 'calendar' | 'timeline';
  onViewModeChange: (mode: 'calendar' | 'timeline') => void;
  scraperStatus: ScraperStatus | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  scraperStatus,
  onSync,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Game Tracker <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">MVP</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Track Upcoming Video Game Releases</p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={scraperStatus?.lastSync ? `Last synced: ${new Date(scraperStatus.lastSync.startedAt).toLocaleTimeString()}` : 'Sync releases'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Releases'}</span>
          </button>

          {/* iCal Export Button */}
          <a
            href="/api/calendar/export.ics"
            download="games-calendar.ics"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all shadow-sm"
            title="Download .ics file to import into Google, Apple, or Outlook Calendar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .ics</span>
          </a>
        </div>
      </div>
    </header>
  );
};
