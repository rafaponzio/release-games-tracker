import { describe, it, expect } from 'vitest';
import { CalendarExportService } from '../../src/services/calendar-export-service.js';
import { Game } from '../../src/domain/game.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('CalendarExportService (iCal RFC 5545 TDD)', () => {
  const service = new CalendarExportService();

  const mockGames: Game[] = [
    {
      id: 'game-1',
      title: 'Grand Theft Auto VI',
      slug: 'grand-theft-auto-vi',
      coverUrl: null,
      genres: ['Action', 'Open World'],
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
      sourceUrl: 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'game-2',
      title: 'TBA Adventure',
      slug: 'tba-adventure',
      coverUrl: null,
      genres: [],
      platforms: [StandardPlatform.PC],
      publisher: null,
      developer: null,
      description: null,
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
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('generates compliant iCalendar .ics format with VCALENDAR and VEVENT', () => {
    const ics = service.generateICalendar(mockGames);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Game Releases Tracker//EN');
    expect(ics).toContain('SUMMARY:Grand Theft Auto VI Release');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261118');
    expect(ics).toContain('DESCRIPTION:Platforms: PlayStation 5\\, Xbox Series X/S');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('skips games without valid release dates in the calendar export', () => {
    const ics = service.generateICalendar(mockGames);
    expect(ics).not.toContain('SUMMARY:TBA Adventure Release');
  });
});
