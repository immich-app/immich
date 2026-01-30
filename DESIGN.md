# Immich on Cloudflare Workers — Design Document

## Overview

This document describes the architecture for porting Immich (an open-source Google Photos alternative) from its current NestJS/PostgreSQL/Redis/Docker stack to run entirely on Cloudflare's platform: Workers for compute, D1 for the database, R2 for file storage, KV for caching, Queues for background jobs, and Workers Static Assets for the frontend.

The goal is a simplified, self-contained deployment with no Docker, no VMs, and no external services. We strip out machine learning, video transcoding, email, OAuth, and other heavyweight features to arrive at a focused photo management platform.

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Infrastructure Mapping](#2-infrastructure-mapping)
3. [Removal Catalog](#3-removal-catalog)
4. [What We Keep](#4-what-we-keep)
5. [Component Design](#5-component-design)
6. [Database Migration (PostgreSQL → D1)](#6-database-migration-postgresql--d1)
7. [File Storage (Filesystem → R2)](#7-file-storage-filesystem--r2)
8. [Background Jobs (BullMQ → Queues)](#8-background-jobs-bullmq--queues)
9. [Caching (Redis → KV)](#9-caching-redis--kv)
10. [Frontend (SvelteKit Static Assets)](#10-frontend-sveltekit-static-assets)
11. [Authentication](#11-authentication)
12. [API Layer (NestJS → Hono)](#12-api-layer-nestjs--hono)
13. [Implementation Plan](#13-implementation-plan)
14. [Cloudflare Limits and Constraints](#14-cloudflare-limits-and-constraints)

---

## 1. Architecture Decisions

### Decision: Drop NestJS, use Hono
**Why**: NestJS relies on decorators, reflect-metadata, Express/Fastify, and a heavyweight dependency injection container — none of which are necessary or efficient on Cloudflare Workers. Hono is a lightweight, Workers-native TypeScript framework with middleware, routing, and Zod integration built in. It has first-class Cloudflare Workers support.

### Decision: Use Zod for validation (not class-validator)
**Why**: The current codebase uses 47 DTO files with `class-validator` decorators, which require `reflect-metadata` and NestJS's `ValidationPipe`. Since we're dropping NestJS, we replace these with Zod schemas. Zod is TypeScript-native, works everywhere, infers types automatically, and integrates cleanly with Hono via `@hono/zod-validator`.

### Decision: Remove machine learning entirely
**Why**: ML features (CLIP search, facial recognition, OCR, duplicate detection) require a separate Python service running ONNX models on GPU. This is fundamentally incompatible with the serverless model. Smart search becomes metadata/text-based only. If ML is desired later, it can be re-added as an external service or via Cloudflare Workers AI.

### Decision: Remove video transcoding entirely
**Why**: FFmpeg cannot run on Workers. Modern phone cameras produce H.264/H.265 MP4 that browsers play natively. Videos are stored and served as-is from R2. If a format doesn't play in the browser, it doesn't play.

### Decision: Remove email notifications entirely
**Why**: Eliminates nodemailer, SMTP config, React Email templates, and the entire notification pipeline. Album sharing and user invites work without email — users share links or manage access through the UI directly.

### Decision: Remove OAuth/OpenID Connect, keep password-only auth
**Why**: The `openid-client` package uses Node.js-specific APIs. OAuth adds significant complexity (PKCE flows, provider discovery, token exchange). Password + JWT auth is sufficient for a self-hosted photo app and works cleanly on Workers.

### Decision: Remove library filesystem watching
**Why**: Library watching uses `chokidar` to monitor local filesystem paths for new photos. There is no local filesystem on Workers. Photos are uploaded via the API or mobile app, not discovered from mounted directories.

### Decision: Remove sidecar/XMP file handling
**Why**: XMP sidecars are a professional photography workflow feature. For a focused photo management app, metadata lives in the database. Reduces complexity significantly.

### Decision: Remove workflows/plugins system
**Why**: The workflow and plugin system is new, incomplete, and adds architectural complexity. Not needed for core photo management.

### Decision: Frontend stays fully static, no conversion needed
**Why**: The SvelteKit frontend already uses `@sveltejs/adapter-static` and builds to plain HTML/JS/CSS. Cloudflare Workers Static Asset Routing serves these files directly from the edge. Zero code changes needed in the web app.

### Decision: Use Cloudflare Queues (not Cron Triggers) for background jobs
**Why**: The current system has 17 BullMQ queues with 90+ job types. After stripping ML, video, email, and other removed features, we're left with ~8-10 essential job types. Cloudflare Queues handles these with automatic retries and batching. Cron Triggers supplement this for scheduled nightly cleanup tasks.

### Decision: WebSocket via Durable Objects (deferred)
**Why**: The current Socket.IO setup provides real-time notifications (upload progress, config changes). This is a nice-to-have. The initial implementation uses polling. WebSocket support via Durable Objects can be added later.

---

## 2. Infrastructure Mapping

| Current Stack | Cloudflare Replacement | Binding Name |
|---|---|---|
| PostgreSQL + Kysely | D1 (SQLite) + Kysely SQLite dialect | `DB` |
| Redis + BullMQ (job queues) | Cloudflare Queues | `QUEUE` |
| Redis (caching) | Workers KV | `KV` |
| Redis (Socket.IO pub/sub) | Deferred (polling initially) | — |
| Local filesystem (media) | R2 object storage | `MEDIA_BUCKET` |
| NestJS + Express | Hono | — |
| Sharp (image processing) | Cloudflare Image Resizing | via `fetch()` with `cf.image` |
| FFmpeg (video) | Removed | — |
| ONNX ML models | Removed | — |
| nodemailer (email) | Removed | — |
| Socket.IO (WebSocket) | Deferred (Durable Objects later) | — |
| Prometheus + OpenTelemetry | Cloudflare Analytics Engine | `ANALYTICS` |
| Docker Compose | `wrangler.toml` | — |
| SvelteKit (served by Express) | Workers Static Assets | `ASSETS` |

---

## 3. Removal Catalog

Everything listed below is deleted from the codebase.

### 3.1 — Top-Level Directories to Delete

| Directory | Reason |
|---|---|
| `machine-learning/` | Entire Python ML service (CLIP, faces, OCR) |
| `mobile/` | Flutter mobile app (already stripped by user, confirm removal) |
| `cli/` | CLI tool (not applicable to Workers) |
| `docker/` | Docker Compose files, Dockerfiles |
| `deployment/` | Terraform/Terragrunt IaC |
| `e2e/` | End-to-end tests (will need rewriting) |
| `e2e-auth-server/` | Auth test server |
| `fastlane/` | Mobile build automation |

### 3.2 — Server Files to Delete: Machine Learning

| File | What It Does |
|---|---|
| `server/src/repositories/machine-learning.repository.ts` | HTTP client to ML Python service |
| `server/src/repositories/ocr.repository.ts` | OCR data persistence |
| `server/src/repositories/search.repository.ts` | Vector/semantic search queries |
| `server/src/repositories/person.repository.ts` | Face/person data persistence |
| `server/src/repositories/duplicate.repository.ts` | Duplicate detection data |
| `server/src/services/smart-info.service.ts` | CLIP embedding generation |
| `server/src/services/ocr.service.ts` | OCR text extraction orchestration |
| `server/src/services/search.service.ts` | Smart search (vector similarity) |
| `server/src/services/person.service.ts` | Facial recognition pipeline |
| `server/src/services/duplicate.service.ts` | Duplicate photo detection |
| `server/src/controllers/face.controller.ts` | Face management API |
| `server/src/controllers/search.controller.ts` | Smart search API |
| `server/src/controllers/person.controller.ts` | Person/face API |
| `server/src/controllers/duplicate.controller.ts` | Duplicate management API |
| `server/src/dtos/search.dto.ts` | Smart search request/response types |
| `server/src/dtos/model-config.dto.ts` | ML model configuration types |
| `server/src/dtos/person.dto.ts` | Person/face types |
| `server/src/dtos/duplicate.dto.ts` | Duplicate types |
| `server/src/dtos/ocr.dto.ts` | OCR types |
| `server/src/schema/tables/smart-search.table.ts` | CLIP embedding table (vector column) |
| `server/src/schema/tables/face-search.table.ts` | Face embedding table (vector column) |
| `server/src/schema/tables/asset-ocr.table.ts` | OCR extracted text |
| `server/src/schema/tables/ocr-search.table.ts` | OCR full-text search |
| All `*spec.ts` files for the above | Unit tests for removed code |

### 3.3 — Server Files to Delete: Video Transcoding

| File | What It Does |
|---|---|
| `server/src/repositories/media.repository.ts` | FFmpeg wrapper (probe, transcode, frame count) |
| `server/src/services/media.service.ts` | Video transcoding orchestration |
| `server/src/utils/media.ts` | FFmpeg argument builder, codec config |

**Note**: `asset-media.service.ts` and `asset-media.controller.ts` handle upload/download of all assets (photos AND videos). These are **kept** but stripped of transcoding-related code paths.

### 3.4 — Server Files to Delete: Email/Notifications

| File | What It Does |
|---|---|
| `server/src/emails/` (entire directory) | React Email templates (album invite, welcome, etc.) |
| `server/src/repositories/email.repository.ts` | SMTP email sending via nodemailer |
| `server/src/repositories/notification.repository.ts` | Notification persistence |
| `server/src/services/notification.service.ts` | Email notification orchestration |
| `server/src/services/notification-admin.service.ts` | Admin notification management |
| `server/src/controllers/notification.controller.ts` | Notification API endpoints |
| `server/src/controllers/notification-admin.controller.ts` | Admin notification API |
| `server/src/dtos/notification.dto.ts` | Notification request/response types |
| `server/src/queries/notification.repository.sql` | Notification SQL queries |

### 3.5 — Server Files to Delete: OAuth/OpenID

| File | What It Does |
|---|---|
| `server/src/repositories/oauth.repository.ts` | OpenID Connect client (discovery, PKCE, token exchange) |
| `server/src/controllers/oauth.controller.ts` | OAuth callback/redirect endpoints |
| `server/src/commands/oauth-login.ts` | CLI OAuth login command |

**Note**: `auth.service.ts` and `auth.controller.ts` are **kept** but stripped of all OAuth code paths. Password login remains.

### 3.6 — Server Files to Delete: Library Watching

| File | What It Does |
|---|---|
| `server/src/services/library.service.ts` | Library scanning, filesystem watching |
| `server/src/repositories/library.repository.ts` | Library data persistence |
| `server/src/controllers/library.controller.ts` | Library management API |
| `server/src/dtos/library.dto.ts` | Library types |
| `server/src/queries/library.repository.sql` | Library SQL queries |

### 3.7 — Server Files to Delete: Workflows/Plugins

| File | What It Does |
|---|---|
| `server/src/services/workflow.service.ts` | Workflow execution engine |
| `server/src/services/plugin.service.ts` | Plugin lifecycle management |
| `server/src/repositories/workflow.repository.ts` | Workflow data persistence |
| `server/src/repositories/plugin.repository.ts` | Plugin data persistence |
| `server/src/controllers/workflow.controller.ts` | Workflow API |
| `server/src/controllers/plugin.controller.ts` | Plugin API |
| `server/src/dtos/workflow.dto.ts` | Workflow types |
| `server/src/dtos/plugin.dto.ts` | Plugin types |
| `server/src/dtos/plugin-manifest.dto.ts` | Plugin manifest types |
| `server/src/schema/tables/workflow.table.ts` | Workflow database tables |
| `server/src/queries/workflow.repository.sql` | Workflow SQL queries |
| `server/src/queries/plugin.repository.sql` | Plugin SQL queries |

### 3.8 — Server Files to Delete: Telemetry/Metrics

| File | What It Does |
|---|---|
| `server/src/repositories/telemetry.repository.ts` | OpenTelemetry/Prometheus data collection |
| `server/src/services/telemetry.service.ts` | Telemetry orchestration |

### 3.9 — Server Files to Delete: Sidecar/XMP

Sidecar handling is embedded in `metadata.service.ts` and `asset.service.ts`. These services are kept but sidecar code paths are removed. The `Sidecar` queue and all `SidecarQueueAll`, `SidecarCheck`, `SidecarWrite` jobs are removed.

### 3.10 — Server Files to Delete: Other Removed Features

| File | What It Does | Reason |
|---|---|---|
| `server/src/services/memory.service.ts` | "On this day" memories | Nice-to-have, can add later |
| `server/src/repositories/memory.repository.ts` | Memory persistence | Paired with memory service |
| `server/src/dtos/memory.dto.ts` | Memory types | Paired with memory service |
| `server/src/services/map.service.ts` | Map view with reverse geocoding | Requires earthdistance extension |
| `server/src/repositories/map.repository.ts` | Geospatial queries | Requires cube/earthdistance |
| `server/src/dtos/map.dto.ts` | Map types | Paired with map service |
| `server/src/services/backup.service.ts` | Database backup to filesystem | Not applicable (D1 has its own backup) |
| `server/src/services/database-backup.service.ts` | Backup orchestration | Not applicable |
| `server/src/dtos/database-backup.dto.ts` | Backup types | Not applicable |
| `server/src/services/cli.service.ts` | CLI command handling | No CLI on Workers |
| `server/src/services/storage-template.service.ts` | Filesystem path templates | Not applicable (R2 uses keys) |
| `server/src/services/version.service.ts` | Version update checking | Not applicable for Workers deployment |
| `server/src/repositories/version-history.repository.ts` | Version history | Paired with version service |

### 3.11 — Server Files to Delete: NestJS Infrastructure

These are the NestJS framework files that are replaced wholesale by Hono:

| File | What It Does |
|---|---|
| `server/src/main.ts` | NestJS bootstrap, worker process spawning |
| `server/src/app.module.ts` | NestJS module definitions, DI wiring |
| `server/src/app.common.ts` | Express middleware pipeline setup |
| `server/src/database.ts` | NestJS database module |
| `server/src/plugins.ts` | NestJS plugin loader |
| `server/src/decorators.ts` | Custom NestJS decorators |
| `server/src/controllers/` (entire directory) | All 48 NestJS controller files |
| `server/src/middleware/auth.guard.ts` | NestJS auth guard |
| `server/src/middleware/asset-upload.interceptor.ts` | NestJS file upload interceptor |
| `server/src/middleware/error.interceptor.ts` | NestJS error interceptor |
| `server/src/middleware/file-upload.interceptor.ts` | NestJS file upload config |
| `server/src/middleware/global-exception.filter.ts` | NestJS exception filter |
| `server/src/middleware/logging.interceptor.ts` | NestJS logging interceptor |
| `server/src/middleware/websocket.adapter.ts` | Socket.IO adapter |
| `server/src/workers/api.ts` | NestJS API worker |
| `server/src/workers/microservices.ts` | NestJS microservices worker |
| `server/src/workers/maintenance.ts` | NestJS maintenance worker |
| `server/src/bin/migrations.ts` | Migration CLI tool |
| `server/src/bin/sync-open-api.ts` | OpenAPI spec generator |
| `server/src/bin/sync-sql.ts` | SQL sync tool |
| `server/src/maintenance/` (entire directory) | Maintenance worker (NestJS-specific) |
| `server/src/commands/` (entire directory) | NestJS CLI commands |

### 3.12 — Server Files to Delete: BullMQ/Redis/Socket.IO

| File | What It Does |
|---|---|
| `server/src/repositories/job.repository.ts` | BullMQ queue wrapper |
| `server/src/repositories/websocket.repository.ts` | Socket.IO gateway |
| `server/src/repositories/event.repository.ts` | NestJS event emitter |
| `server/src/repositories/app.repository.ts` | Redis pub/sub adapter |
| `server/src/repositories/cron.repository.ts` | NestJS cron scheduler |
| `server/src/services/queue.service.ts` | BullMQ queue management |
| `server/src/services/job.service.ts` | Job orchestration |
| `server/src/controllers/queue.controller.ts` | Queue admin API |
| `server/src/controllers/job.controller.ts` | Job admin API |

### 3.13 — npm Packages to Remove

| Package | Reason |
|---|---|
| `@nestjs/*` (all) | Replaced by Hono |
| `bullmq` | Replaced by Cloudflare Queues |
| `ioredis` | Replaced by KV |
| `sharp` | Replaced by Cloudflare Image Resizing |
| `fluent-ffmpeg` | Video transcoding removed |
| `exiftool-vendored` | Replaced by pure-JS EXIF parser |
| `openid-client` | OAuth removed |
| `nodemailer` | Email removed |
| `@react-email/*` | Email templates removed |
| `socket.io` / `@socket.io/redis-adapter` | Replaced by polling (Durable Objects later) |
| `chokidar` | Filesystem watching removed |
| `archiver` | Replaced by Workers-compatible ZIP |
| `multer` | Replaced by Hono multipart parsing |
| `@opentelemetry/*` (all) | Replaced by Cloudflare Analytics |
| `nest-commander` | CLI removed |
| `class-validator` / `class-transformer` | Replaced by Zod |
| `reflect-metadata` | NestJS dependency, not needed |
| `postgres` (driver) | Replaced by D1 binding |
| `express` / `@types/express` | Replaced by Hono |
| `rxjs` | NestJS dependency |

### 3.14 — Database Tables to Remove

| Table | Reason |
|---|---|
| `smart_search` | CLIP vector embeddings (ML) |
| `face_search` | Face vector embeddings (ML) |
| `asset_face` / `asset_face_audit` | Face detection (ML) |
| `person` / `person_audit` | Person/face clustering (ML) |
| `asset_ocr` | OCR text (ML) |
| `ocr_search` | OCR full-text search (ML) |
| `geodata_places` | Reverse geocoding reference data (map feature) |
| `natural_earth_countries` | Geographic reference data (map feature) |
| `library` | External library management |
| `notification` | Email notifications |
| `memory` / `memory_asset` / `memory_audit` / `memory_asset_audit` | Memories feature |
| `workflow` / `workflow_action` / `workflow_filter` | Workflow system |
| `plugin` / `plugin_action` / `plugin_filter` | Plugin system |
| `version_history` | Version tracking |

### 3.15 — Job Types to Remove

After removal, the 90+ job types collapse to the following **kept** jobs (everything else is deleted):

**Kept jobs:**
- `AssetExtractMetadata` — Parse EXIF from uploaded photos
- `AssetGenerateThumbnails` — Create thumbnail and preview images
- `AssetDelete` — Delete asset records and files from R2
- `AssetEmptyTrash` — Permanently delete trashed assets
- `FileDelete` — Delete individual files from R2
- `UserDelete` / `UserDeleteCheck` — Account deletion pipeline
- `UserSyncUsage` — Recalculate storage quotas
- `SessionCleanup` — Expire old sessions

**Removed jobs (all others), including:**
- All `*QueueAll` batch dispatch jobs
- `AssetEncodeVideo` / `AssetEncodeVideoQueueAll` — Video transcoding
- `AssetDetectFaces` / `FacialRecognition` / `FacialRecognitionQueueAll` — Face ML
- `SmartSearch` / `SmartSearchQueueAll` — CLIP embeddings
- `AssetDetectDuplicates` / `AssetDetectDuplicatesQueueAll` — Duplicate detection
- `Ocr` / `OcrQueueAll` — OCR
- `SidecarCheck` / `SidecarWrite` / `SidecarQueueAll` — XMP sidecars
- `NotifyAlbumInvite` / `NotifyAlbumUpdate` / `NotifyUserSignup` / `SendMail` — Email
- `MemoryGenerate` / `MemoryCleanup` — Memories
- `DatabaseBackup` — DB backup
- `LibraryScan*` / `LibrarySync*` / `LibraryDelete*` — Library management
- `StorageTemplateMigration*` — Storage path migration
- `FileMigration*` — File migration
- `PersonCleanup` / `PersonGenerateThumbnail` / `PersonFileMigration` — Person/face
- `WorkflowRun` — Workflows
- `VersionCheck` — Version checking
- `AuditLogCleanup` / `AuditTableCleanup` — Audit cleanup (simplify to inline)

---

## 4. What We Keep

### Core Features (preserved)
- **Photo upload and storage** — Upload photos via API or mobile app, store in R2
- **Photo browsing** — Timeline view, grid view, detail view
- **Albums** — Create, share, manage albums
- **Sharing** — Shared links (public/password-protected), partner sharing
- **Tags** — Organize photos with tags
- **Trash** — Soft delete with configurable retention, restore or permanent delete
- **User management** — Multi-user support, admin panel, storage quotas
- **Password authentication** — Login with email + password, JWT sessions, API keys
- **Thumbnail/preview generation** — Auto-generate thumbnails via Cloudflare Image Resizing
- **EXIF metadata** — Extract and display photo metadata (camera, date, GPS, etc.)
- **Basic search** — Search by filename, date range, location text, camera model, tags
- **Stacks** — Group related photos (bursts, edits)
- **Download** — Download originals individually or as ZIP

### Kept Services (server/src/services/)

| Service | Purpose |
|---|---|
| `activity.service.ts` | Activity feed for albums |
| `album.service.ts` | Album CRUD and sharing |
| `api-key.service.ts` | API key management |
| `api.service.ts` | Core API bootstrap |
| `asset.service.ts` | Asset CRUD operations (stripped of sidecar code) |
| `asset-media.service.ts` | Asset upload/download (stripped of transcode triggers) |
| `audit.service.ts` | Audit logging |
| `auth.service.ts` | Password auth + JWT (stripped of OAuth) |
| `base.service.ts` | Base service class |
| `partner.service.ts` | Partner sharing |
| `server.service.ts` | Server info/health |
| `session.service.ts` | Session management |
| `shared-link.service.ts` | Public/private link sharing |
| `stack.service.ts` | Photo stacking |
| `sync.service.ts` | Mobile sync protocol |
| `system-config.service.ts` | System configuration |
| `system-metadata.service.ts` | System metadata |
| `tag.service.ts` | Tag management |
| `timeline.service.ts` | Timeline view queries |
| `trash.service.ts` | Trash management |
| `user-admin.service.ts` | Admin user operations |
| `user.service.ts` | User profile/preferences |
| `view.service.ts` | Asset view tracking |

### Kept Repositories (to be rewritten for D1/R2/KV)

| Repository | Purpose | Rewrite Target |
|---|---|---|
| `access.repository.ts` | Permission checks | D1 |
| `activity.repository.ts` | Activity persistence | D1 |
| `album.repository.ts` | Album data | D1 |
| `album-user.repository.ts` | Album membership | D1 |
| `api-key.repository.ts` | API key storage | D1 |
| `asset.repository.ts` | Asset metadata | D1 |
| `asset-edit.repository.ts` | Edit history | D1 |
| `asset-job.repository.ts` | Job status per asset | D1 |
| `audit.repository.ts` | Audit log | D1 |
| `config.repository.ts` | System config | D1 + KV cache |
| `crypto.repository.ts` | Hashing/encryption | Web Crypto API |
| `database.repository.ts` | DB management | D1 |
| `download.repository.ts` | Streaming downloads | R2 |
| `logging.repository.ts` | Logging | `console.log` |
| `move.repository.ts` | File move tracking | D1 |
| `partner.repository.ts` | Partner relationships | D1 |
| `server-info.repository.ts` | Server info | D1 + env |
| `session.repository.ts` | Sessions | D1 |
| `shared-link.repository.ts` | Shared links | D1 |
| `shared-link-asset.repository.ts` | Shared link contents | D1 |
| `stack.repository.ts` | Stacks | D1 |
| `storage.repository.ts` | File I/O | R2 |
| `sync-checkpoint.repository.ts` | Sync state | D1 |
| `sync.repository.ts` | Sync operations | D1 |
| `system-metadata.repository.ts` | System metadata | D1 |
| `tag.repository.ts` | Tags | D1 |
| `trash.repository.ts` | Trash | D1 |
| `user.repository.ts` | Users | D1 |
| `view-repository.ts` | View tracking | D1 |

---

## 5. Component Design

### Worker Entry Point

```
src/
├── index.ts                    # Worker entry: fetch(), queue(), scheduled()
├── router.ts                   # Hono app with all route groups
├── bindings.ts                 # TypeScript types for CF bindings (DB, MEDIA_BUCKET, KV, QUEUE)
├── middleware/
│   ├── auth.ts                 # JWT verification, API key lookup, shared link auth
│   ├── validation.ts           # Zod validation middleware
│   ├── error.ts                # Global error handler
│   └── logging.ts              # Request logging
├── routes/
│   ├── auth.routes.ts          # POST /auth/login, POST /auth/signup, etc.
│   ├── asset.routes.ts         # CRUD + upload/download for assets
│   ├── album.routes.ts         # Album management
│   ├── user.routes.ts          # User profile, admin
│   ├── tag.routes.ts           # Tag management
│   ├── shared-link.routes.ts   # Shared links
│   ├── server.routes.ts        # Server info, health
│   ├── timeline.routes.ts      # Timeline queries
│   ├── trash.routes.ts         # Trash operations
│   ├── partner.routes.ts       # Partner sharing
│   ├── session.routes.ts       # Session management
│   ├── activity.routes.ts      # Activity feed
│   ├── stack.routes.ts         # Photo stacking
│   ├── sync.routes.ts          # Mobile sync
│   ├── download.routes.ts      # Download (ZIP, individual)
│   └── search.routes.ts        # Basic metadata search
├── services/                   # Business logic (ported from current, largely unchanged)
├── repositories/               # Data access (rewritten for D1/R2/KV)
├── schema/
│   ├── tables.ts               # D1 table definitions (CREATE TABLE statements)
│   ├── migrations/             # D1 migration files
│   └── types.ts                # Generated Kysely types for D1
├── validators/                 # Zod schemas (replacing DTOs)
├── jobs/
│   ├── consumer.ts             # Queue message handler (dispatches to job functions)
│   ├── thumbnails.ts           # Thumbnail generation job
│   ├── metadata.ts             # EXIF extraction job
│   ├── deletion.ts             # Asset/file deletion job
│   └── cleanup.ts              # Session/user/trash cleanup jobs
├── types/                      # TypeScript types (largely reused from current)
└── utils/                      # Helpers (largely reused from current)
```

### Worker Exports

```typescript
export default {
  // HTTP request handler — all API routes + static asset fallback
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Try API routes first, fall back to static assets
    return app.fetch(request, env, ctx);
  },

  // Queue consumer — processes background jobs
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      await processJob(message.body, env);
      message.ack();
    }
  },

  // Cron trigger — nightly cleanup tasks
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await runNightlyCleanup(env);
  },
};
```

---

## 6. Database Migration (PostgreSQL → D1)

### Type Mapping

| PostgreSQL | D1 (SQLite) | Notes |
|---|---|---|
| `uuid` | `TEXT` | Generate UUID v4 via `crypto.randomUUID()` |
| `timestamptz` | `TEXT` | ISO 8601 strings, e.g. `2024-01-15T10:30:00.000Z` |
| `jsonb` | `TEXT` | Store as JSON string, parse in application |
| `bigint` | `INTEGER` | SQLite integers are 64-bit |
| `bytea` | `BLOB` | Binary data |
| `boolean` | `INTEGER` | 0/1 |
| `real` / `double precision` | `REAL` | Floating point |
| `text[]` (arrays) | `TEXT` | JSON array string, or junction table |
| `enum` | `TEXT` | Application-level validation via Zod |
| `serial` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Auto-increment |

### PostgreSQL Features to Replace

| PostgreSQL Feature | Replacement |
|---|---|
| `gen_random_uuid()` / `uuid-ossp` | `crypto.randomUUID()` in application code |
| `immich_uuid_v7()` (timestamp UUIDs) | Application-side UUID v7 generation |
| `pg_trgm` (trigram search) | SQLite FTS5 virtual tables |
| `unaccent()` | `String.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` |
| `cube` + `earthdistance` | Haversine formula in SQL or application code |
| `NOTIFY` / `LISTEN` | Queue messages or polling |
| Advisory locks | KV-based distributed locks or D1 row-level locking |
| `FOR UPDATE SKIP LOCKED` | Queue-based job claiming (not needed with CF Queues) |
| `DISTINCT ON` | `GROUP BY` + window functions |
| `LATERAL JOIN` | Correlated subqueries |
| Trigger functions (`updated_at`, audit) | Application-level in repository methods |
| Function-based indexes | Computed/stored columns or application-side filtering |
| `RETURNING *` | Separate `SELECT` after `INSERT`/`UPDATE` |

### Kept Tables (D1 Schema)

Core tables to migrate (stripped of ML/removed-feature columns):

```
users                    — User accounts
sessions                 — Login sessions
api_keys                 — API key authentication
assets                   — Photo/video metadata (core table)
asset_files              — File references (original, thumbnail, preview)
asset_exif               — EXIF metadata
asset_edits              — Edit history
asset_job_status         — Job processing state
asset_audit              — Asset change audit
albums                   — Album metadata
album_assets             — Album-asset junction
album_users              — Album membership/sharing
album_audit              — Album change audit
album_asset_audit        — Album-asset change audit
album_user_audit         — Album membership change audit
shared_links             — Public/password-protected links
shared_link_assets       — Shared link contents
tags                     — Tag definitions (hierarchical)
tag_assets               — Tag-asset junction
tag_closure              — Tag hierarchy closure table
stacks                   — Photo stacks/groups
stack_audit              — Stack change audit
partners                 — Partner sharing relationships
partner_audit            — Partner change audit
activities               — Album activity feed
moves                    — File move tracking
user_metadata            — User preferences/settings
user_metadata_audit      — User metadata change audit
user_audit               — User change audit
system_metadata          — System-level key-value config
session_sync_checkpoints — Mobile sync state
audit                    — Legacy audit table
asset_metadata           — Additional asset metadata
asset_metadata_audit     — Metadata change audit
```

### Kysely + D1

Kysely supports SQLite via `kysely-d1` dialect. The query builder syntax is largely the same — the main changes are:
1. Replace PostgreSQL-specific raw SQL fragments
2. Use `SqliteDialect` instead of `PostgresDialect`
3. Remove vector operations
4. Replace `RETURNING` with separate queries where needed

---

## 7. File Storage (Filesystem → R2)

### Key Structure

Current filesystem paths map to R2 object keys:

| Current Path | R2 Key |
|---|---|
| `thumbnails/{userId}/{aa}/{bb}/{assetId}_thumbnail.webp` | `thumbnails/{userId}/{assetId}.webp` |
| `thumbnails/{userId}/{aa}/{bb}/{assetId}_preview.jpeg` | `previews/{userId}/{assetId}.jpeg` |
| `original/{userId}/{aa}/{bb}/{filename}` | `originals/{userId}/{assetId}/{filename}` |
| `profile/{userId}/{personId}.jpeg` | Removed (no face feature) |
| `encoded_video/{userId}/{aa}/{bb}/{assetId}.mp4` | Removed (no transcoding) |

The nested `{aa}/{bb}/` subdirectory hashing was an optimization for filesystem directory listing performance. R2 uses a flat key namespace with prefix listing, so this nesting is unnecessary.

### Storage Repository Rewrite

```typescript
// Current (Node.js fs)
await fs.promises.writeFile(path, buffer);
await fs.promises.readFile(path);
await fs.promises.rename(oldPath, newPath);
await fs.promises.stat(path);
await fs.promises.unlink(path);

// New (R2)
await env.MEDIA_BUCKET.put(key, buffer);
const obj = await env.MEDIA_BUCKET.get(key);
// No atomic rename — copy + delete
await env.MEDIA_BUCKET.put(newKey, (await env.MEDIA_BUCKET.get(oldKey)).body);
await env.MEDIA_BUCKET.delete(oldKey);
const head = await env.MEDIA_BUCKET.head(key);
await env.MEDIA_BUCKET.delete(key);
```

### Upload Flow

1. Client sends multipart upload to `POST /assets`
2. Worker parses multipart body (Hono built-in)
3. Original file written to R2: `originals/{userId}/{assetId}/{filename}`
4. Queue message sent for thumbnail generation
5. Queue consumer fetches original from R2, resizes via Cloudflare Image Resizing, writes thumbnail + preview back to R2

### Download / Serving

- **Thumbnails/Previews**: Serve directly from R2 with aggressive cache headers (`Cache-Control: public, max-age=31536000, immutable`) since keys are content-addressed
- **Originals**: Serve from R2 with `Content-Disposition: attachment` for downloads
- **Large files**: Use R2's streaming support (`ReadableStream`) to avoid buffering entire files in Worker memory

### Image Processing

Sharp is replaced by **Cloudflare Image Resizing** (available on Pro+ plans or via Workers paid):

```typescript
// Thumbnail generation (in queue consumer)
const original = await env.MEDIA_BUCKET.get(originalKey);
const resized = await fetch(original.url, {
  cf: {
    image: {
      width: 250,
      height: 250,
      fit: 'cover',
      format: 'webp',
      quality: 80,
    },
  },
});
await env.MEDIA_BUCKET.put(thumbnailKey, resized.body);
```

If Image Resizing is not available, an alternative is a lightweight WASM-based image resizer running in the Worker (e.g., `photon-rs` compiled to WASM).

### EXIF Extraction

`exiftool-vendored` (native binary) is replaced by a pure-JavaScript EXIF parser. Options:
- `exifreader` — full-featured, pure JS, reads EXIF/IPTC/XMP/ICC from JPEG/TIFF/HEIC/WebP
- `exif-reader` — lightweight EXIF-only parser

EXIF extraction runs in the queue consumer after upload.

---

## 8. Background Jobs (BullMQ → Queues)

### Queue Architecture

One Cloudflare Queue with message-type routing (simpler than 17 separate queues):

```typescript
// wrangler.toml
[[queues.producers]]
binding = "QUEUE"
queue = "immich-jobs"

[[queues.consumers]]
queue = "immich-jobs"
max_batch_size = 10
max_retries = 3
dead_letter_queue = "immich-jobs-dlq"
```

### Message Format

```typescript
interface JobMessage {
  type: JobName;
  data: Record<string, unknown>;
  enqueuedAt: string;
}

// Enqueuing
await env.QUEUE.send({
  type: 'AssetGenerateThumbnails',
  data: { assetId: '...' },
  enqueuedAt: new Date().toISOString(),
});
```

### Consumer Dispatch

```typescript
async function processJob(body: JobMessage, env: Env): Promise<void> {
  switch (body.type) {
    case 'AssetExtractMetadata':
      return extractMetadata(body.data, env);
    case 'AssetGenerateThumbnails':
      return generateThumbnails(body.data, env);
    case 'AssetDelete':
      return deleteAsset(body.data, env);
    case 'FileDelete':
      return deleteFile(body.data, env);
    case 'AssetEmptyTrash':
      return emptyTrash(body.data, env);
    case 'UserDelete':
      return deleteUser(body.data, env);
    case 'UserSyncUsage':
      return syncUsage(body.data, env);
    case 'SessionCleanup':
      return cleanupSessions(body.data, env);
    default:
      console.error(`Unknown job type: ${body.type}`);
  }
}
```

### Scheduled Tasks (Cron Triggers)

```toml
# wrangler.toml
[triggers]
crons = ["0 2 * * *"]  # 2 AM daily
```

The `scheduled()` handler dispatches nightly cleanup:
- `UserDeleteCheck` — find users pending deletion, enqueue `UserDelete` for each
- `SessionCleanup` — delete expired sessions
- `UserSyncUsage` — recalculate storage quotas
- `AssetDeleteCheck` — find assets past trash retention, enqueue permanent deletion

### Inline Processing with `waitUntil()`

For lightweight jobs, we can skip the queue entirely and use `ctx.waitUntil()`:

```typescript
// After successful upload, extract metadata inline
ctx.waitUntil(extractMetadata(asset, env));
```

This runs after the response is sent, within the same Worker invocation. Use for fast operations (<30s). Queue heavier work like thumbnail generation.

---

## 9. Caching (Redis → KV)

### Cache Strategy

| Data | Storage | TTL | Reason |
|---|---|---|---|
| System config | KV | 60s | Avoid D1 read on every request |
| Session lookup | KV | Session lifetime | Fast auth validation |
| Shared link data | KV | 5 min | Frequently accessed by public viewers |
| Server info | KV | 5 min | Static data, rarely changes |

### KV Usage

```typescript
// Read-through cache pattern
async function getSystemConfig(env: Env): Promise<SystemConfig> {
  const cached = await env.KV.get('system:config', 'json');
  if (cached) return cached as SystemConfig;

  const config = await fetchConfigFromD1(env.DB);
  await env.KV.put('system:config', JSON.stringify(config), { expirationTtl: 60 });
  return config;
}
```

### Cache Invalidation

When system config is updated via admin API, delete the KV key:
```typescript
await env.KV.delete('system:config');
```

---

## 10. Frontend (SvelteKit Static Assets)

### No Code Changes Required

The frontend already builds to static files via `@sveltejs/adapter-static`. The build output (`web/build/`) is deployed as Cloudflare Workers Static Assets.

### wrangler.toml Configuration

```toml
[assets]
directory = "./web/build"
```

### Routing

The Worker handles routing priority:
1. `/api/*` → Hono API routes
2. Everything else → Static asset lookup → SPA fallback (`index.html`)

```typescript
// In the Hono app
app.route('/api', apiRoutes);

// Fallback to static assets is handled by the assets binding
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});
```

---

## 11. Authentication

### Kept Auth Methods
- **Email + password login** — bcrypt hash verification, returns JWT
- **JWT access tokens** — Short-lived, stored in `sessions` table
- **API keys** — Long-lived tokens for programmatic access
- **Shared link tokens** — Public/password-protected photo sharing

### Removed Auth Methods
- OAuth 2.0 / OpenID Connect
- PKCE flows

### JWT on Workers

Replace `jsonwebtoken` (Node.js native bindings) with `jose` (pure JS, Web Crypto API):

```typescript
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(env.JWT_SECRET);

// Sign
const token = await new SignJWT({ sub: userId })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secret);

// Verify
const { payload } = await jwtVerify(token, secret);
```

### Password Hashing

`bcrypt` uses native bindings. Replace with `bcryptjs` (pure JS) or use Web Crypto API with PBKDF2:

```typescript
// Using bcryptjs (pure JS bcrypt)
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 10);
const valid = await bcrypt.compare(password, hash);
```

---

## 12. API Layer (NestJS → Hono)

### Route Migration Pattern

**Before (NestJS controller):**
```typescript
@Controller('albums')
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Post()
  @Authenticated()
  createAlbum(@Auth() auth: AuthDto, @Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.service.create(auth, dto);
  }
}
```

**After (Hono route):**
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticated } from '../middleware/auth';

const CreateAlbumSchema = z.object({
  albumName: z.string().min(1),
  assetIds: z.array(z.string().uuid()).optional(),
});

const albums = new Hono<{ Bindings: Env }>();

albums.post('/', authenticated(), zValidator('json', CreateAlbumSchema), async (c) => {
  const auth = c.get('auth');
  const body = c.req.valid('json');
  const album = await albumService.create(auth, body, c.env);
  return c.json(album, 201);
});
```

### Middleware Stack

```typescript
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', errorHandler());
app.use('*', requestLogger());
app.use('/api/*', corsMiddleware());

// Route groups
app.route('/api/auth', authRoutes);
app.route('/api/assets', assetRoutes);
app.route('/api/albums', albumRoutes);
// ... etc
```

### Service Layer Changes

Services are largely unchanged — they contain business logic that doesn't depend on NestJS. The main change is:

1. **Remove `@Injectable()` decorators** — not needed without NestJS DI
2. **Pass `env` (bindings) through** — services receive D1/R2/KV/Queue bindings
3. **Remove `@OnEvent()` listeners** — replace with explicit function calls
4. **Remove `@Cron()` decorators** — handled by `scheduled()` export

### Dependency Injection Replacement

Instead of NestJS's DI container, use a simple factory pattern:

```typescript
// services/index.ts
export function createServices(env: Env) {
  const db = new D1Database(env.DB);
  const storage = new R2Storage(env.MEDIA_BUCKET);
  const queue = new QueueClient(env.QUEUE);
  const kv = new KVCache(env.KV);

  const userRepo = new UserRepository(db);
  const assetRepo = new AssetRepository(db);
  // ... etc

  return {
    auth: new AuthService(userRepo, sessionRepo),
    asset: new AssetService(assetRepo, storage, queue),
    album: new AlbumService(albumRepo, assetRepo),
    // ... etc
  };
}
```

---

## 13. Implementation Plan

### Phase 1 — Skeleton (Worker + D1 + Auth + Static Frontend)

**Goal**: A running Worker that serves the SvelteKit frontend and handles login.

1. Create `wrangler.toml` with D1, R2, KV, Queue bindings
2. Set up Hono app with basic middleware (error handler, logging, CORS)
3. Create D1 schema: `users`, `sessions`, `api_keys`, `system_metadata`
4. Implement auth routes: `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/auth/validate`
5. Implement auth middleware (JWT verify, API key lookup)
6. Implement user routes: `GET /api/users/me`, `PUT /api/users/me`
7. Configure static asset serving for SvelteKit build output
8. Implement `GET /api/server/info` and `GET /api/server/config` (needed by frontend on load)

**Deliverable**: Login works, frontend loads, auth is functional.

### Phase 2 — Asset Upload + Storage

**Goal**: Upload photos, store in R2, view originals.

1. Create D1 schema: `assets`, `asset_files`, `asset_exif`, `asset_job_status`
2. Implement `POST /api/assets` — multipart upload → R2
3. Implement `GET /api/assets/:id` — asset metadata from D1
4. Implement `GET /api/assets/:id/original` — stream original from R2
5. Implement `GET /api/assets/:id/thumbnail` — serve thumbnail from R2 (placeholder until Phase 3)
6. Implement `GET /api/timeline/buckets` and `GET /api/timeline/bucket/:timeBucket` — timeline view
7. Implement `DELETE /api/assets` — move to trash
8. Implement basic asset listing and pagination

**Deliverable**: Upload photos via API, browse in timeline, view originals, delete.

### Phase 3 — Background Jobs (Thumbnails + Metadata)

**Goal**: Auto-generate thumbnails and extract EXIF on upload.

1. Set up Cloudflare Queue producer and consumer
2. Implement EXIF extraction job (pure-JS `exifreader` library)
3. Implement thumbnail generation job (Cloudflare Image Resizing or WASM)
4. Implement preview generation job (larger size)
5. Wire upload flow to enqueue metadata + thumbnail jobs
6. Set up Cron Trigger for nightly cleanup
7. Implement cleanup jobs (session expiry, trash retention, user deletion)

**Deliverable**: Uploaded photos automatically get thumbnails, previews, and EXIF metadata.

### Phase 4 — Albums, Sharing, Tags

**Goal**: Full album and sharing functionality.

1. Create D1 schema: `albums`, `album_assets`, `album_users`, `shared_links`, `shared_link_assets`, `tags`, `tag_assets`, `tag_closure`
2. Implement album CRUD routes
3. Implement album sharing (add/remove users, role management)
4. Implement shared link routes (create, access, password-protected)
5. Implement tag CRUD and asset tagging
6. Implement partner sharing
7. Implement activity feed for albums

**Deliverable**: Full album, sharing, and tag functionality.

### Phase 5 — Search, Stacks, Download, Polish

**Goal**: Complete feature set, mobile app compatibility.

1. Implement basic search (filename, date range, camera model, location text, tags)
2. Set up FTS5 for text search in D1
3. Implement photo stacks
4. Implement bulk download (ZIP streaming)
5. Implement mobile sync endpoints
6. Implement admin routes (user management, server config, storage quotas)
7. Implement audit logging
8. End-to-end testing with mobile app

**Deliverable**: Feature-complete, mobile app works.

### Phase 6 — Hardening

**Goal**: Production-ready.

1. Rate limiting via KV
2. Input sanitization audit
3. R2 bucket lifecycle rules (if needed)
4. Error monitoring and alerting
5. Performance testing and optimization
6. D1 query optimization and indexing
7. Documentation

**Deliverable**: Production deployment.

---

## 14. Cloudflare Limits and Constraints

| Resource | Limit (Paid Plan) | Impact |
|---|---|---|
| Worker CPU time | 30s per request, 15min per Queue batch | Thumbnail gen must complete within batch limit |
| Worker memory | 128 MB | Cannot buffer large files in memory; stream everything |
| D1 database size | 10 GB per database | Monitor growth; shard if needed |
| D1 rows read | 50M per day (paid) | Heavy browse sessions could hit this |
| D1 rows written | 10M per day (paid) | Bulk imports need throttling |
| R2 storage | Unlimited | No concern |
| R2 Class A ops | 10M/month free, then $4.50/M | Writes (upload, thumbnail gen) |
| R2 Class B ops | 100M/month free, then $0.36/M | Reads (view photos) |
| KV reads | 100K/day free, 10M/day paid | Cache hits |
| KV writes | 1K/day free, 1M/day paid | Cache updates |
| Queue messages | 100M/month included | Job throughput |
| Queue batch size | 100 messages max | Process in batches |
| Request body size | 100 MB (paid) | Photo uploads; very large files need multipart |
| Subrequest limit | 1000 per request | R2/D1/KV calls per request |
