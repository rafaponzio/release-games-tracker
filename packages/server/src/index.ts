import path from 'node:path';
import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { createApp } from './api/app.js';
import { FileGameRepository } from './repository/file-game-repository.js';
import { ScraperService } from './services/scraper-service.js';
import { CalendarExportService } from './services/calendar-export-service.js';
import { WikipediaGameScraper } from './scraper/wikipedia-scraper.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'games.json');
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 3 * * *'; // Default: daily at 3am

async function bootstrap() {
  const repo = new FileGameRepository(DATA_FILE);
  const scraper = new WikipediaGameScraper();
  const scraperService = new ScraperService(repo, scraper);
  const calendarService = new CalendarExportService();

  const app = createApp({
    repo,
    scraperService,
    calendarService,
    enableRateLimit: true,
  });

  // Serve static client production build if available
  const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next();
    });
  });


  // Check if database is empty; if so, trigger initial sync for current year
  const initialCount = await repo.count();
  console.log(`[Database] Loaded ${initialCount} games from ${DATA_FILE}`);

  if (initialCount === 0 && process.env.AUTO_SEED !== 'false') {
    const currentYear = new Date().getFullYear();
    console.log(`[Scraper] Initial run: syncing games for year ${currentYear}...`);
    try {
      const res = await scraperService.syncYear(currentYear);
      console.log(`[Scraper] Initial sync complete: scraped ${res.totalScraped}, created ${res.created}.`);
    } catch (err: any) {
      console.warn(`[Scraper] Initial sync warning: ${err.message}`);
    }
  }

  // Background cron scheduler
  cron.schedule(CRON_SCHEDULE, async () => {
    const currentYear = new Date().getFullYear();
    console.log(`[Cron] Executing scheduled game release sync for ${currentYear}...`);
    try {
      const res = await scraperService.syncYear(currentYear);
      console.log(`[Cron] Sync finished: scraped ${res.totalScraped}, created ${res.created}, updated ${res.updated}`);
    } catch (err: any) {
      console.error(`[Cron] Sync failed: ${err.message}`);
    }
  });

  app.listen(PORT, () => {
    console.log(`[Server] Game Releases Tracker API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
