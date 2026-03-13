import type { TakeoutAlbum, TakeoutMediaItem, TakeoutMetadata } from '$lib/utils/google-takeout-parser';
import { detectAlbums, matchSidecarToMedia, parseGoogleTakeoutSidecar } from '$lib/utils/google-takeout-parser';

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

export interface ScanOptions {
  files: File[];
  onProgress?: (progress: ScanProgress) => void;
  signal?: AbortSignal;
}

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
  '.raw',
  '.arw',
  '.cr2',
  '.cr3',
  '.dng',
  '.nef',
  '.orf',
  '.raf',
  '.rw2',
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
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) {
    return false;
  }
  return MEDIA_EXTENSIONS.has(path.slice(lastDot).toLowerCase());
}

function isSidecarFile(path: string): boolean {
  return path.endsWith('.json') && !isStandaloneJson(path);
}

/** Standalone JSON files that are not sidecars (Google Takeout metadata files). */
function isStandaloneJson(path: string): boolean {
  const basename = path.slice(Math.max(0, path.lastIndexOf('/') + 1));
  const standaloneNames = new Set([
    'metadata.json',
    'print-subscriptions.json',
    'shared_album_comments.json',
    'user-generated-memory-titles.json',
  ]);
  return standaloneNames.has(basename);
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

interface ZipEntry {
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData?: (...args: any[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arrayBuffer?: (options?: any) => Promise<ArrayBuffer>;
}

function isZipFile(file: File): boolean {
  return (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.name.toLowerCase().endsWith('.zip')
  );
}

function getFilePath(file: File): string {
  // Use webkitRelativePath if available (folder selection), otherwise just the name
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
}

function trackItemStats(
  metadata: TakeoutMetadata | undefined,
  filePath: string,
  progress: ScanProgress,
): string | undefined {
  // Detect album from path
  const parts = filePath.split('/');
  const googlePhotosIndex = parts.indexOf('Google Photos');
  let albumName: string | undefined;
  if (googlePhotosIndex !== -1 && googlePhotosIndex < parts.length - 2) {
    albumName = parts[googlePhotosIndex + 1];
    progress.albumNames.add(albumName);
  }

  progress.mediaCount++;

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

  return albumName;
}

async function scanZipFile(
  zipFile: File,
  allItems: TakeoutMediaItem[],
  progress: ScanProgress,
  onProgress?: (progress: ScanProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { BlobReader, ZipReader, configure } = await import('@zip.js/zip.js');

  // Disable web workers to avoid stream lifecycle issues during SvelteKit navigation
  configure({ useWebWorkers: false });

  const reader = new ZipReader(new BlobReader(zipFile));

  // Single pass: read all entries once to avoid stream reuse errors.
  // Wrap in try/finally to ensure reader is always closed.
  const mediaPaths: string[] = [];
  const mediaBlobs = new Map<string, Blob>();
  const sidecarTexts = new Map<string, string>();

  try {
    const entries: ZipEntry[] = await reader.getEntries();

    for (const entry of entries) {
      if (!entry.filename || entry.filename.endsWith('/')) {
        continue;
      }

      // Prefer arrayBuffer() which creates a fresh TransformStream per call,
      // avoiding the BlobWriter stream lifecycle issues that cause
      // "Can not close stream after closing or error" in browsers.
      const hasExtractor = entry.arrayBuffer || entry.getData;
      if (!hasExtractor) {
        continue;
      }

      checkAbort(signal);
      progress.currentFile = entry.filename;
      onProgress?.(progress);

      try {
        if (isMediaFile(entry.filename)) {
          mediaPaths.push(entry.filename);

          // Update progress counters during extraction so the UI shows activity
          progress.mediaCount++;
          const parts = entry.filename.split('/');
          const gpIdx = parts.indexOf('Google Photos');
          if (gpIdx !== -1 && gpIdx < parts.length - 2) {
            progress.albumNames.add(parts[gpIdx + 1]);
          }
          onProgress?.(progress);

          // arrayBuffer() creates a fresh TransformStream per call, avoiding
          // the BlobWriter stream lifecycle issues in browsers.
          if (entry.arrayBuffer) {
            const buffer = await entry.arrayBuffer();
            mediaBlobs.set(entry.filename, new Blob([buffer]));
          } else {
            const blob = (await entry.getData!(new WritableStream())) as Blob;
            mediaBlobs.set(entry.filename, blob);
          }
        } else if (isSidecarFile(entry.filename)) {
          if (entry.arrayBuffer) {
            const buffer = await entry.arrayBuffer();
            sidecarTexts.set(entry.filename, new TextDecoder().decode(buffer));
          } else {
            const blob = (await entry.getData!(new WritableStream())) as Blob;
            sidecarTexts.set(entry.filename, await blob.text());
          }
        }
      } catch (error) {
        console.warn(`Skipping zip entry "${entry.filename}":`, error);
      }
    }
  } finally {
    await reader.close();
  }

  // Match sidecars to media (no zip I/O needed)
  const metadataMap = new Map<string, TakeoutMetadata>();
  for (const [sidecarPath, text] of sidecarTexts) {
    const matchedPath = matchSidecarToMedia(sidecarPath, text, mediaPaths);
    if (matchedPath) {
      const metadata = parseGoogleTakeoutSidecar(text);
      if (metadata) {
        metadataMap.set(matchedPath, metadata);
      }
    }
  }

  // Build items from extracted blobs.
  // mediaCount and albumNames were already updated during extraction,
  // so only track metadata-dependent stats here (location, date, favorites, archived).
  for (const [path, blob] of mediaBlobs) {
    const basename = path.slice(Math.max(0, path.lastIndexOf('/') + 1));
    const file = new File([blob], basename, { type: blob.type || 'application/octet-stream' });
    const metadata = metadataMap.get(path);

    // Detect album from path (same logic as trackItemStats but without incrementing mediaCount)
    const parts = path.split('/');
    const googlePhotosIndex = parts.indexOf('Google Photos');
    let albumName: string | undefined;
    if (googlePhotosIndex !== -1 && googlePhotosIndex < parts.length - 2) {
      albumName = parts[googlePhotosIndex + 1];
    }

    // Track metadata-dependent stats
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

    allItems.push({ path, file, metadata, albumName });
    onProgress?.(progress);
  }
}

async function scanFolderFiles(
  files: File[],
  allItems: TakeoutMediaItem[],
  progress: ScanProgress,
  onProgress?: (progress: ScanProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  // Classify files by their relative path
  const mediaFiles: File[] = [];
  const sidecarFiles: File[] = [];
  const mediaPaths: string[] = [];

  for (const file of files) {
    const filePath = getFilePath(file);
    if (isMediaFile(filePath)) {
      mediaFiles.push(file);
      mediaPaths.push(filePath);
    } else if (isSidecarFile(filePath)) {
      sidecarFiles.push(file);
    }
  }

  // Read sidecars and match to media
  const metadataMap = new Map<string, TakeoutMetadata>();

  for (const sidecar of sidecarFiles) {
    checkAbort(signal);

    const sidecarPath = getFilePath(sidecar);
    progress.currentFile = sidecarPath;
    onProgress?.(progress);

    const text = await sidecar.text();
    const matchedPath = matchSidecarToMedia(sidecarPath, text, mediaPaths);
    if (matchedPath) {
      const metadata = parseGoogleTakeoutSidecar(text);
      if (metadata) {
        metadataMap.set(matchedPath, metadata);
      }
    }
  }

  // Build items from media files
  for (const file of mediaFiles) {
    checkAbort(signal);

    const filePath = getFilePath(file);
    progress.currentFile = filePath;

    const metadata = metadataMap.get(filePath);
    const albumName = trackItemStats(metadata, filePath, progress);

    const item: TakeoutMediaItem = {
      path: filePath,
      file,
      metadata,
      albumName,
    };

    allItems.push(item);
    onProgress?.(progress);
  }
}

export async function scanTakeoutFiles(options: ScanOptions): Promise<ScanResult> {
  const { files, onProgress, signal } = options;

  checkAbort(signal);

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

  // Separate zip files from folder files
  const zipFiles: File[] = [];
  const folderFiles: File[] = [];

  for (const file of files) {
    if (isZipFile(file)) {
      zipFiles.push(file);
    } else {
      folderFiles.push(file);
    }
  }

  progress.zipCount = zipFiles.length;

  // Process zip files
  for (let zipIndex = 0; zipIndex < zipFiles.length; zipIndex++) {
    checkAbort(signal);

    const zipFile = zipFiles[zipIndex];
    progress.zipIndex = zipIndex;
    progress.currentZip = zipFile.name;

    await scanZipFile(zipFile, allItems, progress, onProgress, signal);
  }

  // Process folder files
  if (folderFiles.length > 0) {
    await scanFolderFiles(folderFiles, allItems, progress, onProgress, signal);
  }

  // Detect albums from the collected items
  const albums = detectAlbums(allItems);

  // Compute date range
  const dates = allItems.filter((item) => item.metadata?.dateTaken).map((item) => item.metadata!.dateTaken!);

  let dateRange: { earliest: Date; latest: Date } | undefined;
  if (dates.length > 0) {
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    dateRange = { earliest: sorted[0], latest: sorted.at(-1)! };
  }

  return {
    items: allItems,
    albums,
    stats: {
      totalMedia: allItems.length,
      withLocation: progress.withLocation,
      withDate: progress.withDate,
      favorites: progress.favorites,
      archived: progress.archived,
      dateRange,
    },
  };
}

export { type TakeoutAlbum, type TakeoutMediaItem, type TakeoutMetadata } from '$lib/utils/google-takeout-parser';
