import * as cheerio from 'cheerio';
import { Game, slugify } from '../domain/game.js';
import { normalizePlatforms, StandardPlatform } from '../domain/platform.js';
import { parseReleaseDateString, ParsedReleaseDate, ReleasePrecision } from '../domain/release-date.js';
import { sanitizeText } from '../utils/sanitizer.js';
import { UrlSecurityGuard } from './url-security-guard.js';

export interface ParseOptions {
  defaultYear?: number;
  sourceUrl?: string;
}

const MONTH_MAP: Record<string, string> = {
  jan: 'January', january: 'January',
  feb: 'February', february: 'February',
  mar: 'March', march: 'March',
  apr: 'April', april: 'April',
  may: 'May',
  jun: 'June', june: 'June',
  jul: 'July', july: 'July',
  aug: 'August', august: 'August',
  sep: 'September', sept: 'September', september: 'September',
  oct: 'October', october: 'October',
  nov: 'November', november: 'November',
  dec: 'December', december: 'December',
};

export class WikipediaGameScraper {
  private securityGuard: UrlSecurityGuard;

  constructor(securityGuard?: UrlSecurityGuard) {
    this.securityGuard = securityGuard || new UrlSecurityGuard();
  }

  parseHtml(html: string, options: ParseOptions = {}): Array<Omit<Game, 'id' | 'createdAt' | 'updatedAt'>> {
    const $ = cheerio.load(html);
    const results: Array<Omit<Game, 'id' | 'createdAt' | 'updatedAt'>> = [];
    const defaultYear = options.defaultYear || new Date().getFullYear();
    const sourceUrl = options.sourceUrl || null;

    // Find all wikitable tables
    $('table.wikitable').each((_, tableElem) => {
      const table = $(tableElem);
      const rows = table.find('tr');
      if (rows.length < 2) return;

      let currentMonth: string | null = null;
      let monthRowspanRemaining = 0;

      rows.each((rowIndex, rowElem) => {
        const row = $(rowElem);
        const headers = row.find('th');
        if (headers.length > 0 && rowIndex === 0) {
          // Header row
          return;
        }

        const cells = row.find('td');
        if (cells.length === 0) return;

        let cellIndex = 0;
        let dayStr: string | null = null;
        let rawDateStr: string | null = null;

        // Check if first cell is a month with rowspan
        const firstCell = $(cells[0]);
        const firstText = sanitizeText(firstCell.text());
        const firstTextLower = firstText.toLowerCase();

        if (MONTH_MAP[firstTextLower]) {
          currentMonth = MONTH_MAP[firstTextLower];
          const rowspan = parseInt(firstCell.attr('rowspan') || '1', 10);
          monthRowspanRemaining = rowspan;
          cellIndex = 1; // day is in next cell

          if (cells.length > cellIndex) {
            dayStr = sanitizeText($(cells[cellIndex]).text());
            cellIndex++;
          }
        } else if (monthRowspanRemaining > 0 && currentMonth) {
          // Month is active from previous rowspan, current cell 0 is day
          dayStr = sanitizeText(firstCell.text());
          cellIndex = 1;
        } else {
          // Might be unscheduled / single date cell
          rawDateStr = sanitizeText(firstCell.text());
          cellIndex = 1;
        }

        if (monthRowspanRemaining > 0) {
          monthRowspanRemaining--;
        }

        // Remaining cells: Title, Platform(s), Genre(s), Developer(s), Publisher(s)
        const titleCell = $(cells[cellIndex]);
        const platformCell = $(cells[cellIndex + 1]);
        const genreCell = $(cells[cellIndex + 2]);
        const devCell = $(cells[cellIndex + 3]);
        const pubCell = $(cells[cellIndex + 4]);

        const title = sanitizeText(titleCell.text());
        if (!title) return;

        const rawPlatforms = sanitizeText(platformCell.text());
        const rawGenres = sanitizeText(genreCell.text());
        const developer = devCell.length ? sanitizeText(devCell.text()) || null : null;
        const publisher = pubCell.length ? sanitizeText(pubCell.text()) || null : null;

        // Parse date
        let parsedDate: ParsedReleaseDate;
        if (currentMonth && dayStr && /^\d{1,2}$/.test(dayStr)) {
          const dateString = `${currentMonth} ${dayStr}, ${defaultYear}`;
          parsedDate = parseReleaseDateString(dateString);
        } else if (rawDateStr) {
          parsedDate = parseReleaseDateString(rawDateStr);
        } else {
          parsedDate = parseReleaseDateString('TBA');
        }

        // Parse platforms
        const platformsList = rawPlatforms
          ? rawPlatforms.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
          : [];
        const normalizedPlatforms = normalizePlatforms(platformsList);

        // Parse genres
        const genresList = rawGenres
          ? rawGenres.split(/[,/]/).map((g) => g.trim()).filter(Boolean)
          : [];

        results.push({
          title,
          slug: slugify(title),
          coverUrl: null,
          genres: genresList,
          platforms: normalizedPlatforms.length > 0 ? normalizedPlatforms : [StandardPlatform.OTHER],
          publisher,
          developer,
          description: null,
          releaseDate: parsedDate,
          sourceUrl,
        });
      });
    });

    return results;
  }

  async scrapeUrl(url: string, options: ParseOptions = {}): Promise<Array<Omit<Game, 'id' | 'createdAt' | 'updatedAt'>>> {
    this.securityGuard.validateUrl(url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GameReleaseTracker/1.0 (+https://github.com/release-games-tracker)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Wikipedia page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return this.parseHtml(html, { ...options, sourceUrl: url });
  }
}
