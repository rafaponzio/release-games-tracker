import { describe, it, expect } from 'vitest';
import { extractInfoboxReleaseDate } from '../../src/scraper/infobox-scraper.js';
import { ReleasePrecision } from '../../src/domain/release-date.js';

describe('Wikipedia Infobox Scraper (TDD)', () => {
  it('extracts exact release date from GTA VI infobox HTML', () => {
    const html = `
      <table class="infobox hproduct">
        <tr><th scope="row">Developer(s)</th><td>Rockstar North</td></tr>
        <tr><th scope="row">Release</th><td>19 November 2026</td></tr>
      </table>
    `;
    const date = extractInfoboxReleaseDate(html);
    expect(date).not.toBeNull();
    expect(date?.date).toBe('2026-11-19');
    expect(date?.precision).toBe(ReleasePrecision.EXACT);
    expect(date?.raw).toBe('19 November 2026');

  });

  it('extracts and cleans release date with footnote references like [b]', () => {
    const html = `
      <table class="infobox">
        <tr><th scope="row">Release</th><td>23 February 2027<sup class="reference">[b]</sup></td></tr>
      </table>
    `;
    const date = extractInfoboxReleaseDate(html);
    expect(date).not.toBeNull();
    expect(date?.date).toBe('2027-02-23');
    expect(date?.precision).toBe(ReleasePrecision.EXACT);
    expect(date?.year).toBe(2027);
  });

  it('handles regional release dates in infobox', () => {
    const html = `
      <table class="infobox">
        <tr>
          <th scope="row">Release</th>
          <td>
            <ul>
              <li><span class="flagicon"></span> <b>WW:</b> October 28, 2026</li>
            </ul>
          </td>
        </tr>
      </table>
    `;
    const date = extractInfoboxReleaseDate(html);
    expect(date).not.toBeNull();
    expect(date?.date).toBe('2026-10-28');
    expect(date?.precision).toBe(ReleasePrecision.EXACT);
  });
});
