# Video Duplicate Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable video duplicate detection by extracting multiple frames from videos,
encoding each via CLIP, and averaging the embeddings into one vector stored in
`smart_search`.

**Architecture:** The existing image CLIP pipeline is extended with a video branch in
`handleEncodeClip`. Videos are probed for duration, 8 evenly-spaced frames are
extracted via ffmpeg, each frame is CLIP-encoded, and the embeddings are averaged.
No schema, API, or frontend changes.

**Tech Stack:** NestJS, ffmpeg (fluent-ffmpeg), Vitest, existing CLIP ML service

**Design doc:** `docs/plans/2026-03-25-video-duplicate-detection-design.md`

---

### Task 1: Generate test video fixtures

We need these before any integration tests. Generate them synthetically with ffmpeg's
`testsrc` — no download needed, fully reproducible, tiny files.

**Files:**

- Create: `server/test/fixtures/videos/normal.mp4`
- Create: `server/test/fixtures/videos/short.mp4`
- Create: `server/test/fixtures/videos/normal-reencoded.mp4`

**Step 1: Create the test fixtures**

```bash
mkdir -p server/test/fixtures/videos

# Normal: 4 seconds, 720p, no audio, ~100-200 KB
ffmpeg -f lavfi -i testsrc=duration=4:size=1280x720:rate=24 \
  -an -c:v libx264 -crf 30 server/test/fixtures/videos/normal.mp4

# Short: 1 second
ffmpeg -f lavfi -i testsrc=duration=1:size=1280x720:rate=24 \
  -an -c:v libx264 -crf 30 server/test/fixtures/videos/short.mp4

# Re-encoded: same content as normal at lower resolution/bitrate
ffmpeg -i server/test/fixtures/videos/normal.mp4 \
  -vf scale=640:360 -b:v 300k -an server/test/fixtures/videos/normal-reencoded.mp4
```

**Step 2: Verify file sizes**

```bash
ls -lh server/test/fixtures/videos/
```

Each file should be under 500 KB. If too large, increase `-crf`.

**Step 3: Commit**

```
test: add synthetic video fixtures for duplicate detection tests
```

---

### Task 2: Add `elementWiseMean` utility

**Files:**

- Create: `server/src/utils/vector.ts`
- Create: `server/src/utils/vector.spec.ts`

**Step 1: Write the failing tests**

In `server/src/utils/vector.spec.ts`:

```typescript
import { elementWiseMean } from 'src/utils/vector';

describe('elementWiseMean', () => {
  it('should average two vectors', () => {
    const result = elementWiseMean([
      [1, 2, 3],
      [3, 4, 5],
    ]);
    expect(result).toEqual([2, 3, 4]);
  });

  it('should return the vector unchanged for a single input', () => {
    const result = elementWiseMean([[1, 2, 3]]);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle floating point values', () => {
    const result = elementWiseMean([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(result[0]).toBeCloseTo(0.2);
    expect(result[1]).toBeCloseTo(0.3);
  });

  it('should handle 512-dim vectors (CLIP embedding size)', () => {
    const a = Array.from({ length: 512 }, () => Math.random());
    const b = Array.from({ length: 512 }, () => Math.random());
    const result = elementWiseMean([a, b]);
    expect(result).toHaveLength(512);
    expect(result[0]).toBeCloseTo((a[0] + b[0]) / 2);
    expect(result[511]).toBeCloseTo((a[511] + b[511]) / 2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/utils/vector.spec.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

In `server/src/utils/vector.ts`:

```typescript
export function elementWiseMean(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const mean = new Array<number>(dim).fill(0);
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

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/utils/vector.spec.ts`
Expected: PASS — all 4 tests

**Step 5: Commit**

```
feat: add elementWiseMean vector utility
```

---

### Task 3: Add `extractVideoFrames` to media repository

**Files:**

- Modify: `server/src/repositories/media.repository.ts`
- Modify: `server/test/repositories/media.repository.mock.ts`

**Step 1: Add the mock first**

In `server/test/repositories/media.repository.mock.ts`, add to the returned object:

```typescript
extractVideoFrames: vitest.fn().mockResolvedValue([]),
```

**Step 2: Add the implementation**

In `server/src/repositories/media.repository.ts`, add this method to the
`MediaRepository` class. Place it after the existing `probe` method (~line 275):

```typescript
async extractVideoFrames(input: string, timestamps: number[], outputDir: string): Promise<string[]> {
  const results: string[] = [];
  for (const timestamp of timestamps) {
    const output = path.join(outputDir, `frame-${timestamp.toFixed(3)}.jpg`);
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(input)
          .inputOptions([`-ss ${timestamp}`])
          .outputOptions(['-frames:v 1', '-q:v 2'])
          .output(output)
          .on('error', reject)
          .on('end', () => resolve())
          .run();
      });
      results.push(output);
    } catch (error) {
      this.logger.warn(`Failed to extract frame at ${timestamp}s from ${input}: ${error}`);
    }
  }

  if (results.length === 0) {
    throw new Error(`Failed to extract any frames from ${input}`);
  }

  return results;
}
```

Also add `import path from 'node:path';` to the top if not already present.

**Step 3: Run existing media repository tests to verify no regression**

Run: `cd server && npx vitest run src/repositories/media.repository.spec.ts`
Expected: PASS — existing tests unaffected

**Step 4: Commit**

```
feat: add extractVideoFrames to media repository
```

---

### Task 4: Integration test for `extractVideoFrames`

Uses the real ffmpeg + test video fixtures from Task 1. This verifies actual frame
extraction works, not just that the mock is wired up.

**Files:**

- Create: `server/src/repositories/media.repository.extract.spec.ts`

**Step 1: Write the integration test**

```typescript
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MediaRepository } from 'src/repositories/media.repository';

// This test uses real ffmpeg — runs slower than unit tests but verifies actual behavior
describe('MediaRepository.extractVideoFrames (integration)', () => {
  let sut: MediaRepository;
  let outputDir: string;

  const fixturesDir = path.resolve(__dirname, '../../test/fixtures/videos');

  beforeEach(async () => {
    sut = new MediaRepository() as any; // logger is injected, but warn/error are no-ops in test
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'immich-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('should extract frames from a normal video', async () => {
    const input = path.join(fixturesDir, 'normal.mp4');
    const timestamps = [0.5, 1.5, 2.5, 3.5];

    const results = await sut.extractVideoFrames(input, timestamps, outputDir);

    expect(results).toHaveLength(4);
    for (const framePath of results) {
      const stat = await fs.stat(framePath);
      expect(stat.size).toBeGreaterThan(0);
      expect(framePath).toMatch(/\.jpg$/);
    }
  });

  it('should extract a single frame from a short video', async () => {
    const input = path.join(fixturesDir, 'short.mp4');
    const timestamps = [0.5];

    const results = await sut.extractVideoFrames(input, timestamps, outputDir);

    expect(results).toHaveLength(1);
  });

  it('should skip frames that fail and return successful ones', async () => {
    const input = path.join(fixturesDir, 'short.mp4');
    // Timestamp 999 is way past the end of a 1-second video
    const timestamps = [0.5, 999];

    const results = await sut.extractVideoFrames(input, timestamps, outputDir);

    // Should get at least the first frame; the 999s one may fail or produce empty
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should throw when no frames can be extracted', async () => {
    const input = '/nonexistent/video.mp4';
    const timestamps = [0];

    await expect(sut.extractVideoFrames(input, timestamps, outputDir)).rejects.toThrow('Failed to extract any frames');
  });
});
```

**Step 2: Run the integration test**

Run: `cd server && npx vitest run src/repositories/media.repository.extract.spec.ts`
Expected: PASS — requires ffmpeg installed locally

Note: The `MediaRepository` constructor expects a `LoggingRepository` to be injected.
If instantiation fails, use `newTestService` pattern or construct with a mock logger.
Adapt the instantiation as needed to get the test running.

**Step 3: Commit**

```
test: add integration tests for extractVideoFrames
```

---

### Task 5: Add `type` and `originalPath` to `getForClipEncoding` query

**Files:**

- Modify: `server/src/repositories/asset-job.repository.ts:217-224`

**Step 1: Modify the query**

Change the `getForClipEncoding` method at line 217:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getForClipEncoding(id: string) {
  return this.db
    .selectFrom('asset')
    .select(['asset.id', 'asset.visibility', 'asset.type', 'asset.originalPath'])
    .select((eb) => withFiles(eb, AssetFileType.Preview))
    .where('asset.id', '=', id)
    .executeTakeFirst();
}
```

Only change: added `'asset.type', 'asset.originalPath'` to the select array.

**Step 2: Regenerate SQL documentation**

Run: `cd server && pnpm sync:sql`

If `make sql` requires a running DB, skip this and note it for later.

**Step 3: Run existing smart-info tests to verify no regression**

Run: `cd server && npx vitest run src/services/smart-info.service.spec.ts`
Expected: PASS — existing tests unaffected (they mock `getForClipEncoding`)

**Step 4: Commit**

```
feat: include asset type and originalPath in clip encoding query
```

---

### Task 6: Add video CLIP encoding to `handleEncodeClip`

**Files:**

- Modify: `server/src/services/smart-info.service.ts:96-127`
- Modify: `server/src/services/smart-info.service.spec.ts`

**Step 1: Write failing tests for the video branch**

Add these tests inside the existing `describe('handleEncodeClip', ...)` block in
`server/src/services/smart-info.service.spec.ts`.

The `probe` mock must satisfy the full `VideoInfo` type. Create a helper at the top
of the test file:

```typescript
import { VideoInfo } from 'src/types';

const probeStub = (duration: number): VideoInfo => ({
  format: { formatName: 'mov,mp4', formatLongName: 'QuickTime / MOV', duration, bitrate: 0 },
  videoStreams: [],
  audioStreams: [],
});
```

Then add the tests:

```typescript
describe('video CLIP encoding', () => {
  it('should extract 8 frames for a normal video and average embeddings', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(10));
    mocks.media.extractVideoFrames.mockResolvedValue([
      '/tmp/f1.jpg',
      '/tmp/f2.jpg',
      '/tmp/f3.jpg',
      '/tmp/f4.jpg',
      '/tmp/f5.jpg',
      '/tmp/f6.jpg',
      '/tmp/f7.jpg',
      '/tmp/f8.jpg',
    ]);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.probe).toHaveBeenCalledWith(asset.originalPath);
    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(
      asset.originalPath,
      expect.arrayContaining([expect.any(Number)]),
      expect.any(String),
    );
    expect(mocks.machineLearning.encodeImage).toHaveBeenCalledTimes(8);
    expect(mocks.search.upsert).toHaveBeenCalledWith(asset.id, expect.any(String));
  });

  it('should verify 8 timestamps are evenly spaced from 5% to 95%', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(100));
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    await sut.handleEncodeClip({ id: asset.id });

    const timestamps = mocks.media.extractVideoFrames.mock.calls[0][1] as number[];
    expect(timestamps).toHaveLength(8);
    expect(timestamps[0]).toBeCloseTo(5); // 5% of 100
    expect(timestamps[7]).toBeCloseTo(95); // 95% of 100
    // Verify monotonically increasing
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }
  });

  it('should extract 1 frame for a short video (< 2s)', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(1.5));
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(asset.originalPath, [0.75], expect.any(String));
    expect(mocks.machineLearning.encodeImage).toHaveBeenCalledTimes(1);
  });

  it('should extract 1 frame at t=0 when duration is zero', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(0));
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(asset.originalPath, [0], expect.any(String));
  });

  it('should extract 1 frame at t=0 when duration is NaN', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(Number.NaN));
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(asset.originalPath, [0], expect.any(String));
  });

  it('should extract 1 frame at t=0 when duration is negative', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(-5));
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue('[1,0,0]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(asset.originalPath, [0], expect.any(String));
  });

  it('should average embeddings from partial frame extraction', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(10));
    // Only 3 frames succeeded (extractVideoFrames handles partial failure internally)
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/f1.jpg', '/tmp/f2.jpg', '/tmp/f3.jpg']);
    mocks.machineLearning.encodeImage
      .mockResolvedValueOnce('[1,0,0]')
      .mockResolvedValueOnce('[0,1,0]')
      .mockResolvedValueOnce('[0,0,1]');

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.machineLearning.encodeImage).toHaveBeenCalledTimes(3);
    // Averaged: [(1+0+0)/3, (0+1+0)/3, (0+0+1)/3]
    const storedEmbedding = JSON.parse(mocks.search.upsert.mock.calls[0][1]);
    expect(storedEmbedding[0]).toBeCloseTo(1 / 3);
    expect(storedEmbedding[1]).toBeCloseTo(1 / 3);
    expect(storedEmbedding[2]).toBeCloseTo(1 / 3);
  });

  it('should fail when probe fails', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockRejectedValue(new Error('corrupt video'));

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Failed);

    expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    expect(mocks.search.upsert).not.toHaveBeenCalled();
  });

  it('should fail when all frames fail to extract', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).file({ type: AssetFileType.Preview }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);
    mocks.media.probe.mockResolvedValue(probeStub(10));
    mocks.media.extractVideoFrames.mockRejectedValue(new Error('Failed to extract any frames'));

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Failed);

    expect(mocks.search.upsert).not.toHaveBeenCalled();
  });

  it('should skip hidden video assets', async () => {
    const asset = AssetFactory.from({
      type: AssetType.Video,
      visibility: AssetVisibility.Hidden,
    })
      .file({ type: AssetFileType.Preview })
      .build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Skipped);

    expect(mocks.media.probe).not.toHaveBeenCalled();
    expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
  });

  it('should fail for video without preview file', async () => {
    const asset = AssetFactory.from({ type: AssetType.Video }).build();
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Failed);

    expect(mocks.media.probe).not.toHaveBeenCalled();
  });

  it('should still encode images via preview file (no regression)', async () => {
    const asset = AssetFactory.from({ type: AssetType.Image }).file({ type: AssetFileType.Preview }).build();
    mocks.machineLearning.encodeImage.mockResolvedValue('[0.01, 0.02, 0.03]');
    mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

    expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

    expect(mocks.media.probe).not.toHaveBeenCalled();
    expect(mocks.media.extractVideoFrames).not.toHaveBeenCalled();
    expect(mocks.machineLearning.encodeImage).toHaveBeenCalledWith(
      asset.files[0].path,
      expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
    );
    expect(mocks.search.upsert).toHaveBeenCalledWith(asset.id, '[0.01, 0.02, 0.03]');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run src/services/smart-info.service.spec.ts`
Expected: FAIL — video tests fail because `handleEncodeClip` doesn't branch on type

**Step 3: Implement the video branch**

Replace `handleEncodeClip` in `server/src/services/smart-info.service.ts` (lines
95-127). Add new imports at top of file:

```typescript
import { AssetType } from 'src/enum'; // add to existing enum import
import { elementWiseMean } from 'src/utils/vector';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
```

New `handleEncodeClip` and private `encodeVideoClip`:

```typescript
@OnJob({ name: JobName.SmartSearch, queue: QueueName.SmartSearch })
async handleEncodeClip({ id }: JobOf<JobName.SmartSearch>): Promise<JobStatus> {
  const { machineLearning } = await this.getConfig({ withCache: true });
  if (!isSmartSearchEnabled(machineLearning)) {
    return JobStatus.Skipped;
  }

  const asset = await this.assetJobRepository.getForClipEncoding(id);
  if (!asset || asset.files.length !== 1) {
    return JobStatus.Failed;
  }

  if (asset.visibility === AssetVisibility.Hidden) {
    return JobStatus.Skipped;
  }

  let embedding: string;
  if (asset.type === AssetType.Video) {
    const result = await this.encodeVideoClip(asset, machineLearning.clip);
    if (!result) {
      return JobStatus.Failed;
    }
    embedding = result;
  } else {
    embedding = await this.machineLearningRepository.encodeImage(
      asset.files[0].path,
      machineLearning.clip,
    );
  }

  if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
    this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
    await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
  }

  const newConfig = await this.getConfig({ withCache: true });
  if (machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
    return JobStatus.Skipped;
  }

  await this.searchRepository.upsert(asset.id, embedding);

  return JobStatus.Success;
}

private async encodeVideoClip(
  asset: { id: string; originalPath: string },
  clipConfig: { modelName: string },
): Promise<string | null> {
  let probeResult;
  try {
    probeResult = await this.mediaRepository.probe(asset.originalPath);
  } catch (error) {
    this.logger.error(`Failed to probe video ${asset.id}: ${error}`);
    return null;
  }

  const duration = probeResult.format.duration;
  let timestamps: number[];
  if (!duration || duration <= 0 || !Number.isFinite(duration)) {
    timestamps = [0];
  } else if (duration < 2) {
    timestamps = [duration / 2];
  } else {
    timestamps = Array.from({ length: 8 }, (_, i) => duration * (0.05 + (0.9 * i) / 7));
  }

  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'immich-clip-'));
  try {
    const framePaths = await this.mediaRepository.extractVideoFrames(
      asset.originalPath,
      timestamps,
      outputDir,
    );

    const embeddings: number[][] = [];
    for (const framePath of framePaths) {
      const embeddingStr = await this.machineLearningRepository.encodeImage(
        framePath,
        clipConfig,
      );
      embeddings.push(JSON.parse(embeddingStr));
    }

    const averaged = elementWiseMean(embeddings);
    return JSON.stringify(averaged);
  } catch (error) {
    this.logger.error(`Failed to encode video ${asset.id}: ${error}`);
    return null;
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run src/services/smart-info.service.spec.ts`
Expected: PASS — all existing + 12 new video tests

**Step 5: Commit**

```
feat: add video CLIP encoding with multi-frame extraction
```

---

### Task 7: Add E2E test for video duplicate grouping

The existing `duplicates.e2e-spec.ts` manually sets `duplicateId` on assets — no ML
needed. We follow the same pattern: upload video assets, manually assign duplicate
groups, and verify the API returns them correctly. This validates the full stack handles
video duplicate groups without requiring the ML service.

**Files:**

- Modify: `e2e/src/specs/web/duplicates.e2e-spec.ts` (or create a new
  `e2e/src/specs/server/api/duplicate-video.e2e-spec.ts`)

**Step 1: Copy video fixtures to e2e test-assets**

The E2E test runner mounts `e2e/test-assets/` into the Docker container. Copy the
video fixtures there so they're accessible at runtime:

```bash
mkdir -p e2e/test-assets/videos
cp server/test/fixtures/videos/normal.mp4 e2e/test-assets/videos/
cp server/test/fixtures/videos/normal-reencoded.mp4 e2e/test-assets/videos/
```

Note: `e2e/test-assets/` is a git submodule pointing to `immich-app/test-assets`.
Since we can't push to the upstream submodule, add the videos directory to
`.gitignore` inside `e2e/` or track them separately. Alternatively, generate them
in a `beforeAll` hook using ffmpeg if available in the E2E environment.

**Step 2: Add video duplicate E2E test**

```typescript
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

test.describe('Video Duplicate Groups', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('should display video duplicates in the duplicates page', async ({ context, page }) => {
    // Use two different video files (different checksums) to avoid the
    // (ownerId, checksum) unique constraint blocking the second upload
    const normalBytes = await readFile(resolve(testAssetDir, 'videos/normal.mp4'));
    const reencodedBytes = await readFile(resolve(testAssetDir, 'videos/normal-reencoded.mp4'));

    const [videoA, videoB] = await Promise.all([
      utils.createAsset(admin.accessToken, {
        deviceAssetId: 'video-dup-a',
        assetData: { bytes: normalBytes, filename: 'video-a.mp4' },
      }),
      utils.createAsset(admin.accessToken, {
        deviceAssetId: 'video-dup-b',
        assetData: { bytes: reencodedBytes, filename: 'video-b.mp4' },
      }),
    ]);

    // Manually group them as duplicates (same pattern as existing duplicates E2E)
    await updateAssets(
      {
        assetBulkUpdateDto: {
          ids: [videoA.id, videoB.id],
          duplicateId: crypto.randomUUID(),
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/utilities/duplicates');

    // Verify the duplicate group is shown
    await expect(page.getByText('1 / 1')).toBeVisible();
  });
});
```

**Step 2: Run the E2E test**

Run: `cd e2e && npx playwright test src/specs/web/duplicates.e2e-spec.ts`

**Step 3: Commit**

```
test(e2e): add video duplicate group E2E test
```

---

### Task 8: Run lint, type checks, and full test suite

**Step 1: Run server lint**

Run: `cd server && npx eslint --fix src/utils/vector.ts src/services/smart-info.service.ts src/repositories/media.repository.ts src/repositories/asset-job.repository.ts`

Fix any issues.

**Step 2: Run server type check**

Run: `cd server && npx tsc --noEmit`

Fix any type errors. Common issues:

- `probe` returns `VideoInfo` which has `format.duration: number` (not optional). The
  `!duration` check still works for `0` and the `Number.isFinite` check catches `NaN`.
- `asset.type` and `asset.originalPath` are now on the query result type automatically
  via Kysely inference.
- `encodeVideoClip`'s `clipConfig` parameter typed as `{ modelName: string }` — verify
  this is compatible with what `machineLearningRepository.encodeImage` expects (it
  accepts `CLIPConfig` which is `{ modelName: string }` from `src/config.ts`).

**Step 3: Run prettier**

Run: `cd server && npx prettier --write src/utils/vector.ts src/utils/vector.spec.ts src/services/smart-info.service.ts src/services/smart-info.service.spec.ts src/repositories/media.repository.ts src/repositories/media.repository.extract.spec.ts src/repositories/asset-job.repository.ts`

**Step 4: Run full server unit tests**

Run: `cd server && pnpm test`

Expected: PASS — no regressions. If tests fail, investigate. Common issues:

- Other tests that mock `getForClipEncoding` may need updating if they assert on
  the return shape (now includes `type` and `originalPath`).
- The `AssetFactory.create()` default type is `AssetType.Image`, so existing tests
  should still pass for the image path.

**Step 5: Commit any fixes**

```
chore: fix lint, types, and test regressions
```

---

### Task 9: Regenerate SQL query documentation

**Step 1: Check if `make sql` can run**

Run: `make sql`

This requires a running database. If it fails, skip and note it for the PR
description.

**Step 2: If SQL files changed, commit**

```
chore: regenerate SQL query documentation
```
