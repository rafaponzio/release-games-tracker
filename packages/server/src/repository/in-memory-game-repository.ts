import { Game } from '../domain/game.js';
import { GameFilter, GameUpsertInput, IGameRepository } from './game-repository.interface.js';
import crypto from 'node:crypto';

export class InMemoryGameRepository implements IGameRepository {
  protected games: Map<string, Game> = new Map();

  async findAll(filter?: GameFilter): Promise<Game[]> {
    let list = Array.from(this.games.values());

    if (!filter) {
      return this.sortGames(list);
    }

    if (filter.platform) {
      list = list.filter((g) => g.platforms.includes(filter.platform!));
    }

    if (filter.search) {
      const term = filter.search.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(term) ||
          (g.description && g.description.toLowerCase().includes(term)) ||
          (g.publisher && g.publisher.toLowerCase().includes(term)) ||
          (g.developer && g.developer.toLowerCase().includes(term))
      );
    }

    if (filter.year) {
      list = list.filter((g) => g.releaseDate.year === filter.year);
    }

    if (filter.month) {
      list = list.filter((g) => g.releaseDate.month === filter.month);
    }

    if (filter.precision) {
      list = list.filter((g) => g.releaseDate.precision === filter.precision);
    }

    if (filter.startDate) {
      list = list.filter((g) => {
        if (!g.releaseDate.date) return false;
        return g.releaseDate.date >= filter.startDate!;
      });
    }

    if (filter.endDate) {
      list = list.filter((g) => {
        if (!g.releaseDate.date) return false;
        return g.releaseDate.date <= filter.endDate!;
      });
    }

    return this.sortGames(list);
  }

  async findById(id: string): Promise<Game | null> {
    return this.games.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Game | null> {
    for (const game of this.games.values()) {
      if (game.slug === slug) {
        return game;
      }
    }
    return null;
  }

  async upsert(gameData: GameUpsertInput): Promise<Game> {
    const existing = await this.findBySlug(gameData.slug);
    const now = new Date().toISOString();

    if (existing) {
      const updated: Game = {
        ...existing,
        ...gameData,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      this.games.set(existing.id, updated);
      return updated;
    }

    const id = gameData.id || crypto.randomUUID();
    const created: Game = {
      ...gameData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.games.set(id, created);
    return created;
  }

  async bulkUpsert(gamesData: GameUpsertInput[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const item of gamesData) {
      const existing = await this.findBySlug(item.slug);
      if (existing) {
        await this.upsert(item);
        updated++;
      } else {
        await this.upsert(item);
        created++;
      }
    }

    return { created, updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.games.delete(id);
  }

  async count(): Promise<number> {
    return this.games.size;
  }

  protected sortGames(list: Game[]): Game[] {
    return list.sort((a, b) => {
      // Sort with known dates first, ascending
      if (a.releaseDate.date && b.releaseDate.date) {
        return a.releaseDate.date.localeCompare(b.releaseDate.date);
      }
      if (a.releaseDate.date) return -1;
      if (b.releaseDate.date) return 1;
      return a.title.localeCompare(b.title);
    });
  }
}
