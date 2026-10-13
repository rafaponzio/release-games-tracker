import React from 'react';
import { Calendar, Layers, Clock, ExternalLink } from 'lucide-react';
import { Game } from '../types';

interface TimelineViewProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

function getCountdownText(dateStr: string | null): string {
  if (!dateStr) return 'TBA';
  const target = new Date(dateStr);
  const now = new Date();
  // Strip time
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Released today!';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  games,
  onSelectGame,
}) => {
  if (games.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
        <p className="text-slate-400 text-sm">No game releases match your selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const countdown = getCountdownText(game.releaseDate.date);

        return (
          <div
            key={game.id}
            onClick={() => onSelectGame(game)}
            className="group cursor-pointer bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Left: Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  {game.title}
                </h3>
                {game.releaseDate.precision !== 'exact' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {game.releaseDate.precision}
                  </span>
                )}
              </div>

              {/* Developer & Genres */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {game.developer && (
                  <span>Dev: <strong className="text-slate-300">{game.developer}</strong></span>
                )}
                {game.genres.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>{game.genres.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {game.platforms.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Date & Countdown */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>{game.releaseDate.raw}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-purple-400 font-medium mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{countdown}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
