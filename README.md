# 🎮 Game Releases Tracker (MVP)

A modern, secure web application to track upcoming video game releases across all major platforms with an interactive calendar, timeline countdowns, automated scraper ingestion, and standard `.ics` calendar export.

Built strictly using **Test-Driven Development (TDD)** and **Defense-in-Depth Security**.

---

## 🌟 Features

- **Interactive Calendar View**: Monthly grid with release cards, day counters, platform badges, and month navigation.
- **Chronological Timeline View**: Real-time countdowns (*"In 14 days"*, *"Released today"*), publisher/developer information, and genre badges.
- **Filter & Search Engine**: Real-time search by title, publisher, developer, and platform pills (PC, PlayStation 5, Xbox Series X/S, Nintendo Switch).
- **Automated & On-Demand Web Scraper**: Wikipedia release schedules parser (`wikitable`) handling rowspan state machines, alias platforms, and diverse date formats.
- **iCalendar (.ics) Sync**: RFC 5545 `.ics` feed endpoint (`/api/calendar/export.ics`) to export or subscribe directly to Google Calendar, Apple Calendar, or Outlook.
- **Full Release Details Modal**: Comprehensive synopsis, platform listings, and direct link to source documentation.

---

## 🛡️ Security Architecture (Defense in Depth)

1. **SSRF Guard (`UrlSecurityGuard`)**:
   - Strict HTTPS enforcement.
   - Domain whitelisting (`en.wikipedia.org`).
   - Hard blocks on loopback addresses (`127.0.0.1`, `localhost`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud link-local metadata endpoints (`169.254.169.254`).
2. **HTML Sanitization & XSS Defense**:
   - Scraped external content passes through Cheerio-based tag and script stripping before persistence and rendering.
3. **API Hardening**:
   - Schema validation with **Zod** on all request queries and bodies.
   - **Helmet** HTTP security headers.
   - **Rate Limiting** via `express-rate-limit` (300 req / 15 min).
   - Strict CORS configuration.
   - Request payload size capping (100kb limit).
4. **Data Integrity & Concurrency**:
   - Atomic file transactions (temporary write + atomic rename) preventing data corruption.
   - Mutex lock preventing concurrent overlapping scraping executions (returns 409 Conflict).
5. **Zero Vulnerability Dependency Baseline**:
   - Verified with clean `npm audit` (0 vulnerabilities).

---

## 🏗️ Project Architecture

```
release-games-tracker/
├── DECISIONS.md                   # Architecture Decision Records (ADRs)
├── CHANGELOG.md                   # Detailed activity & milestone history
├── packages/
│   ├── server/                    # Node.js + Express + Scraper + SQLite/JSON
│   │   ├── data/games.json        # Persistent games database
│   │   ├── src/
│   │   │   ├── domain/            # Core models (Game, Platform, ReleaseDate)
│   │   │   ├── repository/        # Hexagonal ports & adapters (File, InMemory)
│   │   │   ├── scraper/           # SSRF Guard & Wikipedia Parser
│   │   │   ├── services/          # Scraper & iCal export services
│   │   │   ├── api/               # Express app, Zod schemas, routes
│   │   │   └── utils/             # Sanitizer & slugifier
│   │   └── tests/                 # Vitest & Supertest test suites (37 tests)
│   └── client/                    # React 18 + Vite + Tailwind CSS
│       ├── src/
│       │   ├── components/        # Navbar, CalendarView, TimelineView, FilterBar, GameModal
│       │   ├── services/          # API client
│       │   └── types.ts           # Shared TypeScript definitions
│       └── tests/                 # Vitest client tests (2 tests)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ LTS)
- npm (v10+)

### 1. Installation
```bash
npm install
```

### 2. Run Tests (TDD Suite)
Run all 39 unit and integration tests across server and client workspaces:
```bash
npm test --workspaces
```

### 3. Development Mode
Run both backend API and frontend Vite dev server concurrently:
```bash
# Terminal 1: Start backend server (http://localhost:3001)
npm run dev --workspace=@tracker/server

# Terminal 2: Start frontend dev server (http://localhost:3000)
npm run dev --workspace=@tracker/client
```

### 4. Production Build & Execution
```bash
# Build both workspaces
npm run build --workspaces

# Start unified production server (serves API & React UI on http://localhost:3001)
npm start --workspace=@tracker/server
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck and server timestamp | — |
| `GET` | `/api/games` | Filter and list games | `search`, `platform`, `year`, `month`, `startDate`, `endDate` |
| `GET` | `/api/games/:id` | Get single game by ID or slug | — |
| `POST` | `/api/scraper/sync` | Trigger on-demand Wikipedia sync | `{ "year": 2026 }` |
| `GET` | `/api/scraper/status` | Current sync running state & log | — |
| `GET` | `/api/calendar/export.ics` | Download RFC 5545 iCalendar feed | — |

---

## 📜 Documentation & History
- [DECISIONS.md](DECISIONS.md): Architectural Decision Records (ADRs 001–006).
- [CHANGELOG.md](CHANGELOG.md): Complete chronological development work log.
