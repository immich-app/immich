# Video Trimming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add video trimming to Gallery's existing edit system using FFmpeg stream copy.

**Architecture:** Extend the `AssetEditAction` enum with `Trim`, add `TrimParameters` DTO, restructure `editAsset()` to allow videos, add `MediaRepository.trim()` for FFmpeg stream copy, branch the edit job handler for video vs image, add `TrimManager` + `TrimTimeline` components on the frontend, and split `canEdit` to allow videos without showing rotate actions.

**Tech Stack:** NestJS (server), Kysely (queries), FFmpeg/fluent-ffmpeg (trim), Svelte 5 runes (frontend), Vitest (tests)

**Design doc:** `docs/plans/2026-03-26-video-trimming-design.md`

---

### Task 1: Add Trim to EditAction Enum and TrimParameters DTO

**Files:**

- Modify: `server/src/dtos/editing.dto.ts`
- Modify: `server/src/validation.ts` (IsUniqueEditActions — should already handle new enum value)

**Step 1: Add `Trim` to `AssetEditAction` enum**

In `server/src/dtos/editing.dto.ts:6-10`, add `Trim`:

```typescript
export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
  Trim = 'trim',
}
```

**Step 2: Add `TrimParameters` class**

After `MirrorParameters` (line 49), add:

```typescript
export class TrimParameters {
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Start time in seconds' })
  startTime!: number;

  @IsNumber()
  @Min(0)
  @IsGreaterThanProperty('startTime')
  @ApiProperty({ description: 'End time in seconds' })
  endTime!: number;
}
```

Import `IsNumber` from `class-validator` (add to existing import on line 3).

Add a custom `@IsGreaterThanProperty` validator in `server/src/validation.ts` (or inline with `@Validate`) that enforces `endTime > startTime` at the DTO layer.

**Step 3: Extend type unions and parameter map**

Update `AssetEditParameters` (line 51):

```typescript
export type AssetEditParameters = CropParameters | RotateParameters | MirrorParameters | TrimParameters;
```

Add to `AssetEditActionItem` union (after line 64):

```typescript
  | {
      action: AssetEditAction.Trim;
      parameters: TrimParameters;
    };
```

Add to `actionParameterMap` (line 88-92):

```typescript
const actionParameterMap = {
  [AssetEditAction.Crop]: CropParameters,
  [AssetEditAction.Rotate]: RotateParameters,
  [AssetEditAction.Mirror]: MirrorParameters,
  [AssetEditAction.Trim]: TrimParameters,
};
```

Add `TrimParameters` to `@ApiExtraModels` decorator (line 66):

```typescript
@ApiExtraModels(CropParameters, RotateParameters, MirrorParameters, TrimParameters)
```

**Step 4: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: PASS (no type errors)

**Step 5: Commit**

```
feat: add Trim action to edit DTO with TrimParameters
```

---

### Task 2: Extend `getForEdit()` to Include Duration

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:1321-1334`
- Test: `server/src/services/asset.service.spec.ts`

**Step 1: Add `duration` to `getForEdit()` query**

In `server/src/repositories/asset.repository.ts:1321-1334`, add `asset.duration` to the select:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
async getForEdit(id: string) {
  return this.db
    .selectFrom('asset')
    .select(['asset.type', 'asset.livePhotoVideoId', 'asset.originalPath', 'asset.originalFileName', 'asset.duration'])
    .where('asset.id', '=', id)
    .innerJoin('asset_exif', (join) => join.onRef('asset_exif.assetId', '=', 'asset.id'))
    .select([
      'asset_exif.exifImageWidth',
      'asset_exif.exifImageHeight',
      'asset_exif.orientation',
      'asset_exif.projectionType',
    ])
    .executeTakeFirst();
}
```

**Step 2: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

**Step 3: Regenerate SQL documentation**

Run: `make sql`
Expected: SQL query files updated

**Step 4: Commit**

```
feat: add duration field to getForEdit query for video trim validation
```

---

### Task 3: Add Duration Parsing Utility

**Files:**

- Create: `server/src/utils/duration.ts`
- Create: `server/src/utils/duration.spec.ts`

**Step 1: Write failing tests**

Create `server/src/utils/duration.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseDurationToSeconds, formatSecondsToDuration } from 'src/utils/duration';

describe('parseDurationToSeconds', () => {
  it('should parse HH:MM:SS.ffffff format', () => {
    expect(parseDurationToSeconds('0:05:23.456789')).toBeCloseTo(323.456789);
  });

  it('should parse H:MM:SS format without fractional seconds', () => {
    expect(parseDurationToSeconds('1:23:45')).toBe(5025);
  });

  it('should parse 0:00:00.000000', () => {
    expect(parseDurationToSeconds('0:00:00.000000')).toBe(0);
  });

  it('should return null for null input', () => {
    expect(parseDurationToSeconds(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseDurationToSeconds('')).toBeNull();
  });
});

describe('formatSecondsToDuration', () => {
  it('should format seconds to HH:MM:SS.ffffff', () => {
    expect(formatSecondsToDuration(323.456789)).toBe('0:05:23.456789');
  });

  it('should format zero', () => {
    expect(formatSecondsToDuration(0)).toBe('0:00:00.000000');
  });

  it('should format hours', () => {
    expect(formatSecondsToDuration(5025)).toBe('1:23:45.000000');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/utils/duration.spec.ts`
Expected: FAIL — module not found

**Step 3: Implement duration utilities**

Create `server/src/utils/duration.ts`:

```typescript
export function parseDurationToSeconds(duration: string | null): number | null {
  if (!duration) {
    return null;
  }

  const match = duration.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds, fractional] = match;
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  if (fractional) {
    return total + Number(`0.${fractional}`);
  }
  return total;
}

export function formatSecondsToDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const fractional = (secs - wholeSecs).toFixed(6).slice(2);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${fractional}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/utils/duration.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat: add duration string/seconds conversion utilities for video trim
```

---

### Task 4: Restructure `editAsset()` Validation for Videos

**Files:**

- Modify: `server/src/services/asset.service.ts:556-619`
- Test: `server/src/services/asset.service.spec.ts`

**Step 1: Write failing tests for trim validation**

Find the existing `editAsset` test block in `server/src/services/asset.service.spec.ts`. Add these tests:

```typescript
it('should accept trim on video assets', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
  mocks.assetEditRepository.replaceAll.mockResolvedValue([]);

  await sut.editAsset(authStub.admin, assetStub.image.id, {
    edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } }],
  });

  expect(mocks.assetEditRepository.replaceAll).toHaveBeenCalled();
});

it('should reject trim on image assets', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Image,
    livePhotoVideoId: null,
    originalPath: '/photo.jpg',
    originalFileName: 'photo.jpg',
    duration: null,
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 0, endTime: 10 } }],
    }),
  ).rejects.toThrow(BadRequestException);
});

it('should reject trim with endTime exceeding duration', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 0, endTime: 60 } }],
    }),
  ).rejects.toThrow(BadRequestException);
});

it('should reject mixed spatial and trim edits', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [
        { action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ],
    }),
  ).rejects.toThrow(BadRequestException);
});

it('should reject trim on S3/cloud storage', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: 's3://bucket/video.mp4', // non-local path
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } }],
    }),
  ).rejects.toThrow('Video trimming is not available for cloud-stored videos');
});

it('should reject trim on audio-only files', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/upload/video.mp3',
    originalFileName: 'audio.mp3',
    duration: '0:03:00.000000',
    exifImageWidth: null,
    exifImageHeight: null,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
  mocks.mediaRepository.probe.mockResolvedValue({ videoStreams: [], audioStreams: [{}], format: {} });

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 10, endTime: 60 } }],
    }),
  ).rejects.toThrow('Cannot trim audio-only files');
});

it('should reject trim on very short videos (< 2s)', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:01.500000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 0, endTime: 1 } }],
    }),
  ).rejects.toThrow(BadRequestException);
});

it('should reject trim when edit job is in progress', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
  mocks.jobRepository.getJobCounts.mockResolvedValue({ active: 1 });

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } }],
    }),
  ).rejects.toThrow('edit is already in progress');
});

it('should reject full-duration trim (no-op)', async () => {
  mocks.assetRepository.getForEdit.mockResolvedValue({
    type: AssetType.Video,
    livePhotoVideoId: null,
    originalPath: '/video.mp4',
    originalFileName: 'video.mp4',
    duration: '0:00:30.000000',
    exifImageWidth: 1920,
    exifImageHeight: 1080,
    orientation: null,
    projectionType: null,
  });
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

  await expect(
    sut.editAsset(authStub.admin, assetStub.image.id, {
      edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 0, endTime: 30 } }],
    }),
  ).rejects.toThrow(BadRequestException);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/asset.service.spec.ts`
Expected: FAIL — trim validation not implemented

**Step 3: Restructure `editAsset()` validation**

Modify `server/src/services/asset.service.ts:556-619`. The key change: replace the hard `AssetType.Image` gate with conditional logic based on whether edits contain trim actions.

```typescript
async editAsset(auth: AuthDto, id: string, dto: AssetEditsCreateDto): Promise<AssetEditsResponseDto> {
  await this.requireAccess({ auth, permission: Permission.AssetEditCreate, ids: [id] });

  const asset = await this.assetRepository.getForEdit(id);
  if (!asset) {
    throw new BadRequestException('Asset not found');
  }

  const edits = dto.edits as AssetEditActionItem[];
  const hasTrim = edits.some((e) => e.action === AssetEditAction.Trim);
  const hasSpatial = edits.some((e) =>
    [AssetEditAction.Crop, AssetEditAction.Rotate, AssetEditAction.Mirror].includes(e.action),
  );

  // Reject mixed spatial + trim edits
  if (hasTrim && hasSpatial) {
    throw new BadRequestException('Cannot combine trim with spatial edits');
  }

  if (hasTrim) {
    // Video trim validation
    if (asset.type !== AssetType.Video) {
      throw new BadRequestException('Trim is only supported for video assets');
    }

    if (asset.livePhotoVideoId) {
      throw new BadRequestException('Trimming live photos is not supported');
    }

    // S3/cloud storage check — isExternal only covers external libraries,
    // not S3-stored uploads. Use StorageCore.isImmichPath() to detect local storage.
    if (!StorageCore.isImmichPath(asset.originalPath)) {
      throw new BadRequestException('Video trimming is not available for cloud-stored videos');
    }

    // Audio-only file check — some audio files are stored as AssetType.Video.
    // Probe for video streams before accepting trim.
    const probeResult = await this.mediaRepository.probe(asset.originalPath);
    if (!probeResult.videoStreams || probeResult.videoStreams.length === 0) {
      throw new BadRequestException('Cannot trim audio-only files');
    }

    const durationSeconds = parseDurationToSeconds(asset.duration);
    if (durationSeconds === null || durationSeconds <= 0) {
      throw new BadRequestException('Video duration is not available');
    }

    // Very short video check
    if (durationSeconds < 2) {
      throw new BadRequestException('Video is too short to trim (minimum 2 seconds)');
    }

    // Concurrent edit job check
    const activeJobs = await this.jobRepository.getJobCounts(QueueName.Editor);
    if (activeJobs.active > 0) {
      throw new BadRequestException('An edit is already in progress for this asset');
    }

    const trim = edits.find((e) => e.action === AssetEditAction.Trim)!;
    const { startTime, endTime } = trim.parameters as TrimParameters;

    if (endTime > durationSeconds) {
      throw new BadRequestException('End time exceeds video duration');
    }

    if (startTime === 0 && endTime >= durationSeconds) {
      throw new BadRequestException('Trim must actually remove content');
    }

    // Enrich with originalDuration before storing
    (trim.parameters as TrimParameters & { originalDuration: number }).originalDuration = durationSeconds;
  } else {
    // Existing image validation (unchanged)
    if (asset.type !== AssetType.Image) {
      throw new BadRequestException('Only images can be edited');
    }

    if (asset.livePhotoVideoId) {
      throw new BadRequestException('Editing live photos is not supported');
    }

    if (isPanorama(asset)) {
      throw new BadRequestException('Editing panorama images is not supported');
    }

    if (asset.originalPath?.toLowerCase().endsWith('.gif')) {
      throw new BadRequestException('Editing GIF images is not supported');
    }

    if (asset.originalPath?.toLowerCase().endsWith('.svg')) {
      throw new BadRequestException('Editing SVG images is not supported');
    }

    // Crop bounds validation (existing logic)
    const { width: assetWidth, height: assetHeight } = getDimensions(asset);
    if (!assetWidth || !assetHeight) {
      throw new BadRequestException('Asset dimensions are not available for editing');
    }

    const crop = edits.find((e) => e.action === AssetEditAction.Crop);
    if (crop) {
      if (edits[0].action !== AssetEditAction.Crop) {
        throw new BadRequestException('Crop action must be the first edit action');
      }

      const { x, y, width, height } = crop.parameters;
      if (x + width > assetWidth || y + height > assetHeight) {
        throw new BadRequestException('Crop parameters are out of bounds');
      }
    }
  }

  const newEdits = await this.assetEditRepository.replaceAll(id, edits);
  await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });

  return { assetId: id, edits: newEdits };
}
```

Add import at top of file:

```typescript
import { parseDurationToSeconds } from 'src/utils/duration';
import { TrimParameters } from 'src/dtos/editing.dto';
import { StorageCore } from 'src/cores/storage.core';
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/asset.service.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat: restructure editAsset validation to support video trim
```

---

### Task 5: Update `removeAssetEdits()` for Duration Restore

**Files:**

- Modify: `server/src/services/asset.service.ts:621-631`
- Test: `server/src/services/asset.service.spec.ts`

**Step 1: Write failing tests**

```typescript
it('should restore original duration when removing trim edits', async () => {
  mocks.assetRepository.getById.mockResolvedValue(assetStub.video);
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.video.id]));
  mocks.assetEditRepository.getAll.mockResolvedValue([
    {
      id: 'edit-1',
      action: AssetEditAction.Trim,
      parameters: { startTime: 5, endTime: 25, originalDuration: 30 },
    },
  ]);

  await sut.removeAssetEdits(authStub.admin, assetStub.video.id);

  expect(mocks.assetRepository.update).toHaveBeenCalledWith({
    id: assetStub.video.id,
    duration: expect.any(String),
  });
  expect(mocks.assetEditRepository.replaceAll).toHaveBeenCalled();
});

it('should handle missing originalDuration gracefully on undo', async () => {
  mocks.assetRepository.getById.mockResolvedValue(assetStub.video);
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.video.id]));
  mocks.assetEditRepository.getAll.mockResolvedValue([
    {
      id: 'edit-1',
      action: AssetEditAction.Trim,
      parameters: { startTime: 5, endTime: 25 },
      // originalDuration intentionally missing
    },
  ]);

  await sut.removeAssetEdits(authStub.admin, assetStub.video.id);

  // Should not crash, should not update duration
  expect(mocks.assetRepository.update).not.toHaveBeenCalled();
  expect(mocks.assetEditRepository.replaceAll).toHaveBeenCalled();
});

it('should not update duration when removing non-trim edits', async () => {
  mocks.assetRepository.getById.mockResolvedValue(assetStub.image);
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
  mocks.assetEditRepository.getAll.mockResolvedValue([
    { id: 'edit-1', action: AssetEditAction.Rotate, parameters: { angle: 90 } },
  ]);

  await sut.removeAssetEdits(authStub.admin, assetStub.image.id);

  expect(mocks.assetRepository.update).not.toHaveBeenCalled();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/asset.service.spec.ts`
Expected: FAIL

**Step 3: Implement duration restore in `removeAssetEdits()`**

```typescript
async removeAssetEdits(auth: AuthDto, id: string): Promise<void> {
  await this.requireAccess({ auth, permission: Permission.AssetEditDelete, ids: [id] });

  const asset = await this.assetRepository.getById(id);
  if (!asset) {
    throw new BadRequestException('Asset not found');
  }

  // Read existing edits to check for trim (need originalDuration for restore)
  const existingEdits = await this.assetEditRepository.getAll(id);
  const trimEdit = existingEdits.find((e) => e.action === AssetEditAction.Trim);
  if (trimEdit) {
    const params = trimEdit.parameters as TrimParameters & { originalDuration?: number };
    if (params.originalDuration) {
      const restoredDuration = formatSecondsToDuration(params.originalDuration);
      await this.assetRepository.update({ id, duration: restoredDuration });
    }
  }

  await this.assetEditRepository.replaceAll(id, []);
  await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });
}
```

Add `formatSecondsToDuration` to the duration import.

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/asset.service.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat: restore original duration when removing trim edits
```

---

### Task 6: Add `MediaRepository.trim()` Method

**Files:**

- Modify: `server/src/repositories/media.repository.ts`
- Test: `server/src/repositories/media.repository.spec.ts` (if exists, otherwise unit test via service)

**Step 1: Add `trim()` method to `MediaRepository`**

Add after the `transcode()` method (around line 341):

```typescript
trim(input: string, output: string, startTime: number, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input, { niceness: 10 })
      .inputOptions([`-ss`, `${startTime}`])
      .outputOptions(['-t', `${duration}`, '-c', 'copy', '-avoid_negative_ts', 'make_zero'])
      .output(output)
      .on('start', (command: string) => this.logger.debug(command))
      .on('error', (error, _, stderr) => {
        this.logger.error(stderr || error);
        reject(error);
      })
      .on('end', () => resolve())
      .run();
  });
}
```

**Step 2: Add `extractFrame()` method**

Used by the video trim job handler to extract a thumbnail frame from the trimmed video:

```typescript
extractFrame(input: string, output: string, timeSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input, { niceness: 10 })
      .inputOptions([`-ss`, `${timeSeconds}`])
      .outputOptions(['-frames:v', '1', '-q:v', '2'])
      .output(output)
      .on('start', (command: string) => this.logger.debug(command))
      .on('error', (error, _, stderr) => {
        this.logger.error(stderr || error);
        reject(error);
      })
      .on('end', () => resolve())
      .run();
  });
}
```

**Step 3: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```
feat: add MediaRepository.trim() and extractFrame() for video editing
```

---

### Task 7: Modify `getForVideo()` to Prefer Edited Encoded Video

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:1299-1307`

**Step 1: Replace `withFilePath` with custom subquery**

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
async getForVideo(id: string) {
  return this.db
    .selectFrom('asset')
    .select(['asset.originalPath'])
    .select((eb) =>
      eb
        .selectFrom('asset_file')
        .select('asset_file.path')
        .whereRef('asset_file.assetId', '=', 'asset.id')
        .where('asset_file.type', '=', AssetFileType.EncodedVideo)
        .orderBy('asset_file.isEdited', 'desc')
        .limit(1)
        .as('encodedVideoPath'),
    )
    .where('asset.id', '=', id)
    .where('asset.type', '=', AssetType.Video)
    .executeTakeFirst();
}
```

**Step 2: Regenerate SQL documentation**

Run: `make sql`

**Step 3: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```
feat: prefer edited encoded video in getForVideo query
```

---

### Task 8: Add Video Branch to Edit Job Handler

**Files:**

- Modify: `server/src/services/media.service.ts:211-268`
- Test: `server/src/services/media.service.spec.ts`

**Step 1: Write failing tests**

Find the `handleAssetEditThumbnailGeneration` test block. Add:

```typescript
it('should trim video when edits contain Trim action', async () => {
  const videoAsset = {
    ...assetStub.video,
    edits: [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25, originalDuration: 30 } }],
    files: [],
  };
  mocks.assetJobRepository.getForGenerateThumbnailJob.mockResolvedValue(videoAsset);
  mocks.mediaRepository.probe.mockResolvedValue({
    /* mock probe result with duration */
  });

  await sut.handleAssetEditThumbnailGeneration({ id: videoAsset.id, source: 'upload' });

  expect(mocks.mediaRepository.trim).toHaveBeenCalledWith(
    expect.any(String), // input path
    expect.any(String), // output path
    5, // startTime
    20, // duration (endTime - startTime)
  );
});

it('should update asset duration after trimming', async () => {
  // similar setup, verify assetRepository.update called with new duration
});

it('should handle video undo (empty edits) by cleaning up edited files', async () => {
  const videoAsset = {
    ...assetStub.video,
    edits: [],
    files: [{ type: AssetFileType.EncodedVideo, isEdited: true, path: '/edited.mp4' }],
  };
  mocks.assetJobRepository.getForGenerateThumbnailJob.mockResolvedValue(videoAsset);

  await sut.handleAssetEditThumbnailGeneration({ id: videoAsset.id, source: 'upload' });

  // syncFiles should be called to delete orphaned edited file
  expect(mocks.assetRepository.upsertFiles).toHaveBeenCalled();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/media.service.spec.ts`
Expected: FAIL

**Step 3: Implement video branch in handler**

In `handleAssetEditThumbnailGeneration()`, add video handling before the existing image path:

```typescript
async handleAssetEditThumbnailGeneration({ id }: JobOf<JobName.AssetEditThumbnailGeneration>): Promise<JobStatus> {
  const asset = await this.assetJobRepository.getForGenerateThumbnailJob(id);
  const config = await this.getConfig({ withCache: true });

  if (!asset) {
    this.logger.warn(`Thumbnail generation failed for asset ${id}: not found`);
    return JobStatus.Failed;
  }

  const { localPath, cleanup } = await this.ensureLocalFile(asset.originalPath);

  try {
    const trimEdit = asset.edits.find((e) => e.action === AssetEditAction.Trim);

    if (asset.type === AssetType.Video && trimEdit) {
      // Video trim path
      return await this.handleVideoTrim(asset, config, trimEdit, localPath);
    }

    if (asset.type === AssetType.Video && asset.edits.length === 0) {
      // Video undo path — clean up edited files
      await this.syncFiles(
        asset.files.filter((file) => file.isEdited),
        [],
      );
      // Regenerate thumbnails from original
      await this.jobRepository.queue({ name: JobName.AssetGenerateThumbnails, data: { id } });
      return JobStatus.Success;
    }

    // Existing image path (unchanged)
    const generated = await this.generateEditedThumbnails(asset, config, localPath);
    // ... rest of existing handler ...
  } finally {
    await cleanup();
  }
}
```

Add private `handleVideoTrim()` method:

```typescript
private async handleVideoTrim(
  asset: ThumbnailAsset,
  config: SystemConfig,
  trimEdit: { parameters: unknown },
  localPath: string,
): Promise<JobStatus> {
  const params = trimEdit.parameters as TrimParameters & { originalDuration: number };
  const duration = params.endTime - params.startTime;

  // Select input: non-edited encoded video or original
  const existingEncoded = asset.files.find(
    (f) => f.type === AssetFileType.EncodedVideo && !f.isEdited,
  );
  const inputPath = existingEncoded?.path || localPath;

  // Output path for edited encoded video
  // NOTE: Cannot use getRelativeImagePath (stores in Thumbnails dir) or
  // getRelativeEncodedVideoPath (no isEdited support). Need a new helper or
  // extend getRelativeEncodedVideoPath to accept isEdited parameter.
  // The path should be in StorageFolder.EncodedVideo with an `_edited` suffix:
  const outputPath = StorageCore.getRelativeNestedPath(
    StorageFolder.EncodedVideo,
    asset.ownerId,
    `${asset.id}_edited.mp4`,
  );

  try {
    await this.mediaRepository.trim(inputPath, outputPath, params.startTime, duration);
  } catch (error) {
    this.logger.error(`FFmpeg trim failed for asset ${asset.id}: ${error}`);
    // Clean up partial output
    await fs.unlink(outputPath).catch(() => {});
    return JobStatus.Failed;
  }

  // Re-probe for actual duration
  const probeResult = await this.mediaRepository.probe(outputPath);
  if (probeResult.format.duration) {
    const newDuration = formatSecondsToDuration(probeResult.format.duration);
    await this.assetRepository.update({ id: asset.id, duration: newDuration });
  }

  // Generate thumbnails from trimmed video:
  // Extract a frame at ~10% into the trimmed video using ffmpeg,
  // then feed it into the existing thumbnail generation pipeline.
  const frameTime = duration * 0.1;
  const framePath = `${outputPath}.frame.jpg`;
  await this.mediaRepository.extractFrame(outputPath, framePath, frameTime);

  // Generate thumbnail/preview/fullsize from extracted frame
  const thumbnailFiles = await this.generateImageThumbnails(
    { ...asset, originalPath: framePath },
    config.image,
    true, // isEdited
  );

  // Clean up temp frame
  await fs.unlink(framePath).catch(() => {});

  // Sync both edited encoded video and edited thumbnail files
  const newFiles = [
    { type: AssetFileType.EncodedVideo, path: outputPath, isEdited: true },
    ...(thumbnailFiles?.files ?? []),
  ];
  await this.syncFiles(
    asset.files.filter((file) => file.isEdited),
    newFiles,
  );

  // NOTE: Do NOT emit AssetEditReadyV1 here — job.service.ts already emits it
  // automatically when the job handler returns JobStatus.Success.

  return JobStatus.Success;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/media.service.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat: add video trim branch to edit job handler
```

---

### Task 9: Regenerate OpenAPI Specs and SDK

**Files:**

- Generated: `open-api/` and SDK files

**Step 1: Build server**

Run: `cd server && pnpm build`

**Step 2: Regenerate OpenAPI specs**

Run: `cd server && pnpm sync:open-api`

**Step 3: Regenerate TypeScript SDK**

Run: `make open-api-typescript`

**Step 4: Regenerate Dart client**

Run: `make open-api-dart`

**Step 5: Run type checks**

Run: `cd server && npx tsc --noEmit`
Run: `cd web && npx tsc --noEmit`

**Step 6: Commit**

```
chore: regenerate OpenAPI specs for Trim action
```

---

### Task 10: Add `EditToolType.Trim` and `TrimManager` Skeleton

**Files:**

- Modify: `web/src/lib/managers/edit/edit-manager.svelte.ts`
- Create: `web/src/lib/managers/edit/trim-manager.svelte.ts`

**Step 1: Add `Trim` to `EditToolType` enum**

In `web/src/lib/managers/edit/edit-manager.svelte.ts:29-31`:

```typescript
export enum EditToolType {
  Transform = 'transform',
  Trim = 'trim',
}
```

**Step 2: Create `TrimManager` skeleton**

Create `web/src/lib/managers/edit/trim-manager.svelte.ts`:

```typescript
import type { EditAction, EditActions, EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import type { AssetResponseDto } from '@immich/sdk';

export class TrimManager implements EditToolManager {
  startTime = $state(0);
  endTime = $state(0);
  duration = $state(0);
  currentTime = $state(0);
  isPlaying = $state(false);
  activeHandle = $state<'start' | 'end' | null>(null);

  hasChanges = $state(false);
  canReset = $derived(this.hasChanges);
  trimmedDuration = $derived(this.endTime - this.startTime);

  startPercent = $derived(this.duration > 0 ? this.startTime / this.duration : 0);
  endPercent = $derived(this.duration > 0 ? this.endTime / this.duration : 1);
  currentPercent = $derived(this.duration > 0 ? this.currentTime / this.duration : 0);

  private videoElement: HTMLVideoElement | undefined;
  private cleanupListeners: (() => void) | undefined;

  edits: EditAction[] = $derived.by(() => {
    if (!this.hasChanges) {
      return [];
    }
    return [
      {
        action: 'trim' as const,
        parameters: {
          startTime: this.startTime,
          endTime: this.endTime,
        },
      },
    ] as EditAction[];
  });

  async onActivate(asset: AssetResponseDto, edits: EditActions): Promise<void> {
    this.duration = this.parseDuration(asset.duration);
    this.startTime = 0;
    this.endTime = this.duration;
    this.hasChanges = false;

    // Restore existing trim edits if any
    const existingTrim = edits.find((e) => e.action === 'trim');
    if (existingTrim) {
      const params = existingTrim.parameters as { startTime: number; endTime: number };
      this.startTime = params.startTime;
      this.endTime = params.endTime;
      this.hasChanges = true;
    }
  }

  onDeactivate(): void {
    this.cleanupListeners?.();
    this.cleanupListeners = undefined;
    this.videoElement = undefined;
  }

  async resetAllChanges(): Promise<void> {
    this.startTime = 0;
    this.endTime = this.duration;
    this.hasChanges = false;
  }

  setVideoElement(element: HTMLVideoElement | undefined): void {
    this.cleanupListeners?.();

    if (!element) {
      this.videoElement = undefined;
      return;
    }

    this.videoElement = element;

    const onTimeUpdate = () => {
      this.currentTime = element.currentTime;
      // Constrained playback: loop within trim region
      if (this.hasChanges && element.currentTime >= this.endTime) {
        element.pause();
        element.currentTime = this.startTime;
      }
    };

    const onPlay = () => {
      this.isPlaying = true;
    };
    const onPause = () => {
      this.isPlaying = false;
    };

    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);

    this.cleanupListeners = () => {
      element.removeEventListener('timeupdate', onTimeUpdate);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
    };
  }

  setStart(time: number): void {
    this.startTime = Math.max(0, Math.min(time, this.endTime - 1));
    this.hasChanges = true;
  }

  setEnd(time: number): void {
    this.endTime = Math.min(this.duration, Math.max(time, this.startTime + 1));
    this.hasChanges = true;
  }

  seekTo(time: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
    }
  }

  private parseDuration(duration: string | null | undefined): number {
    if (!duration) {
      return 0;
    }
    const match = duration.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!match) {
      return 0;
    }
    const [, hours, minutes, seconds, fractional] = match;
    const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    return fractional ? total + Number(`0.${fractional}`) : total;
  }
}

export const trimManager = new TrimManager();
```

**Step 3: Register TrimManager in EditManager**

In `edit-manager.svelte.ts`, add the trim tool to the `tools` array. Import `trimManager` and a placeholder component (we'll create the real one in Task 12):

```typescript
import { trimManager } from '$lib/managers/edit/trim-manager.svelte';
import { mdiContentCut } from '@mdi/js';
// TrimTool component will be created in Task 12
```

Add to `tools` array:

```typescript
tools: EditTool[] = [
  {
    type: EditToolType.Transform,
    icon: mdiCropRotate,
    component: TransformTool,
    manager: transformManager,
  },
  {
    type: EditToolType.Trim,
    icon: mdiContentCut,
    component: TrimTool, // placeholder — Task 12
    manager: trimManager,
  },
];
```

**Step 4: Extend WebSocket timeout for video edits**

In `edit-manager.svelte.ts`, modify `applyEdits()` (line 136) to use a longer timeout for video assets:

```typescript
const timeout = this.currentAsset?.type === 'VIDEO' ? 30_000 : 10_000;
const editCompleted = waitForWebsocketEvent('AssetEditReadyV1', (event) => event.asset.id === assetId, timeout);
```

**Step 5: Create minimal placeholder TrimTool component**

Create `web/src/lib/components/asset-viewer/editor/trim-tool/trim-tool.svelte` with a minimal placeholder so intermediate builds don't break:

```svelte
<p>Trim tool placeholder</p>
```

This will be replaced with the full component in Task 12.

**Step 6: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```
feat: add TrimManager with video element sync and constrained playback
```

---

### Task 11: Split `canEdit` and Update EditorPanel

**Files:**

- Modify: `web/src/lib/services/asset.service.ts:236-281`
- Modify: `web/src/lib/components/asset-viewer/editor/editor-panel.svelte`

**Step 1: Split `canEdit` into `canEdit` and `canEditImage`**

In `web/src/lib/services/asset.service.ts`, find the `canEdit` function (line 236-244). Rename it to `canEditImage` and create a new `canEdit` that allows videos:

```typescript
const canEditImage = () =>
  !sharedLink &&
  isOwner &&
  asset.type === AssetTypeEnum.Image &&
  !asset.livePhotoVideoId &&
  asset.exifInfo?.projectionType !== ProjectionType.EQUIRECTANGULAR &&
  !asset.originalPath.toLowerCase().endsWith('.insp') &&
  !asset.originalPath.toLowerCase().endsWith('.gif') &&
  !asset.originalPath.toLowerCase().endsWith('.svg');

const canEditVideo = () => {
  if (sharedLink || !isOwner || asset.type !== AssetTypeEnum.Video || asset.livePhotoVideoId) {
    return false;
  }
  // Duration must be known and >= 2 seconds
  if (!asset.duration) {
    return false;
  }
  const match = asset.duration.match(/^(\d+):(\d{2}):(\d{2})/);
  if (!match) {
    return false;
  }
  const totalSeconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return totalSeconds >= 2;
};

const canEdit = () => canEditImage() || canEditVideo();
```

Update rotate action references (around lines 260-281) to use `canEditImage` instead of `canEdit`:

```typescript
{ action: AssetAction.RotateRight, $if: canEditImage },
{ action: AssetAction.RotateLeft, $if: canEditImage },
{ action: AssetAction.Rotate180, $if: canEditImage },
```

Keep the edit button using `canEdit`:

```typescript
{ action: AssetAction.Edit, $if: canEdit },
```

**Step 2: Update EditorPanel to select tool by asset type**

In `web/src/lib/components/asset-viewer/editor/editor-panel.svelte:24-27`, change the `onMount`:

```typescript
onMount(async () => {
  const edits = await getAssetEdits({ id: asset.id });
  const toolType = asset.type === AssetTypeEnum.Video ? EditToolType.Trim : EditToolType.Transform;
  await editManager.activateTool(toolType, asset, edits);
});
```

Add import for `AssetTypeEnum` from `@immich/sdk`.

**Step 3: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (or minor issues from Task 10 placeholder)

**Step 4: Commit**

```
feat: split canEdit for video support, select trim tool for videos
```

---

### Task 12: Create TrimTimeline Component and TrimTool

**Files:**

- Create: `web/src/lib/components/asset-viewer/editor/trim-tool/trim-timeline.svelte`
- Create: `web/src/lib/components/asset-viewer/editor/trim-tool/trim-tool.svelte`

**Step 1: Create TrimTimeline component**

Create `web/src/lib/components/asset-viewer/editor/trim-tool/trim-timeline.svelte`:

This component renders the timeline bar with draggable in/out handles and playhead. Use the interactive mockup at `docs/mockups/trim-timeline-mockup.html` as the visual reference. Key elements:

- Track bar (full width, `bg-gray-800` / `bg-gray-200`)
- Trim region overlay with accent border
- Dimmed regions outside trim range
- Draggable handles with grip affordance
- Playhead line
- Time labels
- Pointer events for drag (throttled seeking every 100ms)
- Click-to-seek on track
- Keyboard: `I`/`O` for in/out (suppressed on input focus), Space for play/pause, arrow keys for handle nudge
- `aria-label`, `tabindex`, `aria-valuenow` on handles

Props: `trimManager: TrimManager`

**Step 2: Create TrimTool wrapper component**

Create `web/src/lib/components/asset-viewer/editor/trim-tool/trim-tool.svelte`:

This wraps the TrimTimeline and sidebar controls. Layout:

- Sidebar panel with:
  - Trimmed duration (large text)
  - In/Out time inputs (editable, `MM:SS.s` format)
  - "Set In" / "Set Out" buttons with keyboard hints
  - Original duration (read-only)
  - Reset button

**Step 3: Wire TrimTool into EditManager**

Update the import in `edit-manager.svelte.ts` to use the real TrimTool component.

**Step 4: Run type check and lint**

Run: `cd web && npx tsc --noEmit`
Run: `cd web && npx eslint --max-warnings 0 src/lib/components/asset-viewer/editor/trim-tool/`
Expected: PASS

**Step 5: Commit**

```
feat: add TrimTimeline and TrimTool components
```

---

### Task 13: Update EditorPanel Layout for Video

**Files:**

- Modify: `web/src/lib/components/asset-viewer/editor/editor-panel.svelte`
- Modify: `web/src/lib/components/asset-viewer/asset-viewer.svelte`
- Modify: `web/src/lib/components/asset-viewer/video-native-viewer.svelte`

**Step 1: Pass video element ref through AssetViewer**

In `asset-viewer.svelte`, add a state variable for the video element:

```typescript
let videoElement = $state<HTMLVideoElement | undefined>();
```

Pass a setter to VideoNativeViewer and pass the ref to EditorPanel.

**Step 2: Update VideoNativeViewer to expose element ref**

Add a callback prop to `video-native-viewer.svelte`:

```typescript
onVideoElementReady?: (element: HTMLVideoElement) => void;
```

Call it when the video element mounts (via `bind:this` + `$effect`).

Hide native `controls` attribute when in trim edit mode (pass an `isEditing` prop).

**Step 3: Update EditorPanel to pass video element to TrimManager**

When the trim tool is active, pass the video element to `trimManager.setVideoElement()`.

**Step 4: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```
feat: wire video element ref from viewer to trim editor
```

---

### Task 14: Frontend Unit Tests

**Files:**

- Create: `web/src/lib/managers/edit/trim-manager.spec.ts`

**Step 1: Write TrimManager tests**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrimManager } from './trim-manager.svelte';

describe('TrimManager', () => {
  let manager: TrimManager;

  beforeEach(() => {
    manager = new TrimManager();
  });

  describe('onActivate', () => {
    it('should initialize from asset duration', async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
      expect(manager.duration).toBe(30);
      expect(manager.startTime).toBe(0);
      expect(manager.endTime).toBe(30);
      expect(manager.hasChanges).toBe(false);
    });

    it('should restore existing trim edits', async () => {
      await manager.onActivate(
        { duration: '0:00:30.000000' } as any,
        [{ action: 'trim', parameters: { startTime: 5, endTime: 25 } }] as any,
      );
      expect(manager.startTime).toBe(5);
      expect(manager.endTime).toBe(25);
      expect(manager.hasChanges).toBe(true);
    });
  });

  describe('handle clamping', () => {
    beforeEach(async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
    });

    it('should clamp start past end to end - 1', () => {
      manager.setEnd(20);
      manager.setStart(25);
      expect(manager.startTime).toBe(19);
    });

    it('should clamp end before start to start + 1', () => {
      manager.setStart(10);
      manager.setEnd(5);
      expect(manager.endTime).toBe(11);
    });

    it('should clamp start to minimum 0', () => {
      manager.setStart(-5);
      expect(manager.startTime).toBe(0);
    });

    it('should clamp end to maximum duration', () => {
      manager.setEnd(50);
      expect(manager.endTime).toBe(30);
    });
  });

  describe('edits', () => {
    it('should return empty when no changes', async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
      expect(manager.edits).toEqual([]);
    });

    it('should return trim edit when changed', async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
      manager.setStart(5);
      expect(manager.edits).toHaveLength(1);
      expect(manager.edits[0]).toEqual({
        action: 'trim',
        parameters: { startTime: 5, endTime: 30 },
      });
    });
  });

  describe('resetAllChanges', () => {
    it('should reset to full duration', async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
      manager.setStart(5);
      manager.setEnd(25);
      await manager.resetAllChanges();
      expect(manager.startTime).toBe(0);
      expect(manager.endTime).toBe(30);
      expect(manager.hasChanges).toBe(false);
    });
  });

  describe('constrained playback', () => {
    it('should pause and seek to start when currentTime reaches endTime', async () => {
      await manager.onActivate({ duration: '0:00:30.000000' } as any, []);
      manager.setStart(5);
      manager.setEnd(20);

      const mockVideo = {
        currentTime: 20,
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      manager.setVideoElement(mockVideo);

      // Simulate timeupdate firing at endTime
      const onTimeUpdate = (mockVideo.addEventListener as any).mock.calls.find((c: any) => c[0] === 'timeupdate')?.[1];
      expect(onTimeUpdate).toBeDefined();
      onTimeUpdate();

      expect(mockVideo.pause).toHaveBeenCalled();
      expect(mockVideo.currentTime).toBe(5);
    });
  });

  describe('duration parsing', () => {
    it('should handle null duration', async () => {
      await manager.onActivate({ duration: null } as any, []);
      expect(manager.duration).toBe(0);
    });

    it('should handle undefined duration', async () => {
      await manager.onActivate({} as any, []);
      expect(manager.duration).toBe(0);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd web && pnpm test -- --run src/lib/managers/edit/trim-manager.spec.ts`
Expected: PASS

**Step 3: Commit**

```
test: add TrimManager unit tests
```

---

### Task 15: Server Lint, Format, and Type Check

**Files:** All modified server files

**Step 1: Format**

Run: `make format-server` (timeout: 600s)

**Step 2: Lint**

Run: `make lint-server` (timeout: 600s)

**Step 3: Type check**

Run: `make check-server` (timeout: 600s)

**Step 4: Fix any issues found**

**Step 5: Commit if changes**

```
chore: fix lint and formatting for video trim
```

---

### Task 16: Web Lint, Format, and Type Check

**Files:** All modified web files

**Step 1: Format**

Run: `make format-web` (timeout: 600s)

**Step 2: Lint**

Run: `make lint-web` (timeout: 600s)

**Step 3: Type check**

Run: `make check-web` (timeout: 600s)

**Step 4: Fix any issues found**

**Step 5: Commit if changes**

```
chore: fix lint and formatting for video trim frontend
```

---

### Task 17: E2E Tests

**Files:**

- Create or modify: `e2e/src/api/specs/asset-edit.e2e-spec.ts` (or existing edit test file)

**Step 1: Write E2E tests**

```typescript
describe('Video Trimming', () => {
  it('should trim a video and update duration', async () => {
    // Upload a test video
    // Call PUT /assets/:id/edits with Trim action
    // Wait for job completion
    // Verify asset duration changed via GET /assets/:id
  });

  it('should re-trim a previously trimmed video (widen)', async () => {
    // Trim to 5-25, then re-trim to 3-28
    // Verify duration reflects wider range (uses original source)
  });

  it('should undo trim and restore original duration', async () => {
    // Trim first, then DELETE /assets/:id/edits
    // Verify duration restored to original
  });

  it('should reject trim on image asset', async () => {
    // Upload image, attempt trim, expect 400
  });

  it('should reject trim with endTime exceeding duration', async () => {
    // Upload video, attempt trim past end, expect 400
  });

  it('should reject full-duration trim', async () => {
    // Upload video, trim start=0 end=duration, expect 400
  });

  it('should reject trim on very short video', async () => {
    // Upload ~1s video, attempt trim, expect 400
  });

  it('should reject mixed spatial and trim edits', async () => {
    // Upload video, attempt trim + rotate, expect 400
  });
});
```

**Step 2: Run E2E tests**

Run: `cd e2e && pnpm test -- --run src/api/specs/asset-edit.e2e-spec.ts`
Expected: PASS

**Step 3: Commit**

```
test: add E2E tests for video trimming
```

---

### Task 18: Final Integration Test and Cleanup

**Step 1: Run all server tests**

Run: `cd server && pnpm test`

**Step 2: Run all web tests**

Run: `cd web && pnpm test`

**Step 3: Run full lint/check**

Run: `make check-all` (timeout: 600s)
Run: `make lint-all` (timeout: 600s)

**Step 4: Verify OpenAPI specs are current**

Run: `cd server && pnpm build && pnpm sync:open-api`
Check for uncommitted changes with `git status`

**Step 5: Final commit if needed**

```
chore: final cleanup for video trimming feature
```
