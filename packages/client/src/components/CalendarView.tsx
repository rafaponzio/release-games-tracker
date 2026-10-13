import React, { useState } from 'react';
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
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { Game } from '../types';

interface CalendarViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  selectedYear: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  games,
  onSelectGame,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map games by exact release date "YYYY-MM-DD" (only exact precision)
  const gamesByDate: Record<string, Game[]> = {};
  for (const game of games) {
    if (game.releaseDate.date && game.releaseDate.precision === 'exact') {
      if (!gamesByDate[game.releaseDate.date]) {
        gamesByDate[game.releaseDate.date] = [];
      }
      gamesByDate[game.releaseDate.date].push(game);
    }
  }

  // Games in current month/quarter that don't have an exact day
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const currentQuarterNum = Math.ceil(currentMonthNum / 3);
  const estimatedMonthGames = games.filter(
    (g) =>
      g.releaseDate.year === currentYearNum &&
      (
        (g.releaseDate.precision === 'month' && g.releaseDate.month === currentMonthNum) ||
        (g.releaseDate.precision === 'quarter' && g.releaseDate.quarter === currentQuarterNum)
      )
  );


  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-3 px-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Estimated/TBA releases this month/quarter banner */}
      {estimatedMonthGames.length > 0 && (
        <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl p-3 px-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 shrink-0">
            <CalIcon className="w-4 h-4 text-purple-400" />
            <span>Targeted for this window (day unconfirmed):</span>
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
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                    isCurrentDay
                      ? 'bg-purple-600 text-white'
                      : isCurrMonth
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayGames.length > 0 && (
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded-full border border-purple-500/20">
                    {dayGames.length}
                  </span>
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
                  <div className="text-[10px] text-purple-400 font-medium text-center">
                    +{dayGames.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
