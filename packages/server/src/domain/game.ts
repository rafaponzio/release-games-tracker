import { StandardPlatform } from './platform.js';
import { ParsedReleaseDate } from './release-date.js';

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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')         // trim leading/trailing hyphens
    || 'game';
}
