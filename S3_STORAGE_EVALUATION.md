# Immich S3 Storage Evaluation

## Executive Summary

This document evaluates the feasibility of adding S3 storage support to Immich. After analyzing the codebase, the integration is **moderately complex** (estimated effort: Medium-High). The architecture has good abstraction points, but several components assume local filesystem access.

### Key Recommendation

A **hybrid approach** is recommended:
- **Original files** stored in S3 (cold storage, long-term retention)
- **Generated files** (thumbnails, previews, encoded videos) stored locally for fast ML processing and serving
- **PostgreSQL** manages all file location metadata with a new column to indicate storage type

---

## Current Storage Architecture

### 1. File Organization

```
MEDIA_LOCATION/
├── upload/           # Temporary upload location
│   └── {userId}/{xx}/{yy}/
├── library/          # External library imports
│   └── {storageLabel|userId}/
├── thumbs/           # Thumbnails, previews, fullsize, person faces
│   └── {userId}/{xx}/{yy}/
├── encoded-video/    # Transcoded videos
│   └── {userId}/{xx}/{yy}/
├── profile/          # User profile images
│   └── {userId}/
└── backups/          # Database backups
```

### 2. Key Storage Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `StorageCore` | `server/src/cores/storage.core.ts` | Singleton for path generation and file movement |
| `StorageRepository` | `server/src/repositories/storage.repository.ts` | Low-level filesystem operations |
| `StorageService` | `server/src/services/storage.service.ts` | Mount verification, media location detection |
| `StorageTemplateService` | `server/src/services/storage-template.service.ts` | Handlebars-based path templating |

### 3. Database Path Storage

| Entity | Table | Path Field | Content |
|--------|-------|------------|---------|
| Original file | `asset` | `originalPath` | Absolute filesystem path |
| Encoded video | `asset` | `encodedVideoPath` | Nullable, absolute path |
| Thumbnails/Previews | `asset_file` | `path` | Type: thumbnail, preview, fullsize, sidecar |
| Person face | `person` | `thumbnailPath` | Person face JPEG |
| User profile | `user` | `profileImagePath` | User avatar |

---

## ML Processing and Storage Interaction

### Critical Finding: ML Only Uses Generated Files

All ML operations read from **preview/thumbnail files**, NOT original assets:

```typescript
// From asset-job.repository.ts
getForClipEncoding(id)   -> AssetFileType.Preview
getForDetectFacesJob(id) -> AssetFileType.Preview
getForOcr(id)            -> AssetFileType.Preview
```

### ML Communication Pattern

1. Server reads preview file from local disk
2. File is converted to Buffer
3. Buffer sent via HTTP POST to ML microservice
4. ML processes in-memory (never needs direct file access)

```typescript
// From machine-learning.repository.ts
const fileBuffer = await readFile(payload.imagePath);
formData.append('image', new Blob([new Uint8Array(fileBuffer)]));
```

**Implication**: Original files can be stored on S3 without affecting ML processing, as long as generated files remain locally accessible.

---

## S3 Integration Approaches

### Option A: Hybrid Storage (Recommended)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                          Client                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────▼────────────┐
          │     Immich Server      │
          │  ┌──────────────────┐  │
          │  │ StorageAdapter   │  │  (New abstraction layer)
          │  │  ├── LocalFS     │  │
          │  │  └── S3Client    │  │
          │  └──────────────────┘  │
          └────┬──────────────┬────┘
               │              │
    ┌──────────▼────┐   ┌─────▼─────────┐
    │ Local Storage │   │   S3 Bucket   │
    │ (Generated)   │   │  (Originals)  │
    │ - thumbs/     │   │  - originals/ │
    │ - encoded-video│  │               │
    └───────────────┘   └───────────────┘
```

**Workflow:**
1. Upload: File saved locally, then async pushed to S3
2. Thumbnails generated from local copy
3. Local original deleted after S3 confirmation
4. Download: Presigned URL or server-side proxy from S3

**Pros:**
- ML processing unchanged (uses local previews)
- Fast thumbnail/preview serving
- Original files offloaded to cheaper S3 storage
- Minimal disruption to existing architecture

**Cons:**
- Two storage systems to manage
- Need sync logic for upload/delete

### Option B: Full S3 Storage

All files (originals and generated) stored in S3.

**Pros:**
- Single storage backend
- Simpler conceptual model

**Cons:**
- ML processing requires downloading files from S3
- Higher latency for thumbnail generation
- Increased network costs
- Requires significant refactoring

### Option C: S3 with Local Cache

S3 as primary storage with local filesystem as cache.

**Pros:**
- Best of both worlds after warm-up
- Single source of truth

**Cons:**
- Complex cache invalidation
- Cache management overhead
- Cold start latency

---

## Using PostgreSQL for S3 Location Management

### Proposed Schema Changes

```sql
-- New enum for storage type
CREATE TYPE storage_type AS ENUM ('local', 's3');

-- Add to asset table
ALTER TABLE asset ADD COLUMN storage_type storage_type DEFAULT 'local';
ALTER TABLE asset ADD COLUMN s3_bucket VARCHAR(255);
ALTER TABLE asset ADD COLUMN s3_key VARCHAR(1024);

-- For hybrid approach, track which files are where
CREATE TABLE asset_storage_location (
    id UUID PRIMARY KEY,
    asset_id UUID REFERENCES asset(id),
    file_type VARCHAR(50),  -- 'original', 'preview', 'thumbnail', 'encoded_video'
    storage_type storage_type,
    -- For local
    local_path VARCHAR(1024),
    -- For S3
    s3_bucket VARCHAR(255),
    s3_key VARCHAR(1024),
    s3_region VARCHAR(50),
    -- Metadata
    size_bytes BIGINT,
    checksum VARCHAR(64),
    uploaded_at TIMESTAMP,
    UNIQUE(asset_id, file_type)
);
```

### Benefits of PostgreSQL-Based Management

1. **Single Source of Truth**: All file locations in one place
2. **Atomic Operations**: File moves tracked in transactions
3. **Query Flexibility**: Find orphaned files, generate reports
4. **Migration Support**: Gradual migration from local to S3
5. **Audit Trail**: Track when/where files moved

---

## Per-User Buckets for Isolation

### Approach 1: Single Bucket with User Prefixes

```
s3://immich-storage/
├── users/
│   ├── {user-uuid-1}/
│   │   ├── originals/
│   │   └── generated/
│   └── {user-uuid-2}/
│       ├── originals/
│       └── generated/
```

**Pros:**
- Simple to manage
- Single IAM policy
- Easy cross-user operations (admin, sharing)

**Cons:**
- Less isolation
- Harder to audit per-user storage

### Approach 2: Per-User Buckets

```
s3://immich-user-{uuid-1}/
├── originals/
└── generated/

s3://immich-user-{uuid-2}/
├── originals/
└── generated/
```

**Pros:**
- Strong isolation
- Per-user billing/quotas possible
- Easy user data deletion (delete bucket)

**Cons:**
- Bucket management complexity (create on signup, delete on account removal)
- AWS has 100 bucket soft limit (can be raised)
- Cross-user sharing more complex
- Requires dynamic bucket credentials

### Approach 3: Bucket per User Group/Tenant (Multi-tenant)

Best for self-hosted instances with multiple families/organizations.

```
s3://immich-tenant-{family-id}/
├── users/
│   ├── {user-1}/
│   └── {user-2}/
```

### Recommended Approach

**Single bucket with user prefixes** for most use cases:
- Simpler operations
- IAM policies can still restrict access via prefix conditions
- Use bucket policies with user ID in path for access control

---

## Local-First Processing with S3 Push

### Workflow Design

```
┌──────────────────────────────────────────────────────────────────┐
│                        UPLOAD WORKFLOW                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Client Upload ──► Local Staging                               │
│                          │                                         │
│  2. Create DB Record ◄───┘                                         │
│     (status: 'processing')                                         │
│                          │                                         │
│  3. Generate Previews ◄──┘                                         │
│     (thumbnail, preview, fullsize)                                 │
│                          │                                         │
│  4. Queue ML Jobs ◄──────┘                                         │
│     (smart-search, face detection, OCR)                            │
│                          │                                         │
│  5. S3 Upload Job ◄──────┘  (async, can be queued)                 │
│     - Upload original to S3                                        │
│     - Verify checksum matches                                      │
│     - Update DB with S3 location                                   │
│                          │                                         │
│  6. Delete Local Original ◄─┘ (optional, based on config)          │
│                          │                                         │
│  7. Update Status ◄──────┘                                         │
│     (status: 'active', storage: 's3')                              │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Download Workflow Options

**Option A: Server Proxy (Simple, More Control)**
```typescript
// Server fetches from S3 and streams to client
async downloadOriginal(assetId: string): Promise<Stream> {
  const asset = await this.assetRepo.findById(assetId);
  if (asset.storageType === 's3') {
    return this.s3Client.getObject(asset.s3Bucket, asset.s3Key);
  }
  return fs.createReadStream(asset.originalPath);
}
```

**Option B: Presigned URLs (Better Performance)**
```typescript
// Server generates temporary signed URL, client downloads directly
async getDownloadUrl(assetId: string): Promise<string> {
  const asset = await this.assetRepo.findById(assetId);
  if (asset.storageType === 's3') {
    return this.s3Client.getSignedUrl('getObject', {
      Bucket: asset.s3Bucket,
      Key: asset.s3Key,
      Expires: 3600, // 1 hour
    });
  }
  return `/api/assets/${assetId}/original`;
}
```

---

## Implementation Effort Estimate

### Phase 1: Storage Abstraction Layer (2-3 weeks)

| Task | Effort | Risk |
|------|--------|------|
| Create `StorageAdapter` interface | Low | Low |
| Implement `LocalStorageAdapter` | Low | Low |
| Implement `S3StorageAdapter` | Medium | Medium |
| Refactor `StorageRepository` to use adapters | Medium | Medium |
| Database schema changes | Low | Low |
| Configuration for S3 credentials | Low | Low |

### Phase 2: Upload/Download Flow (2-3 weeks)

| Task | Effort | Risk |
|------|--------|------|
| Modify upload interceptor | Medium | Medium |
| Add S3 upload job | Medium | Low |
| Implement presigned URL generation | Low | Low |
| Handle streaming for large files | Medium | Medium |
| Error handling and retry logic | Medium | Medium |

### Phase 3: Migration and Operations (2 weeks)

| Task | Effort | Risk |
|------|--------|------|
| Migration job for existing files | High | High |
| Admin UI for storage configuration | Medium | Low |
| Monitoring and metrics | Medium | Low |
| Documentation | Low | Low |

### Phase 4: Per-User Bucket Support (Optional, 1-2 weeks)

| Task | Effort | Risk |
|------|--------|------|
| Dynamic bucket management | Medium | Medium |
| IAM policy templates | Medium | Medium |
| User onboarding/offboarding hooks | Medium | Low |

### Total Estimated Effort

- **Minimum Viable (Hybrid approach)**: 6-8 weeks
- **Full Feature (with per-user buckets)**: 8-12 weeks

---

## Code Changes Required

### 1. New Storage Adapter Interface

```typescript
// src/interfaces/storage-adapter.interface.ts
export interface StorageAdapter {
  // Basic operations
  read(path: string): Promise<Buffer>;
  readStream(path: string): Promise<Readable>;
  write(path: string, data: Buffer | Readable): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;

  // Metadata
  stat(path: string): Promise<{ size: number; mtime: Date }>;

  // S3-specific (optional)
  getPresignedUrl?(path: string, expiresIn: number): Promise<string>;

  // Multi-part upload for large files
  createMultipartUpload?(path: string): Promise<string>;
  uploadPart?(uploadId: string, partNumber: number, data: Buffer): Promise<string>;
  completeMultipartUpload?(uploadId: string, parts: { PartNumber: number; ETag: string }[]): Promise<void>;
}
```

### 2. Files Requiring Modification

| File | Changes |
|------|---------|
| `storage.repository.ts` | Use StorageAdapter instead of direct fs calls |
| `storage.core.ts` | Add S3 path generation methods |
| `asset-media.service.ts` | Handle S3 uploads, presigned URLs |
| `media.service.ts` | Ensure generated files go to local storage |
| `file-upload.interceptor.ts` | Local staging before S3 push |
| `asset.table.ts` | Add storage_type, s3_bucket, s3_key columns |
| `config.repository.ts` | Add S3 configuration options |

### 3. New Files to Create

| File | Purpose |
|------|---------|
| `storage-adapter.interface.ts` | Storage adapter contract |
| `local-storage.adapter.ts` | Local filesystem implementation |
| `s3-storage.adapter.ts` | AWS S3 implementation |
| `storage.factory.ts` | Factory for creating adapters |
| `s3-upload.job.ts` | Background job for S3 uploads |

---

## Configuration Example

```yaml
# immich.config.yaml
storage:
  # Default storage for new uploads
  default: s3  # or 'local'

  local:
    mediaLocation: /data/immich

  s3:
    endpoint: https://s3.amazonaws.com  # or MinIO endpoint
    bucket: immich-storage
    region: us-east-1
    accessKeyId: ${AWS_ACCESS_KEY_ID}
    secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
    prefix: users/  # Optional prefix for all keys

    # Per-user buckets (optional)
    perUserBuckets: false
    bucketTemplate: immich-user-{userId}

  # What to store where (hybrid mode)
  locations:
    originals: s3
    thumbnails: local
    previews: local
    encodedVideos: local  # or s3 for full offload

  # Upload behavior
  upload:
    localFirst: true  # Process locally, then push to S3
    deleteLocalAfterUpload: true
    retryAttempts: 3
    retryDelayMs: 1000
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Checksum verification, dry-run mode, rollback plan |
| S3 outage affects availability | High | Local cache, graceful degradation |
| Increased latency | Medium | Presigned URLs, CDN integration |
| Cost overruns | Medium | Storage class selection (Glacier for old files) |
| Complex debugging | Medium | Detailed logging, metrics |
| Breaking existing deployments | High | Feature flag, gradual rollout |

---

## Conclusion

S3 storage support for Immich is feasible with moderate effort. The recommended approach is:

1. **Hybrid storage**: Originals in S3, generated files local
2. **PostgreSQL-based management**: Track all file locations in database
3. **Single bucket with user prefixes**: Simpler than per-user buckets
4. **Local-first processing**: Upload locally, process, then push to S3
5. **Presigned URLs for downloads**: Better performance than server proxy

This approach minimizes changes to the ML pipeline while providing the benefits of cloud storage for original files.
