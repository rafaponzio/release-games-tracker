import React from 'react';
import { X, Calendar, Gamepad, Building2, ExternalLink, Tag } from 'lucide-react';
import { Game } from '../types';

interface GameModalProps {
  game: Game | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  if (!game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            {game.releaseDate.precision.toUpperCase()} RELEASE
          </span>
          <h2 className="text-xl font-bold text-white mt-2 leading-tight">
            {game.title}
          </h2>
        </div>

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
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">
              About
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
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
              <span>View Source on Wikipedia</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
