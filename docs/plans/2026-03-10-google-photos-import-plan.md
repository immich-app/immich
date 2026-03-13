# Google Photos Import — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web UI wizard that imports Google Takeout exports into Immich with full metadata preservation (dates, GPS, descriptions, favorites, archived, albums).

**Architecture:** Client-side hybrid — browser streams zips via `zip.js`, parses JSON sidecars, shows preview, uploads through existing `POST /assets` API with metadata injected. No server changes. New `/import` route with 5-step wizard.

**Tech Stack:** Svelte 5 (runes), TypeScript, `@immich/ui` components, `zip.js` for zip streaming, Vitest + @testing-library/svelte for tests.

**Worktree:** This work MUST be done in a worktree at `.claude/worktrees/google-photos-import` on branch `feat/google-photos-import`.

---

## Task 1: Install zip.js dependency

**Files:**

- Modify: `web/package.json`

**Step 1: Install zip.js**

```bash
cd web && pnpm add @nicolo-ribaudo/zip.js
```

Note: `@nicolo-ribaudo/zip.js` is the actively maintained fork of `zip.js`. If unavailable, use `@zip.js/zip.js` instead.

**Step 2: Verify installation**

```bash
cd web && pnpm ls @nicolo-ribaudo/zip.js
```

**Step 3: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml
git commit -m "feat: add zip.js dependency for Google Photos import"
```

---

## Task 2: Google Takeout JSON parser — core metadata extraction

The most critical pure-logic module. All tests first.

**Files:**

- Create: `web/src/lib/utils/google-takeout-parser.ts`
- Create: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests for JSON sidecar parsing**

```typescript
// web/src/lib/utils/google-takeout-parser.spec.ts
import { parseGoogleTakeoutSidecar, type TakeoutMetadata } from './google-takeout-parser';

describe('parseGoogleTakeoutSidecar', () => {
  it('parses a complete Google Takeout JSON sidecar', () => {
    const json = JSON.stringify({
      title: 'IMG_1234.jpg',
      description: 'A beautiful sunset',
      photoTakenTime: { timestamp: '1700000000' },
      geoData: { latitude: 48.8566, longitude: 2.3522, altitude: 35.0 },
      favorited: true,
      archived: false,
    });

    const result = parseGoogleTakeoutSidecar(json);

    expect(result).toEqual({
      title: 'IMG_1234.jpg',
      description: 'A beautiful sunset',
      dateTaken: new Date(1_700_000_000 * 1000),
      latitude: 48.8566,
      longitude: 2.3522,
      isFavorite: true,
      isArchived: false,
    });
  });

  it('returns null for non-Takeout JSON (missing photoTakenTime and creationTime)', () => {
    const json = JSON.stringify({ name: 'package.json', version: '1.0.0' });
    expect(parseGoogleTakeoutSidecar(json)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseGoogleTakeoutSidecar('not json {')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseGoogleTakeoutSidecar('')).toBeNull();
  });

  it('handles missing optional fields gracefully', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
    });

    const result = parseGoogleTakeoutSidecar(json);

    expect(result).toEqual({
      title: 'photo.jpg',
      description: undefined,
      dateTaken: new Date(1_700_000_000 * 1000),
      latitude: undefined,
      longitude: undefined,
      isFavorite: false,
      isArchived: false,
    });
  });

  it('filters GPS (0, 0) as no-location', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
      geoData: { latitude: 0, longitude: 0, altitude: 0 },
    });

    const result = parseGoogleTakeoutSidecar(json);
    expect(result?.latitude).toBeUndefined();
    expect(result?.longitude).toBeUndefined();
  });

  it('falls back to creationTime when photoTakenTime is missing', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      creationTime: { timestamp: '1600000000' },
    });

    const result = parseGoogleTakeoutSidecar(json);
    expect(result?.dateTaken).toEqual(new Date(1_600_000_000 * 1000));
  });

  it('falls back to geoDataExif when geoData is missing', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
      geoDataExif: { latitude: 40.7128, longitude: -74.006, altitude: 10 },
    });

    const result = parseGoogleTakeoutSidecar(json);
    expect(result?.latitude).toBe(40.7128);
    expect(result?.longitude).toBe(-74.006);
  });

  it('filters GPS coordinates outside valid ranges', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
      geoData: { latitude: 200, longitude: -300, altitude: 0 },
    });

    const result = parseGoogleTakeoutSidecar(json);
    expect(result?.latitude).toBeUndefined();
    expect(result?.longitude).toBeUndefined();
  });

  it('trims whitespace-only descriptions', () => {
    const json = JSON.stringify({
      title: 'photo.jpg',
      description: '   ',
      photoTakenTime: { timestamp: '1700000000' },
    });

    const result = parseGoogleTakeoutSidecar(json);
    expect(result?.description).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-parser.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the parser**

```typescript
// web/src/lib/utils/google-takeout-parser.ts

export interface TakeoutMetadata {
  title: string;
  description: string | undefined;
  dateTaken: Date | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  isFavorite: boolean;
  isArchived: boolean;
}

interface TakeoutGeoData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

interface TakeoutTimestamp {
  timestamp?: string;
}

interface TakeoutJson {
  title?: string;
  description?: string;
  photoTakenTime?: TakeoutTimestamp;
  creationTime?: TakeoutTimestamp;
  geoData?: TakeoutGeoData;
  geoDataExif?: TakeoutGeoData;
  favorited?: boolean;
  archived?: boolean;
}

function isValidGps(lat: number | undefined, lng: number | undefined): boolean {
  if (lat === undefined || lng === undefined) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

function parseTimestamp(ts: TakeoutTimestamp | undefined): Date | undefined {
  if (!ts?.timestamp) {
    return undefined;
  }
  const seconds = Number(ts.timestamp);
  if (Number.isNaN(seconds) || seconds <= 0) {
    return undefined;
  }
  return new Date(seconds * 1000);
}

export function parseGoogleTakeoutSidecar(jsonString: string): TakeoutMetadata | null {
  let data: TakeoutJson;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  // Validate this is actually a Takeout sidecar — must have at least one Takeout-specific field
  if (!data.photoTakenTime && !data.creationTime) {
    return null;
  }

  const dateTaken = parseTimestamp(data.photoTakenTime) ?? parseTimestamp(data.creationTime);

  const geo = data.geoData ?? data.geoDataExif;
  const hasValidGps = isValidGps(geo?.latitude, geo?.longitude);

  const description = data.description?.trim() || undefined;

  return {
    title: data.title ?? '',
    description,
    dateTaken,
    latitude: hasValidGps ? geo!.latitude : undefined,
    longitude: hasValidGps ? geo!.longitude : undefined,
    isFavorite: data.favorited === true,
    isArchived: data.archived === true,
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-parser.spec.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat: add Google Takeout JSON sidecar parser with tests"
```

---

## Task 3: Takeout scanner — file matching and album detection

Scans zip entries or folder files, matches media to their JSON sidecars, detects albums.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests for file matching and album detection**

Add to the existing spec file:

```typescript
import {
  parseGoogleTakeoutSidecar,
  matchSidecarToMedia,
  detectAlbums,
  isAutoGeneratedAlbum,
  type TakeoutMediaItem,
  type TakeoutAlbum,
} from './google-takeout-parser';

describe('matchSidecarToMedia', () => {
  it('matches photo.jpg.json to photo.jpg', () => {
    const mediaFiles = ['Google Photos/Album/photo.jpg'];
    const sidecarPath = 'Google Photos/Album/photo.jpg.json';
    const sidecarContent = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
    });

    const result = matchSidecarToMedia(sidecarPath, sidecarContent, mediaFiles);
    expect(result).toBe('Google Photos/Album/photo.jpg');
  });

  it('returns undefined when no media file matches', () => {
    const mediaFiles = ['Google Photos/Album/other.jpg'];
    const sidecarPath = 'Google Photos/Album/photo.jpg.json';
    const sidecarContent = JSON.stringify({
      title: 'photo.jpg',
      photoTakenTime: { timestamp: '1700000000' },
    });

    const result = matchSidecarToMedia(sidecarPath, sidecarContent, mediaFiles);
    expect(result).toBeUndefined();
  });

  it('handles truncated filenames (Google 47-char limit)', () => {
    const longName = 'a_very_long_filename_that_exceeds_the_google_lim.jpg';
    const truncated = 'a_very_long_filename_that_exceeds_the_google_li.jpg';
    const mediaFiles = [`Google Photos/Album/${truncated}`];
    const sidecarPath = `Google Photos/Album/${longName}.json`;
    const sidecarContent = JSON.stringify({
      title: longName,
      photoTakenTime: { timestamp: '1700000000' },
    });

    const result = matchSidecarToMedia(sidecarPath, sidecarContent, mediaFiles);
    expect(result).toBe(`Google Photos/Album/${truncated}`);
  });

  it('returns undefined for non-Takeout JSON content', () => {
    const mediaFiles = ['Google Photos/Album/photo.jpg'];
    const sidecarPath = 'Google Photos/Album/package.json';
    const sidecarContent = JSON.stringify({ name: 'package', version: '1.0.0' });

    const result = matchSidecarToMedia(sidecarPath, sidecarContent, mediaFiles);
    expect(result).toBeUndefined();
  });
});

describe('isAutoGeneratedAlbum', () => {
  it('detects "Photos from YYYY" as auto-generated', () => {
    expect(isAutoGeneratedAlbum('Photos from 2023')).toBe(true);
    expect(isAutoGeneratedAlbum('Photos from 2024')).toBe(true);
  });

  it('does not flag real album names', () => {
    expect(isAutoGeneratedAlbum('Summer Trip 2023')).toBe(false);
    expect(isAutoGeneratedAlbum('Wedding')).toBe(false);
    expect(isAutoGeneratedAlbum('Family')).toBe(false);
  });
});

describe('detectAlbums', () => {
  it('extracts album names from Takeout folder structure', () => {
    const items: TakeoutMediaItem[] = [
      { path: 'Google Photos/Summer Trip/photo1.jpg', file: new File([], 'photo1.jpg') },
      { path: 'Google Photos/Summer Trip/photo2.jpg', file: new File([], 'photo2.jpg') },
      { path: 'Google Photos/Wedding/photo3.jpg', file: new File([], 'photo3.jpg') },
      { path: 'Google Photos/Photos from 2023/photo4.jpg', file: new File([], 'photo4.jpg') },
    ];

    const albums = detectAlbums(items);

    expect(albums).toHaveLength(3);
    expect(albums).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Summer Trip', itemCount: 2, isAutoGenerated: false }),
        expect.objectContaining({ name: 'Wedding', itemCount: 1, isAutoGenerated: false }),
        expect.objectContaining({ name: 'Photos from 2023', itemCount: 1, isAutoGenerated: true }),
      ]),
    );
  });

  it('returns empty array when no albums detected', () => {
    const items: TakeoutMediaItem[] = [{ path: 'photo1.jpg', file: new File([], 'photo1.jpg') }];

    const albums = detectAlbums(items);
    expect(albums).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-parser.spec.ts
```

Expected: FAIL — functions not exported.

**Step 3: Implement matching and album detection**

Add to `google-takeout-parser.ts`:

```typescript
export interface TakeoutMediaItem {
  path: string;
  file: File;
  metadata?: TakeoutMetadata;
  albumName?: string;
}

export interface TakeoutAlbum {
  name: string;
  itemCount: number;
  isAutoGenerated: boolean;
  itemPaths: string[];
}

const PHOTOS_FROM_YEAR_RE = /^Photos from \d{4}$/;

export function isAutoGeneratedAlbum(name: string): boolean {
  return PHOTOS_FROM_YEAR_RE.test(name);
}

/**
 * Given a sidecar JSON path and its content, find the matching media file.
 * Returns the media file path or undefined if no match / not a valid Takeout sidecar.
 */
export function matchSidecarToMedia(
  sidecarPath: string,
  sidecarContent: string,
  mediaFilePaths: string[],
): string | undefined {
  const metadata = parseGoogleTakeoutSidecar(sidecarContent);
  if (!metadata) {
    return undefined;
  }

  // Primary: strip .json extension → exact match
  const expectedMediaPath = sidecarPath.replace(/\.json$/, '');
  if (mediaFilePaths.includes(expectedMediaPath)) {
    return expectedMediaPath;
  }

  // Fallback: Google truncates filenames at 47 chars (without extension).
  // Try matching by directory + truncated basename.
  const dir = sidecarPath.slice(0, Math.max(0, sidecarPath.lastIndexOf('/')));
  for (const mediaPath of mediaFilePaths) {
    const mediaDir = mediaPath.slice(0, Math.max(0, mediaPath.lastIndexOf('/')));
    if (mediaDir !== dir) {
      continue;
    }

    const mediaBasename = mediaPath.slice(mediaPath.lastIndexOf('/') + 1);
    const sidecarBasename = expectedMediaPath.slice(expectedMediaPath.lastIndexOf('/') + 1);

    // Check if the media filename is a truncation of the sidecar's expected filename
    if (sidecarBasename.length > mediaBasename.length) {
      const mediaNameNoExt = mediaBasename.slice(0, mediaBasename.lastIndexOf('.'));
      const sidecarNameNoExt = sidecarBasename.slice(0, sidecarBasename.lastIndexOf('.'));
      const mediaExt = mediaBasename.slice(mediaBasename.lastIndexOf('.'));
      const sidecarExt = sidecarBasename.slice(sidecarBasename.lastIndexOf('.'));

      if (mediaExt === sidecarExt && sidecarNameNoExt.startsWith(mediaNameNoExt)) {
        return mediaPath;
      }
    }
  }

  return undefined;
}

/**
 * Detect albums from the Takeout folder structure.
 * Expects paths like "Google Photos/AlbumName/file.jpg".
 */
export function detectAlbums(items: TakeoutMediaItem[]): TakeoutAlbum[] {
  const albumMap = new Map<string, string[]>();

  for (const item of items) {
    const parts = item.path.split('/');
    // Expected structure: "Google Photos/AlbumName/file.jpg" — album is at index 1
    if (parts.length < 3) {
      continue;
    }

    // Find the album folder — it's the folder directly containing the media file,
    // which is typically the second segment after "Google Photos"
    const albumName = parts.at(-2);
    if (!albumName || albumName === 'Google Photos') {
      continue;
    }

    const existing = albumMap.get(albumName) ?? [];
    existing.push(item.path);
    albumMap.set(albumName, existing);
  }

  return [...albumMap.entries()].map(([name, paths]) => ({
    name,
    itemCount: paths.length,
    isAutoGenerated: isAutoGeneratedAlbum(name),
    itemPaths: paths,
  }));
}
```

**Step 4: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-parser.spec.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat: add Takeout file matching and album detection"
```

---

## Task 4: Takeout scanner — zip streaming integration

Reads zip files using `zip.js` streaming API, extracts file entries, builds the media manifest.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Create: `web/src/lib/utils/google-takeout-scanner.ts`
- Create: `web/src/lib/utils/google-takeout-scanner.spec.ts`

**Step 1: Write failing tests for the scanner**

Note: Since zip.js requires actual zip files, these tests will use a helper to create in-memory zip blobs. We test the scanner's orchestration logic — given zip entries, does it correctly build the manifest?

```typescript
// web/src/lib/utils/google-takeout-scanner.spec.ts
import { scanTakeoutFiles, type ScanResult, type ScanProgress } from './google-takeout-scanner';

// Helper to create a mock zip-like File from a record of path → content
async function createMockZip(entries: Record<string, string>): Promise<File> {
  // Use zip.js to create a real zip blob for testing
  const { BlobWriter, ZipWriter, TextReader } = await import('@zip.js/zip.js');
  const blobWriter = new BlobWriter();
  const zipWriter = new ZipWriter(blobWriter);

  for (const [path, content] of Object.entries(entries)) {
    await zipWriter.add(path, new TextReader(content));
  }

  await zipWriter.close();
  const blob = await blobWriter.getData();
  return new File([blob], 'takeout.zip', { type: 'application/zip' });
}

describe('scanTakeoutFiles', () => {
  it('scans a zip and extracts media items with metadata', async () => {
    const zip = await createMockZip({
      'Takeout/Google Photos/Summer Trip/photo1.jpg': 'fake-image-data',
      'Takeout/Google Photos/Summer Trip/photo1.jpg.json': JSON.stringify({
        title: 'photo1.jpg',
        description: 'Beach day',
        photoTakenTime: { timestamp: '1700000000' },
        geoData: { latitude: 48.8566, longitude: 2.3522, altitude: 35 },
        favorited: true,
      }),
    });

    const result = await scanTakeoutFiles({ files: [zip] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].metadata).toBeDefined();
    expect(result.items[0].metadata?.description).toBe('Beach day');
    expect(result.items[0].metadata?.isFavorite).toBe(true);
    expect(result.items[0].metadata?.latitude).toBe(48.8566);
    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].name).toBe('Summer Trip');
  });

  it('reports scan progress via callback', async () => {
    const zip = await createMockZip({
      'Takeout/Google Photos/Album/p1.jpg': 'data1',
      'Takeout/Google Photos/Album/p1.jpg.json': JSON.stringify({
        title: 'p1.jpg',
        photoTakenTime: { timestamp: '1700000000' },
      }),
      'Takeout/Google Photos/Album/p2.jpg': 'data2',
      'Takeout/Google Photos/Album/p2.jpg.json': JSON.stringify({
        title: 'p2.jpg',
        photoTakenTime: { timestamp: '1700000001' },
      }),
    });

    const progressUpdates: ScanProgress[] = [];
    await scanTakeoutFiles({
      files: [zip],
      onProgress: (p) => progressUpdates.push({ ...p }),
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    const last = progressUpdates.at(-1)!;
    expect(last.mediaCount).toBe(2);
  });

  it('handles items without a matching sidecar', async () => {
    const zip = await createMockZip({
      'Takeout/Google Photos/Album/no-sidecar.jpg': 'data',
    });

    const result = await scanTakeoutFiles({ files: [zip] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].metadata).toBeUndefined();
  });

  it('merges results from multiple zip files', async () => {
    const zip1 = await createMockZip({
      'Takeout/Google Photos/Album1/a.jpg': 'data',
      'Takeout/Google Photos/Album1/a.jpg.json': JSON.stringify({
        title: 'a.jpg',
        photoTakenTime: { timestamp: '1700000000' },
      }),
    });
    const zip2 = await createMockZip({
      'Takeout/Google Photos/Album2/b.jpg': 'data',
      'Takeout/Google Photos/Album2/b.jpg.json': JSON.stringify({
        title: 'b.jpg',
        photoTakenTime: { timestamp: '1700000001' },
      }),
    });

    const result = await scanTakeoutFiles({ files: [zip1, zip2] });

    expect(result.items).toHaveLength(2);
    expect(result.albums).toHaveLength(2);
  });

  it('skips non-media files (json-only entries, metadata.json)', async () => {
    const zip = await createMockZip({
      'Takeout/Google Photos/Album/metadata.json': '{"albumData":{"title":"Album"}}',
      'Takeout/Google Photos/Album/print-subscriptions.json': '{}',
    });

    const result = await scanTakeoutFiles({ files: [zip] });
    expect(result.items).toHaveLength(0);
  });

  it('supports abort signal for cancellation', async () => {
    const zip = await createMockZip({
      'Takeout/Google Photos/Album/photo.jpg': 'data',
    });

    const controller = new AbortController();
    controller.abort();

    await expect(scanTakeoutFiles({ files: [zip], signal: controller.signal })).rejects.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the scanner**

```typescript
// web/src/lib/utils/google-takeout-scanner.ts
import { BlobReader, ZipReader, type Entry } from '@zip.js/zip.js';
import {
  detectAlbums,
  matchSidecarToMedia,
  parseGoogleTakeoutSidecar,
  type TakeoutAlbum,
  type TakeoutMediaItem,
  type TakeoutMetadata,
} from './google-takeout-parser';

export interface ScanProgress {
  currentFile: string;
  currentZip: string;
  zipIndex: number;
  zipCount: number;
  mediaCount: number;
  withLocation: number;
  withDate: number;
  favorites: number;
  archived: number;
  albumNames: Set<string>;
}

export interface ScanResult {
  items: TakeoutMediaItem[];
  albums: TakeoutAlbum[];
  stats: {
    totalMedia: number;
    withLocation: number;
    withDate: number;
    favorites: number;
    archived: number;
    dateRange: { earliest: Date; latest: Date } | undefined;
  };
}

// Common media extensions Immich supports
const MEDIA_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
  '.heif',
  '.tiff',
  '.tif',
  '.bmp',
  '.avif',
  '.jxl',
  '.raw',
  '.arw',
  '.cr2',
  '.cr3',
  '.dng',
  '.nef',
  '.orf',
  '.raf',
  '.rw2',
  '.srw',
  '.pef',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.m4v',
  '.3gp',
  '.mts',
  '.m2ts',
]);

function isMediaFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return MEDIA_EXTENSIONS.has(ext);
}

function isJsonSidecar(path: string): boolean {
  return path.toLowerCase().endsWith('.json');
}

interface ScanOptions {
  files: File[];
  onProgress?: (progress: ScanProgress) => void;
  signal?: AbortSignal;
}

export async function scanTakeoutFiles({ files, onProgress, signal }: ScanOptions): Promise<ScanResult> {
  const allItems: TakeoutMediaItem[] = [];
  const progress: ScanProgress = {
    currentFile: '',
    currentZip: '',
    zipIndex: 0,
    zipCount: files.length,
    mediaCount: 0,
    withLocation: 0,
    withDate: 0,
    favorites: 0,
    archived: 0,
    albumNames: new Set(),
  };

  for (let i = 0; i < files.length; i++) {
    signal?.throwIfAborted();

    const file = files[i];
    progress.zipIndex = i;
    progress.currentZip = file.name;

    const items = await scanSingleZip(file, progress, onProgress, signal);
    allItems.push(...items);
  }

  const albums = detectAlbums(allItems);

  // Assign album names to items
  for (const album of albums) {
    for (const path of album.itemPaths) {
      const item = allItems.find((i) => i.path === path);
      if (item) {
        item.albumName = album.name;
      }
    }
  }

  // Compute date range
  const dates = allItems.map((i) => i.metadata?.dateTaken).filter((d): d is Date => d !== undefined);
  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    items: allItems,
    albums,
    stats: {
      totalMedia: allItems.length,
      withLocation: progress.withLocation,
      withDate: progress.withDate,
      favorites: progress.favorites,
      archived: progress.archived,
      dateRange: dates.length > 0 ? { earliest: dates[0], latest: dates.at(-1)! } : undefined,
    },
  };
}

async function scanSingleZip(
  file: File,
  progress: ScanProgress,
  onProgress?: (progress: ScanProgress) => void,
  signal?: AbortSignal,
): Promise<TakeoutMediaItem[]> {
  const reader = new ZipReader(new BlobReader(file));
  const entries = await reader.getEntries();

  // First pass: collect media paths and sidecar entries
  const mediaPaths: string[] = [];
  const mediaEntries: Entry[] = [];
  const sidecarEntries: Entry[] = [];

  for (const entry of entries) {
    if (entry.directory || !entry.filename) {
      continue;
    }
    if (isMediaFile(entry.filename)) {
      mediaPaths.push(entry.filename);
      mediaEntries.push(entry);
    } else if (isJsonSidecar(entry.filename)) {
      sidecarEntries.push(entry);
    }
  }

  // Second pass: read sidecars and match to media
  const metadataMap = new Map<string, TakeoutMetadata>();

  for (const sidecarEntry of sidecarEntries) {
    signal?.throwIfAborted();

    progress.currentFile = sidecarEntry.filename;
    onProgress?.({ ...progress });

    // Read sidecar content
    const writer = new (await import('@zip.js/zip.js')).TextWriter();
    const content = await sidecarEntry.getData!(writer);

    const mediaPath = matchSidecarToMedia(sidecarEntry.filename, content, mediaPaths);
    if (mediaPath) {
      const metadata = parseGoogleTakeoutSidecar(content);
      if (metadata) {
        metadataMap.set(mediaPath, metadata);
      }
    }
  }

  // Build media items
  const items: TakeoutMediaItem[] = [];

  for (const entry of mediaEntries) {
    signal?.throwIfAborted();

    progress.currentFile = entry.filename;

    // Extract file blob from zip entry
    const writer = new (await import('@zip.js/zip.js')).BlobWriter();
    const blob = await entry.getData!(writer);
    const fileName = entry.filename.slice(entry.filename.lastIndexOf('/') + 1);
    const mediaFile = new File([blob], fileName, { lastModified: entry.lastModDate?.getTime() });

    const metadata = metadataMap.get(entry.filename);

    items.push({
      path: entry.filename,
      file: mediaFile,
      metadata,
    });

    // Update progress
    progress.mediaCount++;
    if (metadata?.dateTaken) {
      progress.withDate++;
    }
    if (metadata?.latitude !== undefined) {
      progress.withLocation++;
    }
    if (metadata?.isFavorite) {
      progress.favorites++;
    }
    if (metadata?.isArchived) {
      progress.archived++;
    }

    // Detect album from path
    const parts = entry.filename.split('/');
    if (parts.length >= 3) {
      const albumName = parts.at(-2);
      if (albumName && albumName !== 'Google Photos') {
        progress.albumNames.add(albumName);
      }
    }

    onProgress?.({ ...progress });
  }

  await reader.close();
  return items;
}
```

Note: The import path may be `@zip.js/zip.js` or `@nicolo-ribaudo/zip.js` — use whichever was installed in Task 1. Verify the correct import before implementing.

**Step 4: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add web/src/lib/utils/google-takeout-scanner.ts web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "feat: add Takeout zip scanner with streaming and progress"
```

---

## Task 5: Import manager — wizard state management

Svelte 5 runes-based state for the wizard.

**Files:**

- Create: `web/src/lib/managers/import-manager.svelte.ts`
- Create: `web/src/lib/managers/import-manager.spec.ts`

**Step 1: Write failing tests**

```typescript
// web/src/lib/managers/import-manager.spec.ts
import { ImportManager, ImportStep } from './import-manager.svelte';

describe('ImportManager', () => {
  let manager: ImportManager;

  beforeEach(() => {
    manager = new ImportManager();
  });

  describe('step navigation', () => {
    it('starts at Source step', () => {
      expect(manager.currentStep).toBe(ImportStep.Source);
    });

    it('advances to next step', () => {
      manager.nextStep();
      expect(manager.currentStep).toBe(ImportStep.Files);
    });

    it('goes back to previous step', () => {
      manager.nextStep();
      manager.previousStep();
      expect(manager.currentStep).toBe(ImportStep.Source);
    });

    it('does not go back past Source', () => {
      manager.previousStep();
      expect(manager.currentStep).toBe(ImportStep.Source);
    });

    it('resets to Source step', () => {
      manager.nextStep();
      manager.nextStep();
      manager.reset();
      expect(manager.currentStep).toBe(ImportStep.Source);
    });
  });

  describe('file management', () => {
    it('starts with no files', () => {
      expect(manager.selectedFiles).toHaveLength(0);
    });

    it('adds files', () => {
      const file = new File([], 'takeout.zip');
      manager.addFiles([file]);
      expect(manager.selectedFiles).toHaveLength(1);
    });

    it('clears files', () => {
      manager.addFiles([new File([], 'takeout.zip')]);
      manager.clearFiles();
      expect(manager.selectedFiles).toHaveLength(0);
    });

    it('calculates total size', () => {
      const file1 = new File(['a'.repeat(100)], 'a.zip');
      const file2 = new File(['b'.repeat(200)], 'b.zip');
      manager.addFiles([file1, file2]);
      expect(manager.totalSize).toBe(300);
    });
  });

  describe('album selection', () => {
    it('toggles album selection', () => {
      manager.setAlbums([{ name: 'Trip', itemCount: 5, isAutoGenerated: false, itemPaths: [] }]);
      expect(manager.selectedAlbums.has('Trip')).toBe(true);

      manager.toggleAlbum('Trip');
      expect(manager.selectedAlbums.has('Trip')).toBe(false);

      manager.toggleAlbum('Trip');
      expect(manager.selectedAlbums.has('Trip')).toBe(true);
    });

    it('auto-generated albums are unchecked by default', () => {
      manager.setAlbums([
        { name: 'Wedding', itemCount: 10, isAutoGenerated: false, itemPaths: [] },
        { name: 'Photos from 2023', itemCount: 100, isAutoGenerated: true, itemPaths: [] },
      ]);

      expect(manager.selectedAlbums.has('Wedding')).toBe(true);
      expect(manager.selectedAlbums.has('Photos from 2023')).toBe(false);
    });

    it('select all / deselect all', () => {
      manager.setAlbums([
        { name: 'A', itemCount: 1, isAutoGenerated: false, itemPaths: [] },
        { name: 'B', itemCount: 1, isAutoGenerated: true, itemPaths: [] },
      ]);

      manager.selectAllAlbums();
      expect(manager.selectedAlbums.size).toBe(2);

      manager.deselectAllAlbums();
      expect(manager.selectedAlbums.size).toBe(0);
    });
  });

  describe('import options', () => {
    it('has sensible defaults', () => {
      expect(manager.options.importFavorites).toBe(true);
      expect(manager.options.importArchived).toBe(true);
      expect(manager.options.importDescriptions).toBe(true);
      expect(manager.options.skipDuplicates).toBe(true);
    });

    it('toggles options', () => {
      manager.setOption('importFavorites', false);
      expect(manager.options.importFavorites).toBe(false);
    });
  });

  describe('import progress', () => {
    it('tracks import counts', () => {
      manager.trackImported();
      manager.trackImported();
      manager.trackSkipped();
      manager.trackError('file.jpg', 'upload failed');

      expect(manager.importProgress.imported).toBe(2);
      expect(manager.importProgress.skipped).toBe(1);
      expect(manager.importProgress.errors).toBe(1);
    });

    it('tracks pause state', () => {
      expect(manager.isPaused).toBe(false);
      manager.togglePause();
      expect(manager.isPaused).toBe(true);
      manager.togglePause();
      expect(manager.isPaused).toBe(false);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/managers/import-manager.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the manager**

```typescript
// web/src/lib/managers/import-manager.svelte.ts
import type { TakeoutAlbum, TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
import type { ScanProgress } from '$lib/utils/google-takeout-scanner';

export enum ImportStep {
  Source = 0,
  Files = 1,
  Scan = 2,
  Review = 3,
  Import = 4,
}

export interface ImportOptions {
  importFavorites: boolean;
  importArchived: boolean;
  importDescriptions: boolean;
  skipDuplicates: boolean;
}

export interface ImportProgress {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
  currentFile: string;
  currentAlbum: string;
  albumsCreated: number;
  errorLog: Array<{ file: string; error: string }>;
}

export class ImportManager {
  currentStep = $state(ImportStep.Source);
  selectedFiles = $state<File[]>([]);
  scanResult = $state<{ items: TakeoutMediaItem[]; albums: TakeoutAlbum[] } | undefined>(undefined);
  scanProgress = $state<ScanProgress | undefined>(undefined);
  selectedAlbums = $state(new Set<string>());
  options = $state<ImportOptions>({
    importFavorites: true,
    importArchived: true,
    importDescriptions: true,
    skipDuplicates: true,
  });
  importProgress = $state<ImportProgress>({
    imported: 0,
    skipped: 0,
    errors: 0,
    total: 0,
    currentFile: '',
    currentAlbum: '',
    albumsCreated: 0,
    errorLog: [],
  });
  isPaused = $state(false);
  isComplete = $state(false);

  totalSize = $derived(this.selectedFiles.reduce((sum, f) => sum + f.size, 0));

  nextStep() {
    if (this.currentStep < ImportStep.Import) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > ImportStep.Source) {
      this.currentStep--;
    }
  }

  reset() {
    this.currentStep = ImportStep.Source;
    this.selectedFiles = [];
    this.scanResult = undefined;
    this.scanProgress = undefined;
    this.selectedAlbums = new Set();
    this.options = {
      importFavorites: true,
      importArchived: true,
      importDescriptions: true,
      skipDuplicates: true,
    };
    this.importProgress = {
      imported: 0,
      skipped: 0,
      errors: 0,
      total: 0,
      currentFile: '',
      currentAlbum: '',
      albumsCreated: 0,
      errorLog: [],
    };
    this.isPaused = false;
    this.isComplete = false;
  }

  addFiles(files: File[]) {
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  clearFiles() {
    this.selectedFiles = [];
  }

  setAlbums(albums: TakeoutAlbum[]) {
    this.selectedAlbums = new Set(albums.filter((a) => !a.isAutoGenerated).map((a) => a.name));
  }

  toggleAlbum(name: string) {
    const next = new Set(this.selectedAlbums);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.selectedAlbums = next;
  }

  selectAllAlbums() {
    if (!this.scanResult) {
      return;
    }
    this.selectedAlbums = new Set(this.scanResult.albums.map((a) => a.name));
  }

  deselectAllAlbums() {
    this.selectedAlbums = new Set();
  }

  setOption<K extends keyof ImportOptions>(key: K, value: ImportOptions[K]) {
    this.options = { ...this.options, [key]: value };
  }

  trackImported() {
    this.importProgress = {
      ...this.importProgress,
      imported: this.importProgress.imported + 1,
    };
  }

  trackSkipped() {
    this.importProgress = {
      ...this.importProgress,
      skipped: this.importProgress.skipped + 1,
    };
  }

  trackError(file: string, error: string) {
    this.importProgress = {
      ...this.importProgress,
      errors: this.importProgress.errors + 1,
      errorLog: [...this.importProgress.errorLog, { file, error }],
    };
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/managers/import-manager.spec.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add web/src/lib/managers/import-manager.svelte.ts web/src/lib/managers/import-manager.spec.ts
git commit -m "feat: add import manager with wizard state management"
```

---

## Task 6: Route and sidebar — wire up `/import` page

**Files:**

- Modify: `web/src/lib/route.ts` (add `import` route)
- Modify: `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte` (add sidebar link)
- Create: `web/src/routes/(user)/import/+page.svelte` (route entry)
- Modify: `i18n/en.json` (add i18n keys)

**Step 1: Add the route**

In `web/src/lib/route.ts`, add after the `folders` entry (~line 67):

```typescript
  // import
  import: () => '/import',
```

**Step 2: Add sidebar link**

In `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte`:

1. Add import for `mdiDatabaseImportOutline` to the `@mdi/js` import block.
2. Add the NavbarItem after the Utilities entry (line 94):

```svelte
  <NavbarItem title={$t('import')} href={Route.import()} icon={mdiDatabaseImportOutline} />
```

**Step 3: Add i18n keys**

In `i18n/en.json`, add these keys (find alphabetical insertion points):

```json
  "import": "Import",
  "import_from_google_photos": "Google Photos",
  "import_from_apple_photos": "Apple Photos",
  "import_coming_soon": "Coming soon",
  "import_select_source": "Import Your Photos",
  "import_select_source_description": "Choose where you're importing from",
  "import_takeout_info": "You'll need your Google Takeout export. Don't have one?",
  "import_request_takeout": "Request it at takeout.google.com",
  "import_select_files": "Select Your Takeout Files",
  "import_drop_files": "Drop zip files or folders here, or click to browse",
  "import_select_zips": "Select Zip Files",
  "import_select_folder": "Select Folder",
  "import_selected_files": "Selected files",
  "import_clear": "Clear",
  "import_scanning": "Scanning Your Library",
  "import_scanning_description": "Reading metadata and matching photos",
  "import_found_so_far": "Found so far",
  "import_photos": "{count} photos",
  "import_videos": "{count} videos",
  "import_with_location": "{count} with location",
  "import_favorites": "{count} favorites",
  "import_archived": "{count} archived",
  "import_albums_detected": "{count} albums",
  "import_review": "Review Import",
  "import_items_ready": "{count} items ready to import",
  "import_missing_dates_warning": "{count} items missing date metadata — file dates will be used instead",
  "import_create_albums": "Create albums from Takeout folders",
  "import_select_all": "Select All",
  "import_deselect_all": "Deselect All",
  "import_options": "Options",
  "import_option_favorites": "Import favorites",
  "import_option_archived": "Import archived as archived",
  "import_option_descriptions": "Import descriptions",
  "import_option_skip_duplicates": "Skip duplicates already in Immich",
  "import_start": "Import {count}",
  "import_importing": "Importing Your Library",
  "import_keep_tab_open": "Keep this tab open until complete",
  "import_speed": "{speed}/s",
  "import_eta": "~{time} remaining",
  "import_status_imported": "imported",
  "import_status_skipped": "skipped",
  "import_status_errors": "errors",
  "import_status_remaining": "remaining",
  "import_pause": "Pause",
  "import_resume": "Resume",
  "import_complete": "Import Complete",
  "import_albums_created": "{count} albums created",
  "import_favorites_marked": "{count} favorites marked",
  "import_archived_count": "{count} archived",
  "import_view_photos": "View Photos",
  "import_view_albums": "View Albums",
  "import_items_failed": "{count} items failed",
  "import_retry_failed": "Retry Failed",
  "import_step_source": "Source",
  "import_step_files": "Files",
  "import_step_scan": "Scan",
  "import_step_review": "Review",
  "import_step_import": "Import",
```

**Step 4: Create the page route**

```svelte
<!-- web/src/routes/(user)/import/+page.svelte -->
<script lang="ts">
  import ImportWizard from '$lib/components/import/import-wizard.svelte';
</script>

<ImportWizard />
```

**Step 5: Create a placeholder wizard component** (to be fleshed out in later tasks)

```svelte
<!-- web/src/lib/components/import/import-wizard.svelte -->
<script lang="ts">
  import { Container } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<Container size="large" center>
  <div class="flex flex-col gap-6 py-8">
    <h1 class="text-2xl font-medium">{$t('import_select_source')}</h1>
    <p class="text-gray-500">{$t('import_select_source_description')}</p>
    <!-- Steps will be added in subsequent tasks -->
  </div>
</Container>
```

**Step 6: Verify it builds**

```bash
cd web && pnpm check
```

**Step 7: Commit**

```bash
git add web/src/lib/route.ts \
  web/src/lib/components/shared-components/side-bar/user-sidebar.svelte \
  web/src/routes/\(user\)/import/+page.svelte \
  web/src/lib/components/import/import-wizard.svelte \
  i18n/en.json
git commit -m "feat: add /import route, sidebar link, and wizard placeholder"
```

---

## Task 7: Step indicator component

**Files:**

- Create: `web/src/lib/components/import/import-step-indicator.svelte`
- Create: `web/src/lib/components/import/__tests__/import-step-indicator.spec.ts`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/import/__tests__/import-step-indicator.spec.ts
import { render } from '@testing-library/svelte';
import ImportStepIndicator from '../import-step-indicator.svelte';
import { ImportStep } from '$lib/managers/import-manager.svelte';

describe('ImportStepIndicator', () => {
  it('renders all step labels', () => {
    const { getByText } = render(ImportStepIndicator, { currentStep: ImportStep.Source });
    // Labels come from i18n dev mode — keys shown as-is
    expect(getByText('import_step_source')).toBeInTheDocument();
    expect(getByText('import_step_files')).toBeInTheDocument();
    expect(getByText('import_step_scan')).toBeInTheDocument();
    expect(getByText('import_step_review')).toBeInTheDocument();
    expect(getByText('import_step_import')).toBeInTheDocument();
  });

  it('marks current step as active', () => {
    const { getByTestId } = render(ImportStepIndicator, { currentStep: ImportStep.Files });
    expect(getByTestId('step-1')).toHaveClass('bg-primary');
  });

  it('marks previous steps as completed', () => {
    const { getByTestId } = render(ImportStepIndicator, { currentStep: ImportStep.Review });
    expect(getByTestId('step-0')).toHaveAttribute('data-completed', 'true');
    expect(getByTestId('step-1')).toHaveAttribute('data-completed', 'true');
    expect(getByTestId('step-2')).toHaveAttribute('data-completed', 'true');
  });

  it('marks future steps as inactive', () => {
    const { getByTestId } = render(ImportStepIndicator, { currentStep: ImportStep.Source });
    expect(getByTestId('step-1')).toHaveAttribute('data-completed', 'false');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/import/__tests__/import-step-indicator.spec.ts
```

**Step 3: Implement the component**

```svelte
<!-- web/src/lib/components/import/import-step-indicator.svelte -->
<script lang="ts">
  import { ImportStep } from '$lib/managers/import-manager.svelte';
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    currentStep: ImportStep;
  }

  let { currentStep }: Props = $props();

  const steps = [
    { key: ImportStep.Source, label: 'import_step_source' },
    { key: ImportStep.Files, label: 'import_step_files' },
    { key: ImportStep.Scan, label: 'import_step_scan' },
    { key: ImportStep.Review, label: 'import_step_review' },
    { key: ImportStep.Import, label: 'import_step_import' },
  ];
</script>

<div class="flex items-center justify-center gap-0">
  {#each steps as step, i (step.key)}
    {#if i > 0}
      <div
        class="h-0.5 w-8 sm:w-16 {currentStep > step.key ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}"
      ></div>
    {/if}

    <div class="flex flex-col items-center gap-1">
      <div
        data-testid="step-{i}"
        data-completed={currentStep > step.key ? 'true' : 'false'}
        class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors
          {currentStep === step.key
            ? 'bg-primary text-white'
            : currentStep > step.key
              ? 'bg-primary/20 text-primary'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}"
      >
        {#if currentStep > step.key}
          <Icon icon={mdiCheck} size="20" />
        {:else}
          {i + 1}
        {/if}
      </div>
      <span
        class="text-xs {currentStep === step.key
          ? 'font-medium text-primary'
          : currentStep > step.key
            ? 'text-primary/60'
            : 'text-gray-400 dark:text-gray-500'}"
      >
        {$t(step.label)}
      </span>
    </div>
  {/each}
</div>
```

**Step 4: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/import/__tests__/import-step-indicator.spec.ts
```

**Step 5: Commit**

```bash
git add web/src/lib/components/import/import-step-indicator.svelte \
  web/src/lib/components/import/__tests__/import-step-indicator.spec.ts
git commit -m "feat: add import step indicator component"
```

---

## Task 8: Source selection step

**Files:**

- Create: `web/src/lib/components/import/import-source-step.svelte`
- Create: `web/src/lib/components/import/__tests__/import-source-step.spec.ts`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/import/__tests__/import-source-step.spec.ts
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportSourceStep from '../import-source-step.svelte';

describe('ImportSourceStep', () => {
  it('renders Google Photos source card', () => {
    const { getByText } = render(ImportSourceStep, { onNext: vi.fn() });
    expect(getByText('import_from_google_photos')).toBeInTheDocument();
  });

  it('renders Apple Photos as disabled', () => {
    const { getByTestId } = render(ImportSourceStep, { onNext: vi.fn() });
    expect(getByTestId('source-apple')).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects Google Photos by default', () => {
    const { getByTestId } = render(ImportSourceStep, { onNext: vi.fn() });
    expect(getByTestId('source-google')).toHaveClass('border-primary');
  });

  it('calls onNext when Next is clicked', async () => {
    const onNext = vi.fn();
    const { getByText } = render(ImportSourceStep, { onNext });
    const user = userEvent.setup();

    await user.click(getByText('next'));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/import/__tests__/import-source-step.spec.ts
```

**Step 3: Implement**

```svelte
<!-- web/src/lib/components/import/import-source-step.svelte -->
<script lang="ts">
  import { Alert, Button } from '@immich/ui';
  import { mdiArrowRight, mdiGoogle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onNext: () => void;
  }

  let { onNext }: Props = $props();
</script>

<div class="flex flex-col gap-6">
  <div>
    <h2 class="text-xl font-medium">{$t('import_select_source')}</h2>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{$t('import_select_source_description')}</p>
  </div>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
    <!-- Google Photos -->
    <button
      type="button"
      data-testid="source-google"
      class="flex flex-col items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-6 transition-colors"
    >
      <svg class="h-10 w-10" viewBox="0 0 24 24">
        <path fill="currentColor" d={mdiGoogle} />
      </svg>
      <span class="text-sm font-medium">{$t('import_from_google_photos')}</span>
    </button>

    <!-- Apple Photos (disabled) -->
    <button
      type="button"
      data-testid="source-apple"
      aria-disabled="true"
      class="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 opacity-50 cursor-not-allowed dark:border-gray-700"
      disabled
    >
      <svg class="h-10 w-10 text-gray-400" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"
        />
      </svg>
      <span class="text-sm font-medium text-gray-400">{$t('import_from_apple_photos')}</span>
      <span class="text-xs text-gray-400">{$t('import_coming_soon')}</span>
    </button>
  </div>

  <Alert color="info" title="">
    <p class="text-sm">
      {$t('import_takeout_info')}
      <a
        href="https://takeout.google.com"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-primary underline"
      >
        {$t('import_request_takeout')}
      </a>
    </p>
  </Alert>

  <div class="flex justify-end">
    <Button shape="round" trailingIcon={mdiArrowRight} onclick={onNext}>
      {$t('next')}
    </Button>
  </div>
</div>
```

**Step 4: Run tests, verify pass. Step 5: Commit.**

```bash
cd web && pnpm test -- --run src/lib/components/import/__tests__/import-source-step.spec.ts
git add web/src/lib/components/import/import-source-step.svelte \
  web/src/lib/components/import/__tests__/import-source-step.spec.ts
git commit -m "feat: add import source selection step"
```

---

## Task 9: File selection step

**Files:**

- Create: `web/src/lib/components/import/import-files-step.svelte`
- Create: `web/src/lib/components/import/__tests__/import-files-step.spec.ts`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/import/__tests__/import-files-step.spec.ts
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportFilesStep from '../import-files-step.svelte';

describe('ImportFilesStep', () => {
  const defaultProps = {
    files: [] as File[],
    totalSize: 0,
    onAddFiles: vi.fn(),
    onClearFiles: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  it('shows drop zone when no files selected', () => {
    const { getByText } = render(ImportFilesStep, defaultProps);
    expect(getByText('import_drop_files')).toBeInTheDocument();
  });

  it('shows file list when files are selected', () => {
    const files = [new File(['data'], 'takeout.zip', { type: 'application/zip' })];
    const { getByText } = render(ImportFilesStep, { ...defaultProps, files, totalSize: 4 });
    expect(getByText('takeout.zip')).toBeInTheDocument();
  });

  it('disables Next when no files selected', () => {
    const { getByTestId } = render(ImportFilesStep, defaultProps);
    expect(getByTestId('next-button')).toBeDisabled();
  });

  it('enables Next when files are selected', () => {
    const files = [new File(['data'], 'takeout.zip')];
    const { getByTestId } = render(ImportFilesStep, { ...defaultProps, files, totalSize: 4 });
    expect(getByTestId('next-button')).not.toBeDisabled();
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = vi.fn();
    const { getByText } = render(ImportFilesStep, { ...defaultProps, onBack });
    await userEvent.setup().click(getByText('back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onClearFiles when Clear is clicked', async () => {
    const onClearFiles = vi.fn();
    const files = [new File(['data'], 'takeout.zip')];
    const { getByText } = render(ImportFilesStep, { ...defaultProps, files, totalSize: 4, onClearFiles });
    await userEvent.setup().click(getByText('import_clear'));
    expect(onClearFiles).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run tests to verify they fail**

**Step 3: Implement the component**

The component has a drop zone with drag-and-drop handlers, two buttons for zip/folder selection, and a file list. It uses the `input` element with `webkitdirectory` attribute for folder selection. The drop zone uses `ondragover`, `ondragenter`, `ondragleave`, `ondrop` handlers for DnD support.

Key implementation details:

- `<input type="file" accept=".zip" multiple>` for zip selection
- `<input type="file" webkitdirectory>` for folder selection
- File list shows icon (`mdiPackageVariantClosed` for zip, `mdiFolder` for folders), name, and human-readable size
- Use `$lib/utils` `asByteUnitString` if available, otherwise format bytes manually

**Step 4: Run tests, verify pass. Step 5: Commit.**

```bash
git add web/src/lib/components/import/import-files-step.svelte \
  web/src/lib/components/import/__tests__/import-files-step.spec.ts
git commit -m "feat: add import file selection step with drag-and-drop"
```

---

## Task 10: Scan progress step

**Files:**

- Create: `web/src/lib/components/import/import-scan-step.svelte`
- Create: `web/src/lib/components/import/__tests__/import-scan-step.spec.ts`

Write tests for: renders progress bar, shows scan stats, calls `onCancel` when Cancel clicked. Implement the component showing a progress bar (`h-2 rounded-full bg-gray-200` with `bg-primary` fill), current file name, and live-updating stats (photos, videos, locations, favorites, albums). Auto-advances by calling `onComplete` when scanning finishes.

```bash
git commit -m "feat: add import scanning progress step"
```

---

## Task 11: Review & configure step

**Files:**

- Create: `web/src/lib/components/import/import-review-step.svelte`
- Create: `web/src/lib/components/import/__tests__/import-review-step.spec.ts`

This is the most complex UI step. Tests should cover:

- Summary stats render correctly
- Albums listed with checkboxes
- "Photos from YYYY" unchecked by default
- Select All / Deselect All buttons work
- Options toggles work
- Import button shows correct count and calls `onImport`
- Warning shown when items missing dates

The component has three cards (Summary, Albums, Options) using `Card color="secondary"` from `@immich/ui`.

```bash
git commit -m "feat: add import review and configure step"
```

---

## Task 12: Import progress step (upload + completion)

**Files:**

- Create: `web/src/lib/components/import/import-progress-step.svelte`
- Create: `web/src/lib/components/import/__tests__/import-progress-step.spec.ts`

Tests should cover: renders progress bar, shows status counters, shows completion state, Pause/Resume toggles, View Photos/View Albums buttons link correctly.

Two states: importing (progress bar, counters, Pause button) and complete (checkmark, final stats, navigation buttons).

```bash
git commit -m "feat: add import progress and completion step"
```

---

## Task 13: Wire up the wizard — full orchestration

**Files:**

- Modify: `web/src/lib/components/import/import-wizard.svelte`
- Create: `web/src/lib/components/import/__tests__/import-wizard.spec.ts`

Replace the placeholder wizard with the full orchestration:

1. Instantiate `ImportManager`
2. Render `ImportStepIndicator` with `manager.currentStep`
3. Conditionally render the correct step component based on `manager.currentStep`
4. Wire step callbacks to manager methods
5. On step 3 (Scan): call `scanTakeoutFiles()` with `manager.selectedFiles`, update `manager.scanProgress`, then set `manager.scanResult` and advance
6. On step 5 (Import): implement the upload loop that:
   - Iterates through `scanResult.items`
   - For each item, builds FormData with metadata from Takeout sidecar
   - Uploads via existing upload infrastructure (adapted from `file-uploader.ts`)
   - After upload, calls `updateAsset()` for GPS/description/archived
   - Creates albums and assigns assets
   - Updates `manager.importProgress`
   - Respects `manager.isPaused`

Tests should verify: correct step renders for each `ImportStep` value, step transitions work end-to-end.

```bash
git commit -m "feat: wire up import wizard with full orchestration"
```

---

## Task 14: Upload integration — metadata injection

**Files:**

- Create: `web/src/lib/utils/google-takeout-uploader.ts`
- Create: `web/src/lib/utils/google-takeout-uploader.spec.ts`

This module handles the actual upload of a single Takeout item with metadata:

```typescript
export async function uploadTakeoutItem(item: TakeoutMediaItem, options: ImportOptions): Promise<UploadResult>;
```

Tests:

- Builds FormData with correct `fileCreatedAt` from Takeout date
- Sets `isFavorite` when option enabled and item is favorited
- Calls `updateAsset` with GPS coordinates after upload
- Calls `updateAsset` with description after upload
- Sets visibility to `Archive` when item is archived and option enabled
- Skips metadata updates when options are disabled
- Returns `{ assetId, status }` on success
- Returns error on failure without throwing

```bash
git commit -m "feat: add Takeout upload function with metadata injection"
```

---

## Task 15: Album creation integration

**Files:**

- Modify: `web/src/lib/utils/google-takeout-uploader.ts`
- Modify: `web/src/lib/utils/google-takeout-uploader.spec.ts`

Add album creation logic:

```typescript
export async function createImportAlbums(
  items: TakeoutMediaItem[],
  assetIdMap: Map<string, string>, // item path → Immich asset ID
  selectedAlbums: Set<string>,
): Promise<number>;
```

Tests:

- Creates albums for selected album names
- Adds correct assets to each album
- Skips unselected albums
- Returns count of albums created
- Handles album creation failure gracefully

Uses existing `createAlbum` from `$lib/utils/album-utils.ts` and `addAssetsToAlbums` from `$lib/services/album.service.ts`.

```bash
git commit -m "feat: add album creation for Google Photos import"
```

---

## Task 16: Folder upload support (non-zip)

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`

Add support for scanning extracted folders (not just zip files). When `files` contains non-zip entries (detected by absence of `.zip` extension or by checking the `webkitRelativePath` property), process them as a folder structure.

Tests:

- Scans a list of `File` objects with `webkitRelativePath` set
- Correctly builds media items from folder structure
- Matches JSON sidecars from the same folder
- Detects albums from folder hierarchy

```bash
git commit -m "feat: add folder upload support to Takeout scanner"
```

---

## Task 17: Lint, format, type-check

**Step 1: Run all checks**

```bash
cd web && pnpm check && cd ../
make lint-web
make format-web
```

**Step 2: Fix any issues**

**Step 3: Run all web tests**

```bash
cd web && pnpm test -- --run
```

Expected: All tests pass, no regressions.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: fix lint and type-check issues in import feature"
```

---

## Task 18: Create PR

Create a PR from the worktree branch to main.

```bash
gh pr create --title "feat(web): Google Photos import wizard" --body "$(cat <<'EOF'
## Summary
- New `/import` page with guided 5-step wizard for importing Google Takeout exports
- Client-side zip streaming via `zip.js` — parses JSON sidecars, matches to photos
- Full metadata preservation: dates, GPS, descriptions, favorites, archived status
- Album detection from Takeout folder structure with user selection
- "Photos from YYYY" auto-generated folders unchecked by default
- Reuses existing upload API — no server changes needed

## Test plan
- [ ] Unit tests: Google Takeout JSON parser (edge cases, malformed input, GPS filtering)
- [ ] Unit tests: File matching (exact match, truncated filenames, non-Takeout JSON rejection)
- [ ] Unit tests: Album detection (real albums vs auto-generated)
- [ ] Unit tests: Import manager state (steps, files, albums, options, progress)
- [ ] Component tests: Each wizard step renders correctly
- [ ] Component tests: Step indicator reflects current/completed/future
- [ ] Component tests: Review step album selection and options
- [ ] Manual: Import a real Google Takeout zip, verify metadata preserved
- [ ] Manual: Import multiple split zips, verify merge
- [ ] Manual: Import extracted folder, verify same behavior
- [ ] Manual: Verify albums created correctly, "Photos from YYYY" skipped by default

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" --label "changelog:feat"
```

Then babysit CI:

```bash
gh pr checks <PR_NUMBER> --watch
```

Fix any CI failures, re-run flaky tests if needed.
