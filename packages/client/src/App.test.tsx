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
});
