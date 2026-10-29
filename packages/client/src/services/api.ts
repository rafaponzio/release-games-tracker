import { Game, ScraperStatus, StandardPlatform } from '../types';

export interface GameFilters {
  search?: string;
  platform?: StandardPlatform | '';
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export async function fetchGames(filters: GameFilters = {}): Promise<Game[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.year) params.set('year', String(filters.year));
  if (filters.month) params.set('month', String(filters.month));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/games?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load games: ${res.statusText}`);
  }
  const data = await res.json();
  return data.games;
}

export async function searchGamesGlobal(query: string, limit: number = 8): Promise<Game[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const params = new URLSearchParams({ search: trimmed, limit: String(limit) });
  const res = await fetch(`/api/games?${params.toString()}`);
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  const data = await res.json();
  return data.games || [];
}

export async function fetchScraperStatus(): Promise<ScraperStatus> {
  const res = await fetch('/api/scraper/status');
  if (!res.ok) {
    throw new Error('Failed to fetch scraper status');
  }
  return res.json();
}

export async function triggerScraperSync(year?: number): Promise<{ message: string; totalScraped: number }> {
  const res = await fetch('/api/scraper/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Sync failed: ${res.statusText}`);
  }
  return res.json();
}
