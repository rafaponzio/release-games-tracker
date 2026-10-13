export enum StandardPlatform {
  PC = 'PC',
  PS5 = 'PlayStation 5',
  PS4 = 'PlayStation 4',
  XBOX_SERIES = 'Xbox Series X/S',
  XBOX_ONE = 'Xbox One',
  SWITCH = 'Nintendo Switch',
  MACOS = 'macOS',
  LINUX = 'Linux',
  IOS = 'iOS',
  ANDROID = 'Android',
  OTHER = 'Other',
}

export interface ParsedReleaseDate {
  raw: string;
  date: string | null;
  precision: 'exact' | 'month' | 'quarter' | 'year' | 'tba';
  year: number | null;
  month: number | null;
  day: number | null;
  quarter: number | null;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  genres: string[];
  platforms: StandardPlatform[];
  publisher: string | null;
  developer: string | null;
  description: string | null;
  releaseDate: ParsedReleaseDate;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScraperStatus {
  isSyncing: boolean;
  lastSync: {
    id: string;
    source: string;
    year: number;
    status: 'running' | 'success' | 'failed';
    totalScraped: number;
    created: number;
    updated: number;
    errorMessage?: string;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
  } | null;
}
