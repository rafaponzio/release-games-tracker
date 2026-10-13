import { describe, it, expect, vi } from 'vitest';
import { ScraperService } from '../../src/services/scraper-service.js';
import { InMemoryGameRepository } from '../../src/repository/in-memory-game-repository.js';
import { WikipediaGameScraper } from '../../src/scraper/wikipedia-scraper.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('ScraperService (TDD)', () => {
  it('coordinates scraping and bulk upserts into repository', async () => {
    const repo = new InMemoryGameRepository();
    const scraper = new WikipediaGameScraper();

    // Mock scrapeUrl to avoid actual HTTP in automated tests
    vi.spyOn(scraper, 'scrapeUrl').mockResolvedValue([
      {
        title: 'Mock Game 1',
        slug: 'mock-game-1',
        coverUrl: null,
        genres: ['Action'],
        platforms: [StandardPlatform.PC],
        publisher: 'Pub1',
        developer: 'Dev1',
        description: null,
        releaseDate: {
          raw: '2026-10-15',
          date: '2026-10-15',
          precision: ReleasePrecision.EXACT,
          year: 2026,
          month: 10,
          day: 15,
          quarter: 4,
        },
        sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_video_games',
      },
      {
        title: 'Mock Game 2',
        slug: 'mock-game-2',
        coverUrl: null,
        genres: ['RPG'],
        platforms: [StandardPlatform.PS5],
        publisher: 'Pub2',
        developer: 'Dev2',
        description: null,
        releaseDate: {
          raw: '2026-11-20',
          date: '2026-11-20',
          precision: ReleasePrecision.EXACT,
          year: 2026,
          month: 11,
          day: 20,
          quarter: 4,
        },
        sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_video_games',
      },
    ]);

    const service = new ScraperService(repo, scraper);
    const result = await service.syncYear(2026);

    expect(result.totalScraped).toBe(2);
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(await repo.count()).toBe(2);

    const log = service.getLastSyncLog();
    expect(log).not.toBeNull();
    expect(log?.status).toBe('success');
    expect(log?.totalScraped).toBe(2);
  });
});
