import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { TimelineView } from './components/TimelineView';
import { GameModal } from './components/GameModal';
import { fetchGames, fetchScraperStatus, triggerScraperSync } from './services/api';
import { Game, ScraperStatus, StandardPlatform } from './types';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [search, setSearch] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<StandardPlatform | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(2026, 9, 1));
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const prevSyncingRef = useRef<boolean>(false);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCalendarDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  const handleCalendarDateChange = (newDate: Date) => {
    setCalendarDate(newDate);
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGames({
        year: selectedYear,
        platform: selectedPlatform,
        search,
      });
      setGames(data);
      if (data.length === 0) {
        loadStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const status = await fetchScraperStatus();
      setScraperStatus(status);
      setIsSyncing(status.isSyncing);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedPlatform, search]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reactive auto-reload: when background sync completes, refresh data automatically
  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing) {
      loadData();
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setNotification(null);
      const res = await triggerScraperSync(selectedYear);
      setNotification({
        type: 'success',
        message: `Synced ${res.totalScraped} games for ${selectedYear}!`,
      });
      await loadData();
      await loadStatus();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Scrape sync failed',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        scraperStatus={scraperStatus}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                : 'bg-rose-950/40 text-rose-300 border-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filter Controls */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          totalGames={games.length}
        />

        {/* Background Syncing Indicator */}
        {isSyncing && (
          <div className="mb-6 p-4 rounded-xl flex items-center justify-between bg-purple-950/40 border border-purple-800 text-purple-300 text-sm">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-purple-400 shrink-0 animate-spin" />
              <div>
                <span className="font-semibold text-white">Syncing release data:</span>{' '}
                Fetching games from Wikipedia
                {scraperStatus?.lastSync?.year ? ` for ${scraperStatus.lastSync.year}` : ''}... The schedule will refresh automatically when finished!
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-950/30 border border-rose-800 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-rose-300">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State on initial load */}
        {loading && games.length === 0 && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
            Carregando catálogo de lançamentos...
          </div>
        )}

        {/* View Content (Preserved during filter/search to prevent month jump or DOM recreation) */}
        {(!loading || games.length > 0) && (
          <div className="relative">
            {loading && (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-slate-900/95 border border-purple-500/40 text-purple-300 text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur">
                <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span>Atualizando...</span>
              </div>
            )}

            {viewMode === 'calendar' ? (
              <CalendarView
                games={games}
                onSelectGame={setSelectedGame}
                selectedYear={selectedYear}
                currentDate={calendarDate}
                onDateChange={handleCalendarDateChange}
              />
            ) : (
              <TimelineView
                games={games}
                onSelectGame={setSelectedGame}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Game Releases Tracker MVP &bull; Built with TDD, TypeScript, Express &amp; React &bull; Defense-in-depth Security
        </div>
      </footer>

      {/* Game Details Modal */}
      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
export default App;
