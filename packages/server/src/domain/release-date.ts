export enum ReleasePrecision {
  EXACT = 'exact',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  TBA = 'tba',
}

export interface ParsedReleaseDate {
  raw: string;
  date: string | null; // ISO YYYY-MM-DD
  precision: ReleasePrecision;
  year: number | null;
  month: number | null;
  day: number | null;
  quarter: number | null;
}

const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

function formatISO(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getQuarterFromMonth(month: number): number {
  return Math.ceil(month / 3);
}

export function parseReleaseDateString(rawInput: string): ParsedReleaseDate {
  const raw = (rawInput || '').trim();

  if (!raw || /^(tba|tbd|to be announced|unknown)$/i.test(raw)) {
    return {
      raw,
      date: null,
      precision: ReleasePrecision.TBA,
      year: null,
      month: null,
      day: null,
      quarter: null,
    };
  }

  // Check TBA with year, e.g. "TBA 2027", "TBD 2026"
  const tbaYearMatch = raw.match(/^(?:tba|tbd)\s+(\d{4})$/i);
  if (tbaYearMatch) {
    const year = parseInt(tbaYearMatch[1], 10);
    return {
      raw,
      date: null,
      precision: ReleasePrecision.TBA,
      year,
      month: null,
      day: null,
      quarter: null,
    };
  }

  // Check Quarter, e.g. "Q2 2026", "2Q 2026", "Q4 2025"
  const quarterMatch = raw.match(/^(?:Q([1-4])\s+(\d{4})|([1-4])Q\s+(\d{4}))$/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1] || quarterMatch[3], 10);
    const year = parseInt(quarterMatch[2] || quarterMatch[4], 10);
    const startMonth = (quarter - 1) * 3 + 1;
    return {
      raw,
      date: formatISO(year, startMonth, 1),
      precision: ReleasePrecision.QUARTER,
      year,
      month: startMonth,
      day: 1,
      quarter,
    };
  }

  // Check Year only, e.g. "2026"
  if (/^\d{4}$/.test(raw)) {
    const year = parseInt(raw, 10);
    return {
      raw,
      date: formatISO(year, 1, 1),
      precision: ReleasePrecision.YEAR,
      year,
      month: 1,
      day: 1,
      quarter: 1,
    };
  }

  // Check "Month Day, Year", e.g. "November 18, 2026" or "Nov 18, 2026" or "18 November 2026"
  const exactMatch1 = raw.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (exactMatch1) {
    const monthName = exactMatch1[1].toLowerCase();
    const day = parseInt(exactMatch1[2], 10);
    const year = parseInt(exactMatch1[3], 10);
    const month = MONTH_NAMES[monthName];
    if (month) {
      return {
        raw,
        date: formatISO(year, month, day),
        precision: ReleasePrecision.EXACT,
        year,
        month,
        day,
        quarter: getQuarterFromMonth(month),
      };
    }
  }

  // Check "Day Month Year", e.g. "18 November 2026"
  const exactMatch2 = raw.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  if (exactMatch2) {
    const day = parseInt(exactMatch2[1], 10);
    const monthName = exactMatch2[2].toLowerCase();
    const year = parseInt(exactMatch2[3], 10);
    const month = MONTH_NAMES[monthName];
    if (month) {
      return {
        raw,
        date: formatISO(year, month, day),
        precision: ReleasePrecision.EXACT,
        year,
        month,
        day,
        quarter: getQuarterFromMonth(month),
      };
    }
  }

  // Check "Month Year", e.g. "October 2026"
  const monthYearMatch = raw.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2], 10);
    const month = MONTH_NAMES[monthName];
    if (month) {
      return {
        raw,
        date: formatISO(year, month, 1),
        precision: ReleasePrecision.MONTH,
        year,
        month,
        day: 1,
        quarter: getQuarterFromMonth(month),
      };
    }
  }

  // Fallback if unable to parse reliably
  return {
    raw,
    date: null,
    precision: ReleasePrecision.TBA,
    year: null,
    month: null,
    day: null,
    quarter: null,
  };
}
