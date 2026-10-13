import * as cheerio from 'cheerio';
import { parseReleaseDateString, ParsedReleaseDate, ReleasePrecision } from '../domain/release-date.js';
import { sanitizeText } from '../utils/sanitizer.js';
import { UrlSecurityGuard } from './url-security-guard.js';

export function extractInfoboxReleaseDate(html: string): ParsedReleaseDate | null {
  const $ = cheerio.load(html);
  const infobox = $('table.infobox');
  if (!infobox.length) return null;

  // Remove references / sup tags (e.g. [1], [b])
  infobox.find('sup.reference, .reference').remove();

  let rawDateText = '';

  infobox.find('tr').each((_, tr) => {
    const th = $(tr).find('th').text().trim().toLowerCase();
    if (th.includes('release') || th.includes('release date')) {
      const td = $(tr).find('td');
      const listItems = td.find('li');
      if (listItems.length > 0) {
        let foundWW = '';
        listItems.each((_, li) => {
          const liText = $(li).text().trim();
          if (/\b(ww|worldwide|na|int)\b/i.test(liText)) {
            foundWW = liText.replace(/^.*?\b(ww|worldwide|na|int)[:\s]*/i, '').trim();
          }
        });
        rawDateText = foundWW || listItems.first().text().replace(/^.*?:[\s]*/i, '').trim();
      } else {
        rawDateText = td.text().trim();
      }
    }
  });

  if (!rawDateText) return null;

  // Clean brackets, footnotes and regional prefixes
  const clean = sanitizeText(rawDateText)
    .replace(/\[[a-z0-9]+\]/gi, '')
    .replace(/^(ww|na|pal|jp|worldwide|north america)[:\s]+/i, '')
    .trim();

  // Try parsing direct clean string
  const parsed = parseReleaseDateString(clean);
  if (parsed.precision !== ReleasePrecision.TBA) {
    return parsed;
  }

  // Fallback: search for month day, year in string
  const regex = /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})|(\d{1,2})\s+([a-z]+)\s+(\d{4})/i;
  const match = clean.match(regex);
  if (match) {
    return parseReleaseDateString(match[0]);
  }

  return null;
}

export class WikipediaInfoboxScraper {
  private guard: UrlSecurityGuard;

  constructor(guard?: UrlSecurityGuard) {
    this.guard = guard || new UrlSecurityGuard();
  }

  async scrapeInfoboxDate(articleUrl: string): Promise<ParsedReleaseDate | null> {
    this.guard.validateUrl(articleUrl);

    const res = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'GameReleaseTracker/1.0 (+https://github.com/release-games-tracker)',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    return extractInfoboxReleaseDate(html);
  }
}
