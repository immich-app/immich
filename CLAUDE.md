# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Immich is a self-hosted photo and video management solution. It's a monorepo managed with **pnpm workspaces** containing:

- **server/** — NestJS 11 backend (TypeScript) — package name: `immich`
- **web/** — SvelteKit frontend with Svelte 5 (TypeScript) — package name: `immich-web`
- **mobile/** — Flutter/Dart app with Riverpod state management
- **machine-learning/** — Python FastAPI service (CLIP, facial recognition, OCR via ONNX Runtime)
- **cli/** — Node.js CLI (`@immich/cli`)
- **open-api/** — OpenAPI spec and generated SDKs (`@immich/sdk`)
- **e2e/** — End-to-end tests (Playwright + Vitest)

## Common Commands

### Development Environment

```bash
make dev                # Start full dev stack (Docker Compose)
make dev-update         # Rebuild and start dev stack
make e2e                # Run E2E test stack
```

### Building

```bash
make build-server       # Build server (NestJS)
make build-web          # Build web (SvelteKit) — depends on SDK
make build-sdk          # Build TypeScript SDK
make build-cli          # Build CLI — depends on SDK
```

### Testing

```bash
# Server
cd server
pnpm test                                    # Run all unit tests (vitest)
pnpm test -- --run src/services/album.service.spec.ts  # Run a single test file
pnpm test:cov                                # Unit tests with coverage
pnpm test:medium                             # Medium tests (require DB via Docker)

# Web
cd web
pnpm test                                    # Run all unit tests (vitest)
pnpm test -- --run src/lib/components/MyComponent.spec.ts  # Single test file

# E2E
cd e2e
pnpm test                                    # API tests (vitest)
pnpm test:web                                # Playwright web tests
```

### Linting & Formatting

```bash
# Per-module (from repo root)
make lint-server        # ESLint with --fix
make lint-web
make format-server      # Prettier --write
make format-web
make check-server       # TypeScript type check (tsc --noEmit)
make check-web          # svelte-check + tsc --noEmit

# All modules
make lint-all
make format-all
make check-all
```

### Code Generation

```bash
make open-api              # Regenerate all OpenAPI clients (Dart + TypeScript)
make open-api-typescript   # Regenerate TypeScript SDK only
make open-api-dart         # Regenerate Dart client only
make sql                   # Sync SQL query documentation from decorated repositories
```

### Database Migrations (server/)

```bash
pnpm migrations:generate   # Auto-generate migration from schema changes
pnpm migrations:run        # Apply pending migrations
pnpm migrations:revert     # Rollback last migration
pnpm schema:reset          # Drop and recreate schema (destructive)
```

## Architecture

### Server (NestJS)

- **Workers**: Three worker types run as separate processes — API (HTTP), Microservices (background jobs), Maintenance
- **ORM**: Kysely (type-safe SQL query builder, NOT TypeORM). Schema defined in `server/src/schema/tables/`
- **Job Queue**: BullMQ with Redis for async tasks (thumbnails, encoding, ML, etc.)
- **Services**: All domain services extend `BaseService` (in `src/services/base.service.ts`) which provides access to ~40 injected repositories
- **Repositories**: Data access layer in `src/repositories/` with typed Kysely queries. Methods decorated with `@GenerateSqlQueries` get auto-documented
- **Controllers**: HTTP endpoints in `src/controllers/` with DTOs in `src/dtos/`
- **Middleware**: Auth guards, error interceptors, file upload handling in `src/middleware/`
- **Database**: PostgreSQL with extensions (pgvectors/vectorchord for embeddings, cube, earthdistance, pg_trgm)
- **Testing**: Vitest with `newTestService()` factory in `test/utils.ts` for auto-mocking dependencies. Medium tests use real DB via testcontainers

### Web (SvelteKit)

- **Svelte 5**: Uses `$state`, `$derived`, `$effect`, `$props` runes in newer code. Older code uses Svelte stores
- **Component library**: `@immich/ui` for shared UI primitives
- **State management patterns**:
  - **Managers** (`src/lib/managers/`): Class-based singletons using Svelte 5 runes for business logic
  - **Stores** (`src/lib/stores/`): Mix of Svelte writable stores and persisted stores
- **API client**: Generated `@immich/sdk` wrapping fetch calls
- **Real-time**: Socket.IO client for server events
- **Testing**: Vitest + @testing-library/svelte with happy-dom
- **Styling**: Tailwind CSS 4 with `@immich/ui` theme system

### Mobile (Flutter)

- **State management**: Riverpod (hooks_riverpod)
- **Local DB**: Isar with Drift for migrations
- **API client**: Generated from OpenAPI (in `mobile/openapi/`)
- **Navigation**: auto_route

### Machine Learning (Python)

- **Framework**: FastAPI with Gunicorn/Uvicorn
- **Models**: ONNX Runtime inference (CLIP, InsightFace, RapidOCR)
- **Model management**: Hugging Face Hub with local caching
- **Package manager**: uv

## Code Style

- **Formatting**: Prettier with 120 char line width, single quotes, trailing commas, semicolons
- **Imports**: Auto-organized by `prettier-plugin-organize-imports`
- **Linting**: ESLint with zero warnings policy (`--max-warnings 0`)
- **Server imports**: No relative imports allowed — use `src/` path alias
- **TypeScript**: Strict mode in all packages
- **Async**: `no-floating-promises` and `no-misused-promises` enforced everywhere

## OpenAPI Workflow

When server API endpoints change:
1. Build server: `cd server && pnpm build`
2. Regenerate specs: `pnpm sync:open-api`
3. Regenerate clients: `make open-api` (generates both TypeScript SDK and Dart client)

The TypeScript SDK uses `oazapfts` for generation. The Dart client uses OpenAPI Generator with custom mustache templates and patches.
