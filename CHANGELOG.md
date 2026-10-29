# Project Changelog & Work History

All notable changes, implementation steps, and work log entries for the Game Releases Tracker are recorded here.

---

## [Unreleased] - 2026-10-07

### Initial Setup & Architecture
- **Repository Initialized**: Git repo setup with `.gitignore` and root `package.json` utilizing npm workspaces.
- **Architectural Plan Created**: Published detailed MVP plan in project plan artifact covering Hexagonal architecture, TDD, and Security blueprint.
- **Documentation & Tracking**:
  - Created [`DECISIONS.md`](file:///Users/rafaelponzio/Workspace/release-games-tracker/DECISIONS.md) to record Architecture Decision Records (ADRs).
  - Created [`CHANGELOG.md`](file:///Users/rafaelponzio/Workspace/release-games-tracker/CHANGELOG.md) to log all development steps, modifications, and milestones.
- **Package Definitions**: Configured `packages/server` and `packages/client` dependencies, TypeScript settings (`tsconfig.json`), and Vitest runner configuration.
- **Security Dependency Audit**: Mitigated 14 CVEs down to **0 vulnerabilities** (`npm audit` verified clean). Documented in ADR 004.

### Phase 1: Domain Core & Repositories (TDD Completed)
- **Domain Entities & Normalizers**:
  - Implemented `StandardPlatform` enum with fuzzy alias normalization (`PC`, `PS5`, `Switch`, etc.).
  - Implemented `ReleasePrecision` and `parseReleaseDateString` handling exact, month, quarter, year, and TBA dates.
  - Implemented Cheerio-based `sanitizeText` and `sanitizeGameInput` protecting against XSS payloads and control chars.
- **Hexagonal Repository Layer**:
  - Implemented `IGameRepository` port.
  - Created `InMemoryGameRepository` and `FileGameRepository` adapters with atomic file write transactions and query filtering (by platform, date range, search query).
  - 100% test coverage with 21 passing domain/repository tests.

### Phase 2: Scraper Engine & Ingestion Pipeline (TDD Completed)
- **SSRF Security Protection**: Created `UrlSecurityGuard` with domain whitelisting, scheme checks, and private IP/metadata blocklists.
- **Wikipedia Scraper Adapter**: Implemented `WikipediaGameScraper` parsing complex Wikipedia tables with rowspan state machines, tested against realistic offline HTML fixtures.
- **Scraper Ingestion Service**: Implemented `ScraperService` coordinating scraping, progress logging, and bulk upserting.
- Total test suite: 29 passing unit & integration tests.

### Phase 3: REST API, Security Middleware & Scheduler (TDD Completed)
- **REST Endpoints**:
  - `GET /api/games`: Filter games by platform, search term, date range, year, and month.
  - `GET /api/games/:id`: Query individual game by UUID or slug with 404 handling.
  - `POST /api/scraper/sync`: On-demand scraper trigger with concurrency lock (409 Conflict if active).
  - `GET /api/scraper/status`: Query active scrape status and last execution summary.
  - `GET /api/calendar/export.ics`: Generates standard RFC 5545 iCalendar stream for direct import into Google, Apple, and Outlook calendars.
- **Security Middleware**: Helmet headers, strict CORS, body size caps (100kb), and rate limiting.
- **Background Cron**: Automated daily scheduled scraping via `node-cron`.
- Total test suite: 37 passing unit & integration tests.

### Phase 4: Frontend Calendar & List UI (Completed)
- **Interactive Calendar Grid**: Responsive monthly view with day counters, platform badges, today highlighter, and month navigation (`CalendarView`).
- **Timeline / Countdown View**: Chronological upcoming releases with live countdowns (*"In 14 days"*, *"Released today"*), developer, and genre tags (`TimelineView`).
- **Filter & Search Engine**: Real-time filtering by platform pills (PC, PS5, Xbox Series X/S, Switch), search bar, and year selector (`FilterBar`).
- **Release Details Modal**: Comprehensive synopsis, publisher, developer, platform tags, and direct source link (`GameModal`).
- **Responsive Header & Sync**: Live scraper sync trigger with status indicators and quick export button (`Navbar`).

### Phase 5: Production Integration, Packaging & Documentation (Completed)
- **Static Asset Serving**: Configured Express server to serve built React frontend in production for single-process deployment.
- **Comprehensive Documentation**: Published complete [README.md](file:///Users/rafaelponzio/Workspace/release-games-tracker/README.md) with API reference, setup, and architecture specs.
- **Verification**: Verified 100% build passes and all 39 tests passing across workspaces (`npm test --workspaces`).

### Scraper Enhancement & Authoritative Date Ingestion (Completed)
- **Authoritative Infobox Ingestion**: Built [`WikipediaInfoboxScraper`](file:///Users/rafaelponzio/Workspace/release-games-tracker/packages/server/src/scraper/infobox-scraper.ts) to parse game article infoboxes directly, discovering confirmed exact dates (e.g. **Grand Theft Auto VI** on **November 19, 2026**; **Fable** on **February 23, 2027**). Documented in ADR 007.
- **Dynamic Header & Colspan Parser**: Upgraded [`WikipediaGameScraper`](file:///Users/rafaelponzio/Workspace/release-games-tracker/packages/server/src/scraper/wikipedia-scraper.ts) to parse granular tables from `List_of_video_games_released_in_${year}`.
- **Comprehensive 2026 Ingestion**: Ingested all quarterly schedules from Wikipedia, populating **1,291 verified releases for 2026**, including **140 games in October 2026 alone** (e.g. *Call of Duty: Modern Warfare 4*, *Castlevania: Belmont's Curse*, *Final Fantasy Resonance*, *Planet Zoo 2*, *Phantom Blade Zero*, *Resident Evil*, etc.).
- **Calendar Day Precision**: Calendar grid now only pins games with `precision: 'exact'` to day cells, placing seasonal/quarterly windows into the tentative banner.
- **Test Suite**: Expanded to 40 passing automated tests.

### Autonomous Scraper Pipeline & Multi-Year Automation (Completed)
- **Zero-Manual Scraping Pipeline**:
  - **Startup Auto-Seed**: On launch, the server automatically checks surrounding years (`currentYear - 1`, `currentYear`, `currentYear + 1`) and non-blockingly populates missing years from Wikipedia.
  - **On-Demand Auto-Heal**: Querying an unpopulated year automatically triggers a background sync job.
  - **Daily Scheduled Cron**: Automatically syncs current and upcoming year every night at 3:00 AM.
- **Multi-Year Data Coverage**:
  - Ingested 2025 releases (1,051 games), bringing the database to **2,214 total games**.
  - Populated Switch 2 and major franchise titles including *The Legend of Zelda: Ocarina of Time* (Nov 5, 2026), *The Legend of Zelda: Breath of the Wild – Switch 2 Edition* (June 5, 2025), and *The Legend of Zelda: Tears of the Kingdom – Switch 2 Edition* (June 5, 2025).
- **Frontend Reactive Auto-Reload & Status Feedback**:
  - Added reactive pollers and state hooks (`prevSyncingRef`) that auto-refresh the games list immediately when background sync finishes.
  - Added live sync progress banner indicating active Wikipedia ingestion and upcoming auto-refresh.
  - Fixed calendar year tracking so changing the year filter automatically updates the calendar view date.
- **Scraper Quality & Junk Table Filtering**:
  - Table classification filter in `WikipediaGameScraper` skips non-release tables (abbreviation legends, compilation summaries) to eliminate false positives.

### Calendar UX & Day Releases Modal (Completed)
- **Full Day Releases View (`DayReleasesModal`)**:
  - Days with more than 3 releases now display a clickable button `+{N} mais (ver todos)` and clickable count badges.
  - Clicking any day count badge, `+N mais` button, or day header opens a comprehensive modal listing all releases for that date with platform badges, genre tags, developer info, internal search filter, and direct details navigation.
- **Persistent Calendar Month State**:
  - Lifted `calendarDate` state to parent (`App.tsx`) so applying search queries or platform filters keeps the user on their currently viewed month.
  - Eliminated full-view unmounting during background search/filtering, replacing screen flashes with a subtle floating update indicator.

### Vercel Serverless Deployment (Completed)
- **Production Serverless Architecture**:
  - Configured `vercel.json` with client static output from `packages/client/dist` and API function via `api/index.ts`.
  - Refactored `packages/server/src/index.ts` to export `app` at module level and conditionally gate `app.listen()`, auto-seed, and background cron when running on `process.env.VERCEL`.
  - Added root `type: module` and server `main: dist/index.js` for clean ESM module resolution in Vercel runtime.
  - Configured asset bundling to include seed `data/games.json`.
  - Successfully deployed to `https://release-games-tracker.vercel.app`.

### Mobile Responsiveness & Touch Optimization (Completed)
- **Mobile Calendar Matrix & Day Agenda (`CalendarView`)**:
  - Responsive dual-layout: compact date matrix for mobile (`block md:hidden`) alongside desktop grid (`hidden md:block`).
  - Mobile date matrix shows release dot indicators and day badges, with a selected day agenda list below showing full game cards with touch-friendly tap targets.
  - Optimized rendering with `useMemo` for day game indexing.
- **Compact Navbar (`Navbar`)**:
  - Streamlined branding and icon-only actions on small screens to prevent header wrapping.
  - Optimized touch targets and spacing for mobile devices.
- **Stacked Filter Bar (`FilterBar`)**:
  - Stacked mobile layout with horizontally scrollable platform filter chips.
  - Localized filter labels to Portuguese (*Todos*, *Busca*, etc.).

### Live Search Autocomplete & Jump-to-Date Navigation (Completed)
- **Live Search Autocomplete (`FilterBar`)**:
  - Typeahead dropdown activates dynamically while typing with debounced global querying (`searchGamesGlobal`).
  - Displays game title, formatted release date with status badge (*Data Confirmada* for exact releases), platform badges, and developer.
  - Keyboard accessibility: arrow keys (`↑` / `↓`) to navigate suggestions, `Enter` to select, `Esc` to close.
  - Dedicated clear button (`✕`) and live loading spinner (`Loader2`).
- **Instant Date Navigation & Multi-Year Sync (`App.tsx`)**:
  - Selecting any game in the search dropdown immediately parses its release precision and date.
  - Automatically switches the selected year and calendar month/day directly to the game's release date.
  - Automatically switches view mode to **Calendar**.
  - Opens the comprehensive game detail card (`GameModal`).
- **Visual Game Highlighting (`CalendarView`)**:
  - Highlighted game and day cell receive a glowing purple pulse ring (`animate-pulse`, `ring-2 ring-purple-500`) on both desktop and mobile views.
  - On mobile, automatically sets the selected agenda day to the game's launch date so the card is directly visible beneath the calendar matrix.
- **Backend Limit Parameter**:
  - Added optional `limit` parameter to `GamesQuerySchema`, `GameFilter`, and `InMemoryGameRepository` to optimize search payload size.

### IGDB Integration & Multi-Source Architecture (Completed)
- **Twitch IGDB Adapter (`IgdbService`)**:
  - Implemented client credentials OAuth flow with automated token caching and expiration buffer.
  - Queries IGDB Apicalypse API for future and tentative releases (2027+), including high-res box art covers (`t_cover_big`), involved companies (developers and publishers), and release date categories.
  - Mapped IGDB platform IDs and aliases (`PC (Microsoft Windows)`, `Xbox Series X|S`, etc.) to `StandardPlatform`.
  - Added endpoint `POST /api/scraper/sync-igdb` and startup auto-sync hook for 2027.
- **Secure Secret Handling**:
  - Configured server to load credentials safely from `.env.local` or `.env` without exposing keys to git.
  - Added `.env.example` template.


