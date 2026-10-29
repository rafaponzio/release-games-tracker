import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Calendar, Gamepad2, ChevronRight, CornerDownLeft } from 'lucide-react';
import { Game, StandardPlatform } from '../types';
import { searchGamesGlobal } from '../services/api';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedPlatform: StandardPlatform | '';
  onPlatformChange: (p: StandardPlatform | '') => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  totalGames: number;
  onSelectGame?: (game: Game) => void;
}

const PLATFORM_OPTIONS: Array<{ label: string; value: StandardPlatform | '' }> = [
  { label: 'Todos', value: '' },
  { label: 'PC', value: StandardPlatform.PC },
  { label: 'PlayStation 5', value: StandardPlatform.PS5 },
  { label: 'Xbox Series X/S', value: StandardPlatform.XBOX_SERIES },
  { label: 'Nintendo Switch', value: StandardPlatform.SWITCH },
];

function formatReleaseDate(releaseDate: Game['releaseDate']): string {
  if (releaseDate.precision === 'exact' && releaseDate.date) {
    const [y, m, d] = releaseDate.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (releaseDate.raw) return releaseDate.raw;
  if (releaseDate.year && releaseDate.month) return `${releaseDate.month}/${releaseDate.year}`;
  if (releaseDate.year) return `Ano ${releaseDate.year}`;
  return 'A definir';
}

function formatPlatformShort(p: string): string {
  return p
    .replace('PlayStation 5', 'PS5')
    .replace('PlayStation 4', 'PS4')
    .replace('Xbox Series X/S', 'XSX')
    .replace('Nintendo Switch', 'Switch')
    .replace('Other', 'Outro');
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  selectedYear,
  onYearChange,
  totalGames,
  onSelectGame,
}) => {
  const [inputValue, setInputValue] = useState(search);
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync external search changes
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchGamesGlobal(trimmed, 8);
        setSuggestions(results);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error('Failed to query search autocomplete:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onSearchChange(val);
    if (!val) {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleSelectSuggestion = (game: Game) => {
    setIsOpen(false);
    if (onSelectGame) {
      onSelectGame(game);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 relative z-30">
      {/* Search Input with Live Dropdown */}
      <div ref={containerRef} className="relative flex-1 w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar jogos (ex: GTA VI, Zelda, Fable)..."
            className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />

          {/* Right Status / Action: Spinner or Clear Button */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            ) : inputValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Floating Autocomplete Dropdown */}
        {isOpen && inputValue.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 border border-purple-500/30 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Header */}
            <div className="px-3.5 py-2 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" />
                Jogos Encontrados ({suggestions.length})
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                Use ↑ ↓ para navegar &bull; Enter para selecionar
              </span>
            </div>

            {/* List */}
            {suggestions.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                <p>Nenhum jogo encontrado para &ldquo;<strong className="text-white">{inputValue}</strong>&rdquo;.</p>
                <p className="text-[11px] text-slate-500">Tente buscar por outro termo ou ano.</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                {suggestions.map((game, index) => {
                  const isActive = index === activeIndex;
                  const dateStr = formatReleaseDate(game.releaseDate);

                  return (
                    <div
                      key={game.id}
                      onClick={() => handleSelectSuggestion(game)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`px-3.5 py-2.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-purple-900/50 text-white'
                          : 'hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-purple-200' : 'text-white'}`}>
                            {game.title}
                          </h4>
                          {game.releaseDate.precision === 'exact' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              Data Confirmada
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          {/* Release Date with calendar icon */}
                          <span className="inline-flex items-center gap-1 text-purple-300 font-medium shrink-0">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </span>

                          {/* Platforms */}
                          <div className="flex items-center gap-1 overflow-hidden">
                            {game.platforms.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="text-[9px] font-medium bg-slate-950 border border-slate-800 px-1.5 py-0.2 rounded text-slate-300"
                              >
                                {formatPlatformShort(p)}
                              </span>
                            ))}
                            {game.platforms.length > 3 && (
                              <span className="text-[9px] text-slate-500">
                                +{game.platforms.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Developer */}
                          {game.developer && (
                            <span className="hidden sm:inline text-[11px] text-slate-400 truncate">
                              &bull; {game.developer}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Arrow */}
                      <div className="shrink-0 flex items-center gap-1 text-purple-400">
                        <span className="text-[10px] font-semibold hidden md:inline opacity-70">
                          Ver no dia
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Platform & Year Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {/* Platform Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll-smooth -mx-1 px-1">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPlatformChange(opt.value)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                selectedPlatform === opt.value
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Year Dropdown & Total Counter */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value={2025}>Ano 2025</option>
            <option value={2026}>Ano 2026</option>
            <option value={2027}>Ano 2027</option>
          </select>

          {/* Total Badge */}
          <div className="text-xs text-slate-400 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg whitespace-nowrap">
            <span className="font-semibold text-purple-400">{totalGames}</span> jogos
          </div>
        </div>
      </div>
    </div>
  );
};
