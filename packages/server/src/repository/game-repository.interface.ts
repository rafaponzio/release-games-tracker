import { Game } from '../domain/game.js';
import { StandardPlatform } from '../domain/platform.js';
import { ReleasePrecision } from '../domain/release-date.js';

export interface GameFilter {
  platform?: StandardPlatform;
  search?: string;
  year?: number;
  month?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  precision?: ReleasePrecision;
  limit?: number;
}

export type GameUpsertInput = Omit<Game, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export interface IGameRepository {
  findAll(filter?: GameFilter): Promise<Game[]>;
  findById(id: string): Promise<Game | null>;
  findBySlug(slug: string): Promise<Game | null>;
  upsert(gameData: GameUpsertInput): Promise<Game>;
  bulkUpsert(gamesData: GameUpsertInput[]): Promise<{ created: number; updated: number }>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
