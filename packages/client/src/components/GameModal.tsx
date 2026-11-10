import React, { useEffect, useState } from 'react';
import { X, Calendar, Gamepad, Building2, ExternalLink, Tag } from 'lucide-react';
import { Game } from '../types';

interface GameModalProps {
  game: Game | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const [imageError, setImageError] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (game) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, onClose]);

  // Reset image error when game changes
  useEffect(() => {
    setImageError(false);
  }, [game?.id]);

  if (!game) return null;

  const isIgdb = game.sourceUrl?.includes('igdb.com');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title, Cover Poster, and Close Button */}
        <div className="p-5 pb-4 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur shrink-0 relative flex gap-4 items-start pr-12">
          {game.coverUrl && !imageError && (
            <img
              src={game.coverUrl}
              alt={game.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl shadow-lg border border-slate-700/80 shrink-0 bg-slate-950"
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              {game.releaseDate.precision.toUpperCase()} RELEASE
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-2 leading-tight">
              {game.title}
            </h2>
          </div>

          {/* Close Button - fixed in header, always visible */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors shadow-sm"
            aria-label="Fechar"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="p-6 pt-4 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">Release Date</p>
                <p className="text-white font-semibold">{game.releaseDate.raw}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">Developer</p>
                <p className="text-white font-semibold">{game.developer || 'TBA'}</p>
              </div>
            </div>

            {game.publisher && (
              <div className="col-span-2 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400">Publisher</p>
                  <p className="text-white font-semibold">{game.publisher}</p>
                </div>
              </div>
            )}
          </div>

          {/* Platforms */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Gamepad className="w-3.5 h-3.5 text-purple-400" />
              Platforms
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {game.platforms.map((p) => (
                <span
                  key={p}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Genres */}
          {game.genres.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Genres
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {game.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-800/40"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description / Synopsis */}
          {game.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
                About
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                {game.description}
              </p>
            </div>
          )}

          {/* Source Link */}
          {game.sourceUrl && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <a
                href={game.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>{isIgdb ? 'Ver fonte no IGDB' : 'Ver fonte na Wikipedia'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

