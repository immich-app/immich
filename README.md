# Core Monorepo

A full-stack monorepo template with **NestJS** (server), **SvelteKit** (web), and **Flutter** (mobile), powered by **pnpm workspaces**.

## Architecture

```
server/       NestJS REST API with PostgreSQL + Redis
web/          SvelteKit frontend (static adapter)
mobile/       Flutter mobile app
e2e/          End-to-end tests (Vitest + Playwright)
open-api/     OpenAPI spec generation & TypeScript SDK
i18n/         Internationalization strings
docker/       Docker Compose for local development
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Postgres + Redis
make dev

# Or individually:
make dev-down     # Stop services
make build-server # Build NestJS server
make build-web    # Build SvelteKit app
make open-api     # Regenerate OpenAPI spec & SDK
```

## Development

| Command | Description |
|---------|-------------|
| `make dev` | Start Docker services + web + server |
| `make dev-down` | Stop all services |
| `make build-server` | Build the NestJS server |
| `make build-web` | Build the SvelteKit web app |
| `make open-api` | Regenerate OpenAPI spec & SDKs |
| `make test-server` | Run server unit tests |
| `make test-e2e` | Run end-to-end tests |
| `make lint-server` | Lint the server |
| `make lint-web` | Lint the web app |
| `make clean` | Remove containers, volumes, node_modules |

## Stack

- **Server**: NestJS, Kysely (query builder), PostgreSQL 18, Redis
- **Web**: SvelteKit 2, Svelte 5, TailwindCSS, @immich/ui
- **Mobile**: Flutter / Dart
- **API**: Auto-generated OpenAPI spec with TypeScript SDK via oazapfts
- **Auth**: JWT (access + refresh tokens), API keys, session management
- **i18n**: svelte-i18n with English base locale
