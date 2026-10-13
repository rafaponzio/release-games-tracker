# Architecture Decision Records (ADRs)

This document tracks all significant architectural, security, and design decisions made throughout the project lifecycle.

---

## ADR 001: Monorepo Architecture with NPM Workspaces
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: The application requires a backend API, a background scraper/scheduler, and an interactive web calendar UI.
- **Decision**: Use a lightweight npm workspaces structure (`packages/server` and `packages/client`).
- **Rationale**: Keeps server domain models, scrapers, and client code co-located without complex monorepo tooling overhead (like Nx or Turborepo) for the MVP stage, while ensuring clean separation of concerns.
- **Consequences**: Easy unified script execution (`npm test --workspaces`), shared types where needed, independent testing.

---

## ADR 002: Test-Driven Development (TDD) with Vitest
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: High quality, maintainability, and regression resistance are required for both domain logic and scraper parsing.
- **Decision**: Adopt Vitest with Supertest for API and domain testing, following the Red-Green-Refactor cycle.
- **Rationale**: Vitest provides native TypeScript and ESM execution, instant startup, compatibility with Jest APIs, and excellent fixture support for testing HTML parsing offline.
- **Consequences**: HTML response fixtures will be saved locally for scrapers; tests do not make live external HTTP calls during automated test suites.

---

## ADR 003: Defense-in-Depth Security for Web Scraping & APIs
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: Web scrapers and public APIs face SSRF (Server-Side Request Forgery), XSS from untrusted parsed HTML, and DoS/abuse risks.
- **Decision**:
  1. Strict SSRF protection: Whitelist allowed scraping hostnames and ban private/loopback IP address ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
  2. Input & Output sanitization: Use Zod for schema validation on all inputs; sanitize scraped text (titles, descriptions) to strip executable scripts/tags before saving and rendering.
  3. Polite Crawler: Respect robots.txt, set distinct User-Agent header, adhere to rate limits and exponential backoff.
  4. API Security: Helmet headers, strict CORS, and rate limiting middleware.
- **Rationale**: Prevents common OWASP Top 10 vulnerabilities at the architecture layer.

---

## ADR 004: Dependency Hardening & Zero-Vulnerability Policy
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: Initial dependency graph revealed moderate to critical vulnerabilities in transitive packages (prototype pollution in tinypool/vitest, DoS in braces/chokidar, buffer bounds in uuid).
- **Decision**: Update direct dependencies and apply security overrides to achieve 0 vulnerabilities on `npm audit`.
- **Rationale**: Maintain a zero-vulnerability baseline from day one, preventing supply-chain and runtime exploits.

---

## ADR 005: Resilient Scraper Engine with SSRF & HTML Defense
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: Scraping external game releases requires parsing messy HTML tables with rowspan month/day headers while guarding against SSRF and malicious content.
- **Decision**:
  1. Implemented `UrlSecurityGuard` enforcing HTTPS, strict domain whitelisting, and blocking RFC 1918 private subnets and link-local metadata IPs.
  2. Implemented `WikipediaGameScraper` with Cheerio table parser handling rowspan state machines, alias platforms, and diverse date formats.
  3. Integrated `ScraperService` for atomic bulk upserting and real-time execution status tracking.
- **Rationale**: Keeps ingestion isolated, highly resilient to structure changes, and secure against untrusted inputs.

---

## ADR 006: Hardened REST API & RFC 5545 iCalendar Synchronization
- **Date**: 2026-10-07
- **Status**: Accepted
- **Context**: Clients and personal calendar applications require clean query APIs and standard export formats.
- **Decision**:
  1. Express API with strict input validation using Zod for query parameters and mutation bodies.
  2. Applied Helmet, CORS, and rate limiting to prevent DoS attacks.
  3. Implemented `CalendarExportService` generating RFC 5545 `.ics` feeds for native import into Google Calendar, Apple Calendar, and Outlook.
  4. Scheduled automated periodic scraping via `node-cron`.
- **Rationale**: Provides standard, accessible interoperability with calendar ecosystems while maintaining zero-trust API boundaries.



