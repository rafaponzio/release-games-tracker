import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { TimelineView } from './components/TimelineView';
import { GameModal } from './components/GameModal';
import { fetchGames } from './services/api';
import { Game, StandardPlatform } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [search, setSearch] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<StandardPlatform | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [highlightedGameId, setHighlightedGameId] = useState<string | null>(null);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCalendarDate((prev) => new Date(year, prev.getMonth(), prev.getDate()));
  };

  const handleCalendarDateChange = (newDate: Date) => {
    setCalendarDate(newDate);
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }
  };

  const handleSelectGameFromSearch = (game: Game) => {
    // 1. If game belongs to another year, sync year so games are loaded
    if (game.releaseDate?.year && game.releaseDate.year !== selectedYear) {
      setSelectedYear(game.releaseDate.year);
    }

    // 2. Compute calendar date target
    let targetDate: Date;
    if (game.releaseDate?.date && game.releaseDate.precision === 'exact') {
      const [y, m, d] = game.releaseDate.date.split('-').map(Number);
      targetDate = new Date(y, m - 1, d);
    } else if (game.releaseDate?.year && game.releaseDate?.month) {
      targetDate = new Date(game.releaseDate.year, game.releaseDate.month - 1, 1);
    } else if (game.releaseDate?.year) {
      targetDate = new Date(game.releaseDate.year, 0, 1);
    } else {
      targetDate = new Date();
    }

    setCalendarDate(targetDate);

    // 3. Switch to calendar view so user lands directly on that day
    setViewMode('calendar');

    // 4. Highlight the game visually in the calendar
    setHighlightedGameId(game.id);

    // 5. Open game details modal
    setSelectedGame(game);

    // Clear search text so full month of games is visible around this game
    setSearch('');

    // Clear highlight after 12s
    setTimeout(() => {
      setHighlightedGameId((curr) => (curr === game.id ? null : curr));
    }, 12000);
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
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedPlatform, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
          onSelectGame={handleSelectGameFromSearch}
        />

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
                highlightedGameId={highlightedGameId}
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
    </div>
  );
}
export default App;
