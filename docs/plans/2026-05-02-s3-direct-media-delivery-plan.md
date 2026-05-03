# S3 Direct Media Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make S3-backed media load through authorized presigned redirects by default, with proxy mode preserved as a fallback and without the service worker owning media response bodies.

**Architecture:** Keep Gallery API routes as the authorization boundary, then let the storage backend return either a disk file, a proxy stream, or a redirect. S3 redirect mode signs content-type and content-disposition response overrides, API 302 responses use an expiry-safe cache policy, and the web app loads redirected images with anonymous CORS so canvas workflows keep working.

**Tech Stack:** NestJS, Express, AWS SDK v3 S3 presigning, Zod DTOs, Svelte 5, service worker APIs, Vitest, Docusaurus docs.

---

## Design Reference

Read `docs/plans/2026-05-02-s3-direct-media-delivery-design.md` before executing. The implementation below deliberately does not add new S3 proxy idle-timeout, stream buffering, or abort-propagation patches. Those approaches were already tried and did not resolve the production fast-scroll stall.

## File Map

- `server/src/interfaces/storage-backend.interface.ts`: Replace the bare `contentType` serve argument with a `ServeOptions` object.
- `server/src/utils/file.ts`: Add reusable content-disposition formatting and per-response disposition support for file and stream responses.
- `server/src/utils/file.spec.ts`: Cover attachment disposition and expiry-safe redirect cache headers.
- `server/src/backends/disk-storage.backend.ts`: Accept `ServeOptions` while keeping file serving behavior unchanged.
- `server/src/backends/disk-storage.backend.spec.ts`: Update call sites for the new `getServeStrategy()` signature.
- `server/src/backends/s3-storage.backend.ts`: Sign `ResponseContentType` and `ResponseContentDisposition` in redirect mode; keep proxy mode streaming unchanged.
- `server/src/backends/s3-storage.backend.spec.ts`: Cover signed response overrides and proxy compatibility.
- `server/src/backends/s3-storage.backend.integration.spec.ts`: Update the integration call signature and add a redirect URL smoke assertion for response overrides.
- `server/src/services/base.service.ts`: Pass `ServeOptions` into backends and force redirect responses to `CacheControl.PrivateWithoutCache`.
- `server/src/dtos/asset.dto.ts`: Add a `download` query flag to `/api/assets/:id/original`.
- `server/src/services/asset-media.service.ts`: Use `attachment` only when the explicit download flag is set; viewer originals remain `inline`.
- `server/src/services/asset-media.service.spec.ts`: Cover inline display, attachment download, and S3 redirect metadata.
- `web/src/lib/utils.ts`: Add `download?: boolean` to media URL generation and include it only on original media URLs.
- `web/src/lib/utils.spec.ts`: Cover original download URL generation.
- `web/src/lib/services/asset.service.ts`: Pass `download: true` for user-initiated single-asset downloads.
- `web/src/lib/services/asset.service.spec.ts`: Assert single-asset downloads request the API route with `download=true`.
- `web/src/service-worker/index.ts`: Stop registering a `fetch` handler for asset media.
- `web/src/service-worker/index.spec.ts`: Verify no service-worker fetch listener is registered.
- `web/src/lib/components/Image.svelte`: Default shared images to `crossorigin="anonymous"` with caller override support.
- `web/src/lib/components/Image.spec.ts`: Cover default and overridden CORS attributes.
- `web/src/lib/actions/image-loader.svelte.ts`: Set `img.crossOrigin` before `img.src`.
- `web/src/lib/actions/__test__/image-loader.spec.ts`: Cover off-DOM image CORS behavior.
- `web/src/lib/utils/people-utils.ts`: Set anonymous CORS before assigning `src` for helper images drawn to canvas.
- `web/src/lib/utils/people-utils.spec.ts`: Cover video face crop helper image CORS behavior.
- `web/src/lib/managers/edit/transform-manager.svelte.ts`: Set anonymous CORS before loading the editor preview image.
- `web/src/lib/managers/edit/transform-manager.svelte.spec.ts`: Cover editor preview image CORS behavior.
- `web/src/lib/utils/cast/gcast-destination.svelte.ts`: Probe media content type with a GET range request instead of HEAD.
- `web/src/lib/utils/cast/gcast-destination.svelte.spec.ts`: Cover the Cast content-type probe.
- `docs/docs/features/s3-storage.md`: Document redirect as the preferred browser-readable S3 mode and include CORS configuration.
- `docs/docs/install/environment-variables.md`: Clarify the `IMMICH_S3_SERVE_MODE` tradeoff.

## Test Coverage And Edge-Case Targets

| Scenario                                                                  | Red/green coverage in this plan                                                                                                                                                                             |
| :------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production-like fast-scroll burst against many S3 thumbnails              | Task 1 adds a burst thumbnail service test that currently fails because S3 proxy/stream behavior can remain in the API byte path; it passes only when S3 media resolves to redirect responses.              |
| Service worker owning/copying media bodies during rapid image load/cancel | Task 3 adds a burst media fetch test that currently fails because the service worker registers `fetch` and calls `respondWith()` for asset media; it passes only after media fetch interception is removed. |
| Redirect mode accidentally opening S3 `GetObject` streams                 | Task 1 adds high-cardinality S3 redirect tests that assert redirect signing does not call the S3 client's `send()` stream path.                                                                             |
| Proxy mode regression while redirect becomes preferred                    | Existing S3 proxy limiter/release tests stay in scope, and Task 1 reruns them with the new serve-options signature.                                                                                         |
| Expired presigned URL cached behind a long-lived 302                      | Task 1 covers redirect `Cache-Control: private, no-cache, no-transform`.                                                                                                                                    |
| Cross-origin image display works but canvas becomes tainted               | Task 4 covers shared `<Image>`, off-DOM loaders, face crop helpers, and editor preview images setting anonymous CORS before `src`.                                                                          |
| Cross-origin download ignores `<a download>` filename                     | Task 2 covers explicit `download=true` and attachment content-disposition signing.                                                                                                                          |
| Cast content-type probe follows `HEAD` to a GET-signed S3 URL             | Task 5 covers switching the probe to `GET` with `Range: bytes=0-0`.                                                                                                                                         |
| Provider CORS/range behavior differs from unit tests                      | Task 7 includes MinIO integration and RC smoke checks for CORS, attachment filenames, and video ranges.                                                                                                     |

---

### Task 1: Backend Serve Options And Redirect Metadata

**Files:**

- Modify: `server/src/interfaces/storage-backend.interface.ts`
- Modify: `server/src/utils/file.ts`
- Modify: `server/src/utils/file.spec.ts`
- Modify: `server/src/backends/disk-storage.backend.ts`
- Modify: `server/src/backends/disk-storage.backend.spec.ts`
- Modify: `server/src/backends/s3-storage.backend.ts`
- Modify: `server/src/backends/s3-storage.backend.spec.ts`
- Modify: `server/src/backends/s3-storage.backend.integration.spec.ts`
- Modify: `server/src/services/base.service.ts`
- Modify: `server/src/services/asset-media.service.spec.ts`

- [ ] **Step 1: Write failing backend tests**

Add these cases to `server/src/utils/file.spec.ts`:

```ts
it('should send file response with attachment disposition', async () => {
  const res = {
    set: vi.fn(),
    header: vi.fn(),
    headersSent: false,
    sendFile: vi.fn((_path: string, _options: any, cb: (err?: Error) => void) => cb()),
  } as any;
  const next = vi.fn();

  await sendFile(
    res,
    next,
    () =>
      new ImmichFileResponse({
        path: '/tmp/test-file.jpg',
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
        fileName: 'my photo.jpg',
        disposition: 'attachment',
      }),
    mockLogger,
  );

  expect(res.header).toHaveBeenCalledWith('Content-Disposition', `attachment; filename*=UTF-8''my%20photo.jpg`);
});

it('should set expiry-safe cache-control for redirect responses', async () => {
  const res = {
    set: vi.fn(),
    header: vi.fn(),
    redirect: vi.fn(),
    headersSent: false,
  } as any;
  const next = vi.fn();

  await sendFile(
    res,
    next,
    () =>
      new ImmichRedirectResponse({
        url: 'https://s3.example.com/signed-url',
        cacheControl: CacheControl.PrivateWithoutCache,
      }),
    mockLogger,
  );

  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-cache, no-transform');
  expect(res.redirect).toHaveBeenCalledWith('https://s3.example.com/signed-url');
});
```

Update `server/src/backends/s3-storage.backend.spec.ts` imports:

```ts
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CacheControl } from 'src/enum';
```

Add this redirect-mode test in `describe('getServeStrategy')`:

```ts
it('should include response override metadata in redirect presigned URLs', async () => {
  const strategy = await backend.getServeStrategy('upload/user1/photo.jpg', {
    contentType: 'image/jpeg',
    cacheControl: CacheControl.PrivateWithCache,
    fileName: 'Vacation Photo.jpg',
    disposition: 'attachment',
  });

  expect(strategy.type).toBe('redirect');
  expect(GetObjectCommand).toHaveBeenCalledWith(
    expect.objectContaining({
      Bucket: 'test-bucket',
      Key: 'upload/user1/photo.jpg',
      ResponseContentType: 'image/jpeg',
      ResponseContentDisposition: `attachment; filename*=UTF-8''Vacation%20Photo.jpg`,
    }),
  );
});
```

Add this production-regression burst test in `server/src/backends/s3-storage.backend.spec.ts` in `describe('getServeStrategy')`:

```ts
it('should sign a high-cardinality redirect burst without opening S3 read streams', async () => {
  const strategies = await Promise.all(
    Array.from({ length: 200 }, (_, index) =>
      backend.getServeStrategy(`thumbs/user1/aa/bb/thumb-${index}.webp`, {
        contentType: 'image/webp',
        cacheControl: CacheControl.PrivateWithCache,
        fileName: `thumb-${index}.webp`,
        disposition: 'inline',
      }),
    ),
  );

  expect(strategies).toHaveLength(200);
  expect(strategies.every((strategy) => strategy.type === 'redirect')).toBe(true);
  expect(mockSend).not.toHaveBeenCalled();
  expect(getSignedUrl).toHaveBeenCalledTimes(200);
});
```

Update the `server/src/services/asset-media.service.spec.ts` file import so redirect responses can be asserted:

```ts
import { ImmichFileResponse, ImmichRedirectResponse } from 'src/utils/file';
```

Add these S3 redirect bridge tests to `server/src/services/asset-media.service.spec.ts` in `describe('downloadOriginal')` and `describe('viewThumbnail')`:

```ts
it('should create a safe redirect response for S3 originals', async () => {
  const asset = AssetFactory.create({
    originalPath: 'upload/admin/aa/bb/image.jpg',
    originalFileName: 'image.jpg',
  });
  const s3Backend = {
    getServeStrategy: vi.fn().mockResolvedValue({
      type: 'redirect',
      url: 'https://s3.example.com/image.jpg?X-Amz-Signature=abc',
    }),
  };

  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForOriginal.mockResolvedValue(asset);
  const previousS3Backend = (StorageService as any).s3Backend;
  (StorageService as any).s3Backend = s3Backend;

  try {
    await expect(sut.downloadOriginal(authStub.admin, asset.id, {})).resolves.toEqual(
      expect.objectContaining({
        url: 'https://s3.example.com/image.jpg?X-Amz-Signature=abc',
        cacheControl: CacheControl.PrivateWithoutCache,
      }),
    );
    expect(s3Backend.getServeStrategy).toHaveBeenCalledWith('upload/admin/aa/bb/image.jpg', {
      contentType: 'image/jpeg',
      cacheControl: CacheControl.PrivateWithCache,
      fileName: 'image.jpg',
      disposition: 'inline',
    });
  } finally {
    (StorageService as any).s3Backend = previousS3Backend;
  }
});

it('should return safe redirects for a burst of S3 thumbnail loads without API streaming', async () => {
  const asset = AssetFactory.from()
    .file({ type: AssetFileType.Thumbnail, path: 'thumbs/admin/aa/bb/thumb.jpg' })
    .build();
  const path = asset.files[0].path;
  const s3Backend = {
    getServeStrategy: vi.fn().mockResolvedValue({
      type: 'redirect',
      url: 'https://s3.example.com/thumb.jpg?X-Amz-Signature=abc',
    }),
  };

  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path });
  const previousS3Backend = (StorageService as any).s3Backend;
  (StorageService as any).s3Backend = s3Backend;

  try {
    const results = await Promise.all(
      Array.from({ length: 150 }, () =>
        sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL }),
      ),
    );

    expect(results).toHaveLength(150);
    expect(results.every((result) => result instanceof ImmichRedirectResponse)).toBe(true);
    for (const result of results) {
      expect(result).toEqual(
        expect.objectContaining({
          url: 'https://s3.example.com/thumb.jpg?X-Amz-Signature=abc',
          cacheControl: CacheControl.PrivateWithoutCache,
        }),
      );
    }
    expect(s3Backend.getServeStrategy).toHaveBeenCalledTimes(150);
    expect(s3Backend.getServeStrategy).toHaveBeenNthCalledWith(1, path, {
      contentType: 'image/jpeg',
      cacheControl: CacheControl.PrivateWithCache,
      fileName: `IMG_${asset.id}_thumbnail.jpg`,
      disposition: 'inline',
    });
  } finally {
    (StorageService as any).s3Backend = previousS3Backend;
  }
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --dir server test src/utils/file.spec.ts src/backends/s3-storage.backend.spec.ts src/services/asset-media.service.spec.ts --run
```

Expected: FAIL because `disposition` and `ServeOptions` do not exist yet.

- [ ] **Step 3: Add serve option types**

Replace `server/src/interfaces/storage-backend.interface.ts` with this shape:

```ts
import { Readable } from 'node:stream';
import { CacheControl } from 'src/enum';
import type { ContentDisposition } from 'src/utils/file';

export type ServeOptions = {
  contentType: string;
  cacheControl: CacheControl;
  fileName?: string;
  disposition?: ContentDisposition;
};

export type ServeStrategy =
  | { type: 'file'; path: string }
  | { type: 'redirect'; url: string }
  | { type: 'stream'; stream: Readable; length?: number };

export interface StorageBackend {
  put(key: string, source: Buffer | Readable, options?: { contentType?: string }): Promise<void>;
  get(key: string): Promise<{ stream: Readable; contentType?: string; length?: number }>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
  getServeStrategy(key: string, options: ServeOptions): Promise<ServeStrategy>;
  downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }>;
  getPrefixUsage(prefix: string): Promise<number>;
}
```

- [ ] **Step 4: Add response disposition support**

In `server/src/utils/file.ts`, add the type and helper near the response classes:

```ts
export type ContentDisposition = 'inline' | 'attachment';

export const getContentDispositionHeader = (disposition: ContentDisposition, fileName: string): string => {
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};
```

Add `public readonly disposition?: ContentDisposition;` to `ImmichFileResponse` and `ImmichStreamResponse`.

Replace each inline content-disposition header in `sendFile()` with:

```ts
res.header('Content-Disposition', getContentDispositionHeader(file.disposition ?? 'inline', file.fileName));
```

- [ ] **Step 5: Update storage backends**

In `server/src/backends/disk-storage.backend.ts`, change the signature only:

```ts
async getServeStrategy(key: string, _options: ServeOptions): Promise<ServeStrategy> {
  return { type: 'file', path: this.resolvePath(key) };
}
```

In `server/src/backends/s3-storage.backend.ts`, import the new types and helper:

```ts
import type { ServeOptions, ServeStrategy } from 'src/interfaces/storage-backend.interface';
import { getContentDispositionHeader } from 'src/utils/file';
```

Change `getServeStrategy()` to:

```ts
async getServeStrategy(key: string, options: ServeOptions): Promise<ServeStrategy> {
  if (this.serveMode === 'proxy') {
    await this.proxyLimiter.acquire();
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        this.proxyLimiter.release();
      }
    };

    try {
      const { stream, length } = await this.get(key);
      return { type: 'stream', stream: releaseWhenStreamCloses(stream, release), length };
    } catch (error) {
      release();
      throw error;
    }
  }

  const commandInput = {
    Bucket: this.bucket,
    Key: key,
    ResponseContentType: options.contentType,
    ResponseContentDisposition: options.fileName
      ? getContentDispositionHeader(options.disposition ?? 'inline', options.fileName)
      : undefined,
  };

  const command = new GetObjectCommand(commandInput);
  const url = await getSignedUrl(this.client, command, { expiresIn: this.presignedUrlExpiry });
  return { type: 'redirect', url };
}
```

Use `GetObjectCommandInput` if TypeScript asks for explicit typing:

```ts
const commandInput: GetObjectCommandInput = {
  Bucket: this.bucket,
  Key: key,
  ResponseContentType: options.contentType,
};
if (options.fileName) {
  commandInput.ResponseContentDisposition = getContentDispositionHeader(
    options.disposition ?? 'inline',
    options.fileName,
  );
}
```

- [ ] **Step 6: Update BaseService redirect policy**

In `server/src/services/base.service.ts`, update `serveFromBackend()` to accept disposition and pass `ServeOptions`:

```ts
protected async serveFromBackend(
  filePath: string,
  contentType: string,
  cacheControl: CacheControl,
  fileName?: string,
  disposition: ContentDisposition = 'inline',
): Promise<ImmichMediaResponse> {
  const { StorageService } = await import('./storage.service.js');
  const backend = StorageService.resolveBackendForKey(filePath);
  const strategy: ServeStrategy = await backend.getServeStrategy(filePath, {
    contentType,
    cacheControl,
    fileName,
    disposition,
  });
  const responseDisposition = disposition === 'inline' ? undefined : disposition;

  switch (strategy.type) {
    case 'file': {
      return new ImmichFileResponse({
        path: strategy.path,
        contentType,
        cacheControl,
        fileName,
        disposition: responseDisposition,
      });
    }
    case 'redirect': {
      return new ImmichRedirectResponse({
        url: strategy.url,
        cacheControl: CacheControl.PrivateWithoutCache,
      });
    }
    case 'stream': {
      return new ImmichStreamResponse({
        stream: strategy.stream,
        contentType,
        length: strategy.length,
        cacheControl,
        fileName,
        disposition: responseDisposition,
      });
    }
  }
}
```

Add `ContentDisposition` to the `src/utils/file` import.

- [ ] **Step 7: Update backend call sites and tests**

Replace direct test calls like this:

```ts
await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');
```

with:

```ts
await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', {
  contentType: 'image/webp',
  cacheControl: CacheControl.PrivateWithCache,
});
```

Apply the same pattern in:

- `server/src/backends/disk-storage.backend.spec.ts`
- `server/src/backends/s3-storage.backend.spec.ts`
- `server/src/backends/s3-storage.backend.integration.spec.ts`

- [ ] **Step 8: Run backend tests**

Run:

```bash
pnpm --dir server test src/utils/file.spec.ts src/backends/disk-storage.backend.spec.ts src/backends/s3-storage.backend.spec.ts src/services/asset-media.service.spec.ts --run
pnpm --dir server check
```

Expected: PASS.

- [ ] **Step 9: Commit backend serve metadata**

Run:

```bash
git add server/src/interfaces/storage-backend.interface.ts server/src/utils/file.ts server/src/utils/file.spec.ts server/src/backends/disk-storage.backend.ts server/src/backends/disk-storage.backend.spec.ts server/src/backends/s3-storage.backend.ts server/src/backends/s3-storage.backend.spec.ts server/src/backends/s3-storage.backend.integration.spec.ts server/src/services/base.service.ts server/src/services/asset-media.service.spec.ts
git commit -m "feat: sign s3 media response metadata"
```

---

### Task 2: Explicit Original Download Disposition

**Files:**

- Modify: `server/src/dtos/asset.dto.ts`
- Modify: `server/src/services/asset-media.service.ts`
- Modify: `server/src/services/asset-media.service.spec.ts`
- Modify: `web/src/lib/utils.ts`
- Modify: `web/src/lib/utils.spec.ts`
- Modify: `web/src/lib/services/asset.service.ts`
- Modify: `web/src/lib/services/asset.service.spec.ts`

- [ ] **Step 1: Write failing server tests**

Add this case to `server/src/services/asset-media.service.spec.ts` in `describe('downloadOriginal')`:

```ts
it('should mark explicit original downloads as attachments', async () => {
  const asset = AssetFactory.create();
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForOriginal.mockResolvedValue(asset);

  await expect(sut.downloadOriginal(authStub.admin, asset.id, { download: true })).resolves.toEqual(
    new ImmichFileResponse({
      path: asset.originalPath,
      fileName: asset.originalFileName,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.PrivateWithCache,
      disposition: 'attachment',
    }),
  );
});

it('should keep original viewer requests inline by default', async () => {
  const asset = AssetFactory.create();
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForOriginal.mockResolvedValue(asset);

  const response = await sut.downloadOriginal(authStub.admin, asset.id, {});
  expect(response).toEqual(
    new ImmichFileResponse({
      path: asset.originalPath,
      fileName: asset.originalFileName,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.PrivateWithCache,
    }),
  );
  expect(response).not.toHaveProperty('disposition');
});
```

- [ ] **Step 2: Write failing web URL tests**

Update the import in `web/src/lib/utils.spec.ts`:

```ts
import { getAssetMediaUrl, getAssetUrl, getMemoryTitle, getReleaseType } from '$lib/utils';
import { AssetMediaSize, AssetTypeEnum, MemoryType, type MemoryResponseDto } from '@immich/sdk';
```

Add these cases under `describe('utils')`:

```ts
describe(getAssetMediaUrl.name, () => {
  it('adds download=true to original media URLs when requested', () => {
    const url = getAssetMediaUrl({
      id: 'asset-1',
      size: AssetMediaSize.Original,
      edited: false,
      cacheKey: 'cache-1',
      download: true,
    });

    expect(url).toContain('/api/assets/asset-1/original');
    expect(url).toContain('download=true');
    expect(url).toContain('edited=false');
    expect(url).toContain('c=cache-1');
  });

  it('does not add download=true to thumbnail media URLs', () => {
    const url = getAssetMediaUrl({
      id: 'asset-1',
      size: AssetMediaSize.Thumbnail,
      download: true,
    });

    expect(url).toContain('/api/assets/asset-1/thumbnail');
    expect(url).not.toContain('download=true');
  });
});
```

In `web/src/lib/services/asset.service.spec.ts`, add a hoisted mock above the existing mocks:

```ts
const { downloadUrlMock } = vitest.hoisted(() => ({
  downloadUrlMock: vitest.fn(),
}));

vitest.mock('$lib/utils/asset-utils', async () => {
  const originalModule = await vitest.importActual<typeof import('$lib/utils/asset-utils')>('$lib/utils/asset-utils');
  return {
    ...originalModule,
    downloadUrl: downloadUrlMock,
  };
});
```

Add this case in `describe('handleDownloadAsset')`:

```ts
it('should request attachment disposition for single-asset downloads', async () => {
  downloadUrlMock.mockClear();
  const $t = vitest.fn().mockReturnValue('formatter');
  vitest.mocked(getFormatter).mockResolvedValue($t);
  const asset = assetFactory.build({ id: 'asset-1', originalFileName: 'asset.jpg', thumbhash: 'cache-1' });

  await handleDownloadAsset(asset, { edited: false });

  expect(downloadUrlMock).toHaveBeenCalledWith(expect.stringContaining('/api/assets/asset-1/original'), 'asset.jpg');
  expect(downloadUrlMock.mock.calls[0][0]).toContain('download=true');
  expect(downloadUrlMock.mock.calls[0][0]).toContain('edited=false');
  expect(downloadUrlMock.mock.calls[0][0]).toContain('c=cache-1');
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
pnpm --dir server test src/services/asset-media.service.spec.ts --run
pnpm --dir web test src/lib/utils.spec.ts src/lib/services/asset.service.spec.ts --run
```

Expected: FAIL because the `download` flag is not defined or propagated.

- [ ] **Step 4: Add server download flag**

In `server/src/dtos/asset.dto.ts`, extend `AssetDownloadOriginalSchema`:

```ts
const AssetDownloadOriginalSchema = z
  .object({
    edited: stringToBool.default(false).optional().describe('Return edited asset if available'),
    download: stringToBool.default(false).optional().describe('Return original asset as an attachment download'),
  })
  .meta({ id: 'AssetDownloadOriginalDto' });
```

In `server/src/services/asset-media.service.ts`, change the final `serveFromBackend()` call in `downloadOriginal()`:

```ts
return this.serveFromBackend(
  path,
  mimeTypes.lookup(path),
  CacheControl.PrivateWithCache,
  getFileNameWithoutExtension(originalFileName) + getFilenameExtension(path),
  dto.download ? 'attachment' : 'inline',
);
```

In `viewThumbnail()`, make the inline behavior explicit:

```ts
return this.serveFromBackend(path, mimeTypes.lookup(path), CacheControl.PrivateWithCache, fileName, 'inline');
```

- [ ] **Step 5: Add web download URL propagation**

In `web/src/lib/utils.ts`, update the type and URL builder:

```ts
type AssetUrlOptions = {
  id: string;
  cacheKey?: string | null;
  edited?: boolean;
  size?: AssetMediaSize;
  download?: boolean;
};

export const getAssetMediaUrl = (options: AssetUrlOptions) => {
  const { id, size, cacheKey: c, edited = true, download } = options;
  const isOriginal = size === AssetMediaSize.Original;
  const path = isOriginal ? getAssetOriginalPath(id) : getAssetThumbnailPath(id);
  return createUrl(path, {
    ...authManager.params,
    size: isOriginal ? undefined : size,
    c,
    edited,
    download: isOriginal ? download : undefined,
  });
};
```

In `web/src/lib/services/asset.service.ts`, update the single-asset download call:

```ts
downloadUrl(getAssetMediaUrl({ id, size: AssetMediaSize.Original, edited, cacheKey, download: true }), filename);
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --dir server test src/services/asset-media.service.spec.ts --run
pnpm --dir web test src/lib/utils.spec.ts src/lib/services/asset.service.spec.ts --run
```

Expected: PASS.

- [ ] **Step 7: Commit explicit download disposition**

Run:

```bash
git add server/src/dtos/asset.dto.ts server/src/services/asset-media.service.ts server/src/services/asset-media.service.spec.ts web/src/lib/utils.ts web/src/lib/utils.spec.ts web/src/lib/services/asset.service.ts web/src/lib/services/asset.service.spec.ts
git commit -m "feat: preserve filenames for s3 original downloads"
```

---

### Task 3: Service Worker Media Bypass

**Files:**

- Modify: `web/src/service-worker/index.ts`
- Create: `web/src/service-worker/index.spec.ts`

- [ ] **Step 1: Write failing service-worker registration test**

Create `web/src/service-worker/index.spec.ts`:

```ts
import { installMessageListener } from './messaging';

vi.mock('./messaging', () => ({
  installMessageListener: vi.fn(),
}));

describe('service worker index', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('does not register a fetch listener for media requests', async () => {
    const addEventListener = vi.spyOn(globalThis, 'addEventListener');
    Object.defineProperty(globalThis, 'clients', {
      value: { claim: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'skipWaiting', {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });

    await import('./index');

    expect(addEventListener).toHaveBeenCalledWith('install', expect.any(Function), { passive: true });
    expect(addEventListener).toHaveBeenCalledWith('activate', expect.any(Function), { passive: true });
    expect(addEventListener.mock.calls.some(([eventName]) => eventName === 'fetch')).toBe(false);
    expect(installMessageListener).toHaveBeenCalledOnce();
  });

  it('does not take ownership of a burst of asset media fetches', async () => {
    const listeners = new Map<string, EventListener[]>();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    vi.spyOn(globalThis, 'addEventListener').mockImplementation((eventName, listener) => {
      const key = String(eventName);
      listeners.set(key, [...(listeners.get(key) ?? []), listener as EventListener]);
    });
    Object.defineProperty(globalThis, 'clients', {
      value: { claim: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'skipWaiting', {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });

    await import('./index');

    const fetchListeners = listeners.get('fetch') ?? [];
    const respondWith = vi.fn();
    for (let index = 0; index < 200; index++) {
      for (const listener of fetchListeners) {
        listener({
          request: new Request(
            `${location.origin}/api/assets/00000000-0000-4000-8000-${String(index).padStart(12, '0')}/thumbnail`,
          ),
          respondWith,
        } as unknown as Event);
      }
    }

    expect(fetchListeners).toHaveLength(0);
    expect(respondWith).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --dir web test src/service-worker/index.spec.ts --run
```

Expected: FAIL because `index.ts` still registers a `fetch` listener.

- [ ] **Step 3: Remove the media fetch intercept**

In `web/src/service-worker/index.ts`, remove:

```ts
import { handleFetch as handleAssetFetch } from './request';

const ASSET_REQUEST_REGEX = /^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/;
```

Remove the `handleFetch()` function and this registration:

```ts
sw.addEventListener('fetch', handleFetch, { passive: true });
```

The final file should keep install, activate, and message handling:

```ts
sw.addEventListener('install', handleInstall, { passive: true });
sw.addEventListener('activate', handleActivate, { passive: true });
installMessageListener();
```

Keep `web/src/service-worker/request.ts` and `web/src/service-worker/messaging.ts` in this change. `cancelImageUrl()` remains harmless when no media fetches are owned by the service worker.

- [ ] **Step 4: Run service-worker test**

Run:

```bash
pnpm --dir web test src/service-worker/index.spec.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit service-worker bypass**

Run:

```bash
git add web/src/service-worker/index.ts web/src/service-worker/index.spec.ts
git commit -m "fix: bypass service worker for media requests"
```

---

### Task 4: CORS-Safe Image Loading

**Files:**

- Modify: `web/src/lib/components/Image.svelte`
- Modify: `web/src/lib/components/Image.spec.ts`
- Modify: `web/src/lib/actions/image-loader.svelte.ts`
- Create: `web/src/lib/actions/__test__/image-loader.spec.ts`
- Modify: `web/src/lib/utils/people-utils.ts`
- Modify: `web/src/lib/utils/people-utils.spec.ts`
- Modify: `web/src/lib/managers/edit/transform-manager.svelte.ts`
- Create: `web/src/lib/managers/edit/transform-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing image component tests**

Add these cases to `web/src/lib/components/Image.spec.ts`:

```ts
it('renders anonymous CORS by default', () => {
  const { baseElement } = render(Image, { src: '/test.jpg', alt: 'test' });
  const img = baseElement.querySelector('img')!;
  expect(img).toHaveAttribute('crossorigin', 'anonymous');
});

it('allows callers to override crossorigin', () => {
  const { baseElement } = render(Image, { src: '/test.jpg', alt: 'test', crossorigin: 'use-credentials' });
  const img = baseElement.querySelector('img')!;
  expect(img).toHaveAttribute('crossorigin', 'use-credentials');
});
```

Create `web/src/lib/actions/__test__/image-loader.spec.ts`:

```ts
import { loadImage } from '$lib/actions/image-loader.svelte';

describe('loadImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets anonymous CORS before assigning src', () => {
    const originalCreateElement = document.createElement.bind(document);
    let imageElement: HTMLImageElement | undefined;
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'img') {
        imageElement = element as HTMLImageElement;
      }
      return element;
    });

    loadImage('/api/assets/asset-1/thumbnail', vi.fn(), vi.fn());

    expect(imageElement).toBeDefined();
    expect(imageElement!.crossOrigin).toBe('anonymous');
    expect(imageElement!.src).toContain('/api/assets/asset-1/thumbnail');
  });
});
```

- [ ] **Step 2: Write failing canvas helper tests**

Update `web/src/lib/utils/people-utils.spec.ts` imports:

```ts
import { AssetTypeEnum } from '@immich/sdk';
import { getBoundingBox, zoomImageToBase64 } from '$lib/utils/people-utils';
```

Add this mock near the top:

```ts
vi.mock('$lib/utils', () => ({
  getAssetMediaUrl: vi.fn(() => '/api/assets/asset-1/thumbnail'),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

Add this case:

```ts
it('sets anonymous CORS on images used for video face crops', async () => {
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toDataURL: () => 'data:image/png;base64,face',
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tagName);
  });

  class TestImage {
    crossOrigin = '';
    naturalWidth = 4000;
    naturalHeight = 3000;
    private currentSrc = '';

    set src(value: string) {
      this.currentSrc = value;
    }

    get src() {
      return this.currentSrc;
    }

    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject) {
      if (eventName === 'load') {
        queueMicrotask(() => {
          if (typeof listener === 'function') {
            listener(new Event('load'));
          }
        });
      }
    }
  }

  const imageMock = vi.fn(() => new TestImage());
  vi.stubGlobal('Image', imageMock);

  const result = await zoomImageToBase64(makeFace(), 'asset-1', AssetTypeEnum.Video, undefined);

  expect(result).toBe('data:image/png;base64,face');
  expect(imageMock).toHaveBeenCalledTimes(2);
  expect(imageMock.mock.results[0].value.crossOrigin).toBe('anonymous');
  expect(imageMock.mock.results[1].value.crossOrigin).toBe('anonymous');
});
```

Create `web/src/lib/managers/edit/transform-manager.svelte.spec.ts`:

```ts
import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';

describe('transformManager image loading', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    transformManager.onDeactivate();
  });

  it('sets anonymous CORS before assigning the editor preview src', async () => {
    const image = {
      crossOrigin: '',
      src: '',
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLImageElement;
    vi.stubGlobal(
      'Image',
      vi.fn(() => image),
    );

    const asset = assetFactory.build({
      id: 'asset-1',
      type: AssetTypeEnum.Image,
      thumbhash: 'cache-1',
      exifInfo: { exifImageWidth: 4000, exifImageHeight: 3000 } as any,
    });

    await transformManager.onActivate(asset, []);

    expect(image.crossOrigin).toBe('anonymous');
    expect(image.src).toContain('/api/assets/asset-1/thumbnail');
  });
});
```

- [ ] **Step 3: Run failing web tests**

Run:

```bash
pnpm --dir web test src/lib/components/Image.spec.ts src/lib/actions/__test__/image-loader.spec.ts src/lib/utils/people-utils.spec.ts src/lib/managers/edit/transform-manager.svelte.spec.ts --run
```

Expected: FAIL because anonymous CORS is not set yet.

- [ ] **Step 4: Implement shared image CORS defaults**

In `web/src/lib/components/Image.svelte`, destructure `crossorigin` with a default:

```svelte
let { src, onStart, onLoad, onError, ref = $bindable(), crossorigin = 'anonymous', ...rest }: Props = $props();
```

Add the attribute to the `<img>` element before `{...rest}` or after it. Since `crossorigin` is destructured, it will not be duplicated:

```svelte
<img
  bind:this={ref}
  src={capturedSource}
  crossorigin={crossorigin}
  {...rest}
  style:visibility={isFirefox && !loaded ? 'hidden' : undefined}
  onload={handleLoad}
  onerror={handleError}
/>
```

In `web/src/lib/actions/image-loader.svelte.ts`, set CORS before `src`:

```ts
const img = document.createElement('img');
img.crossOrigin = 'anonymous';
img.addEventListener('load', handleLoad);
img.addEventListener('error', handleError);
```

- [ ] **Step 5: Implement explicit canvas image CORS**

In `web/src/lib/utils/people-utils.ts`, set CORS before each `src` assignment:

```ts
const img: HTMLImageElement = new Image();
img.crossOrigin = 'anonymous';
img.src = data;
```

and:

```ts
const faceImage = new Image();
faceImage.crossOrigin = 'anonymous';
faceImage.src = image.src;
```

In `web/src/lib/managers/edit/transform-manager.svelte.ts`, set CORS immediately after constructing the image:

```ts
this.imgElement = new Image();
this.imgElement.crossOrigin = 'anonymous';
```

- [ ] **Step 6: Run focused web tests**

Run:

```bash
pnpm --dir web test src/lib/components/Image.spec.ts src/lib/actions/__test__/image-loader.spec.ts src/lib/utils/people-utils.spec.ts src/lib/managers/edit/transform-manager.svelte.spec.ts --run
pnpm --dir web check:typescript
```

Expected: PASS.

- [ ] **Step 7: Commit CORS-safe image loading**

Run:

```bash
git add web/src/lib/components/Image.svelte web/src/lib/components/Image.spec.ts web/src/lib/actions/image-loader.svelte.ts web/src/lib/actions/__test__/image-loader.spec.ts web/src/lib/utils/people-utils.ts web/src/lib/utils/people-utils.spec.ts web/src/lib/managers/edit/transform-manager.svelte.ts web/src/lib/managers/edit/transform-manager.svelte.spec.ts
git commit -m "fix: load redirected media with anonymous cors"
```

---

### Task 5: Cast Content-Type Probe For Redirect Mode

**Files:**

- Modify: `web/src/lib/utils/cast/gcast-destination.svelte.ts`
- Create: `web/src/lib/utils/cast/gcast-destination.svelte.spec.ts`

- [ ] **Step 1: Write failing Cast probe test**

Create `web/src/lib/utils/cast/gcast-destination.svelte.spec.ts`:

```ts
import { getMediaContentType } from '$lib/utils/cast/gcast-destination.svelte';

describe('getMediaContentType', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses a GET range probe so redirect-mode S3 keeps the signed GET method', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        headers: { 'content-type': 'video/mp4' },
      }),
    );

    await expect(getMediaContentType('/api/assets/asset-1/video/playback')).resolves.toBe('video/mp4');
    expect(fetchMock).toHaveBeenCalledWith('/api/assets/asset-1/video/playback', {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
  });

  it('returns null when the media response has no content type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));

    await expect(getMediaContentType('/api/assets/asset-1/video/playback')).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run failing Cast probe test**

Run:

```bash
pnpm --dir web test src/lib/utils/cast/gcast-destination.svelte.spec.ts --run
```

Expected: FAIL because `getMediaContentType()` does not exist and Cast still uses `HEAD`.

- [ ] **Step 3: Add GET range content-type probe**

In `web/src/lib/utils/cast/gcast-destination.svelte.ts`, add this helper near the imports:

```ts
export const getMediaContentType = async (mediaUrl: string) => {
  const response = await fetch(mediaUrl, {
    method: 'GET',
    headers: { Range: 'bytes=0-0' },
  });
  return response.headers.get('content-type');
};
```

Replace the existing `HEAD` probe:

```ts
const assetHead = await fetch(mediaUrl, { method: 'HEAD' });
const contentType = assetHead.headers.get('content-type');
```

with:

```ts
const contentType = await getMediaContentType(mediaUrl);
```

Keep the existing error when `contentType` is missing.

- [ ] **Step 4: Run Cast probe test**

Run:

```bash
pnpm --dir web test src/lib/utils/cast/gcast-destination.svelte.spec.ts --run
pnpm --dir web check:typescript
```

Expected: PASS.

- [ ] **Step 5: Commit Cast redirect compatibility**

Run:

```bash
git add web/src/lib/utils/cast/gcast-destination.svelte.ts web/src/lib/utils/cast/gcast-destination.svelte.spec.ts
git commit -m "fix: probe cast media with get range"
```

---

### Task 6: S3 Redirect Documentation And CORS Guidance

**Files:**

- Modify: `docs/docs/features/s3-storage.md`
- Modify: `docs/docs/install/environment-variables.md`

- [ ] **Step 1: Update S3 serve mode guidance**

In `docs/docs/features/s3-storage.md`, replace the serve mode table with:

```md
| Mode       | Behavior                                                                                                                          |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `redirect` | Returns a temporary presigned URL. The client downloads directly from S3. Recommended when the browser can reach the S3 endpoint. |
| `proxy`    | The Gallery server streams the file from S3 to the client. Use only when S3 is not directly reachable by browsers.                |
```

Replace the "Choose a Serve Mode" bullets with:

```md
- **`redirect`** (default) - Recommended for browser-readable S3 endpoints. Gallery authorizes the API request and returns a short-lived presigned URL, so media bytes flow directly from S3 to the browser.
- **`proxy`** - Compatibility mode for private-network S3 endpoints. Gallery streams every media byte through the API process, so it costs more server resources and is not the recommended mode for large scrolling grids.
```

- [ ] **Step 2: Add CORS section**

Add this section after "Choose a Serve Mode":

````md
### 4. Configure CORS For Redirect Mode

Redirect mode keeps the bucket private, but browsers need CORS headers when Gallery draws S3 images to canvas for editing, face crops, and copy-to-clipboard.

Use an origin list that matches your deployment:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://gallery.example.com", "http://localhost:3000", "http://localhost:2283"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "Content-Type", "ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

For S3-compatible providers that support the AWS CLI, apply it with:

```bash
aws --endpoint-url "$IMMICH_S3_ENDPOINT" s3api put-bucket-cors \
  --bucket "$IMMICH_S3_BUCKET" \
  --cors-configuration '{"CORSRules":[{"AllowedOrigins":["https://gallery.example.com","http://localhost:3000","http://localhost:2283"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["Accept-Ranges","Content-Length","Content-Range","Content-Type","ETag"],"MaxAgeSeconds":3600}]}'
```

Do not use `"*"` for production origins if you introduce credentialed browser requests to S3. Gallery media images use anonymous CORS.
````

Renumber the existing restart section from `### 4. Restart Gallery` to `### 5. Restart Gallery`.

- [ ] **Step 3: Update environment variable table wording**

In `docs/docs/install/environment-variables.md`, change the `IMMICH_S3_SERVE_MODE` description to:

```md
How to serve S3 assets: `redirect` is recommended when browsers can reach S3; `proxy` streams through the server
```

- [ ] **Step 4: Run docs formatting**

Run:

```bash
pnpm --dir docs exec prettier --check docs/features/s3-storage.md docs/install/environment-variables.md
```

Expected: PASS.

- [ ] **Step 5: Commit docs**

Run:

```bash
git add docs/docs/features/s3-storage.md docs/docs/install/environment-variables.md
git commit -m "docs: document s3 redirect media delivery"
```

---

### Task 7: Verification, OpenAPI, And RC Smoke

**Files:**

- May modify generated OpenAPI files if `sync:open-api` reports changes.
- No code file should be modified by the manual smoke steps.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
pnpm --dir server test src/utils/file.spec.ts src/backends/disk-storage.backend.spec.ts src/backends/s3-storage.backend.spec.ts src/services/asset-media.service.spec.ts --run
pnpm --dir web test src/lib/utils.spec.ts src/lib/services/asset.service.spec.ts src/service-worker/index.spec.ts src/lib/components/Image.spec.ts src/lib/actions/__test__/image-loader.spec.ts src/lib/utils/people-utils.spec.ts src/lib/managers/edit/transform-manager.svelte.spec.ts src/lib/utils/cast/gcast-destination.svelte.spec.ts --run
```

Expected: PASS.

- [ ] **Step 2: Run type and lint checks**

Run:

```bash
pnpm --dir server check
pnpm --dir web check:typescript
pnpm --dir web check:svelte
pnpm --dir docs exec prettier --check plans/2026-05-02-s3-direct-media-delivery-design.md plans/2026-05-02-s3-direct-media-delivery-plan.md docs/features/s3-storage.md docs/install/environment-variables.md
```

Expected: PASS.

- [ ] **Step 3: Regenerate OpenAPI after DTO change**

Run:

```bash
pnpm --dir server build
pnpm --dir server sync:open-api
git status --short open-api
```

Expected: `open-api/immich-openapi-specs.json` and TypeScript SDK outputs may change to include `download` on `AssetDownloadOriginalDto`. If files change, include them in the current branch and rerun the web type checks.

- [ ] **Step 4: Run optional MinIO integration tests**

Run this when Docker is available:

```bash
IMMICH_TEST_DOCKER=true pnpm --dir server test src/backends/s3-storage.backend.integration.spec.ts --run
```

Expected: PASS. The redirect-mode integration should still return a presigned URL, and proxy mode should still stream object bytes.

- [ ] **Step 5: Smoke redirect behavior locally or on RC**

With a redirect-mode S3 instance, choose one real image asset id and one real video asset id from the browser network panel. Use an API key that has asset view and asset download permissions:

```bash
IMAGE_ASSET_ID="$GALLERY_SMOKE_IMAGE_ASSET_ID"
VIDEO_ASSET_ID="$GALLERY_SMOKE_VIDEO_ASSET_ID"
GALLERY_BASE_URL="$GALLERY_SMOKE_BASE_URL"
AUTH_HEADER="x-api-key: ${GALLERY_SMOKE_API_KEY}"
curl -I -H "${AUTH_HEADER}" "${GALLERY_BASE_URL}/api/assets/${IMAGE_ASSET_ID}/thumbnail?size=thumbnail"
curl -I -H "${AUTH_HEADER}" "${GALLERY_BASE_URL}/api/assets/${IMAGE_ASSET_ID}/original?download=true"
curl -I -H "${AUTH_HEADER}" "${GALLERY_BASE_URL}/api/assets/${VIDEO_ASSET_ID}/video/playback"
```

Expected:

- Each API media response is a 302.
- `Cache-Control` on the 302 is `private, no-cache, no-transform`.
- The `Location` host is the S3 provider endpoint.
- Following the thumbnail `Location` returns image bytes and CORS headers for the Gallery origin.
- Following the original `Location` returns a `Content-Disposition` attachment filename.
- Following the video `Location` with `Range: bytes=0-1023` returns `206 Partial Content`.

- [ ] **Step 6: Smoke the browser workflows**

On the RC after CORS is applied and `IMMICH_S3_SERVE_MODE=redirect` is set:

```text
1. Hard refresh the production host and confirm the active service worker is the new build.
2. Open /photos and fast-scroll through several hundred thumbnails.
3. Confirm visible thumbnails leave blurred preview state.
4. Open an image viewer that uses the original endpoint.
5. Download a single original and confirm the saved filename matches the asset name.
6. Play a video and seek to the middle.
7. Open a person page and use face crop or face editor flows.
8. Use copy-to-clipboard on an image.
9. If a Cast receiver is available, cast a video and confirm playback starts after the content-type probe.
10. Open browser devtools and confirm /api/assets media requests are 302 responses instead of long-running proxied streams.
11. Confirm /api/users/me and /api/server/ping respond during and after fast scroll.
```

Expected: No global blurred-media stall, no pile-up of long-running API media streams, downloads keep filenames, Cast does not fail on the content-type probe, and canvas workflows do not throw tainted-canvas errors.

- [ ] **Step 7: Commit generated files and final verification fixes**

Run:

```bash
git status --short
git add open-api web/src server/src docs/docs docs/plans
git commit -m "test: verify s3 direct media delivery"
```

Only create this commit if Task 7 produced generated OpenAPI updates or verification fixes. If Task 7 produced no file changes, skip the commit and keep the previous task commits.

---

## Rollout Notes

- `redirect` is the actual architecture fix for browser-readable S3 because the API stops streaming media bytes.
- `proxy` remains supported, but only benefits from the service-worker bypass; it still streams S3 bytes through Gallery.
- Apply bucket CORS before switching the production instance to redirect mode.
- Old service workers can mask the fix. The RC smoke must include a hard refresh or service-worker update verification.
- Treat presigned URLs as temporary credentials while they are valid.

## Full Verification Command Set

Run this before requesting review:

```bash
pnpm --dir server test src/utils/file.spec.ts src/backends/disk-storage.backend.spec.ts src/backends/s3-storage.backend.spec.ts src/services/asset-media.service.spec.ts --run
pnpm --dir web test src/lib/utils.spec.ts src/lib/services/asset.service.spec.ts src/service-worker/index.spec.ts src/lib/components/Image.spec.ts src/lib/actions/__test__/image-loader.spec.ts src/lib/utils/people-utils.spec.ts src/lib/managers/edit/transform-manager.svelte.spec.ts src/lib/utils/cast/gcast-destination.svelte.spec.ts --run
pnpm --dir server check
pnpm --dir web check:typescript
pnpm --dir web check:svelte
pnpm --dir docs exec prettier --check plans/2026-05-02-s3-direct-media-delivery-design.md plans/2026-05-02-s3-direct-media-delivery-plan.md docs/features/s3-storage.md docs/install/environment-variables.md
pnpm --dir server build
pnpm --dir server sync:open-api
```

Expected: all commands pass, and `git status --short` only shows intentional source, docs, and generated OpenAPI changes.
