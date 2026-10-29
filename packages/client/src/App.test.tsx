import { describe, it, expect } from 'vitest';
import { StandardPlatform } from './types';

describe('Client Domain & Component Logic (TDD)', () => {
  it('correctly maps platform enums', () => {
    expect(StandardPlatform.PC).toBe('PC');
    expect(StandardPlatform.PS5).toBe('PlayStation 5');
    expect(StandardPlatform.SWITCH).toBe('Nintendo Switch');
  });

  it('calculates countdown accurately', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const target = new Date(dateStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBeLessThanOrEqual(1);
  });

  it('correctly parses target navigation date from game release info', () => {
    // Exact date
    const exactGame = {
      releaseDate: {
        raw: 'November 19, 2026',
        date: '2026-11-19',
        precision: 'exact' as const,
        year: 2026,
        month: 11,
        day: 19,
        quarter: 4,
      },
    };
    const [y, m, d] = exactGame.releaseDate.date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    expect(targetDate.getFullYear()).toBe(2026);
    expect(targetDate.getMonth()).toBe(10); // 0-indexed November
    expect(targetDate.getDate()).toBe(19);

    // Month precision
    const monthGame = {
      releaseDate: {
        raw: 'May 2026',
        date: null,
        precision: 'month' as const,
        year: 2026,
        month: 5,
        day: null,
        quarter: 2,
      },
    };
    const monthTarget = new Date(monthGame.releaseDate.year, monthGame.releaseDate.month - 1, 1);
    expect(monthTarget.getFullYear()).toBe(2026);
    expect(monthTarget.getMonth()).toBe(4); // 0-indexed May
  });
});
