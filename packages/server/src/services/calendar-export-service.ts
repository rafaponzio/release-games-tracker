import { Game } from '../domain/game.js';

export class CalendarExportService {
  generateICalendar(games: Game[]): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Game Releases Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Video Game Releases',
    ];

    const validGames = games.filter((g) => g.releaseDate.date);

    for (const game of validGames) {
      const dateParts = game.releaseDate.date!.split('-');
      if (dateParts.length !== 3) continue;

      const dtStart = `${dateParts[0]}${dateParts[1]}${dateParts[2]}`;
      const escapedTitle = this.escapeIcs(game.title);
      const platformsStr = game.platforms.join(', ');
      const escapedPlatforms = this.escapeIcs(platformsStr);
      const desc = `Platforms: ${escapedPlatforms}${game.developer ? `\\nDeveloper: ${this.escapeIcs(game.developer)}` : ''}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${game.id}@gamereleasetracker.app`);
      lines.push(`DTSTAMP:${this.formatUtcTimestamp(new Date())}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`SUMMARY:${escapedTitle} Release`);
      lines.push(`DESCRIPTION:${desc}`);
      if (game.sourceUrl) {
        lines.push(`URL:${this.escapeIcs(game.sourceUrl)}`);
      }
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private escapeIcs(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private formatUtcTimestamp(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }
}
