# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Immich is a high-performance, self-hosted photo and video management solution. It's a PNPM monorepo with multiple components:

- **server/** - NestJS backend (TypeScript) - package name: `immich`
- **web/** - SvelteKit frontend (Svelte 5) - package name: `immich-web`
- **mobile/** - Flutter app (Dart) - uses FVM for version management
- **machine-learning/** - Python ML service (uv package manager)
- **cli/** - TypeScript CLI tool - package name: `@immich/cli`
- **open-api/typescript-sdk/** - Auto-generated SDK - package name: `@immich/sdk`
- **e2e/** - End-to-end tests - package name: `immich-e2e`

## Essential Commands

### Development Environment

```bash
# Start full stack with Docker Compose (hot-reload enabled)
make dev

# Stop development environment
make dev-down

# Rebuild with changes
make dev-update
```

### Running Tests

```bash
# Server unit tests
make test-server
# or: pnpm --filter immich run test

# Web unit tests
make test-web
# or: pnpm --filter immich-web run test

# CLI tests
make test-cli

# Run a single test file (server)
pnpm --filter immich run test -- path/to/file.spec.ts

# Run a single test file (web)
pnpm --filter immich-web run test -- path/to/file.spec.ts

# Integration tests (requires docker)
make test-medium-dev

# E2E tests
make test-e2e
```

### Code Quality

```bash
# Format and lint all packages
make format-all
make lint-all

# Type checking
make check-all

# Single package (server example)
pnpm --filter immich run format:fix
pnpm --filter immich run lint:fix
pnpm --filter immich run check

# Web package
pnpm --filter immich-web run check:svelte
pnpm --filter immich-web run check:typescript
```

### Building

```bash
# Build all packages
make build-all

# Build specific package (sdk must be built first for cli/web)
make build-sdk
make build-server
make build-web
make build-cli
```

### OpenAPI / SDK Generation

```bash
# Regenerate all OpenAPI specs and SDKs
make open-api

# TypeScript SDK only
make open-api-typescript

# Dart SDK only (mobile)
make open-api-dart
```

### Database

```bash
# Sync SQL schema
make sql
# or: pnpm --filter immich run sync:sql

# Generate migration (after entity changes)
pnpm --filter immich run migrations:generate
```

## Architecture

### Backend (server/)

- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL with Kysely ORM (type-safe SQL)
- **Cache/Queue**: Redis with BullMQ for job processing
- **API**: OpenAPI/Swagger auto-generated specs
- **Structure**:
  - `src/controllers/` - API endpoints
  - `src/services/` - Business logic
  - `src/repositories/` - Data access layer
  - `src/entities/` - Database models
  - `src/dtos/` - Request/response schemas

### Frontend (web/)

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **UI Components**: @immich/ui library
- **Testing**: Vitest with @testing-library/svelte
- **Structure**:
  - `src/routes/` - Page components
  - `src/lib/` - Reusable logic and components

### Mobile (mobile/)

- **Framework**: Flutter with Dart
- **Architecture**: MVVM with Riverpod state management
- **Local DB**: Isar Database
- **Linting**: DCM (Dart Code Metrics)
- **Commands** (from mobile/ directory):
  - `make build` - Generate files with build_runner
  - `make analyze` - Static analysis
  - `make format` - Format code
  - `make test` - Run tests

### SDK Generation Flow

When API endpoints change:
1. Server decorators (`@nestjs/swagger`) define the API
2. Running `make open-api` generates `open-api/immich-openapi-specs.json`
3. SDKs auto-generated: `open-api/typescript-sdk/` and `mobile/openapi/`

## PR Checklist

Before submitting:

**Server**: `pnpm --filter immich run check:all` (runs lint, format, check, test)

**Web**: `pnpm --filter immich-web run check:all` (runs lint, format, check:svelte, check:typescript, test)

**Mobile**: From mobile/ directory: `make build && make analyze && make format && make test`

**If API changed**: Run `make open-api` to regenerate SDKs

**If entities changed**: Generate database migration with `pnpm --filter immich run migrations:generate`

## Web-Only Development

To develop web against the demo server (no local backend needed):

```bash
cd open-api/typescript-sdk && pnpm i && pnpm run build
cd web && IMMICH_SERVER_URL=https://demo.immich.app/ pnpm run dev
```

## Node Version

Volta-pinned to Node.js 24.11.1. Volta auto-installs the correct version.

## Workflow Orchestration

### 1. Plan Mode Default
Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
If something goes sideways, STOP and re-plan immediately - don't keep pushing
Use plan mode for verification steps, not just building
Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
Offload research, exploration, and parallel analysis to subagents
For complex problems, throw more compute at it via subagents
One task per subagent for focused execution

### 3. Self-Improvement Loop
After ANY correction from the user: update 'tasks/lessons.md' with the pattern
Write rules for yourself that prevent the same mistake
Ruthlessly iterate on these lessons until mistake rate drops
Review lessons at session start for relevant project

### 4. Verification Before Done
Never mark a task complete without proving it works
Diff behavior between main and your changes when relevant
Ask yourself: "Would a staff engineer approve this?"
Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
For non-trivial changes: pause and ask "is there a more elegant way?"
If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
Skip this for simple, obvious fixes - don't over-engineer
Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
When given a bug report: just fix it. Don't ask for hand-holding
Point at logs, errors, failing tests -> then resolve them
Zero context switching required from the user
Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles
**Simplicity First**: Make every change as simple as possible. Impact minimal code.
**No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
**Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.