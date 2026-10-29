import { IGameRepository, GameUpsertInput } from '../repository/game-repository.interface.js';
import { StandardPlatform, normalizePlatforms } from '../domain/platform.js';
import { ReleasePrecision } from '../domain/release-date.js';

export interface IgdbServiceOptions {
  clientId?: string;
  clientSecret?: string;
  repo: IGameRepository;
}

export interface IgdbRawGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  cover?: {
    id: number;
    image_id: string;
  };
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ id: number; name: string }>;
  first_release_date?: number; // unix timestamp in seconds
  release_dates?: Array<{
    id: number;
    date?: number; // unix timestamp in seconds
    human?: string;
    m?: number;
    y?: number;
    category?: number; // 0=exact, 1=month, 2=year, 3=quarter, 4=tbd
  }>;
  involved_companies?: Array<{
    developer?: boolean;
    publisher?: boolean;
    company?: {
      name: string;
    };
  }>;
  url?: string;
}

export class IgdbService {
  private clientId: string | null;
  private clientSecret: string | null;
  private repo: IGameRepository;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(options: IgdbServiceOptions) {
    this.clientId = options.clientId || process.env.TWITCH_CLIENT_ID || null;
    this.clientSecret = options.clientSecret || process.env.TWITCH_CLIENT_SECRET || null;
    this.repo = options.repo;
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('IGDB requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET to be configured in .env or .env.local');
    }

    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(
      this.clientId
    )}&client_secret=${encodeURIComponent(this.clientSecret)}&grant_type=client_credentials`;

    const res = await fetch(tokenUrl, { method: 'POST' });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to authenticate with Twitch OAuth: ${res.status} ${res.statusText} ${errText}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number; token_type: string };
    this.cachedToken = data.access_token;
    // Buffer expiration by 60 seconds
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.cachedToken;
  }

  async queryIgdb<T = any>(endpoint: string, queryBody: string): Promise<T> {
    const token = await this.getAccessToken();

    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': this.clientId!,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: queryBody,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`IGDB query failed on /${endpoint}: ${res.status} ${res.statusText} - ${errText}`);
    }

    return (await res.json()) as T;
  }

  mapIgdbGameToDomain(raw: IgdbRawGame, targetYear?: number): GameUpsertInput {
    // Determine developer & publisher
    let developer: string | null = null;
    let publisher: string | null = null;

    if (raw.involved_companies) {
      for (const comp of raw.involved_companies) {
        if (comp.developer && comp.company?.name && !developer) {
          developer = comp.company.name;
        }
        if (comp.publisher && comp.company?.name && !publisher) {
          publisher = comp.company.name;
        }
      }
    }

    // Platforms
    const rawPlatformNames = (raw.platforms || []).map((p) => p.name);
    const platforms = normalizePlatforms(rawPlatformNames);

    // Genres
    const genres = (raw.genres || []).map((g) => g.name);

    // High resolution cover URL
    const coverUrl = raw.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${raw.cover.image_id}.jpg`
      : null;

    // Release Date evaluation
    let releaseDate = this.extractReleaseDate(raw, targetYear);

    // Slug
    const slug = raw.slug || raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return {
      title: raw.name,
      slug,
      coverUrl,
      genres,
      platforms,
      publisher,
      developer,
      description: raw.summary || raw.storyline || null,
      releaseDate,
      sourceUrl: raw.url || `https://www.igdb.com/games/${raw.slug || raw.id}`,
    };
  }

  private extractReleaseDate(raw: IgdbRawGame, targetYear?: number) {
    // Pick the most relevant release date entry (filter by targetYear if specified)
    const dates = raw.release_dates || [];
    let best = targetYear ? dates.find((d) => d.y === targetYear) : null;
    if (!best && dates.length > 0) {
      best = dates[0];
    }

    if (best && best.date) {
      const dateObj = new Date(best.date * 1000);
      const y = dateObj.getUTCFullYear();
      const m = dateObj.getUTCMonth() + 1;
      const d = dateObj.getUTCDate();
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');

      if (best.category === 0) {
        // Exact
        return {
          raw: best.human || `${y}-${mStr}-${dStr}`,
          date: `${y}-${mStr}-${dStr}`,
          precision: ReleasePrecision.EXACT,
          year: y,
          month: m,
          day: d,
          quarter: Math.ceil(m / 3),
        };
      } else if (best.category === 1) {
        // Month
        return {
          raw: best.human || `${mStr}/${y}`,
          date: null,
          precision: ReleasePrecision.MONTH,
          year: y,
          month: m,
          day: null,
          quarter: Math.ceil(m / 3),
        };
      } else if (best.category === 3) {
        // Quarter
        const quarter = Math.ceil(m / 3);
        return {
          raw: best.human || `Q${quarter} ${y}`,
          date: null,
          precision: ReleasePrecision.QUARTER,
          year: y,
          month: null,
          day: null,
          quarter,
        };
      }
    }

    // Fallback: first_release_date timestamp
    if (raw.first_release_date) {
      const dateObj = new Date(raw.first_release_date * 1000);
      const y = dateObj.getUTCFullYear();
      const m = dateObj.getUTCMonth() + 1;
      const d = dateObj.getUTCDate();
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');

      return {
        raw: `${y}-${mStr}-${dStr}`,
        date: `${y}-${mStr}-${dStr}`,
        precision: ReleasePrecision.EXACT,
        year: y,
        month: m,
        day: d,
        quarter: Math.ceil(m / 3),
      };
    }

    const y = best?.y || targetYear || null;
    return {
      raw: best?.human || (y ? `TBA ${y}` : 'TBA'),
      date: null,
      precision: y ? ReleasePrecision.YEAR : ReleasePrecision.TBA,
      year: y,
      month: null,
      day: null,
      quarter: null,
    };
  }

  async syncYear(
    year: number,
    limit: number = 100
  ): Promise<{ total: number; created: number; updated: number }> {
    if (!this.isConfigured()) {
      throw new Error(
        'IGDB credentials not set. Please define TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env or .env.local.'
      );
    }

    const query = `
      fields name, slug, summary, storyline, cover.image_id, genres.name, platforms.name, first_release_date, release_dates.date, release_dates.human, release_dates.m, release_dates.y, release_dates.category, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, url;
      where release_dates.y = ${year} & hypes != null;
      sort release_dates.date asc;
      limit ${Math.min(limit, 500)};
    `;

    const rawGames = await this.queryIgdb<IgdbRawGame[]>('games', query);

    const inputs = rawGames.map((g) => this.mapIgdbGameToDomain(g, year));
    const result = await this.repo.bulkUpsert(inputs);

    return {
      total: rawGames.length,
      created: result.created,
      updated: result.updated,
    };
  }
}
