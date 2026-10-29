import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, ChevronRight as ArrowIcon, Sparkles } from 'lucide-react';
import { Game } from '../types';
import { DayReleasesModal } from './DayReleasesModal';

interface CalendarViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  selectedYear?: number;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  games,
  onSelectGame,
  selectedYear,
  currentDate: controlledDate,
  onDateChange: controlledOnDateChange,
}) => {
  const [internalDate, setInternalDate] = useState(() => new Date(selectedYear || 2026, new Date().getMonth(), 1));
  const [selectedDayModal, setSelectedDayModal] = useState<{ date: Date; games: Game[] } | null>(null);

  const currentDate = controlledDate || internalDate;
  const setCurrentDate = (d: Date | ((prev: Date) => Date)) => {
    const nextDate = typeof d === 'function' ? d(currentDate) : d;
    if (controlledOnDateChange) {
      controlledOnDateChange(nextDate);
    } else {
      setInternalDate(nextDate);
    }
  };

  const prevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedMobileDay(today);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Map games by exact release date "YYYY-MM-DD"
  const gamesByDate: Record<string, Game[]> = useMemo(() => {
    const map: Record<string, Game[]> = {};
    for (const game of games) {
      if (game.releaseDate.date && game.releaseDate.precision === 'exact') {
        if (!map[game.releaseDate.date]) {
          map[game.releaseDate.date] = [];
        }
        map[game.releaseDate.date].push(game);
      }
    }
    return map;
  }, [games]);

  // Mobile selected date state (agenda view)
  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(() => {
    return isSameMonth(new Date(), currentDate) ? new Date() : startOfMonth(currentDate);
  });

  // Keep mobile selected date synced with month navigation
  useEffect(() => {
    if (!isSameMonth(selectedMobileDay, currentDate)) {
      const firstWithReleases = days.find((d) => {
        const dStr = format(d, 'yyyy-MM-dd');
        return isSameMonth(d, monthStart) && gamesByDate[dStr]?.length > 0;
      });
      setSelectedMobileDay(firstWithReleases || startOfMonth(currentDate));
    }
  }, [currentDate, days, gamesByDate, monthStart, selectedMobileDay]);

  const selectedMobileDateStr = format(selectedMobileDay, 'yyyy-MM-dd');
  const selectedMobileGames = gamesByDate[selectedMobileDateStr] || [];

  // Estimated/TBA releases this month/quarter
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const currentQuarterNum = Math.ceil(currentMonthNum / 3);
  const estimatedMonthGames = useMemo(() => {
    return games.filter(
      (g) =>
        g.releaseDate.year === currentYearNum &&
        (
          (g.releaseDate.precision === 'month' && g.releaseDate.month === currentMonthNum) ||
          (g.releaseDate.precision === 'quarter' && g.releaseDate.quarter === currentQuarterNum)
        )
    );
  }, [games, currentYearNum, currentMonthNum, currentQuarterNum]);

  // Jump to next release day in current month
  const handleJumpNextRelease = () => {
    const nextDay = days.find((d) => {
      const dStr = format(d, 'yyyy-MM-dd');
      return isSameMonth(d, monthStart) && d > selectedMobileDay && gamesByDate[dStr]?.length > 0;
    });
    if (nextDay) {
      setSelectedMobileDay(nextDay);
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 sm:p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 sm:p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estimated/TBA releases this month/quarter banner */}
      {estimatedMonthGames.length > 0 && (
        <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl p-3 px-3.5 sm:px-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 shrink-0">
            <CalIcon className="w-4 h-4 text-purple-400" />
            <span>Previsão para este período (dia a confirmar):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {estimatedMonthGames.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelectGame(g)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 border border-purple-600/40 text-purple-100 transition-colors shadow-sm"
              >
                {g.title} <span className="text-[10px] text-purple-300 ml-1">({g.releaseDate.raw})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOBILE CALENDAR VIEW (< md: breakpoint)                       */}
      {/* Compact date touch-matrix + active day agenda below            */}
      {/* ============================================================== */}
      <div className="block md:hidden space-y-4">
        {/* Compact 7-col month matrix */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2.5">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 pb-2">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Grid of Compact Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayGames = gamesByDate[dateStr] || [];
              const isCurrMonth = isSameMonth(day, monthStart);
              const isSelected = isSameDay(day, selectedMobileDay);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedMobileDay(day)}
                  className={`min-h-[48px] rounded-xl p-1 flex flex-col items-center justify-between transition-all relative ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                      : isCurrMonth
                      ? isCurrentDay
                        ? 'bg-slate-800 border border-purple-500/60 text-white'
                        : 'bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/60 text-slate-200'
                      : 'opacity-30 text-slate-600'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? 'text-white font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>

                  {/* Indicator Badge or Dot */}
                  {dayGames.length > 0 ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none flex items-center justify-center ${
                        isSelected
                          ? 'bg-white text-purple-900'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {dayGames.length}
                    </span>
                  ) : (
                    <div className="w-1 h-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Cards */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Lançamentos do dia
              </span>
              <h3 className="text-base font-bold text-white capitalize">
                {format(selectedMobileDay, 'EEEE, d MMMM yyyy')}
              </h3>
            </div>
            {selectedMobileGames.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {selectedMobileGames.length} {selectedMobileGames.length === 1 ? 'jogo' : 'jogos'}
              </span>
            )}
          </div>

          {selectedMobileGames.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-slate-400">Nenhum lançamento previsto para este dia.</p>
              <button
                type="button"
                onClick={handleJumpNextRelease}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 underline underline-offset-4"
              >
                <span>Ir para próximo dia com lançamentos</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {selectedMobileGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="bg-slate-950/70 active:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3.5 transition-all space-y-2 cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white group-hover:text-purple-300">
                      {game.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 rounded shrink-0">
                      {game.releaseDate.raw}
                    </span>
                  </div>

                  {/* Platforms */}
                  <div className="flex flex-wrap items-center gap-1">
                    {game.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Dev & Genre */}
                  {(game.developer || game.genres.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
                      {game.developer && <span>Dev: <strong className="text-slate-300 font-medium">{game.developer}</strong></span>}
                      {game.genres.length > 0 && <span>&bull; {game.genres.slice(0, 2).join(', ')}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP CALENDAR VIEW (hidden on mobile, block on md+)         */}
      {/* Full 7-column expansive grid with game cards in cells          */}
      {/* ============================================================== */}
      <div className="hidden md:block space-y-2">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Grid of Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayGames = gamesByDate[dateStr] || [];
            const isCurrMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateStr}
                className={`min-h-[110px] rounded-xl p-2 border transition-all flex flex-col justify-between ${
                  isCurrMonth
                    ? isCurrentDay
                      ? 'bg-slate-900 border-purple-500/50 shadow-md shadow-purple-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/20 border-slate-900/60 opacity-40'
                }`}
              >
                {/* Day Number & Count Badge */}
                <div
                  className={`flex items-center justify-between mb-1.5 ${
                    dayGames.length > 0 ? 'cursor-pointer group/header' : ''
                  }`}
                  onClick={() => {
                    if (dayGames.length > 0) {
                      setSelectedDayModal({ date: day, games: dayGames });
                    }
                  }}
                >
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-md transition-colors ${
                      isCurrentDay
                        ? 'bg-purple-600 text-white'
                        : isCurrMonth
                        ? 'text-slate-300 group-hover/header:text-purple-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayGames.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayModal({ date: day, games: dayGames });
                      }}
                      title={`Ver todos os ${dayGames.length} lançamentos deste dia`}
                      className="text-[10px] font-bold text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-600 px-1.5 py-0.2 rounded-full border border-purple-500/30 transition-colors shadow-sm"
                    >
                      {dayGames.length}
                    </button>
                  )}
                </div>

                {/* Games List in Cell */}
                <div className="space-y-1.5 flex-1 overflow-hidden">
                  {dayGames.slice(0, 3).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => onSelectGame(g)}
                      className="w-full text-left p-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700/60 hover:border-purple-500/50 transition-all text-xs group"
                    >
                      <p className="font-medium text-slate-200 group-hover:text-purple-200 truncate leading-tight">
                        {g.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                        {g.platforms.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="text-[9px] font-medium text-slate-400 bg-slate-900 px-1 rounded truncate"
                          >
                            {p.replace('PlayStation ', 'PS').replace('Xbox Series ', 'XS').replace('Nintendo ', '')}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}

                  {dayGames.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayModal({ date: day, games: dayGames });
                      }}
                      className="w-full text-[10px] text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-800/80 border border-purple-800/60 rounded py-0.5 font-medium text-center transition-colors shadow-sm block"
                    >
                      +{dayGames.length - 3} mais (ver todos)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Releases Modal */}
      <DayReleasesModal
        date={selectedDayModal?.date ?? null}
        games={selectedDayModal?.games ?? []}
        onClose={() => setSelectedDayModal(null)}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
