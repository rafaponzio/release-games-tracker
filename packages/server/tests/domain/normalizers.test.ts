import { describe, it, expect } from 'vitest';
import {
  normalizePlatform,
  normalizePlatforms,
  StandardPlatform,
} from '../../src/domain/platform.js';
import {
  parseReleaseDateString,
  ReleasePrecision,
} from '../../src/domain/release-date.js';
import { sanitizeText, sanitizeGameInput } from '../../src/utils/sanitizer.js';

describe('Platform Normalizer (TDD)', () => {
  it('normalizes known platform aliases to StandardPlatform enum', () => {
    expect(normalizePlatform('PC')).toBe(StandardPlatform.PC);
    expect(normalizePlatform('Windows')).toBe(StandardPlatform.PC);
    expect(normalizePlatform('Microsoft Windows')).toBe(StandardPlatform.PC);
    expect(normalizePlatform('PlayStation 5')).toBe(StandardPlatform.PS5);
    expect(normalizePlatform('PS5')).toBe(StandardPlatform.PS5);
    expect(normalizePlatform('PlayStation 4')).toBe(StandardPlatform.PS4);
    expect(normalizePlatform('PS4')).toBe(StandardPlatform.PS4);
    expect(normalizePlatform('Xbox Series X/S')).toBe(StandardPlatform.XBOX_SERIES);
    expect(normalizePlatform('XSX')).toBe(StandardPlatform.XBOX_SERIES);
    expect(normalizePlatform('Xbox One')).toBe(StandardPlatform.XBOX_ONE);
    expect(normalizePlatform('Nintendo Switch')).toBe(StandardPlatform.SWITCH);
    expect(normalizePlatform('Switch')).toBe(StandardPlatform.SWITCH);
    expect(normalizePlatform('macOS')).toBe(StandardPlatform.MACOS);
    expect(normalizePlatform('Linux')).toBe(StandardPlatform.LINUX);
  });

  it('handles unknown platforms gracefully as Other', () => {
    expect(normalizePlatform('Atari 2600')).toBe(StandardPlatform.OTHER);
  });

  it('normalizes lists of comma- or slash-separated platforms and deduplicates them', () => {
    const raw = ['PC', 'PlayStation 5', 'PS5', 'Xbox Series X/S', 'UnknownPlatform'];
    const result = normalizePlatforms(raw);
    expect(result).toEqual([
      StandardPlatform.PC,
      StandardPlatform.PS5,
      StandardPlatform.XBOX_SERIES,
      StandardPlatform.OTHER,
    ]);
  });
});

describe('Release Date Normalizer (TDD)', () => {
  it('parses exact ISO-like and full text dates', () => {
    const res = parseReleaseDateString('November 18, 2026');
    expect(res).toEqual({
      raw: 'November 18, 2026',
      date: '2026-11-18',
      precision: ReleasePrecision.EXACT,
      year: 2026,
      month: 11,
      day: 18,
      quarter: 4,
    });
  });

  it('parses month and year dates (e.g. October 2026)', () => {
    const res = parseReleaseDateString('October 2026');
    expect(res).toEqual({
      raw: 'October 2026',
      date: '2026-10-01',
      precision: ReleasePrecision.MONTH,
      year: 2026,
      month: 10,
      day: 1,
      quarter: 4,
    });
  });

  it('parses quarter dates (e.g. Q2 2026, 2Q 2026)', () => {
    const res = parseReleaseDateString('Q2 2026');
    expect(res).toEqual({
      raw: 'Q2 2026',
      date: '2026-04-01',
      precision: ReleasePrecision.QUARTER,
      year: 2026,
      month: 4,
      day: 1,
      quarter: 2,
    });
  });

  it('parses year-only dates (e.g. 2026)', () => {
    const res = parseReleaseDateString('2026');
    expect(res).toEqual({
      raw: '2026',
      date: '2026-01-01',
      precision: ReleasePrecision.YEAR,
      year: 2026,
      month: 1,
      day: 1,
      quarter: 1,
    });
  });

  it('handles TBA and TBD strings', () => {
    const res = parseReleaseDateString('TBA');
    expect(res).toEqual({
      raw: 'TBA',
      date: null,
      precision: ReleasePrecision.TBA,
      year: null,
      month: null,
      day: null,
      quarter: null,
    });
  });

  it('handles TBA with tentative year (e.g. TBA 2027)', () => {
    const res = parseReleaseDateString('TBA 2027');
    expect(res.precision).toBe(ReleasePrecision.TBA);
    expect(res.year).toBe(2027);
  });
});

describe('Sanitizer & Security Guards (TDD)', () => {
  it('strips HTML tags and malicious script payloads from scraped text', () => {
    const dirty = '<script>alert("xss")</script>Grand Theft Auto <b>VI</b>';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Grand Theft Auto VI');
  });

  it('normalizes whitespace and removes control characters', () => {
    const dirty = '  Half-Life 3\n\t  ';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Half-Life 3');
  });

  it('sanitizes entire game input structures before persistence', () => {
    const dirtyGame = {
      title: '<img src=x onerror=alert(1)>Cyberpunk Orion',
      publisher: '<a href="javascript:steal()">CD Projekt</a>',
      developer: 'CD Projekt Red',
      description: '<p>A futuristic <strong>RPG</strong>.</p><script>bad()</script>',
    };
    const cleanGame = sanitizeGameInput(dirtyGame);
    expect(cleanGame.title).toBe('Cyberpunk Orion');
    expect(cleanGame.publisher).toBe('CD Projekt');
    expect(cleanGame.developer).toBe('CD Projekt Red');
    expect(cleanGame.description).toBe('A futuristic RPG.');
  });
});
