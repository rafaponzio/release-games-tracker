import { IGameRepository } from '../repository/game-repository.interface.js';
import { WikipediaGameScraper } from '../scraper/wikipedia-scraper.js';

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
  private lastLog: ScraperSyncLog | null = null;
  private isRunning = false;

  constructor(repo: IGameRepository, scraper?: WikipediaGameScraper) {
    this.repo = repo;
    this.scraper = scraper || new WikipediaGameScraper();
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
    const url = `https://en.wikipedia.org/wiki/${year}_in_video_games`;

    this.isRunning = true;
    this.lastLog = {
      id: logId,
      source: url,
      year,
      status: 'running',
      totalScraped: 0,
      created: 0,
      updated: 0,
      startedAt: new Date(startTime).toISOString(),
    };

    try {
      const scrapedGames = await this.scraper.scrapeUrl(url, { defaultYear: year });
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
