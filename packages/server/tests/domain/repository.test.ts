import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { InMemoryGameRepository } from '../../src/repository/in-memory-game-repository.js';
import { FileGameRepository } from '../../src/repository/file-game-repository.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe.each([
  ['InMemoryGameRepository', () => new InMemoryGameRepository()],
  ['FileGameRepository', () => {
    const tmpPath = path.join(process.cwd(), 'tests', 'fixtures', `test-db-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    return new FileGameRepository(tmpPath);
  }],
])('%s (TDD Repository Suite)', (_, createRepo) => {
  let repo: InMemoryGameRepository | FileGameRepository;

  beforeEach(() => {
    repo = createRepo();
  });

  afterEach(async () => {
    if ('filePath' in repo && typeof (repo as any).filePath === 'string') {
      try {
        await fs.unlink((repo as any).filePath);
      } catch {}
    }
  });

  it('upserts a new game and assigns an id, timestamps', async () => {
    const game = await repo.upsert({
      title: 'Grand Theft Auto VI',
      slug: 'grand-theft-auto-vi',
      coverUrl: null,
      genres: ['Action', 'Open World'],
      platforms: [StandardPlatform.PS5, StandardPlatform.XBOX_SERIES],
      publisher: 'Rockstar Games',
      developer: 'Rockstar North',
      description: 'Next chapter in the GTA series',
      releaseDate: {
        raw: 'Fall 2026',
        date: '2026-10-01',
        precision: ReleasePrecision.QUARTER,
        year: 2026,
        month: 10,
        day: 1,
        quarter: 4,
      },
      sourceUrl: 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI',
    });

    expect(game.id).toBeDefined();
    expect(game.title).toBe('Grand Theft Auto VI');
    expect(game.createdAt).toBeDefined();
    expect(game.updatedAt).toBeDefined();

    const count = await repo.count();
    expect(count).toBe(1);
  });

  it('updates an existing game if slug matches (upsert idempotency)', async () => {
    await repo.upsert({
      title: 'Hollow Knight: Silksong',
      slug: 'hollow-knight-silksong',
      coverUrl: null,
      genres: ['Metroidvania'],
      platforms: [StandardPlatform.PC, StandardPlatform.SWITCH],
      publisher: 'Team Cherry',
      developer: 'Team Cherry',
      description: 'Sequel to Hollow Knight',
      releaseDate: {
        raw: 'TBA',
        date: null,
        precision: ReleasePrecision.TBA,
        year: null,
        month: null,
        day: null,
        quarter: null,
      },
      sourceUrl: null,
    });

    // Update release date
    const updated = await repo.upsert({
      title: 'Hollow Knight: Silksong',
      slug: 'hollow-knight-silksong',
      coverUrl: 'https://example.com/cover.jpg',
      genres: ['Metroidvania', 'Action'],
      platforms: [StandardPlatform.PC, StandardPlatform.SWITCH, StandardPlatform.PS5],
      publisher: 'Team Cherry',
      developer: 'Team Cherry',
      description: 'Sequel to Hollow Knight with updated date',
      releaseDate: {
        raw: '2026-11-20',
        date: '2026-11-20',
        precision: ReleasePrecision.EXACT,
        year: 2026,
        month: 11,
        day: 20,
        quarter: 4,
      },
      sourceUrl: null,
    });

    expect(await repo.count()).toBe(1);
    expect(updated.platforms).toContain(StandardPlatform.PS5);
    expect(updated.coverUrl).toBe('https://example.com/cover.jpg');
    expect(updated.releaseDate.date).toBe('2026-11-20');
  });

  it('filters games by platform, search term, and date range', async () => {
    await repo.upsert({
      title: 'Doom: The Dark Ages',
      slug: 'doom-the-dark-ages',
      coverUrl: null,
      genres: ['FPS'],
      platforms: [StandardPlatform.PC, StandardPlatform.XBOX_SERIES, StandardPlatform.PS5],
      publisher: 'Bethesda',
      developer: 'id Software',
      description: 'Prequel to Doom 2016',
      releaseDate: {
        raw: 'May 15, 2026',
        date: '2026-05-15',
        precision: ReleasePrecision.EXACT,
        year: 2026,
        month: 5,
        day: 15,
        quarter: 2,
      },
      sourceUrl: null,
    });

    await repo.upsert({
      title: 'Mario Wonder 2',
      slug: 'mario-wonder-2',
      coverUrl: null,
      genres: ['Platformer'],
      platforms: [StandardPlatform.SWITCH],
      publisher: 'Nintendo',
      developer: 'Nintendo',
      description: 'Next Mario platformer',
      releaseDate: {
        raw: 'November 2026',
        date: '2026-11-01',
        precision: ReleasePrecision.MONTH,
        year: 2026,
        month: 11,
        day: 1,
        quarter: 4,
      },
      sourceUrl: null,
    });

    // Filter by platform
    const switchGames = await repo.findAll({ platform: StandardPlatform.SWITCH });
    expect(switchGames.length).toBe(1);
    expect(switchGames[0].title).toBe('Mario Wonder 2');

    // Filter by search term
    const doomGames = await repo.findAll({ search: 'dark ages' });
    expect(doomGames.length).toBe(1);
    expect(doomGames[0].title).toBe('Doom: The Dark Ages');

    // Filter by date range (May 2026 to June 2026)
    const midYearGames = await repo.findAll({
      startDate: '2026-05-01',
      endDate: '2026-06-30',
    });
    expect(midYearGames.length).toBe(1);
    expect(midYearGames[0].title).toBe('Doom: The Dark Ages');
  });

  it('bulk upserts games reporting created and updated counts', async () => {
    const batch = [
      {
        title: 'Game A',
        slug: 'game-a',
        coverUrl: null,
        genres: [],
        platforms: [StandardPlatform.PC],
        publisher: null,
        developer: null,
        description: null,
        releaseDate: {
          raw: '2026-01-01',
          date: '2026-01-01',
          precision: ReleasePrecision.EXACT,
          year: 2026,
          month: 1,
          day: 1,
          quarter: 1,
        },
        sourceUrl: null,
      },
      {
        title: 'Game B',
        slug: 'game-b',
        coverUrl: null,
        genres: [],
        platforms: [StandardPlatform.PS5],
        publisher: null,
        developer: null,
        description: null,
        releaseDate: {
          raw: '2026-02-01',
          date: '2026-02-01',
          precision: ReleasePrecision.EXACT,
          year: 2026,
          month: 2,
          day: 1,
          quarter: 1,
        },
        sourceUrl: null,
      },
    ];

    const result1 = await repo.bulkUpsert(batch);
    expect(result1.created).toBe(2);
    expect(result1.updated).toBe(0);

    const result2 = await repo.bulkUpsert(batch);
    expect(result2.created).toBe(0);
    expect(result2.updated).toBe(2);
  });

  it('limits results when limit is specified', async () => {
    await repo.bulkUpsert([
      {
        title: 'Alpha',
        slug: 'alpha',
        coverUrl: null,
        genres: [],
        platforms: [StandardPlatform.PC],
        publisher: null,
        developer: null,
        description: null,
        releaseDate: { raw: '2026-01-01', date: '2026-01-01', precision: ReleasePrecision.EXACT, year: 2026, month: 1, day: 1, quarter: 1 },
        sourceUrl: null,
      },
      {
        title: 'Beta',
        slug: 'beta',
        coverUrl: null,
        genres: [],
        platforms: [StandardPlatform.PC],
        publisher: null,
        developer: null,
        description: null,
        releaseDate: { raw: '2026-01-02', date: '2026-01-02', precision: ReleasePrecision.EXACT, year: 2026, month: 1, day: 2, quarter: 1 },
        sourceUrl: null,
      },
      {
        title: 'Gamma',
        slug: 'gamma',
        coverUrl: null,
        genres: [],
        platforms: [StandardPlatform.PC],
        publisher: null,
        developer: null,
        description: null,
        releaseDate: { raw: '2026-01-03', date: '2026-01-03', precision: ReleasePrecision.EXACT, year: 2026, month: 1, day: 3, quarter: 1 },
        sourceUrl: null,
      },
    ]);

    const results = await repo.findAll({ limit: 2 });
    expect(results).toHaveLength(2);
  });
});
