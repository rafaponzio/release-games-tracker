import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IgdbService, IgdbRawGame } from '../../src/services/igdb-service.js';
import { InMemoryGameRepository } from '../../src/repository/in-memory-game-repository.js';
import { StandardPlatform } from '../../src/domain/platform.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('IgdbService (TDD)', () => {
  let repo: InMemoryGameRepository;
  let service: IgdbService;

  beforeEach(() => {
    repo = new InMemoryGameRepository();
    service = new IgdbService({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      repo,
    });
    vi.restoreAllMocks();
  });

  it('checks if credentials are configured', () => {
    expect(service.isConfigured()).toBe(true);

    const unconfigured = new IgdbService({ repo });
    // May be false unless env variables are present in shell
    if (!process.env.TWITCH_CLIENT_ID) {
      expect(unconfigured.isConfigured()).toBe(false);
    }
  });

  it('maps IGDB raw game with cover, platforms and release date to domain entity', () => {
    const raw: IgdbRawGame = {
      id: 12345,
      name: 'Judas',
      slug: 'judas',
      summary: 'A narrative-driven first-person shooter set on a disintegrating starship.',
      cover: {
        id: 999,
        image_id: 'co6abc',
      },
      genres: [{ id: 5, name: 'Shooter' }, { id: 12, name: 'Role-playing (RPG)' }],
      platforms: [
        { id: 6, name: 'PC (Microsoft Windows)' },
        { id: 167, name: 'PlayStation 5' },
        { id: 169, name: 'Xbox Series X|S' },
      ],
      release_dates: [
        {
          id: 100,
          date: 1800000000, // exact unix timestamp
          human: 'Mar 15, 2027',
          m: 3,
          y: 2027,
          category: 0, // exact
        },
      ],
      involved_companies: [
        {
          developer: true,
          publisher: false,
          company: { name: 'Ghost Story Games' },
        },
        {
          developer: false,
          publisher: true,
          company: { name: 'Take-Two Interactive' },
        },
      ],
      url: 'https://www.igdb.com/games/judas',
    };

    const domain = service.mapIgdbGameToDomain(raw, 2027);

    expect(domain.title).toBe('Judas');
    expect(domain.slug).toBe('judas');
    expect(domain.developer).toBe('Ghost Story Games');
    expect(domain.publisher).toBe('Take-Two Interactive');
    expect(domain.coverUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co6abc.jpg');
    expect(domain.platforms).toContain(StandardPlatform.PC);
    expect(domain.platforms).toContain(StandardPlatform.PS5);
    expect(domain.platforms).toContain(StandardPlatform.XBOX_SERIES);
    expect(domain.genres).toContain('Shooter');
    expect(domain.releaseDate.precision).toBe(ReleasePrecision.EXACT);
    expect(domain.releaseDate.year).toBe(2027);
  });

  it('handles TBA and quarter categories gracefully', () => {
    const rawQuarter: IgdbRawGame = {
      id: 54321,
      name: 'Fable 2027',
      release_dates: [
        {
          id: 200,
          date: 1814000000,
          human: 'Q2 2027',
          m: 6,
          y: 2027,
          category: 3, // quarter
        },
      ],
    };

    const domainQuarter = service.mapIgdbGameToDomain(rawQuarter, 2027);
    expect(domainQuarter.releaseDate.precision).toBe(ReleasePrecision.QUARTER);
    expect(domainQuarter.releaseDate.quarter).toBe(2);
    expect(domainQuarter.releaseDate.year).toBe(2027);

    const rawTba: IgdbRawGame = {
      id: 99999,
      name: 'Elder Scrolls VI',
      release_dates: [
        {
          id: 300,
          human: 'TBA 2028',
          y: 2028,
          category: 4, // tba
        },
      ],
    };

    const domainTba = service.mapIgdbGameToDomain(rawTba, 2028);
    expect(domainTba.releaseDate.precision).toBe(ReleasePrecision.YEAR);
    expect(domainTba.releaseDate.year).toBe(2028);
  });
});
