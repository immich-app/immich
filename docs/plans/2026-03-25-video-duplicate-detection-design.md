# Video Duplicate Detection Design

## Goal

Enable video duplicate detection using CLIP embeddings from multiple sampled frames,
using the same pipeline as images. Introduce a "detection method" concept so additional
methods (perceptual hashing, audio fingerprinting) can be added later as independent
duplicate groups.

## Current State

- Image duplicates are detected via CLIP embeddings stored in `smart_search` (512-dim
  vector, cosine distance via HNSW index).
- `duplicate.service.ts` queues per-asset detection jobs;
  `duplicate.repository.ts` does vector similarity search filtered by `asset.type`.
- Videos already have preview thumbnails (single representative frame selected by
  ffmpeg's `thumbnail` filter), but CLIP encoding has only been tested on images.
- Byte-identical uploads per user are already blocked by the `(ownerId, checksum)`
  unique index, so content hashing adds no value.
- The preview thumbnail alone is unreliable for detecting re-encoded video duplicates
  because ffmpeg's thumbnail filter may select a different "most representative" frame
  for each encode.

## Design Decisions

| Decision             | Choice                               | Rationale                                               |
| -------------------- | ------------------------------------ | ------------------------------------------------------- |
| Detection approach   | Multi-frame CLIP averaging           | Reuses existing pipeline, robust to re-encoding         |
| Number of frames     | 8 evenly spaced                      | Good coverage without excessive ML cost                 |
| Short video handling | Fewer frames, min 1                  | Avoids invalid seeks on brief clips                     |
| Embedding storage    | Same `smart_search` table            | One averaged vector per asset, no schema change         |
| Method abstraction   | Deferred to future phase             | YAGNI — only one method exists today                    |
| S3 support           | Not supported                        | Videos must be on local filesystem for ffmpeg           |
| Admin configuration  | Existing `duplicateDetection` config | No new config needed for Phase 1                        |
| Frame encoding order | Sequential                           | Avoids overloading the ML service under job concurrency |

## Architecture

### What Changes

**1. `asset-job.repository.ts` — `getForClipEncoding` (line 217)**

Add `asset.type` and `asset.originalPath` to the select clause. Needed to branch on
video vs image and to locate the video file for ffmpeg.

**2. `media.repository.ts` — new `extractVideoFrames()` method**

```
extractVideoFrames(input: string, timestamps: number[], outputDir: string): Promise<string[]>
```

- Takes a video file path, array of seek timestamps (seconds), and a temp output
  directory.
- For each timestamp: runs ffmpeg with `-ss <t> -frames:v 1` to extract a single
  frame as a JPEG.
- Returns array of output file paths (only the frames that succeeded).
- If no frames succeed, throws.

Implementation: either N separate ffmpeg calls (simpler, parallelizable) or a single
ffmpeg call with a `select` filter (more efficient). Start with N separate calls for
simplicity.

**3. `smart-info.service.ts` — `handleEncodeClip` (line 96)**

After fetching the asset, branch on `asset.type`:

- **Image:** unchanged — call `encodeImage()` with preview file path.
- **Video:** new flow:

```
1. probe = this.mediaRepository.probe(asset.originalPath)
2. duration = probe.format.duration
3. if duration is null/0/NaN:
     timestamps = [0]              // single frame at start
   else if duration < 2:
     timestamps = [duration / 2]   // single frame at midpoint
   else:
     timestamps = 8 evenly spaced from 5% to 95% of duration
4. outputDir = mkdtemp(path.join(os.tmpdir(), 'immich-clip-'))
5. try:
     framePaths = await this.mediaRepository.extractVideoFrames(
       asset.originalPath, timestamps, outputDir
     )
     embeddings = []
     for each framePath in framePaths:       // sequential
       embedding = await this.machineLearningRepository.encodeImage(framePath, clipConfig)
       embeddings.push(JSON.parse(embedding))
     averaged = elementWiseMean(embeddings)  // float32[]
     serialized = JSON.stringify(averaged)   // JSON array → pgvector string
     await this.searchRepository.upsert(asset.id, serialized)
   finally:
     rm(outputDir, { recursive: true, force: true })
```

**Temp file isolation:** Each job creates a unique temp directory via `mkdtemp`,
preventing collisions when multiple `SmartSearch` jobs run concurrently.

**Failure handling:**

| Scenario                                          | Behavior                                     |
| ------------------------------------------------- | -------------------------------------------- |
| ffprobe fails (corrupt video, audio-only)         | Return `JobStatus.Failed`                    |
| Some frames fail to extract (e.g., seek past end) | Average the frames that succeeded            |
| All frames fail to extract                        | Return `JobStatus.Failed`                    |
| Duration missing/zero                             | Extract single frame at t=0                  |
| ML encode fails for a frame                       | Propagates error, job fails, temp cleaned up |

### What Does NOT Change

- **`files.length !== 1` guard** (line 103): Still valid. The `withFiles` call only
  fetches preview files, and we get `originalPath` from the asset row directly.
- **`duplicate.service.ts`**: No changes. Already handles both asset types.
- **`duplicate.repository.ts`**: No changes. The `search()` method already filters by
  `asset.type`, so videos only match videos and images only match images.
- **`smart_search` table**: No schema change. One embedding per asset.
- **`asset.duplicateId` column**: No change. Same grouping mechanism.
- **API / DTOs**: No changes. `DuplicateResponseDto` is type-agnostic.
- **Frontend**: No changes. Videos appear in the same duplicate groups list. The
  `DuplicatesCompareControl` component already renders video assets.
- **ML service**: No changes. Receives individual frame images via existing `/predict`
  endpoint.
- **`streamForEncodeClip`**: Already returns video assets (no type filter in query).

### Utility Function

```typescript
function elementWiseMean(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] += vec[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= vectors.length;
  }
  return mean;
}
```

## Testing

### Test fixtures

Add small stock videos to `server/test/fixtures/videos/` (not the upstream
`e2e/test-assets` submodule, which we don't control):

- `normal.mp4` — 3-5 second clip, 720p, ~200-500 KB. Download a royalty-free clip
  from Pexels or Pixabay and trim with ffmpeg:
  `ffmpeg -i source.mp4 -t 4 -vf scale=1280:720 -an normal.mp4`
- `short.mp4` — ~1 second clip derived from the same source:
  `ffmpeg -i source.mp4 -t 1 -vf scale=1280:720 -an short.mp4`
- `normal-reencoded.mp4` — same content as `normal.mp4` re-encoded at lower
  resolution/bitrate (guarantees identical visual content, different file hash):
  `ffmpeg -i normal.mp4 -vf scale=640:360 -b:v 300k normal-reencoded.mp4`

Keep files under 500 KB each. Use `-an` to strip audio (smaller files, avoids
audio-only edge cases in unrelated tests).

### Unit tests

- **`handleEncodeClip` video branch** (`smart-info.service.spec.ts`): mock probe,
  frame extraction, and ML encoding. Test cases:
  - Normal video (duration 10s) → 8 timestamps, 8 encodeImage calls, averaged result
  - Short video (duration 1s) → 1 timestamp at midpoint
  - Missing duration (null) → 1 timestamp at t=0
  - Partial frame extraction failure (3 of 8 succeed) → averages 3 embeddings
  - All frames fail → returns `JobStatus.Failed`
  - Probe failure → returns `JobStatus.Failed`
  - Temp directory cleaned up in all cases (success and failure)
- **`elementWiseMean`**: basic averaging, single vector passthrough, dimension
  consistency.
- **`extractVideoFrames`** (`media.repository.spec.ts`): mock ffmpeg calls, verify
  correct `-ss` timestamps and output paths.

### Integration tests

- Confirm `streamForEncodeClip` returns video assets (no type filter exists, but worth
  an explicit test).
- Confirm `getForClipEncoding` returns `type` and `originalPath` for video assets.

### E2E tests

These tests require the full ML stack (CLIP model loaded) and are gated the same way
as existing smart search E2E tests — skipped when ML is unavailable.

- Upload `normal.mp4` and `normal-reencoded.mp4` to the same user.
- Trigger smart search + duplicate detection jobs, wait for completion.
- Verify both videos end up in the same duplicate group via `GET /duplicates`.
- Upload `short.mp4` and verify it does not match the other two.

If ML-dependent E2E tests are too expensive for regular CI, these can be run manually
or in a dedicated ML-enabled CI job. The unit tests (which mock all external calls)
provide the primary CI safety net.

## Future Phases

**Phase 2: Detection method abstraction**

When a second detection method is needed (perceptual hashing, audio fingerprinting):

- Introduce `asset_duplicate` junction table: `(assetId, method, duplicateId)`.
- Migrate existing `asset.duplicateId` data with `method = 'clip'`.
- Add frontend tabs per method.
- Each method gets its own config section and job status tracking.

This refactoring is straightforward because all duplicate logic is already isolated in
`duplicate.service.ts` and `duplicate.repository.ts`.

**Phase 3: Improved video embeddings**

- Experiment with more frames or weighted sampling (more frames near scene changes).
- Consider dedicated video embedding models (X-CLIP) if averaged CLIP proves
  insufficient.
