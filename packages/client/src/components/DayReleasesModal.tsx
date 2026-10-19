import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, Gamepad2, ChevronRight, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { Game } from '../types';

interface DayReleasesModalProps {
  date: Date | null;
  games: Game[];
  onClose: () => void;
  onSelectGame: (game: Game) => void;
}

export const DayReleasesModal: React.FC<DayReleasesModalProps> = ({
  date,
  games,
  onClose,
  onSelectGame,
}) => {
  const [filterText, setFilterText] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (date) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [date, onClose]);

  // Reset filter when date changes
  useEffect(() => {
    setFilterText('');
  }, [date]);

  if (!date || games.length === 0) return null;

  const filteredGames = games.filter((g) => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    return (
      g.title.toLowerCase().includes(term) ||
      g.genres.some((genre) => genre.toLowerCase().includes(term)) ||
      g.platforms.some((platform) => platform.toLowerCase().includes(term)) ||
      (g.developer && g.developer.toLowerCase().includes(term))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 relative shadow-2xl flex flex-col gap-4 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pr-8 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                <Calendar className="w-3.5 h-3.5" />
                {games.length} {games.length === 1 ? 'Lançamento' : 'Lançamentos'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 leading-tight">
              {format(date, 'MMMM d, yyyy')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Search if more than 3 games */}
        {games.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar lançamentos deste dia por título, plataforma..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
        )}

        {/* Games List */}
        <div className="overflow-y-auto pr-1 space-y-2.5 max-h-[55vh]">
          {filteredGames.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum jogo encontrado com "{filterText}".
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  onClose();
                  onSelectGame(game);
                }}
                className="group cursor-pointer bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-purple-300 transition-colors truncate">
                      {game.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Platform pills */}
                    {game.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}

                    {/* Developer */}
                    {game.developer && (
                      <span className="text-[10px] text-slate-400 ml-1 truncate">
                        por <span className="text-slate-300">{game.developer}</span>
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {game.genres.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {game.genres.slice(0, 3).map((g) => (
                        <span key={g} className="text-[9px] text-purple-400 bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-900/40">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-300 transition-colors shrink-0">
                  <span className="text-xs font-medium hidden sm:inline">Ver detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
