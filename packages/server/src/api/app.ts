import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { IGameRepository } from '../repository/game-repository.interface.js';
import { ScraperService } from '../services/scraper-service.js';
import { CalendarExportService } from '../services/calendar-export-service.js';
import { StandardPlatform } from '../domain/platform.js';

import { IgdbService } from '../services/igdb-service.js';

export interface AppOptions {
  repo: IGameRepository;
  scraperService: ScraperService;
  calendarService: CalendarExportService;
  igdbService?: IgdbService;
  enableRateLimit?: boolean;
}

const GamesQuerySchema = z.object({
  search: z.string().optional(),
  platform: z.nativeEnum(StandardPlatform).optional(),
  year: z.coerce.number().int().min(1970).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const SyncBodySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100).optional(),
});

export function createApp(options: AppOptions) {
  const app = express();
  const { repo, scraperService, calendarService, enableRateLimit = true } = options;

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  }));

  // Body parser with size limits to prevent body bombing
  app.use(express.json({ limit: '100kb' }));

  // Rate Limiting (optional in test environments)
  if (enableRateLimit) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // limit each IP to 300 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
    app.use('/api/', limiter);
  }

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Get games with filtering
  app.get('/api/games', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = GamesQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors,
        });
      }

      const query = validation.data;
      const games = await repo.findAll(query);

      // Auto-heal: If an unpopulated year is requested and no scrape is running, initiate background sync
      if (games.length === 0 && query.year && !scraperService.isSyncing()) {
        scraperService.syncYear(query.year).catch((err) => {
          console.warn(`[AutoSync] Background sync for ${query.year} failed: ${err.message}`);
        });
      }

      res.json({
        total: games.length,
        games,
      });

    } catch (err) {
      next(err);
    }
  });

  // Get single game by ID or slug
  app.get('/api/games/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      let game = await repo.findById(id);
      if (!game) {
        game = await repo.findBySlug(id);
      }


      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({ game });
    } catch (err) {
      next(err);
    }
  });

  // Scraper status
  app.get('/api/scraper/status', (_req: Request, res: Response) => {
    res.json({
      isSyncing: scraperService.isSyncing(),
      lastSync: scraperService.getLastSyncLog(),
    });
  });

  // Trigger scraper sync
  app.post('/api/scraper/sync', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = SyncBodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors,
        });
      }

      const year = validation.data.year || new Date().getFullYear();
      const result = await scraperService.syncYear(year);
      res.json({
        message: 'Sync completed successfully',
        ...result,
      });
    } catch (err: any) {
      if (err.message?.includes('already running')) {
        return res.status(409).json({ error: err.message });
      }
      next(err);
    }
  });

  // Trigger IGDB sync
  app.post('/api/scraper/sync-igdb', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!options.igdbService || !options.igdbService.isConfigured()) {
        return res.status(503).json({
          error: 'IGDB not configured. Please define TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env or .env.local.',
        });
      }

      const validation = SyncBodySchema.safeParse(req.body);
      const year = validation.success && validation.data.year ? validation.data.year : 2027;

      const result = await options.igdbService.syncYear(year);
      res.json({
        message: `Synced ${result.total} games for ${year} from IGDB`,
        ...result,
      });
    } catch (err: any) {
      next(err);
    }
  });

  // Export iCalendar (.ics)
  app.get('/api/calendar/export.ics', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const games = await repo.findAll();
      const icsData = calendarService.generateICalendar(games);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="games-calendar.ics"');
      res.send(icsData);
    } catch (err) {
      next(err);
    }
  });

  // Central Error Handler (sanitizes output, no stack traces leaked)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err.message || err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
    });
  });

  return app;
}
