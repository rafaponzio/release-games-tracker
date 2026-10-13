import { IGameRepository } from '../repository/game-repository.interface.js';
import { WikipediaGameScraper } from '../scraper/wikipedia-scraper.js';
import { WikipediaInfoboxScraper } from '../scraper/infobox-scraper.js';
import { ReleasePrecision } from '../domain/release-date.js';

export interface ScraperSyncLog {
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
}

export class ScraperService {
  private repo: IGameRepository;
  private scraper: WikipediaGameScraper;
  private infoboxScraper: WikipediaInfoboxScraper;
  private lastLog: ScraperSyncLog | null = null;
  private isRunning = false;

  constructor(
    repo: IGameRepository,
    scraper?: WikipediaGameScraper,
    infoboxScraper?: WikipediaInfoboxScraper
  ) {
    this.repo = repo;
    this.scraper = scraper || new WikipediaGameScraper();
    this.infoboxScraper = infoboxScraper || new WikipediaInfoboxScraper();
  }

  getLastSyncLog(): ScraperSyncLog | null {
    return this.lastLog;
  }

  isSyncing(): boolean {
    return this.isRunning;
  }

  async syncYear(year: number): Promise<{ totalScraped: number; created: number; updated: number; durationMs: number }> {
    if (this.isRunning) {
      throw new Error('A scrape synchronization job is already running');
    }

    const startTime = Date.now();
    const logId = `scrape-${Date.now()}`;
    const primaryUrl = `https://en.wikipedia.org/wiki/List_of_video_games_released_in_${year}`;
    const fallbackUrl = `https://en.wikipedia.org/wiki/${year}_in_video_games`;

    this.isRunning = true;
    this.lastLog = {
      id: logId,
      source: primaryUrl,
      year,
      status: 'running',
      totalScraped: 0,
      created: 0,
      updated: 0,
      startedAt: new Date(startTime).toISOString(),
    };

    try {
      let scrapedGames: Array<any> = [];

      // Try primary granular list page first
      try {
        scrapedGames = await this.scraper.scrapeUrl(primaryUrl, { defaultYear: year });
      } catch (err: any) {
        console.warn(`[Scraper] Primary URL ${primaryUrl} failed: ${err.message}. Trying fallback ${fallbackUrl}...`);
      }

      // If primary returned few or no items, or to supplement, also scrape year page
      if (scrapedGames.length < 5) {
        try {
          const fallbackGames = await this.scraper.scrapeUrl(fallbackUrl, { defaultYear: year });
          // Deduplicate by slug
          const existingSlugs = new Set(scrapedGames.map((g) => g.slug));
          for (const fg of fallbackGames) {
            if (!existingSlugs.has(fg.slug)) {
              scrapedGames.push(fg);
              existingSlugs.add(fg.slug);
            }
          }
        } catch {}
      }

      // Enrich games that have dedicated Wikipedia articles and unconfirmed dates
      // (Focus on high-profile games or first batch to maintain polite rate limits)
      const gamesToEnrich = scrapedGames.filter(
        (g) => g.sourceUrl && g.sourceUrl.includes('/wiki/') && g.releaseDate.precision !== ReleasePrecision.EXACT
      ).slice(0, 15);

      for (const game of gamesToEnrich) {
        try {
          const infoboxDate = await this.infoboxScraper.scrapeInfoboxDate(game.sourceUrl);
          if (infoboxDate && infoboxDate.precision === ReleasePrecision.EXACT) {
            game.releaseDate = infoboxDate;
          }
        } catch {}
      }

      const { created, updated } = await this.repo.bulkUpsert(scrapedGames);
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      this.lastLog = {
        ...this.lastLog,
        status: 'success',
        totalScraped: scrapedGames.length,
        created,
        updated,
        completedAt: new Date(endTime).toISOString(),

        durationMs,
      };

      return {
        totalScraped: scrapedGames.length,
        created,
        updated,
        durationMs,
      };
    } catch (err: any) {
      const endTime = Date.now();
      this.lastLog = {
        ...this.lastLog,
        status: 'failed',
        errorMessage: err.message,
        completedAt: new Date(endTime).toISOString(),
        durationMs: endTime - startTime,
      };
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}
