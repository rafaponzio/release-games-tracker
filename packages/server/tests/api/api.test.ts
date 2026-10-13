import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api/app.js';
import { InMemoryGameRepository } from '../../src/repository/in-memory-game-repository.js';
import { ScraperService } from '../../src/services/scraper-service.js';
import { CalendarExportService } from '../../src/services/calendar-export-service.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('REST API & Security Middleware (Supertest TDD)', () => {
  let repo: InMemoryGameRepository;
  let scraperService: ScraperService;
  let calendarService: CalendarExportService;
  let app: any;

  beforeEach(async () => {
    repo = new InMemoryGameRepository();
    scraperService = new ScraperService(repo);
    calendarService = new CalendarExportService();

    // Populate initial fixture
    await repo.upsert({
      title: 'Grand Theft Auto VI',
      slug: 'grand-theft-auto-vi',
      coverUrl: null,
      genres: ['Action'],
      platforms: [StandardPlatform.PS5, StandardPlatform.XBOX_SERIES],
      publisher: 'Rockstar Games',
      developer: 'Rockstar North',
      description: 'Next chapter in GTA',
      releaseDate: {
        raw: 'November 18, 2026',
        date: '2026-11-18',
        precision: ReleasePrecision.EXACT,
        year: 2026,
        month: 11,
        day: 18,
        quarter: 4,
      },
      sourceUrl: null,
    });

    app = createApp({
      repo,
      scraperService,
      calendarService,
      enableRateLimit: false, // disable in test for fast requests
    });
  });

  it('GET /api/health returns status ok with server timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/games returns game list and supports filters', async () => {
    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(res.body.games).toHaveLength(1);
    expect(res.body.games[0].title).toBe('Grand Theft Auto VI');

    // Filter matching
    const resPs5 = await request(app).get('/api/games?platform=PlayStation 5');
    expect(resPs5.status).toBe(200);
    expect(resPs5.body.games).toHaveLength(1);

    // Filter non-matching
    const resSwitch = await request(app).get('/api/games?platform=Nintendo Switch');
    expect(resSwitch.status).toBe(200);
    expect(resSwitch.body.games).toHaveLength(0);
  });

  it('validates query parameters and returns 400 on invalid input', async () => {
    const res = await request(app).get('/api/games?year=invalid-year');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('GET /api/games/:id finds game by id or slug and returns 404 if not found', async () => {
    const res = await request(app).get('/api/games/grand-theft-auto-vi');
    expect(res.status).toBe(200);
    expect(res.body.game.title).toBe('Grand Theft Auto VI');

    const notFound = await request(app).get('/api/games/non-existent-game');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error).toBe('Game not found');
  });

  it('GET /api/calendar/export.ics exports iCalendar file with proper headers', async () => {
    const res = await request(app).get('/api/calendar/export.ics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toContain('attachment; filename="games-calendar.ics"');
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('SUMMARY:Grand Theft Auto VI Release');
  });

  it('GET /api/scraper/status returns current scraper status', async () => {
    const res = await request(app).get('/api/scraper/status');
    expect(res.status).toBe(200);
    expect(res.body.isSyncing).toBe(false);
  });
});
