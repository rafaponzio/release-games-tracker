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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-md shadow-purple-500/10">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Game Tracker</span>
              <span className="hidden xs:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">MVP</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block">Track Upcoming Video Game Releases</p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 sm:p-1">
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Calendário"
            >
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Calendário</span>
            </button>
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Linha do Tempo"
            >
              <List className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Timeline</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={scraperStatus?.lastSync ? `Última sincronização: ${new Date(scraperStatus.lastSync.startedAt).toLocaleTimeString()}` : 'Sincronizar lançamentos'}
            className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* iCal Export Button */}
          <a
            href="/api/calendar/export.ics"
            download="games-calendar.ics"
            className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all shadow-sm"
            title="Baixar calendário (.ics) para Google, Apple ou Outlook"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">.ics</span>
          </a>
        </div>
      </div>
    </header>
  );
};
