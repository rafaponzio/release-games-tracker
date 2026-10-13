import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Game } from '../domain/game.js';
import { GameFilter, GameUpsertInput, IGameRepository } from './game-repository.interface.js';
import { InMemoryGameRepository } from './in-memory-game-repository.js';

export class FileGameRepository extends InMemoryGameRepository implements IGameRepository {
  public readonly filePath: string;
  private isLoaded = false;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const items: Game[] = JSON.parse(raw);
      this.games.clear();
      for (const item of items) {
        this.games.set(item.id, item);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // If file doesn't exist yet, start with empty map
      this.games.clear();
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
    const data = JSON.stringify(Array.from(this.games.values()), null, 2);
    // Atomic file write via temporary file + rename
    await fs.writeFile(tmpPath, data, 'utf-8');
    await fs.rename(tmpPath, this.filePath);
  }

  override async findAll(filter?: GameFilter): Promise<Game[]> {
    await this.ensureLoaded();
    return super.findAll(filter);
  }

  override async findById(id: string): Promise<Game | null> {
    await this.ensureLoaded();
    return super.findById(id);
  }

  override async findBySlug(slug: string): Promise<Game | null> {
    await this.ensureLoaded();
    return super.findBySlug(slug);
  }

  override async upsert(gameData: GameUpsertInput): Promise<Game> {
    await this.ensureLoaded();
    const result = await super.upsert(gameData);
    await this.persist();
    return result;
  }

  override async bulkUpsert(gamesData: GameUpsertInput[]): Promise<{ created: number; updated: number }> {
    await this.ensureLoaded();
    let created = 0;
    let updated = 0;

    for (const item of gamesData) {
      const existing = await super.findBySlug(item.slug);
      if (existing) {
        await super.upsert(item);
        updated++;
      } else {
        await super.upsert(item);
        created++;
      }
    }

    await this.persist();
    return { created, updated };
  }

  override async delete(id: string): Promise<boolean> {
    await this.ensureLoaded();
    const result = await super.delete(id);
    if (result) {
      await this.persist();
    }
    return result;
  }

  override async count(): Promise<number> {
    await this.ensureLoaded();
    return super.count();
  }
}
