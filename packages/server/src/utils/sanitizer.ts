import * as cheerio from 'cheerio';

export function sanitizeText(dirty: string): string {
  if (!dirty) return '';

  // Load into cheerio, remove script/style tags, and extract clean text
  const $ = cheerio.load(dirty);
  $('script, style, noscript, iframe, object, embed').remove();
  const text = $.text();

  // Normalize control characters and multiple whitespaces
  return text
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface RawGameInput {
  title: string;
  publisher?: string | null;
  developer?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  sourceUrl?: string | null;
}

export function sanitizeGameInput<T extends RawGameInput>(raw: T): T {
  return {
    ...raw,
    title: sanitizeText(raw.title),
    publisher: raw.publisher ? sanitizeText(raw.publisher) : null,
    developer: raw.developer ? sanitizeText(raw.developer) : null,
    description: raw.description ? sanitizeText(raw.description) : null,
  };
}
