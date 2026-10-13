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




