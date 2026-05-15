# S3-Relative Path Audit Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix issue #396 (video CLIP encoding fails on S3) and the `copySidecar` S3 bug flagged in PR #391, while deduplicating the `ensureLocalFile` helper into `BaseService`. Add two E2E phases to the existing S3 nightly harness.

**Architecture:** Lift `ensureLocalFile(path) → { localPath, cleanup }` from two service-level duplicates into `BaseService` with a lazy `StorageService` import (matching the precedent of `BaseService.serveFromBackend`). Wrap the two bug sites — `smart-info.service.ts encodeVideoClip` and `asset.service.ts copySidecar` — using that helper. `copySidecar` drops a now-redundant `unlink` (both `fs.copyFile` and S3 `put` overwrite) and branches once on destination to handle the disk vs. S3 write.

**Tech Stack:** NestJS 11 + TypeScript on the server, Vitest unit tests with the `newTestService()` factory, Playwright/Vitest E2E in `e2e/`, `archiver` for download zip, `fluent-ffmpeg` for probe, `@aws-sdk/client-s3` via a `StorageBackend` interface.

**Design reference:** `docs/plans/2026-04-21-s3-relative-path-audit-design.md` (committed on this branch). Read it before starting.

**Worktree:** Work from `.worktrees/investigate-396` (branch `investigate/s3-ffmpeg-396`, already checked out on HEAD of main with the two design commits on top). Do not switch to main.

---

## Phase 0 — Pre-implementation verifications

Two implementation-time verifications the design doc flagged. Both feed into the PR body; they may also surface scope changes.

### Task 0.1: Grep-verify `copyAssetProperties` caller behavior

**Files:**

- Read-only: all `server/src/**/*.ts`

**Step 1: Grep for callers.**

```bash
rg -n 'copyAssetProperties\s*\(' server/src
```

**Step 2: Inspect each caller.** For each hit, look at the 20 lines after the call. Answer: does any caller synchronously inspect filesystem state (via `fs.*`, `storageRepository.checkFileExists`, `backend.exists`, or similar) on the target asset immediately after `copyAssetProperties({ sidecar: true })` returns?

**Step 3: Record the answer** in a scratch file `server/.scratch-copy-asset-caller-audit.md` (add to `.gitignore` if needed) with one line per caller: `<file>:<line> — <synchronous-fs-check? yes/no>`. This content lands in the PR body later (task 5.4).

**Expected outcome:** all callers answer "no". If any answer "yes", STOP and reopen the design doc — the `unlink` drop assumption is broken and needs rework.

**Step 4: Commit nothing.** This is investigation output; the scratch file is local-only.

---

### Task 0.2: Pin the multer disk-storage invariant

**Files:**

- Read-only: `server/src/middleware/*.ts`, `server/src/app.module.ts`

**Step 1: Grep for multer disk-storage config.**

```bash
rg -n 'diskStorage|multer|FileInterceptor|FilesInterceptor|destination:|dest:' server/src
```

**Step 2: Identify the exact file + line** that configures where incoming uploads land. This is the invariant source-of-truth underpinning the `asset-media.service.ts:345,347,361,371` safe-by-invariant claim in the design doc.

**Step 3: Record `<file>:<line>`** in the same scratch file from task 0.1. This reference goes in the PR body's "audited-safe-by-invariant" subsection.

**Step 4: Commit nothing.**

---

## Phase 1 — Lift `ensureLocalFile` to `BaseService` (C1)

Pure refactor. No behavior change. Three to four commits: add + tests together, then two removal commits, plus an optional final spec-consolidation commit.

### Task 1.1: Write failing tests for `BaseService.ensureLocalFile`

**Files:**

- Modify: `server/src/services/base.service.spec.ts` (create if it doesn't exist)

**Step 1: Check if the spec file exists.**

```bash
ls server/src/services/base.service.spec.ts 2>/dev/null && echo EXISTS || echo NEW
```

If new, scaffold with the standard `newTestService(BaseService)` pattern — see `server/test/utils.ts:newTestService` and copy the preamble from any existing `*.service.spec.ts` (e.g., `album.service.spec.ts`).

**Step 2: Add four describe-block tests** under `describe('ensureLocalFile', ...)`:

```typescript
describe('ensureLocalFile', () => {
  it('returns the path as-is with a no-op cleanup for absolute paths', async () => {
    const result = await (sut as any).ensureLocalFile('/var/lib/immich/upload/abc.jpg');
    expect(result.localPath).toBe('/var/lib/immich/upload/abc.jpg');
    await expect(result.cleanup()).resolves.toBeUndefined();
  });

  it('downloads relative keys via the backend and returns its cleanup', async () => {
    const backendCleanup = vi.fn().mockResolvedValue(undefined);
    const backend = {
      downloadToTemp: vi.fn().mockResolvedValue({ tempPath: '/tmp/abc.jpg', cleanup: backendCleanup }),
    };
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue(backend as any);

    const result = await (sut as any).ensureLocalFile('upload/user/abc.jpg');

    expect(StorageService.resolveBackendForKey).toHaveBeenCalledWith('upload/user/abc.jpg');
    expect(backend.downloadToTemp).toHaveBeenCalledWith('upload/user/abc.jpg');
    expect(result.localPath).toBe('/tmp/abc.jpg');
    await result.cleanup();
    expect(backendCleanup).toHaveBeenCalledOnce();
  });

  it('propagates errors from resolveBackendForKey without leaking cleanup', async () => {
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockImplementation(() => {
      throw new Error('unknown backend');
    });

    await expect((sut as any).ensureLocalFile('unknown://foo')).rejects.toThrow('unknown backend');
  });

  it('propagates errors from downloadToTemp without leaking cleanup', async () => {
    const backend = { downloadToTemp: vi.fn().mockRejectedValue(new Error('S3 unavailable')) };
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue(backend as any);

    await expect((sut as any).ensureLocalFile('upload/user/abc.jpg')).rejects.toThrow('S3 unavailable');
  });
});
```

Cast to `any` is acceptable for the `protected` access — matches the `serveFromBackend` test pattern if one exists.

**Step 3: Run and confirm failure.**

```bash
cd server && pnpm test -- --run src/services/base.service.spec.ts
```

Expected: all 4 new tests fail with `this.ensureLocalFile is not a function` (or equivalent).

**Step 4: Do not commit yet** — the tests are failing on purpose; commit after implementation (task 1.2).

---

### Task 1.2: Implement `BaseService.ensureLocalFile`

**Files:**

- Modify: `server/src/services/base.service.ts` (add method next to `serveFromBackend` around line 230)

**Step 1: Add the import** at the top of `base.service.ts`:

```typescript
import { isAbsolute } from 'node:path';
```

(Verify it isn't already imported; skip if so.)

**Step 2: Add the method** inside the `BaseService` class, immediately after `serveFromBackend` (line 266):

```typescript
/**
 * For assets on S3 backends, download to a local temp file for processing by
 * tools that require a filesystem path (ffmpeg, exiftool, sharp). Caller is
 * responsible for catching `downloadToTemp` errors or letting them propagate.
 *
 * @param filePath absolute disk path OR S3 relative key (anything that might
 *                 come from a DB column such as `asset.originalPath`).
 * @returns { localPath, cleanup } — cleanup is a no-op for disk paths and
 *          removes the temp file for S3-sourced paths. Always call cleanup
 *          in a `finally` block.
 */
protected async ensureLocalFile(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
  if (isAbsolute(filePath)) {
    return { localPath: filePath, cleanup: async () => {} };
  }
  // lazy import to avoid circular dependency (StorageService extends BaseService)
  const { StorageService } = await import('./storage.service.js');
  const backend = StorageService.resolveBackendForKey(filePath);
  const { tempPath, cleanup } = await backend.downloadToTemp(filePath);
  return { localPath: tempPath, cleanup };
}
```

**Step 3: Run the new tests.**

```bash
cd server && pnpm test -- --run src/services/base.service.spec.ts
```

Expected: all 4 `ensureLocalFile` tests pass.

**Step 4: Run the full server test suite** to catch anything the lazy import might break:

```bash
cd server && pnpm test -- --run
```

Expected: no new failures. (Pre-existing flakes may fail; record them but don't investigate here.)

**Step 5: Type-check.**

```bash
make check-server
```

**Step 6: Commit.**

```bash
git add server/src/services/base.service.ts server/src/services/base.service.spec.ts
git commit -m "refactor(server): lift ensureLocalFile to BaseService

Adds the shared helper matching the serveFromBackend pattern (lazy
StorageService import to avoid the BaseService <- StorageService <-
BaseService cycle). Call-site updates in media and metadata services
come in follow-up commits."
```

---

### Task 1.3: Remove duplicate from `media.service.ts`

**Files:**

- Modify: `server/src/services/media.service.ts` (remove the `ensureLocalFile` private method; verify imports remain needed)

**Step 1: Locate and delete the duplicated method.** Grep for the method body (don't rely on the line numbers above — they drift with any intervening PR):

```bash
cd server && rg -n 'private async ensureLocalFile' src/services/media.service.ts
```

Delete the method **and its preceding JSDoc comment**. Call sites that read `this.ensureLocalFile(...)` remain and will now hit the inherited `BaseService` method.

**Step 2: Check unused imports.** If `isAbsolute` is no longer referenced in `media.service.ts`, remove its import. Same for any `StorageService` direct import that was only used by the deleted method.

```bash
cd server && grep -n "isAbsolute\|StorageService" src/services/media.service.ts
```

Remove what's now unused.

**Step 3: Run media-service tests.**

```bash
cd server && pnpm test -- --run src/services/media.service.spec.ts
```

Expected: all tests pass (inheritance should be transparent).

**Step 4: Type-check and lint.**

```bash
make check-server
cd server && pnpm lint --max-warnings 0
```

**Step 5: Commit.**

```bash
git add server/src/services/media.service.ts
git commit -m "refactor(server): drop media.service ensureLocalFile duplicate"
```

---

### Task 1.4: Remove duplicate from `metadata.service.ts`

**Files:**

- Modify: `server/src/services/metadata.service.ts` (remove the `ensureLocalFile` private method)

**Step 1: Locate and delete the duplicated method,** same technique as task 1.3:

```bash
cd server && rg -n 'private async ensureLocalFile' src/services/metadata.service.ts
```

Delete the method and its preceding JSDoc comment.

**Step 2: Check unused imports** in `metadata.service.ts`. `isAbsolute` is also used for sidecar-path branching elsewhere in the file (around the S3 sidecar write path), so almost certainly stays. Verify with `rg -n 'isAbsolute\b' src/services/metadata.service.ts` before removing anything.

**Step 3: Run metadata-service tests.**

```bash
cd server && pnpm test -- --run src/services/metadata.service.spec.ts
```

**Step 4: Type-check and lint.**

```bash
make check-server
cd server && pnpm lint --max-warnings 0
```

**Step 5: Commit.**

```bash
git add server/src/services/metadata.service.ts
git commit -m "refactor(server): drop metadata.service ensureLocalFile duplicate"
```

---

### Task 1.5: Consolidate stale `ensureLocalFile` specs (if any)

**Files:**

- Potentially modify: `server/src/services/media.service.spec.ts`, `server/src/services/metadata.service.spec.ts`

**Step 1: Search for service-level tests of the old helper.**

```bash
cd server && rg -n "ensureLocalFile" src/services/*.spec.ts
```

**Step 2: Inspect each hit.** Any test that was specifically asserting the old duplicated method's absolute/relative branching (as opposed to testing a service method _through_ the helper) is now redundant — the base-service spec covers it.

**Step 3: Remove redundant tests only.** Keep any test that asserts a service method's behavior through the helper.

**Step 4: Run the affected spec files to confirm nothing regressed.**

```bash
cd server && pnpm test -- --run src/services/media.service.spec.ts src/services/metadata.service.spec.ts
```

**Step 5: Commit if anything was removed.** Otherwise skip.

```bash
git add server/src/services/media.service.spec.ts server/src/services/metadata.service.spec.ts
git commit -m "test(server): drop duplicate ensureLocalFile specs (moved to base.service.spec.ts)"
```

---

## Phase 2 — Fix issue #396: video CLIP encoding on S3 (C2)

### Task 2.1: Write failing S3 tests for `encodeVideoClip`

**Files:**

- Modify: `server/src/services/smart-info.service.spec.ts`

**Step 1: Locate the existing `handleEncodeClip` video test block.**

```bash
cd server && rg -n "handleEncodeClip|encodeVideoClip" src/services/smart-info.service.spec.ts
```

**Step 2: Add five new tests** next to the existing video cases. The pattern: mock `ensureLocalFile` (via `BaseService` prototype spy), set `asset.originalPath` to a relative key, invoke `handleEncodeClip`, assert `mediaRepository.probe` received the temp path and the cleanup spy fired.

```typescript
describe('handleEncodeClip — S3 video', () => {
  const relativeKey = 'upload/abc/foo.mp4';
  const tempPath = '/tmp/immich-xyz.mp4';
  let cleanupSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanupSpy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(sut as any, 'ensureLocalFile').mockResolvedValue({ localPath: tempPath, cleanup: cleanupSpy });
  });

  it('passes the local temp path to probe and extractVideoFrames on success', async () => {
    // arrange asset + mocks so the video branch runs to completion
    // ... existing setup for success path ...
    mocks.media.probe.mockResolvedValue({ format: { duration: 10 }, videoStreams: [...], audioStreams: [] });
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/frame-0.jpg']);
    mocks.machineLearning.encodeImage.mockResolvedValue(JSON.stringify([0.1, 0.2]));

    await sut.handleEncodeClip({ id: 'asset-id' });

    expect(mocks.media.probe).toHaveBeenCalledWith(tempPath);
    expect(mocks.media.extractVideoFrames).toHaveBeenCalledWith(tempPath, expect.any(Array), expect.any(String));
    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('calls cleanup when probe throws', async () => {
    mocks.media.probe.mockRejectedValue(new Error('ENOENT'));

    await sut.handleEncodeClip({ id: 'asset-id' });

    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('calls cleanup when extractVideoFrames throws', async () => {
    mocks.media.probe.mockResolvedValue({ format: { duration: 10 }, videoStreams: [...], audioStreams: [] });
    mocks.media.extractVideoFrames.mockRejectedValue(new Error('frame extraction failed'));

    await sut.handleEncodeClip({ id: 'asset-id' });

    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('calls cleanup when encodeImage throws on a frame', async () => {
    mocks.media.probe.mockResolvedValue({ format: { duration: 10 }, videoStreams: [...], audioStreams: [] });
    mocks.media.extractVideoFrames.mockResolvedValue(['/tmp/frame-0.jpg']);
    mocks.machineLearning.encodeImage.mockRejectedValue(new Error('ML down'));

    await sut.handleEncodeClip({ id: 'asset-id' });

    expect(cleanupSpy).toHaveBeenCalledOnce();
  });
});

describe('handleEncodeClip — disk video regression', () => {
  it('still works when originalPath is absolute (no-op cleanup)', async () => {
    // arrange asset.originalPath = '/usr/src/app/upload/abc/foo.mp4'
    // do NOT mock ensureLocalFile; rely on real passthrough
    // ... setup for success ...

    await sut.handleEncodeClip({ id: 'asset-id' });

    expect(mocks.media.probe).toHaveBeenCalledWith('/usr/src/app/upload/abc/foo.mp4');
  });
});
```

Use the existing test harness patterns — check sibling tests in the same file for how assets are constructed, how `assetJobRepository.getForClipEncoding` is mocked, how the job name signature is called.

**Step 3: Run the new tests.**

```bash
cd server && pnpm test -- --run src/services/smart-info.service.spec.ts
```

Expected: the five new tests fail (method does not yet wrap via `ensureLocalFile`).

**Step 4: Do not commit yet.**

---

### Task 2.2: Wrap `encodeVideoClip` in `ensureLocalFile`

**Files:**

- Modify: `server/src/services/smart-info.service.ts:143-189`

**Step 1: Rewrite `encodeVideoClip`.** Current body at lines 143-189:

```typescript
private async encodeVideoClip(originalPath: string, clipConfig: CLIPConfig): Promise<string | null> {
  let videoInfo: VideoInfo;
  try {
    videoInfo = await this.mediaRepository.probe(originalPath);
  } catch (error) {
    this.logger.error(`Failed to probe video: ${originalPath}`, error);
    return null;
  }
  // ... lines 152-189 ...
}
```

New body (preserve all existing logic; only changes are the outer wrap and swapping `originalPath` → `localPath` inside the ffmpeg/ML calls):

```typescript
private async encodeVideoClip(originalPath: string, clipConfig: CLIPConfig): Promise<string | null> {
  const { localPath, cleanup } = await this.ensureLocalFile(originalPath);
  try {
    let videoInfo: VideoInfo;
    try {
      videoInfo = await this.mediaRepository.probe(localPath);
    } catch (error) {
      this.logger.error(`Failed to probe video: ${originalPath}`, error);
      return null;
    }

    const duration = videoInfo.format.duration;
    let timestamps: number[];
    if (!duration || duration <= 0 || !Number.isFinite(duration)) {
      timestamps = [0];
    } else if (duration < 2) {
      timestamps = [duration / 2];
    } else {
      const count = 8;
      timestamps = Array.from({ length: count }, (_, i) => duration * (0.05 + (0.9 * i) / (count - 1)));
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'immich-video-clip-'));
    try {
      let framePaths: string[];
      try {
        framePaths = await this.mediaRepository.extractVideoFrames(localPath, timestamps, tempDir);
      } catch (error) {
        this.logger.error(`Failed to extract video frames: ${originalPath}`, error);
        return null;
      }

      let embeddings: number[][];
      try {
        embeddings = [];
        for (const framePath of framePaths) {
          const raw = await this.machineLearningRepository.encodeImage(framePath, clipConfig);
          embeddings.push(JSON.parse(raw));
        }
      } catch (error) {
        this.logger.error(`Failed to encode video frames: ${originalPath}`, error);
        return null;
      }

      const averaged = elementWiseMean(embeddings);
      return JSON.stringify(averaged);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } finally {
    await cleanup();
  }
}
```

Error logs still reference `originalPath` (the DB key) — operators correlate by that.

**Step 2: Run the smart-info tests.**

```bash
cd server && pnpm test -- --run src/services/smart-info.service.spec.ts
```

Expected: all 5 new tests + existing tests pass.

**Step 3: Type-check.**

```bash
make check-server
```

**Step 4: Commit.**

```bash
git add server/src/services/smart-info.service.ts server/src/services/smart-info.service.spec.ts
git commit -m "fix(server): route video CLIP encoding through ensureLocalFile for S3 (#396)

Issue #396: encodeVideoClip previously passed asset.originalPath
directly to mediaRepository.probe and extractVideoFrames. On S3
backends this path is a relative key and ffmpeg resolved it against
CWD, throwing ENOENT. The SmartSearch job failed for every video
upload on an S3 instance with smart search enabled.

Wraps the entire function body in ensureLocalFile with cleanup in the
outer finally, so every inner-catch early return still releases the
temp file."
```

---

## Phase 3 — Fix `copySidecar` on S3 (C3)

### Task 3.1: Write failing tests for `copySidecar`

**Files:**

- Modify: `server/src/services/asset.service.spec.ts`

**Step 1: Locate the existing `copyAssetProperties` / `copySidecar` test block.**

```bash
cd server && rg -n "copyAssetProperties|copySidecar" src/services/asset.service.spec.ts
```

**Step 2: Add a `describe('copySidecar', ...)` block** with these cases:

```typescript
describe('copySidecar', () => {
  const diskSource = { path: '/usr/src/app/upload/user/src.jpg.xmp', type: AssetFileType.Sidecar };
  const s3Source = { path: 'upload/user/src.jpg.xmp', type: AssetFileType.Sidecar };
  const diskTargetAsset = { id: 'target-id', originalPath: '/usr/src/app/upload/user/dst.jpg', files: [] };
  const s3TargetAsset = { id: 'target-id', originalPath: 'upload/user/dst.jpg', files: [] };
  let cleanupSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanupSpy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(sut as any, 'ensureLocalFile').mockImplementation(async (p: string) => ({
      localPath: p.startsWith('/') ? p : `/tmp/dl-${path.basename(p)}`,
      cleanup: p.startsWith('/') ? async () => {} : cleanupSpy,
    }));
  });

  it('disk → disk: copies via storageRepository.copyFile (regression guard)', async () => {
    await (sut as any).copySidecar({ sourceAsset: { files: [diskSource] }, targetAsset: diskTargetAsset });
    expect(mocks.storage.copyFile).toHaveBeenCalledWith(diskSource.path, `${diskTargetAsset.originalPath}.xmp`);
  });

  it('disk → S3: uploads via backend.put', async () => {
    const backendPut = vi.fn().mockResolvedValue(undefined);
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await (sut as any).copySidecar({ sourceAsset: { files: [diskSource] }, targetAsset: s3TargetAsset });

    expect(backendPut).toHaveBeenCalledWith(`${s3TargetAsset.originalPath}.xmp`, expect.anything(), {
      contentType: 'application/xml',
    });
  });

  it('S3 → disk: downloads source then copies to disk', async () => {
    await (sut as any).copySidecar({ sourceAsset: { files: [s3Source] }, targetAsset: diskTargetAsset });
    expect(mocks.storage.copyFile).toHaveBeenCalledWith(
      `/tmp/dl-${path.basename(s3Source.path)}`,
      `${diskTargetAsset.originalPath}.xmp`,
    );
    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('S3 → S3: downloads source then uploads to target', async () => {
    const backendPut = vi.fn().mockResolvedValue(undefined);
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await (sut as any).copySidecar({ sourceAsset: { files: [s3Source] }, targetAsset: s3TargetAsset });

    expect(backendPut).toHaveBeenCalledOnce();
    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('overwrites an existing target sidecar without an unlink, with source content reaching the put', async () => {
    // Headline behavioral change: no more pre-copy unlink, and the stream handed to backend.put must
    // come from localPath. Asserting on the ReadStream's `.path` property (a public Node fs.ReadStream
    // field) instead of spying on createReadStream — ESM static imports bind the symbol at load time,
    // so vi.spyOn(fs, 'createReadStream') wouldn't intercept asset.service.ts's calls.
    const existingTarget = { ...s3Source, path: `${s3TargetAsset.originalPath}.xmp` };
    const target = { ...s3TargetAsset, files: [existingTarget] };
    const backendPut = vi.fn().mockResolvedValue(undefined);
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await (sut as any).copySidecar({ sourceAsset: { files: [s3Source] }, targetAsset: target });

    expect(mocks.storage.unlink).not.toHaveBeenCalled();
    expect(backendPut).toHaveBeenCalledOnce();
    // The stream passed to backend.put must be a createReadStream of the source's localPath —
    // not of /dev/null, an empty buffer, or the target's path.
    const [, streamArg] = backendPut.mock.calls[0];
    expect(streamArg.path).toBe(`/tmp/dl-${path.basename(s3Source.path)}`);
  });

  it('succeeds when target has no existing sidecar (files: []) — disk→S3 variant', async () => {
    // Explicit coverage that the no-existing-target branch works; matrix tests cover the other combos.
    const backendPut = vi.fn().mockResolvedValue(undefined);
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await (sut as any).copySidecar({
      sourceAsset: { files: [diskSource] },
      targetAsset: { ...s3TargetAsset, files: [] },
    });

    expect(backendPut).toHaveBeenCalledOnce();
  });

  it('succeeds when targetAsset.files is undefined (not just empty)', async () => {
    // Line in copySidecar does `targetAsset.files ?? []` — assert the nullish-coalesce path is exercised.
    const backendPut = vi.fn().mockResolvedValue(undefined);
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await (sut as any).copySidecar({
      sourceAsset: { files: [s3Source] },
      targetAsset: { id: 'target-id', originalPath: s3TargetAsset.originalPath, files: undefined as any },
    });

    expect(backendPut).toHaveBeenCalledOnce();
  });

  it('returns early when source has no sidecar', async () => {
    await (sut as any).copySidecar({ sourceAsset: { files: [] }, targetAsset: s3TargetAsset });
    expect(mocks.storage.copyFile).not.toHaveBeenCalled();
    expect(cleanupSpy).not.toHaveBeenCalled();
  });

  // Source-vs-target-distinct-paths invariant is documented as a code comment in
  // asset.service.ts copySidecar (see task 3.2 step 1), not as a test — it's a
  // static fact about copyAssetProperties' sourceId !== targetId gate, not behavior
  // that copySidecar itself can verify at runtime.

  it('calls cleanup when backend.put fails', async () => {
    const backendPut = vi.fn().mockRejectedValue(new Error('S3 down'));
    const { StorageService } = await import('src/services/storage.service');
    vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue({ put: backendPut } as any);

    await expect(
      (sut as any).copySidecar({ sourceAsset: { files: [s3Source] }, targetAsset: s3TargetAsset }),
    ).rejects.toThrow('S3 down');
    expect(cleanupSpy).toHaveBeenCalledOnce();
  });

  it('calls cleanup when storageRepository.copyFile fails', async () => {
    mocks.storage.copyFile.mockRejectedValue(new Error('disk full'));

    await expect(
      (sut as any).copySidecar({ sourceAsset: { files: [s3Source] }, targetAsset: diskTargetAsset }),
    ).rejects.toThrow('disk full');
    expect(cleanupSpy).toHaveBeenCalledOnce();
  });
});
```

**Step 3: Run the tests.**

```bash
cd server && pnpm test -- --run src/services/asset.service.spec.ts
```

Expected: new tests fail. Existing `copyAssetProperties` tests should still pass until task 3.2 changes the implementation.

**Step 4: Do not commit yet.**

---

### Task 3.2: Rewrite `copySidecar`

**Files:**

- Modify: `server/src/services/asset.service.ts:313-337`

**Step 1: Replace the body** of `copySidecar` at lines 313-337 with:

```typescript
private async copySidecar({
  sourceAsset,
  targetAsset,
}: {
  sourceAsset: { files: AssetFile[] };
  targetAsset: { id: string; files: AssetFile[]; originalPath: string };
}) {
  const { sidecarFile: sourceFile } = getAssetFiles(sourceAsset.files);
  if (!sourceFile?.path) {
    return;
  }

  // Safe-by-invariant: copyAssetProperties rejects sourceId === targetId, so distinct
  // assets guarantee sourceFile.path !== targetSidecarPath.
  const targetSidecarPath = `${targetAsset.originalPath}.xmp`;

  const { localPath, cleanup } = await this.ensureLocalFile(sourceFile.path);
  try {
    if (isAbsolute(targetSidecarPath)) {
      this.storageCore.ensureFolders(targetSidecarPath);
      await this.storageRepository.copyFile(localPath, targetSidecarPath);
    } else {
      const backend = StorageService.resolveBackendForKey(targetSidecarPath);
      await backend.put(targetSidecarPath, createReadStream(localPath), { contentType: 'application/xml' });
    }
  } finally {
    await cleanup();
  }

  await this.assetRepository.upsertFile({
    assetId: targetAsset.id,
    path: targetSidecarPath,
    type: AssetFileType.Sidecar,
  });
  await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: { id: targetAsset.id } });
}
```

**Step 2: Match the `StorageService` import style used elsewhere.** `base.service.ts` lazy-imports `StorageService` inside methods because `StorageService extends BaseService` — top-level import there would cycle. `AssetService` also extends `BaseService`, so top-level is _probably_ safe — but don't guess. Check how the existing callers import:

```bash
cd server && rg -n "import .*StorageService|const \\{ StorageService \\}" src/services/asset.service.ts src/services/metadata.service.ts src/services/media.service.ts
```

Use whichever style (top-level vs. lazy-in-method) is already used in `metadata.service.ts` / `media.service.ts` for callers of `StorageService.resolveBackendForKey`. If both patterns exist, prefer lazy-in-method to match `BaseService`'s pattern. Update the step below accordingly.

**Step 3: Add the imports** at the top of `asset.service.ts` (skip any already present; move `StorageService` into a lazy import inside `copySidecar` if step 2 said so):

```typescript
import { createReadStream } from 'node:fs';
import { isAbsolute } from 'node:path';
// Either top-level:
import { StorageService } from 'src/services/storage.service';
// Or in-method (drop the top-level import if using this):
// const { StorageService } = await import('./storage.service.js');
```

**Step 4: Run the asset-service tests.**

```bash
cd server && pnpm test -- --run src/services/asset.service.spec.ts
```

Expected: all new `copySidecar` tests pass; existing `copyAssetProperties` tests pass.

**Step 5: Type-check and lint.**

```bash
make check-server
cd server && pnpm lint --max-warnings 0
```

**Step 6: Commit.**

```bash
git add server/src/services/asset.service.ts server/src/services/asset.service.spec.ts
git commit -m "fix(server): route copySidecar through ensureLocalFile for S3

copySidecar previously called storageRepository.unlink + copyFile
directly on DB-sourced paths. On S3 those paths are relative keys and
fs.* threw ENOENT, so asset duplication with sidecar=true was broken
on S3 backends (flagged as follow-up in PR #391).

Routes the source through ensureLocalFile (no-op on disk, download to
temp on S3) and branches once on the destination backend. Drops the
pre-copy unlink: both fs.copyFile and backend.put overwrite, and the
old target sidecar key always equals the new one on the same asset
(metadata.service.ts:488 always writes \${originalPath}.xmp), so the
unlink was redundant and racy."
```

---

## Phase 4 — E2E coverage

### Task 4.1: Add `phaseSmartSearchS3VideoClip` to the nightly harness

**Files:**

- Modify: `e2e/src/storage-migration.ts`

**Step 1: Read the existing phase structure.** In `e2e/src/storage-migration.ts`, look at phases around lines 960 and 1126 to see the `phase*` function signature, how `createAsset` is used to upload with `IMMICH_STORAGE_BACKEND=s3` active, and how `waitForQueueFinish` from `e2e/src/utils.ts:741` is awaited.

**Step 2: Add the phase** near the other `template-s3-*` phases. Full body:

```typescript
export const phaseSmartSearchS3VideoClip = async (state: PhaseState) => {
  const { api, adminApiKey } = state;
  console.log('\n=== phase: smart-search-s3-video-clip ===');

  const videoBuffer = readFileSync(`${testAssetDir}/formats/mp4/sample.mp4`);
  const { id: assetId, originalPath } = await createAsset(api, adminApiKey, videoBuffer, {
    filename: 'smart-search-s3.mp4',
    deviceAssetId: `smart-search-s3-${randomUUID()}`,
  });
  expect(originalPath).not.toMatch(/^\//); // proves asset landed in S3

  await waitForQueueFinish(api, adminApiKey, 'smartSearch');

  const row = await api.dbClient.selectFrom('smart_search').where('assetId', '=', assetId).executeTakeFirst();
  expect(row, 'smart_search row should exist after SmartSearch job').toBeDefined();

  console.log('phase passed');
};
```

Use an existing small test video from `e2e/test-assets/` — verify the path in `e2e/test-assets/formats/` or similar. If none exists, pick the smallest mp4 fixture already committed.

**Step 3: Verify the phase is a real regression test by proving it fails against pre-fix code.** A phase that passes against both broken and fixed code isn't catching anything. The C2 fix was committed in task 2.2, so `git stash push -- <file>` is a no-op here (no uncommitted changes) — we need to overwrite the working tree with the pre-fix version, then restore:

```bash
# 1. find the C2 commit SHA (the fix(server): route video CLIP... commit)
C2_SHA=$(git log --oneline --grep='route video CLIP' -1 --format=%H)

# 2. overwrite the working tree with the pre-fix version (parent of C2)
git checkout ${C2_SHA}^ -- server/src/services/smart-info.service.ts

# 3. rebuild if the harness needs compiled dist (make dev-update or similar — follow e2e/ README)

# 4. run the phase; assert it FAILS (smart_search row should be missing — job threw ENOENT)

# 5. restore the fix
git checkout HEAD -- server/src/services/smart-info.service.ts

# 6. rebuild again; re-run the phase; assert it PASSES
```

This assumes no commit between C2 and HEAD also touched `smart-info.service.ts`. If anything did (check `git log ${C2_SHA}..HEAD -- server/src/services/smart-info.service.ts`), manually revert only the wrap hunk that C2 introduced and use that for the "broken state" run.

If running locally is truly infeasible, document in the commit message that "pre-fix failure verification deferred to CI (revert C2 in a branch, confirm nightly goes red)."

**Step 4: Commit.**

```bash
git add e2e/src/storage-migration.ts
git commit -m "test(e2e): phase smart-search-s3-video-clip — regression for #396"
```

---

### Task 4.2: Add `phaseCopyAssetSidecarS3` to the nightly harness

**Files:**

- Modify: `e2e/src/storage-migration.ts`

**Step 1: Add the phase** next to the previous one:

```typescript
export const phaseCopyAssetSidecarS3 = async (state: PhaseState) => {
  const { api, adminApiKey } = state;
  console.log('\n=== phase: copy-asset-sidecar-s3 ===');

  // 1. upload photo + XMP sidecar pair to S3
  const photo = readFileSync(`${testAssetDir}/albums/nature/prairie_falcon.jpg`);
  const sidecarXml = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"/>';
  const { id: sourceId, originalPath: sourcePath } = await createAsset(api, adminApiKey, photo, {
    filename: 'copy-sidecar-src.jpg',
    deviceAssetId: `copy-sidecar-src-${randomUUID()}`,
    sidecarBuffer: Buffer.from(sidecarXml),
  });
  expect(sourcePath).not.toMatch(/^\//);

  // 2. upload a target photo to be the copy destination
  const { id: targetId, originalPath: targetPath } = await createAsset(api, adminApiKey, photo, {
    filename: 'copy-sidecar-dst.jpg',
    deviceAssetId: `copy-sidecar-dst-${randomUUID()}`,
  });
  expect(targetPath).not.toMatch(/^\//);

  // 3. trigger the copy with sidecar=true (exact endpoint + DTO shape per AssetService.copyAssetProperties)
  await apiCopyAssetProperties(api, adminApiKey, { sourceId, targetId, sidecar: true });
  await waitForQueueFinish(api, adminApiKey, 'metadataExtraction');

  // 4. assert target has a Sidecar file row
  const files = await api.dbClient
    .selectFrom('asset_file')
    .where('assetId', '=', targetId)
    .where('type', '=', 'sidecar')
    .selectAll()
    .execute();
  expect(files).toHaveLength(1);
  const targetSidecarKey = files[0].path;
  expect(targetSidecarKey).toBe(`${targetPath}.xmp`);

  // 5. assert the S3 object exists AND is non-empty (cheap content guard)
  const backend = resolveTestS3Backend(state);
  expect(await backend.exists(targetSidecarKey)).toBe(true);
  const { length } = await backend.get(targetSidecarKey);
  expect(length ?? 0).toBeGreaterThan(0);

  console.log('phase passed');
};
```

Verify during implementation: does `createAsset` accept a `sidecarBuffer`? If not, use whatever helper the storage-migration harness already uses for sidecar uploads (check phase `template-s3-sidecar-skipped` for the pattern). Does `apiCopyAssetProperties` exist as a helper, or is it an inline `api.assetApi.copyAssetProperties(...)` call? Follow the existing call style.

`resolveTestS3Backend` may or may not exist. Check `e2e/src/` for how other phases call `backend.exists` — there are prior art sites in `storage-migration.ts`. Reuse; don't invent.

**Step 2: Verify the phase is a real regression test by proving it fails against pre-fix code.** Same technique as task 4.1 step 3 (`git checkout <fix-commit>^ -- <file>` rather than `git stash`, because the fix is already committed by now):

```bash
# 1. find the C3 commit SHA (the fix(server): route copySidecar... commit)
C3_SHA=$(git log --oneline --grep='route copySidecar' -1 --format=%H)

# 2. overwrite with the pre-fix version
git checkout ${C3_SHA}^ -- server/src/services/asset.service.ts

# 3. rebuild, run phase: copy-asset-sidecar-s3
# 4. assert FAIL (target sidecar should be missing — copyFile threw ENOENT)

# 5. restore
git checkout HEAD -- server/src/services/asset.service.ts

# 6. rebuild, re-run, assert PASS
```

If anything between C3 and HEAD also touched `asset.service.ts`, manually revert only the `copySidecar` hunks C3 introduced for the "broken state" run. Same fallback guidance as 4.1 if running locally is infeasible.

**Step 3: Commit.**

```bash
git add e2e/src/storage-migration.ts
git commit -m "test(e2e): phase copy-asset-sidecar-s3 — regression for copySidecar S3 bug"
```

---

### Task 4.3: Wire phases into the workflow

**Files:**

- Modify: `.github/workflows/storage-migration-tests.yml`

**Step 1: Read the current phase list.** Look at how existing `template-s3-*` phases are declared (step names, commands).

**Step 2: Add two new steps** for `smart-search-s3-video-clip` and `copy-asset-sidecar-s3`, in the order they appear in the TS file, placed between existing S3 phases. Match the step-declaration style exactly (same `run:` command shape, same `name:` prefix convention).

**Step 3: Sanity-check the workflow file renders** by running:

```bash
gh workflow view storage-migration-tests.yml 2>/dev/null || true
```

(If `gh` isn't authenticated here, skip — the PR's GitHub Actions syntax check will catch malformed YAML.)

**Step 4: Commit.**

```bash
git add .github/workflows/storage-migration-tests.yml
git commit -m "ci(storage-migration): add smart-search-s3 + copy-sidecar-s3 phases"
```

---

## Phase 5 — Final validation + PR

### Task 5.1: Regenerate OpenAPI + SQL if needed

**Files:**

- Potentially: `open-api/`, `server/src/queries/*.sql`

**Step 1: Check for surface changes.** This PR didn't add controllers, DTOs, or repository methods with `@GenerateSql`, so both regenerations should be no-ops. Verify:

```bash
# Only run if a DB with immich schema is up. See feedback_sql_query_regen (memory).
# If no DB available locally, CI will fail with a diff we can apply on PR.
cd server && pnpm build && pnpm sync:open-api 2>&1 | tail -20
git status -s open-api/ server/src/queries/
```

Expected: `git status` shows no changes. If there are changes, inspect — probably unrelated drift, in which case leave as-is and let CI confirm.

**Step 2: Do not commit unless the diff is clearly scoped to this PR.**

---

### Task 5.2: Full server suite + type-check + lint

**Files:**

- (read-only)

**Step 1: Run the full server test suite.**

```bash
cd server && pnpm test -- --run
```

Expected: all pass. Known flakes (per memory) may misbehave; note but don't block.

**Step 2: Type-check.**

```bash
make check-server
```

**Step 3: Lint.**

```bash
cd server && pnpm lint --max-warnings 0
```

Expected: zero warnings.

**Step 4: Format.**

```bash
cd server && pnpm format:check
```

If it reports issues, run `pnpm format` and commit as `chore: prettier`.

---

### Task 5.3: Manual smoke via RC on personal instance

**Files:**

- (none — use the `/rc-personal` skill)

**Step 1: Push the branch** and invoke the `/rc-personal` skill to ship this branch to `personal instance`.

**Step 2: Manually verify on personal instance:**

- Upload a short video; wait ~30s; confirm a `smart_search` row appears for the asset (query the DB directly via the instance's psql or admin UI).
- Duplicate an asset with an XMP sidecar via the UI; confirm the target sidecar object exists in the S3 bucket.

**Step 3: If either check fails, STOP** and investigate before opening the PR.

**Step 4: Remove the RC override** per `feedback_pierre_rc_override_cleanup` so the next release deploy doesn't ship stale RC image.

---

### Task 5.4: Open the PR

**Files:**

- PR body (below)

**Step 1: Push.**

**Rename the branch to something PR-friendly** before pushing — `investigate/*` is the wrong prefix for a merged PR:

```bash
git branch -m fix/s3-relative-path-audit
git push -u origin fix/s3-relative-path-audit
```

**Step 2: Open PR** using `gh pr create`. Body template:

```markdown
## Summary

Fixes #396 (video CLIP encoding fails on S3) and a second S3-relative-path bug in `copySidecar` (called out as follow-up in PR #391). Deduplicates the `ensureLocalFile` helper into `BaseService`.

Design: `docs/plans/2026-04-21-s3-relative-path-audit-design.md`

## Changes

- `BaseService.ensureLocalFile` added; media + metadata duplicates removed.
- `SmartInfoService.encodeVideoClip` wraps `asset.originalPath` via `ensureLocalFile` before `probe` / `extractVideoFrames`.
- `AssetService.copySidecar` routes the source through `ensureLocalFile`, branches once on destination backend, drops the now-redundant pre-copy unlink.

## Test plan

- [ ] Server unit tests pass (`cd server && pnpm test -- --run`)
- [ ] Type-check green (`make check-server`)
- [ ] Lint zero warnings (`cd server && pnpm lint --max-warnings 0`)
- [ ] Nightly storage-migration workflow passes with the two new phases
- [ ] Manual smoke on personal instance: video upload → `smart_search` row appears; asset duplicate with sidecar → target sidecar in S3

## Verifications

- `copyAssetProperties({ sidecar: true })` caller audit: <paste content from task 0.1 scratch file>
- Multer disk-storage invariant for `asset-media.service.ts:345,347,361,371`: <paste content from task 0.2 scratch file>

## Notes

- Separate S3 download-hang bug is tracked as a follow-up; see the design doc's out-of-scope section for the hypothesis.
- @\<reporter-handle-of-396\> — please confirm the fix on your instance once the release ships.
```

Replace the `<paste ...>` placeholders with the scratch-file contents.

**Step 3: Do not auto-merge.** Per memory `feedback_review_before_merge` and `feedback_never_merge_without_asking`, wait for review + explicit user approval before merging.

---

## Checkpoint summary

| Phase               | Tasks                   | Commits |
| ------------------- | ----------------------- | ------- |
| 0 — Verifications   | 0.1, 0.2                | 0       |
| 1 — Helper lift     | 1.1, 1.2, 1.3, 1.4, 1.5 | 3–4     |
| 2 — Fix #396        | 2.1, 2.2                | 1       |
| 3 — Fix copySidecar | 3.1, 3.2                | 1       |
| 4 — E2E phases      | 4.1, 4.2, 4.3           | 3       |
| 5 — Validate + PR   | 5.1, 5.2, 5.3, 5.4      | 0–1     |
| **Total**           | 17 tasks                | 8–10    |

Expected total diff (per design): ≈400–600 LOC production + tests, + ≈100–200 LOC for the E2E phases. If the plan grows materially beyond this during execution, pause and reopen the design.
