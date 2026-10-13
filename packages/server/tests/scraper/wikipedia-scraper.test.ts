import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { WikipediaGameScraper } from '../../src/scraper/wikipedia-scraper.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('WikipediaGameScraper (TDD)', () => {
  it('parses structured HTML fixture and extracts games with normalized dates & platforms', async () => {
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'wikipedia-2026.html');
    const html = await fs.readFile(fixturePath, 'utf-8');

    const scraper = new WikipediaGameScraper();
    const games = scraper.parseHtml(html, { defaultYear: 2026, sourceUrl: 'https://en.wikipedia.org/wiki/2026_in_video_games' });

    expect(games.length).toBe(7);

    // 1st Game: Astra Chronicles
    const g1 = games.find((g) => g.title === 'Astra Chronicles');
    expect(g1).toBeDefined();
    expect(g1?.slug).toBe('astra-chronicles');
    expect(g1?.releaseDate).toEqual({
      raw: 'January 15, 2026',
      date: '2026-01-15',
      precision: ReleasePrecision.EXACT,
      year: 2026,
      month: 1,
      day: 15,
      quarter: 1,
    });
    expect(g1?.platforms).toEqual([StandardPlatform.PC, StandardPlatform.PS5]);
    expect(g1?.developer).toBe('Nebula Games');
    expect(g1?.publisher).toBe('Nebula Interactive');

    // Game with alias platforms: Shadow Siege ("Windows, PlayStation 5, XSX")
    const g5 = games.find((g) => g.title === 'Shadow Siege');
    expect(g5).toBeDefined();
    expect(g5?.platforms).toContain(StandardPlatform.PC);
    expect(g5?.platforms).toContain(StandardPlatform.PS5);
    expect(g5?.platforms).toContain(StandardPlatform.XBOX_SERIES);
    expect(g5?.releaseDate.date).toBe('2026-02-27');

    // Quarter release: Starborne Legacy ("Q3 2026")
    const g6 = games.find((g) => g.title === 'Starborne Legacy');
    expect(g6).toBeDefined();
    expect(g6?.releaseDate.precision).toBe(ReleasePrecision.QUARTER);
    expect(g6?.releaseDate.quarter).toBe(3);
    expect(g6?.releaseDate.date).toBe('2026-07-01');

    // TBA release: Mythic Odyssey 2
    const g7 = games.find((g) => g.title === 'Mythic Odyssey 2');
    expect(g7).toBeDefined();
    expect(g7?.releaseDate.precision).toBe(ReleasePrecision.TBA);
    expect(g7?.releaseDate.date).toBeNull();
  });

  it('rejects scraping attempts if URL fails SSRF security check', async () => {
    const scraper = new WikipediaGameScraper();
    await expect(scraper.scrapeUrl('http://127.0.0.1/evil')).rejects.toThrow();
  });
});
