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

    // Remove reference sup tags to avoid [1], [b] polluting dates & titles
    $('sup.reference, .reference').remove();

    // Find all wikitable tables
    $('table.wikitable').each((_, tableElem) => {
      const table = $(tableElem);
      const rows = table.find('tr');
      if (rows.length < 2) return;

      // Extract header names from first row, expanding colspans
      const firstRow = rows.first();
      const headerTexts: string[] = [];
      firstRow.find('th').each((_, th) => {
        const text = $(th).text().trim().toLowerCase();
        const colspan = parseInt($(th).attr('colspan') || '1', 10);
        for (let c = 0; c < colspan; c++) {
          headerTexts.push(text);
        }
      });


      const titleCol = headerTexts.findIndex((h) => h.includes('title'));
      const dateCol = headerTexts.findIndex((h) => h.includes('date') || h.includes('release'));
      const platformCol = headerTexts.findIndex((h) => h.includes('platform'));
      const genreCol = headerTexts.findIndex((h) => h.includes('genre'));
      const devCol = headerTexts.findIndex((h) => h.includes('developer'));
      const pubCol = headerTexts.findIndex((h) => h.includes('publisher'));

      // Check if table uses Month rowspan format (legacy Wikipedia style)
      const hasMonthRowspan = table.find('td[rowspan]').toArray().some((td) => {
        const text = $(td).text().trim().toLowerCase();
        return Boolean(MONTH_MAP[text]);
      });

      // If this table has explicit title and platform headers and is not a month-rowspan table
      const isDynamicTable = !hasMonthRowspan && titleCol !== -1 && platformCol !== -1;

      // Skip non-release tables (e.g. platform abbreviation keys, compilation summaries)
      if (!isDynamicTable && !hasMonthRowspan) {
        return;
      }



      let currentMonth: string | null = null;
      let monthRowspanRemaining = 0;

      rows.each((rowIndex, rowElem) => {
        const row = $(rowElem);
        const headers = row.find('th');
        if (headers.length > 0 && rowIndex === 0) {
          return;
        }

        const cells = row.find('td');
        if (cells.length === 0) return;

        let title = '';
        let rawDateStr = '';
        let rawPlatforms = '';
        let rawGenres = '';
        let developer: string | null = null;
        let publisher: string | null = null;
        let gameArticleUrl: string | null = sourceUrl;

        if (isDynamicTable && cells.length >= Math.max(titleCol, platformCol)) {
          // Dynamic Header Mode
          const titleCell = $(cells[titleCol]);
          title = sanitizeText(titleCell.text());

          const link = titleCell.find('a').attr('href');
          if (link && link.startsWith('/wiki/')) {
            gameArticleUrl = `https://en.wikipedia.org${link}`;
          }

          if (dateCol !== -1 && cells.length > dateCol) {
            rawDateStr = sanitizeText($(cells[dateCol]).text());
          }

          if (platformCol !== -1 && cells.length > platformCol) {
            rawPlatforms = sanitizeText($(cells[platformCol]).text());
          }

          if (genreCol !== -1 && cells.length > genreCol) {
            rawGenres = sanitizeText($(cells[genreCol]).text());
          }

          if (devCol !== -1 && cells.length > devCol) {
            developer = sanitizeText($(cells[devCol]).text()) || null;
          }

          if (pubCol !== -1 && cells.length > pubCol) {
            publisher = sanitizeText($(cells[pubCol]).text()) || null;
          }
        } else {
          // Legacy Rowspan Mode (e.g. Month rowspan cell 0, Day cell 1, Title cell 2...)
          let cellIndex = 0;
          let dayStr: string | null = null;

          const firstCell = $(cells[0]);
          const firstText = sanitizeText(firstCell.text());
          const firstTextLower = firstText.toLowerCase();

          if (MONTH_MAP[firstTextLower]) {
            currentMonth = MONTH_MAP[firstTextLower];
            const rowspan = parseInt(firstCell.attr('rowspan') || '1', 10);
            monthRowspanRemaining = rowspan;
            cellIndex = 1;

            if (cells.length > cellIndex) {
              dayStr = sanitizeText($(cells[cellIndex]).text());
              cellIndex++;
            }
          } else if (monthRowspanRemaining > 0 && currentMonth) {
            dayStr = sanitizeText(firstCell.text());
            cellIndex = 1;
          } else {
            rawDateStr = sanitizeText(firstCell.text());
            cellIndex = 1;
          }

          if (monthRowspanRemaining > 0) {
            monthRowspanRemaining--;
          }

          const titleCell = $(cells[cellIndex]);
          const platformCell = $(cells[cellIndex + 1]);
          const genreCell = $(cells[cellIndex + 2]);
          const devCell = $(cells[cellIndex + 3]);
          const pubCell = $(cells[cellIndex + 4]);

          title = sanitizeText(titleCell.text());
          const link = titleCell.find('a').attr('href');
          if (link && link.startsWith('/wiki/')) {
            gameArticleUrl = `https://en.wikipedia.org${link}`;
          }

          rawPlatforms = sanitizeText(platformCell.text());
          rawGenres = sanitizeText(genreCell.text());
          developer = devCell.length ? sanitizeText(devCell.text()) || null : null;
          publisher = pubCell.length ? sanitizeText(pubCell.text()) || null : null;

          if (currentMonth && dayStr && /^\d{1,2}$/.test(dayStr)) {
            rawDateStr = `${currentMonth} ${dayStr}, ${defaultYear}`;
          }
        }

        if (!title || title.length < 2) return;

        // Parse date
        let parsedDate: ParsedReleaseDate;
        if (rawDateStr) {
          // If raw date is like "January 5", append defaultYear if year is absent
          let dateToParse = rawDateStr;
          if (/^[a-z]+\s+\d{1,2}$/i.test(rawDateStr.trim())) {
            dateToParse = `${rawDateStr.trim()}, ${defaultYear}`;
          }
          parsedDate = parseReleaseDateString(dateToParse);
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
          sourceUrl: gameArticleUrl,
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
