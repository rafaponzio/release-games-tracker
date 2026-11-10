import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { Game, StandardPlatform } from '../types';

describe('CalendarView Component & Day Selection Tests', () => {
  const mockGames: Game[] = [
    {
      id: 'game-1',
      title: 'Monster Hunter Wilds',
      slug: 'monster-hunter-wilds',
      coverUrl: 'https://images.igdb.com/test.jpg',
      genres: ['Action', 'RPG'],
      platforms: [StandardPlatform.PC, StandardPlatform.PS5],
      publisher: 'Capcom',
      developer: 'Capcom',
      description: 'Hunting monsters in wilds',
      releaseDate: {
        raw: '2026-11-15',
        date: '2026-11-15',
        precision: 'exact',
        year: 2026,
        month: 11,
        day: 15,
        quarter: 4,
      },
      sourceUrl: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'game-2',
      title: 'Grand Theft Auto VI',
      slug: 'grand-theft-auto-vi',
      coverUrl: null,
      genres: ['Action'],
      platforms: [StandardPlatform.PS5],
      publisher: 'Rockstar',
      developer: 'Rockstar North',
      description: 'Vice City awaits',
      releaseDate: {
        raw: '2026-11-19',
        date: '2026-11-19',
        precision: 'exact',
        year: 2026,
        month: 11,
        day: 19,
        quarter: 4,
      },
      sourceUrl: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('renders without hardcoding October: respects current/provided date', () => {
    const novDate = new Date(2026, 10, 10); // Nov 10, 2026
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={vi.fn()}
        currentDate={novDate}
        onDateChange={vi.fn()}
      />
    );

    // Should display November 2026 in main month header, NOT October 2026
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/november 2026/i);
    expect(heading.textContent).not.toMatch(/october 2026/i);
  });

  it('allows selecting any day on desktop and updates date', () => {
    const currentDate = new Date(2026, 10, 10);
    const onDateChange = vi.fn();
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={vi.fn()}
        currentDate={currentDate}
        onDateChange={onDateChange}
      />
    );

    // Click desktop cell for Nov 15
    const cell = screen.getByTestId('desktop-day-cell-2026-11-15');
    fireEvent.click(cell);

    expect(onDateChange).toHaveBeenCalled();
    const calledDate: Date = onDateChange.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(2026);
    expect(calledDate.getMonth()).toBe(10);
    expect(calledDate.getDate()).toBe(15);
  });

  it('allows selecting day on mobile matrix and updates agenda', () => {
    const currentDate = new Date(2026, 10, 10);
    const onDateChange = vi.fn();
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={vi.fn()}
        currentDate={currentDate}
        onDateChange={onDateChange}
      />
    );

    // Click mobile button for Nov 19
    const mobileBtn = screen.getByTestId('mobile-day-cell-2026-11-19');
    fireEvent.click(mobileBtn);

    expect(onDateChange).toHaveBeenCalled();
    const calledDate: Date = onDateChange.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(2026);
    expect(calledDate.getMonth()).toBe(10);
    expect(calledDate.getDate()).toBe(19);
  });

  it('opens day releases modal when a day with games is clicked on desktop', () => {
    const currentDate = new Date(2026, 10, 15);
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={vi.fn()}
        currentDate={currentDate}
        onDateChange={vi.fn()}
      />
    );

    const cell = screen.getByTestId('desktop-day-cell-2026-11-15');
    fireEvent.click(cell);

    // Day releases modal header should open showing games count
    expect(screen.getByText(/1 lançamento/i)).toBeTruthy();
  });

  it('clicking a specific game button in a day cell triggers onSelectGame without conflict', () => {
    const currentDate = new Date(2026, 10, 15);
    const onSelectGame = vi.fn();
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={onSelectGame}
        currentDate={currentDate}
        onDateChange={vi.fn()}
      />
    );

    const gameTitleBtn = screen.getAllByText('Monster Hunter Wilds')[0];
    fireEvent.click(gameTitleBtn);

    expect(onSelectGame).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Monster Hunter Wilds' })
    );
  });

  it('navigates to today when "Hoje" button is clicked', () => {
    const pastDate = new Date(2025, 0, 1);
    const onDateChange = vi.fn();
    render(
      <CalendarView
        games={mockGames}
        onSelectGame={vi.fn()}
        currentDate={pastDate}
        onDateChange={onDateChange}
      />
    );

    const hojeBtn = screen.getByRole('button', { name: /hoje/i });
    fireEvent.click(hojeBtn);

    expect(onDateChange).toHaveBeenCalled();
    const calledDate: Date = onDateChange.mock.calls[0][0];
    const today = new Date();
    expect(calledDate.getFullYear()).toBe(today.getFullYear());
    expect(calledDate.getMonth()).toBe(today.getMonth());
    expect(calledDate.getDate()).toBe(today.getDate());
  });
});
