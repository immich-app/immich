# Google Takeout Zip On-Demand Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor browser Google Takeout zip scanning so media bytes are loaded only when an item is uploaded, not during scan/review.

**Architecture:** `TakeoutMediaItem` becomes a metadata object with `getFile()`. Folder imports return the original selected `File`; zip imports keep zip entry metadata and a cached `FileEntry` closure that extracts one media file on demand. Upload uses cheap metadata until it needs bytes, then calls `getFile()` once per item.

**Tech Stack:** SvelteKit web app, TypeScript, Vitest, zip.js `ZipReader`/`FileEntry`, browser `File`/`Blob`/`FormData`.

---

## File Structure

- Modify `web/src/lib/utils/google-takeout-parser.ts`: update `TakeoutMediaItem` interface only; album/root helpers continue using `path`, `metadata`, and `albumName`.
- Modify `web/src/lib/utils/google-takeout-scanner.ts`: replace eager zip media extraction with metadata descriptors and on-demand `getFile()` closures; update folder items to new shape.
- Modify `web/src/lib/utils/google-takeout-uploader.ts`: replace `item.file` reads with `item.name`, `item.lastModified`, and a local `await item.getFile()`.
- Modify `web/src/lib/components/import/import-wizard.svelte`: use `item.name` for current file and error reporting.
- Modify `web/src/lib/utils/google-takeout-scanner.spec.ts`: add red tests for lazy zip extraction and update assertions to the new item shape.
- Modify `web/src/lib/utils/google-takeout-uploader.spec.ts`: update fixture helper and add red tests for upload-time `getFile()` behavior.
- Modify `web/src/lib/components/import/__tests__/import-wizard.spec.ts`: add a red interaction test proving the import loop uses `item.name`, not `item.file.name`.
- Modify `web/src/lib/utils/google-takeout-parser.spec.ts`: update test-only `TakeoutMediaItem` literals to the new shape.
- Modify `web/src/lib/components/import/__tests__/import-review-step.spec.ts`: update test fixture helper to the new shape.

## Setup

- [ ] **Step 1: Confirm clean worktree**

Run:

```bash
git status --short --branch
```

Expected output:

```text
## refactor/takeout-zip-on-demand-files
```

- [ ] **Step 2: Build the local SDK for web tests**

Run:

```bash
pnpm --dir open-api/typescript-sdk build
```

Expected output includes:

```text
> @immich/sdk@2.7.5 build
> tsc
```

- [ ] **Step 3: Confirm focused baseline**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts src/lib/utils/google-takeout-uploader.spec.ts
```

Expected output:

```text
Test Files  2 passed (2)
Tests       37 passed (37)
```

### Task 1: Zip Items Expose Lazy Files

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.ts`

- [ ] **Step 1: Write the failing scanner tests**

In `web/src/lib/utils/google-takeout-scanner.spec.ts`, update the first zip scan test body to assert the new metadata fields and `getFile()` result:

```ts
it('should scan a zip and expose media bytes lazily with metadata', async () => {
  const zipBlob = await createZipBlob([
    { path: 'Takeout/Google Photos/Trip/IMG_001.jpg', content: 'fake-image-data' },
    { path: 'Takeout/Google Photos/Trip/IMG_001.jpg.json', content: makeSidecar() },
  ]);

  const result: ScanResult = await scanTakeoutFiles({
    files: [blobToFile(zipBlob, 'takeout-001.zip')],
  });

  expect(result.items).toHaveLength(1);
  expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_001.jpg');
  expect(result.items[0].name).toBe('IMG_001.jpg');
  expect(result.items[0].size).toBe('fake-image-data'.length);
  expect(result.items[0].lastModified).toBeGreaterThan(0);

  const file = await result.items[0].getFile();
  expect(file.name).toBe('IMG_001.jpg');
  expect(file.size).toBe('fake-image-data'.length);
  expect(await file.text()).toBe('fake-image-data');

  const secondFile = await result.items[0].getFile();
  expect(secondFile).not.toBe(file);
  expect(secondFile.name).toBe('IMG_001.jpg');
  expect(await secondFile.text()).toBe('fake-image-data');

  expect(result.items[0].metadata).toBeDefined();
  expect(result.items[0].metadata!.title).toBe('IMG_001.jpg');
  expect(result.items[0].metadata!.latitude).toBe(48.8566);
  expect(result.items[0].metadata!.isFavorite).toBe(true);
  expect(result.stats.totalMedia).toBe(1);
  expect(result.stats.withLocation).toBe(1);
  expect(result.stats.withDate).toBe(1);
  expect(result.stats.favorites).toBe(1);
  expect(result.stats.archived).toBe(0);
});
```

Also add this test inside `describe('scanTakeoutFiles', ...)` to prove scan does not extract media:

```ts
it('does not extract media entries while scanning a zip', async () => {
  vi.resetModules();

  const mediaArrayBuffer = vi.fn(async () => new TextEncoder().encode('media-bytes').buffer);
  const sidecarArrayBuffer = vi.fn(async () => new TextEncoder().encode(makeSidecar()).buffer);
  const close = vi.fn(async () => undefined);

  vi.doMock('@zip.js/zip.js', () => ({
    BlobReader: vi.fn(),
    configure: vi.fn(),
    ZipReader: vi.fn().mockImplementation(() => ({
      close,
      getEntries: vi.fn(async () => [
        {
          filename: 'Takeout/Google Photos/Trip/IMG_001.jpg',
          directory: false,
          uncompressedSize: 'media-bytes'.length,
          lastModDate: new Date('2021-01-01T00:00:00.000Z'),
          arrayBuffer: mediaArrayBuffer,
        },
        {
          filename: 'Takeout/Google Photos/Trip/IMG_001.jpg.json',
          directory: false,
          uncompressedSize: 10,
          lastModDate: new Date('2021-01-01T00:00:00.000Z'),
          arrayBuffer: sidecarArrayBuffer,
        },
      ]),
    })),
  }));

  try {
    const { scanTakeoutFiles } = await import('$lib/utils/google-takeout-scanner');
    const result = await scanTakeoutFiles({
      files: [new File(['zip-placeholder'], 'takeout.zip', { type: 'application/zip' })],
    });

    expect(sidecarArrayBuffer).toHaveBeenCalledOnce();
    expect(mediaArrayBuffer).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();

    const file = await result.items[0].getFile();
    expect(mediaArrayBuffer).toHaveBeenCalledOnce();
    expect(await file.text()).toBe('media-bytes');
  } finally {
    vi.doUnmock('@zip.js/zip.js');
    vi.resetModules();
    const mod = await import('$lib/utils/google-takeout-scanner');
    scanTakeoutFiles = mod.scanTakeoutFiles;
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts -t "should scan a zip and expose media bytes lazily with metadata|does not extract media entries while scanning a zip"
```

Expected: FAIL. The first test fails because `result.items[0].name`, `size`, `lastModified`, and `getFile` do not exist yet. The second test fails because the current scanner calls `mediaArrayBuffer` during scan.

- [ ] **Step 3: Update the `TakeoutMediaItem` interface**

In `web/src/lib/utils/google-takeout-parser.ts`, replace the interface at lines 60-65 with:

```ts
export interface TakeoutMediaItem {
  path: string;
  name: string;
  size: number;
  lastModified: number;
  getFile: () => Promise<File>;
  metadata?: TakeoutMetadata;
  albumName?: string;
}
```

- [ ] **Step 4: Add zip entry metadata support**

In `web/src/lib/utils/google-takeout-scanner.ts`, replace the local `ZipEntry` interface with:

```ts
interface ZipEntry {
  filename: string;
  directory?: boolean;
  uncompressedSize?: number;
  lastModDate?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData?: (...args: any[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arrayBuffer?: (options?: any) => Promise<ArrayBuffer>;
}

interface ZipMediaDescriptor {
  path: string;
  name: string;
  size: number;
  lastModified: number;
  entry: ZipEntry;
}

function basename(path: string): string {
  return path.slice(Math.max(0, path.lastIndexOf('/') + 1));
}

async function getZipEntryFile(entry: ZipEntry, name: string, lastModified: number): Promise<File> {
  if (entry.arrayBuffer) {
    const buffer = await entry.arrayBuffer();
    return new File([buffer], name, { lastModified });
  }

  if (entry.getData) {
    const blob = (await entry.getData(new WritableStream())) as Blob;
    return new File([blob], name, { type: blob.type || 'application/octet-stream', lastModified });
  }

  throw new Error(`Zip entry "${entry.filename}" cannot be extracted`);
}
```

- [ ] **Step 5: Replace eager zip media extraction with descriptors**

In `web/src/lib/utils/google-takeout-scanner.ts`, inside `scanZipFile`, replace the `mediaBlobs` map with descriptors:

```ts
const mediaPaths: string[] = [];
const mediaDescriptors = new Map<string, ZipMediaDescriptor>();
const sidecarTexts = new Map<string, string>();
```

Then replace the media branch in the entry loop with:

```ts
        if (isMediaFile(entry.filename)) {
          const name = basename(entry.filename);
          const lastModified = entry.lastModDate?.getTime() ?? zipFile.lastModified;

          mediaPaths.push(entry.filename);
          mediaDescriptors.set(entry.filename, {
            path: entry.filename,
            name,
            size: entry.uncompressedSize ?? 0,
            lastModified,
            entry,
          });

          progress.mediaCount++;
          const parts = entry.filename.split('/');
          if (parts[0] === 'Takeout' && parts.length >= 4) {
            progress.albumNames.add(parts[2]);
          }
          onProgress?.(progress);
        } else if (isSidecarFile(entry.filename)) {
```

Keep the existing sidecar extraction block after `else if`.

- [ ] **Step 6: Build zip items from descriptors**

In `web/src/lib/utils/google-takeout-scanner.ts`, replace the `for (const [path, blob] of mediaBlobs)` block with:

```ts
for (const descriptor of mediaDescriptors.values()) {
  const metadata = metadataMap.get(descriptor.path);

  if (metadata?.latitude !== undefined && metadata?.longitude !== undefined) {
    progress.withLocation++;
  }
  if (metadata?.dateTaken) {
    progress.withDate++;
  }
  if (metadata?.isFavorite) {
    progress.favorites++;
  }
  if (metadata?.isArchived) {
    progress.archived++;
  }

  allItems.push({
    path: descriptor.path,
    name: descriptor.name,
    size: descriptor.size,
    lastModified: descriptor.lastModified,
    getFile: () => getZipEntryFile(descriptor.entry, descriptor.name, descriptor.lastModified),
    metadata,
    albumName: undefined,
  });
  onProgress?.(progress);
}
```

- [ ] **Step 7: Run the focused tests to verify they pass**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts -t "should scan a zip and expose media bytes lazily with metadata|does not extract media entries while scanning a zip"
```

Expected: both tests PASS.

- [ ] **Step 8: Commit Task 1**

Run:

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-scanner.ts web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "refactor(takeout): expose zip files on demand"
```

### Task 2: Update Existing Zip Scanner Edge Cases

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.ts` only if these tests reveal a regression

- [ ] **Step 1: Update the no-sidecar zip test to use the new item contract**

In `web/src/lib/utils/google-takeout-scanner.spec.ts`, update `should handle items without sidecar`:

```ts
expect(result.items).toHaveLength(1);
expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_002.jpg');
expect(result.items[0].name).toBe('IMG_002.jpg');
expect(await result.items[0].getFile()).toBeInstanceOf(File);
expect(result.items[0].metadata).toBeUndefined();
expect(result.stats.withLocation).toBe(0);
expect(result.stats.withDate).toBe(0);
```

- [ ] **Step 2: Run the no-sidecar test**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts -t "should handle items without sidecar"
```

Expected: PASS after Task 1. If it fails, fix the descriptor path for media entries without metadata before continuing.

- [ ] **Step 3: Run the updated zip edge tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts -t "should scan a zip and expose media bytes lazily with metadata|does not extract media entries while scanning a zip|should handle items without sidecar"
```

Expected: all selected tests pass.

- [ ] **Step 4: Commit Task 2**

Run:

```bash
git add web/src/lib/utils/google-takeout-scanner.spec.ts web/src/lib/utils/google-takeout-scanner.ts
git commit -m "test(takeout): update zip scanner edge cases"
```

### Task 3: Folder Imports Use The Same Item Contract

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.ts`

- [ ] **Step 1: Write or update the failing folder test**

In `web/src/lib/utils/google-takeout-scanner.spec.ts`, update `should scan folder files with webkitRelativePath`:

```ts
expect(result.items).toHaveLength(1);
expect(result.items[0].path).toBe('Takeout/Google Photos/Trip/IMG_001.jpg');
expect(result.items[0].name).toBe('IMG_001.jpg');
expect(result.items[0].size).toBe('fake-image'.length);
expect(result.items[0].lastModified).toBeGreaterThan(0);
expect(await result.items[0].getFile()).toBe(files[0]);
expect(result.items[0].metadata).toBeDefined();
expect(result.items[0].metadata!.title).toBe('IMG_001.jpg');
expect(result.items[0].metadata!.latitude).toBe(48.8566);
expect(result.stats.totalMedia).toBe(1);
expect(result.stats.withLocation).toBe(1);
```

Update the sidecar matching test assertion:

```ts
expect(itemWithout!.name).toBe('IMG_002.jpg');
expect(await itemWithout!.getFile()).toBe(files[2]);
```

- [ ] **Step 2: Run the folder tests to verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts -t "folder"
```

Expected: FAIL because folder items still use `file` and do not define `name`, `size`, `lastModified`, or `getFile`.

- [ ] **Step 3: Update folder item creation**

In `web/src/lib/utils/google-takeout-scanner.ts`, replace the folder item object with:

```ts
const item: TakeoutMediaItem = {
  path: filePath,
  name: file.name,
  size: file.size,
  lastModified: file.lastModified,
  getFile: async () => file,
  metadata,
  albumName: undefined,
};
```

- [ ] **Step 4: Run scanner specs**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: scanner specs pass.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add web/src/lib/utils/google-takeout-scanner.ts web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "refactor(takeout): adapt folder imports to lazy files"
```

### Task 4: Uploader Loads Bytes Only At Upload Time

**Files:**

- Modify: `web/src/lib/utils/google-takeout-uploader.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-uploader.ts`

- [ ] **Step 1: Update the uploader test fixture first**

In `web/src/lib/utils/google-takeout-uploader.spec.ts`, replace `makeItem()` with:

```ts
function makeItem(overrides: Partial<TakeoutMediaItem> = {}): TakeoutMediaItem {
  const file = new File(['fake-image-data'], 'IMG_001.jpg', { type: 'image/jpeg', lastModified: 1_609_459_200_000 });
  return {
    path: 'Takeout/Google Photos/Trip/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: file.size,
    lastModified: 1_609_459_200_000,
    getFile: vi.fn(async () => file),
    metadata: {
      title: 'IMG_001.jpg',
      description: 'A nice photo',
      dateTaken: new Date('2021-01-01T00:00:00.000Z'),
      latitude: 48.8566,
      longitude: 2.3522,
      isFavorite: true,
      isArchived: false,
    },
    albumName: 'Trip',
    ...overrides,
  };
}
```

- [ ] **Step 2: Add failing uploader tests**

In `describe('uploadTakeoutItem', ...)`, add:

```ts
it('loads the file through getFile once during upload', async () => {
  utilsMock.uploadRequest.mockResolvedValue({
    data: { id: 'asset-1', status: 'created' },
    status: 201,
  });

  const getFile = vi.fn(async () => new File(['lazy-bytes'], 'IMG_001.jpg', { lastModified: 1_609_459_200_000 }));
  const item = makeItem({ getFile, size: 'lazy-bytes'.length });

  await uploadTakeoutItem(item, { ...defaultOptions(), skipDuplicates: false });

  expect(getFile).toHaveBeenCalledOnce();
  const formData = utilsMock.uploadRequest.mock.calls[0][0].data as FormData;
  const uploadedFile = formData.get('assetData') as File;
  expect(uploadedFile.name).toBe('IMG_001.jpg');
  expect(await uploadedFile.text()).toBe('lazy-bytes');
});

it('hashes lazy file bytes for duplicate checks at upload time', async () => {
  vi.mocked(sdkMock.checkBulkUpload).mockResolvedValue({
    results: [
      {
        id: 'IMG_001.jpg',
        assetId: 'existing-asset-1',
        action: AssetUploadAction.Reject,
        reason: AssetRejectReason.Duplicate,
      },
    ],
  });

  const getFile = vi.fn(async () => new File(['lazy-bytes'], 'IMG_001.jpg', { lastModified: 1_609_459_200_000 }));
  const item = makeItem({ getFile, size: 'lazy-bytes'.length });

  const result = await uploadTakeoutItem(item, defaultOptions());

  expect(getFile).toHaveBeenCalledOnce();
  expect(sdkMock.checkBulkUpload).toHaveBeenCalledWith({
    assetBulkUploadCheckDto: {
      assets: [{ id: 'IMG_001.jpg', checksum: 'b2953b8e364061cea5600e64ec5049d63f08efbe' }],
    },
  });
  expect(result).toEqual({ assetId: 'existing-asset-1', status: 'duplicate' });
  expect(utilsMock.uploadRequest).not.toHaveBeenCalled();
});

it('uses item name and lastModified metadata instead of file metadata', async () => {
  utilsMock.uploadRequest.mockResolvedValue({
    data: { id: 'asset-1', status: 'created' },
    status: 201,
  });

  const file = new File(['bytes'], 'WRONG_NAME.jpg', { lastModified: 946_684_800_000 });
  const item = makeItem({
    name: 'IMG_FROM_ITEM.jpg',
    lastModified: 1_609_459_200_000,
    getFile: vi.fn(async () => file),
    metadata: {
      title: 'IMG_FROM_ITEM.jpg',
      description: undefined,
      dateTaken: undefined,
      latitude: undefined,
      longitude: undefined,
      isFavorite: false,
      isArchived: false,
    },
  });

  await uploadTakeoutItem(item, { ...defaultOptions(), skipDuplicates: false });

  const formData = utilsMock.uploadRequest.mock.calls[0][0].data as FormData;
  const uploadedFile = formData.get('assetData') as File;
  expect(formData.get('deviceAssetId')).toBe('takeout-IMG_FROM_ITEM.jpg-1609459200000');
  expect(formData.get('fileCreatedAt')).toBe('2021-01-01T00:00:00.000Z');
  expect(uploadedFile.name).toBe('IMG_FROM_ITEM.jpg');
});

it('returns an item error when lazy file loading fails', async () => {
  const item = makeItem({
    getFile: vi.fn(async () => {
      throw new Error('Cannot extract zip entry');
    }),
  });

  const result = await uploadTakeoutItem(item, { ...defaultOptions(), skipDuplicates: false });

  expect(result.status).toBe('error');
  expect(result.error).toContain('Cannot extract zip entry');
  expect(utilsMock.uploadRequest).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run uploader tests to verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-uploader.spec.ts -t "getFile|lazy file loading|lazy file bytes|file metadata"
```

Expected: FAIL because `uploadTakeoutItem()` still reads `item.file`.

- [ ] **Step 4: Update uploader implementation**

In `web/src/lib/utils/google-takeout-uploader.ts`, replace the top of `uploadTakeoutItem()` through `assetData` append with:

```ts
  try {
    const deviceAssetId = 'takeout-' + item.name + '-' + item.lastModified;
    const fileCreatedAt = item.metadata?.dateTaken
      ? item.metadata.dateTaken.toISOString()
      : new Date(item.lastModified).toISOString();
    const file = await item.getFile();

    // Duplicate check
    if (options.skipDuplicates && crypto?.subtle) {
      try {
        const checksum = await computeSha1(file);
        const {
          results: [checkResult],
        } = await checkBulkUpload({
          assetBulkUploadCheckDto: { assets: [{ id: item.name, checksum }] },
        });
        if (checkResult.action === AssetUploadAction.Reject && checkResult.assetId) {
          return { assetId: checkResult.assetId, status: 'duplicate' };
        }
      } catch (error) {
        console.error('Error checking duplicate', error);
      }
    }

    // Build FormData
    const formData = new FormData();
    formData.append('deviceAssetId', deviceAssetId);
    formData.append('deviceId', 'WEB_IMPORT');
    formData.append('fileCreatedAt', fileCreatedAt);
    formData.append('fileModifiedAt', fileCreatedAt);
    formData.append('isFavorite', String(options.importFavorites && item.metadata?.isFavorite === true));
    formData.append('duration', '0:00:00.000000');
    formData.append('assetData', new File([file], item.name, { lastModified: item.lastModified }));
```

- [ ] **Step 5: Run uploader specs**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-uploader.spec.ts
```

Expected: all uploader tests pass.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add web/src/lib/utils/google-takeout-uploader.ts web/src/lib/utils/google-takeout-uploader.spec.ts
git commit -m "refactor(takeout): load upload files on demand"
```

### Task 5: Update UI And Test-Only Item Fixtures

**Files:**

- Modify: `web/src/lib/components/import/import-wizard.svelte`
- Modify: `web/src/lib/components/import/__tests__/import-wizard.spec.ts`
- Modify: `web/src/lib/components/import/__tests__/import-review-step.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts` if any old `file` assertion remains

- [ ] **Step 1: Write or confirm typecheck failure**

Run:

```bash
pnpm --dir web run check:typescript
```

Expected before this task: FAIL with `Property 'file' does not exist on type 'TakeoutMediaItem'` in import wizard and/or specs.

- [ ] **Step 2: Add the failing import wizard interaction test**

In `web/src/lib/components/import/__tests__/import-wizard.spec.ts`, replace the imports with:

```ts
import type { TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
import { scanTakeoutFiles } from '$lib/utils/google-takeout-scanner';
import { uploadTakeoutItem } from '$lib/utils/google-takeout-uploader';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportWizard from '../import-wizard.svelte';
```

Add this test inside `describe('ImportWizard', ...)`:

```ts
it('imports name-only Takeout items without reading item.file', async () => {
  const user = userEvent.setup();
  const file = new File(['bytes'], 'IMG_001.jpg', { lastModified: 1_609_459_200_000 });
  const item: TakeoutMediaItem = {
    path: 'Takeout/Google Photos/Trip/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: file.size,
    lastModified: file.lastModified,
    getFile: async () => file,
    metadata: undefined,
    albumName: undefined,
  };
  Object.defineProperty(item, 'file', {
    get() {
      throw new Error('item.file should not be read');
    },
  });

  vi.mocked(scanTakeoutFiles).mockResolvedValue({
    items: [item],
    albums: [],
    stats: {
      totalMedia: 1,
      withLocation: 0,
      withDate: 0,
      favorites: 0,
      archived: 0,
      dateRange: undefined,
    },
  });
  vi.mocked(uploadTakeoutItem).mockResolvedValue({ assetId: 'asset-1', status: 'imported' });

  const { container, getByText, getByTestId } = render(ImportWizard);

  await user.click(getByText('next'));

  const zipInput = container.querySelector('input[type="file"][accept=".zip"]') as HTMLInputElement;
  await fireEvent.change(zipInput, {
    target: { files: [new File(['zip'], 'takeout.zip', { type: 'application/zip' })] },
  });
  await user.click(getByTestId('next-button'));

  await waitFor(() => expect(getByTestId('import-button')).toBeInTheDocument());
  await user.click(getByTestId('import-button'));

  await waitFor(() => expect(uploadTakeoutItem).toHaveBeenCalledWith(item, expect.any(Object)));
});
```

- [ ] **Step 3: Run the import wizard test to verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/import/__tests__/import-wizard.spec.ts -t "imports name-only Takeout items without reading item.file"
```

Expected: FAIL because `import-wizard.svelte` reads `item.file.name`.

- [ ] **Step 4: Update import wizard runtime reads**

In `web/src/lib/components/import/import-wizard.svelte`, replace:

```ts
        currentFile: item.file.name,
```

with:

```ts
        currentFile: item.name,
```

Replace:

```ts
manager.trackError(item.file.name, result.error ?? 'Unknown error');
```

with:

```ts
manager.trackError(item.name, result.error ?? 'Unknown error');
```

- [ ] **Step 5: Add a parser spec fixture helper**

In `web/src/lib/utils/google-takeout-parser.spec.ts`, near the `validMeta` constant, add:

```ts
function makeMediaItem(path: string, overrides: Partial<TakeoutMediaItem> = {}): TakeoutMediaItem {
  const name = path.slice(Math.max(0, path.lastIndexOf('/') + 1));
  const file = new File([], name);
  return {
    path,
    name,
    size: file.size,
    lastModified: file.lastModified,
    getFile: async () => file,
    ...overrides,
  };
}
```

Replace old literals shaped like:

```ts
{ path: 'Takeout/Google Photos/A/img.jpg', file: new File([], 'img.jpg'), metadata: validMeta }
```

with:

```ts
makeMediaItem('Takeout/Google Photos/A/img.jpg', { metadata: validMeta });
```

For old literals with `albumName`, use:

```ts
makeMediaItem('Takeout/YouTube/playlists/playlist.json', { albumName: 'playlists' });
```

- [ ] **Step 6: Update import review fixture helper**

In `web/src/lib/components/import/__tests__/import-review-step.spec.ts`, replace `makeItem()` with:

```ts
function makeItem(overrides?: Partial<TakeoutMediaItem>): TakeoutMediaItem {
  const file = new File(['x'], 'IMG_1234.jpg');
  return {
    path: 'Takeout/Google Photos/Vacation/IMG_1234.jpg',
    name: 'IMG_1234.jpg',
    size: file.size,
    lastModified: file.lastModified,
    getFile: async () => file,
    metadata: undefined,
    ...overrides,
  };
}
```

- [ ] **Step 7: Remove remaining stale `item.file` references**

Run:

```bash
rg -n 'item\.file|\.file\.name|file: new File' web/src/lib/utils web/src/lib/components/import
```

Expected remaining matches may include unrelated upload utilities outside Takeout. There must be no matches in:

```text
web/src/lib/utils/google-takeout-*.ts
web/src/lib/utils/google-takeout-*.spec.ts
web/src/lib/components/import/*.svelte
web/src/lib/components/import/__tests__/*.spec.ts
```

- [ ] **Step 8: Run typecheck and focused component/parser tests**

Run:

```bash
pnpm --dir web run check:typescript
pnpm --dir web exec vitest run src/lib/utils/google-takeout-parser.spec.ts src/lib/components/import/__tests__/import-review-step.spec.ts src/lib/components/import/__tests__/import-wizard.spec.ts
```

Expected: both commands pass. If `check:typescript` surfaces unrelated baseline failures, document them and run the focused Vitest command.

- [ ] **Step 9: Commit Task 5**

Run:

```bash
git add web/src/lib/components/import/import-wizard.svelte web/src/lib/components/import/__tests__/import-wizard.spec.ts web/src/lib/components/import/__tests__/import-review-step.spec.ts web/src/lib/utils/google-takeout-parser.spec.ts web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "refactor(takeout): update media item consumers"
```

### Task 6: Worker Configuration And Full Verification

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.ts` only if worker configuration is changed

- [ ] **Step 1: Try enabling zip.js workers for the scanner path**

In `web/src/lib/utils/google-takeout-scanner.ts`, replace:

```ts
// Disable web workers to avoid stream lifecycle issues during SvelteKit navigation
configure({ useWebWorkers: false });
```

with:

```ts
configure({ useWebWorkers: true });
```

- [ ] **Step 2: Run scanner and uploader specs**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-scanner.spec.ts src/lib/utils/google-takeout-uploader.spec.ts
```

Expected: all tests pass. If zip.js worker setup fails in Vitest or reproduces stream lifecycle errors, revert only this worker configuration change and keep the on-demand file refactor.

- [ ] **Step 3: Run all Takeout-related tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/google-takeout-parser.spec.ts src/lib/utils/google-takeout-scanner.spec.ts src/lib/utils/google-takeout-uploader.spec.ts src/lib/components/import/__tests__/import-review-step.spec.ts
```

Expected: all listed test files pass.

- [ ] **Step 4: Run lint and type checks**

Run:

```bash
pnpm --dir web run lint
pnpm --dir web run check:typescript
pnpm --dir web run check:svelte
```

Expected: all pass. If there are unrelated baseline failures, capture exact failing files and messages in the final summary.

- [ ] **Step 5: Run broader test command**

Run:

```bash
pnpm --dir web exec vitest run
```

Expected: pass. If this is too broad for the environment, document the exact failure or timeout and keep the focused Takeout test results from Step 3.

- [ ] **Step 6: Final stale-reference audit**

Run:

```bash
rg -n 'mediaBlobs|item\.file|TakeoutMediaItem.*file|file: new File' web/src/lib/utils/google-takeout-* web/src/lib/components/import
```

Expected: no stale eager-media implementation references. Test fixture helpers may contain local `const file = new File(...)`, but `TakeoutMediaItem` objects must use `name`, `size`, `lastModified`, and `getFile`.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add web/src/lib/utils/google-takeout-scanner.ts
git commit -m "chore(takeout): verify lazy zip import"
```

If no files changed in this task, do not create an empty commit.

## Manual Verification

- [ ] Select a small Google Takeout zip in the browser import flow.
- [ ] Confirm scan completes and review counts still match the fixture contents.
- [ ] Confirm import uploads files with correct names.
- [ ] Confirm sidecar date, favorite, archive, GPS, and description behavior is unchanged.
- [ ] Confirm album creation still maps uploaded asset IDs to selected album names.
- [ ] Confirm browser memory does not grow by the sum of decompressed media bytes during scan.

## Completion Criteria

- `TakeoutMediaItem` no longer has `file`.
- Zip scan does not extract media entries during scan.
- Zip `getFile()` returns the correct file bytes on demand.
- Folder `getFile()` returns the original selected `File`.
- Upload calls `getFile()` once per item and does not retain the file beyond the function scope.
- Focused Takeout tests pass.
- Lint, TypeScript, Svelte checks, and broad Vitest verification pass or blockers are documented with exact output.
