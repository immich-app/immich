# Immich Storage Encryption (At-Rest)

This document outlines a phased approach to encrypt assets (photos/videos and derived files) at rest in Immich.

## Goals
- Protect media bytes on disk or object storage via authenticated encryption.
- Minimize disruption: reuse existing upload/serve paths through storage abstractions.
- Preserve server features (thumbnails, previews, metadata extraction, ML) with transparent decrypt on read.
- Support future key rotation and optional per-user keys without rearchitecting core flows.

## Scope
- Originals, sidecars, thumbnails, previews, encoded videos.
- Local filesystem; future-ready for object storage.
- Server-Side Encryption (SSE) using envelope encryption in Phase 1; optional per-user keys later.

## Architecture Overview

- Crypto: AES-256-GCM per file, random IV, authentication tag for integrity.
- Keys:
  - Data Encryption Key (DEK): randomly generated per file.
  - Key Encryption Key (KEK): master server key (local secret or KMS-managed).
  - Envelope: store `encryptedDek` (DEK wrapped by KEK) alongside file metadata.

- Metadata: track encryption status and parameters per file record:
  - `encrypted: boolean`
  - `encryptionAlgo: 'AES-256-GCM'`
  - `encryptionIv: base64`
  - `encryptedDek: base64`
  - `encryptionTag: base64` (if not embedded in file stream)
  - `encryptionVersion: number`

- Storage Repository additions:
  - Streaming encrypt on write: `createEncryptedWriteStream(path, params)`.
  - Streaming decrypt on read: `createDecryptedReadStream(path, params)`.
  - Branch existing `createReadStream`/`createWriteStream` when file is marked encrypted.

- Config additions:
  - `storageEncryption.enabled: boolean`
  - `storageEncryption.mode: 'sse' | 'per-user'` (future)
  - `storageEncryption.algorithm: 'AES-256-GCM'`
  - `storageEncryption.kek`: `{ type: 'local' | 'kms', secret?: string, provider?: 'aws'|'gcp'|'azure', keyId?: string }`

## Data Flow Changes

1) Upload
- Compute plaintext checksum before encryption for dedupe.
- Generate DEK + IV.
- Stream-encrypt upload temp file into final location.
- Store encryption metadata (encryptedDek, IV, algo, version) with asset file record; store plaintext checksum.

2) Serve (Download/Playback/Thumbnails)
- Storage layer transparently decrypts when reading encrypted files.
- Existing controllers/services continue to call repository methods; no API changes.

3) Derived Assets
- Generators read decrypted streams, process, and write encrypted outputs.
- Ensure all file IO goes through `StorageRepository`.

4) Verification & Dedupe
- Size checks unaffected.
- Checksum comparisons use stored plaintext checksum captured at upload.

## Key Management

Phase 1 (SSE): single KEK
- Local: KEK from env/secret; rotate by rewrapping DEKs and updating metadata.
- KMS: use provider’s key to wrap/unwrap DEKs; audit and rotation via KMS.

Phase 2+: Per-user KEKs
- Each user has a KEK; DEKs wrapped to user KEK.
- Sharing: rewrap DEKs to recipient KEKs or use group KEK.

## Migration Strategy

1) Schema migration: add encryption columns to `asset_file` table and possibly `asset` for originals.
2) Config defaults: encryption disabled.
3) Backfill: optional job to re-encrypt existing files in batches and update metadata.
4) Rollback: decrypt and clear metadata if needed.

## Risks & Considerations

- Performance: AES-GCM is fast; expect modest CPU overhead.
- Recovery: backups require KEK availability; document ops procedures.
- Integrity: GCM tag verification on reads; fail closed on mismatch.
- Direct FS access: audit and replace with repository methods.
- Object storage SSE: avoid double-encrypt unless mandated; allow mode selection per backend.

## Phased Implementation

Phase 1 (baseline, 2–3 weeks)
- Add config and crypto helpers.
- Implement streaming encrypt/decrypt helpers.
- Wire upload and read paths to use helpers via `StorageRepository`.
- Store plaintext checksums in DB; adapt duplicate checks to use DB value.

Phase 2 (derived assets, 1–2 weeks)
- Encrypt thumbnails/previews/encoded videos.
- Ensure jobs/services read via repository.

Phase 3 (KMS & rotation, ~2 weeks)
- Add KMS integration; implement DEK rewrap jobs and admin controls.

Phase 4 (per-user keys, 3–4+ weeks)
- Introduce per-user KEKs; implement sharing rewrap and UI.

## Minimal Scaffold (this PR)

- `server/src/utils/encryption.ts`: streaming AES-GCM encrypt/decrypt helpers and envelope routines.
- No behavior changes by default; ready to be integrated in `StorageRepository`.
