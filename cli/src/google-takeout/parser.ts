/**
 * Google Photos Takeout Parser
 *
 * Parses Google Takeout export directories and ZIP files,
 * matching media files with their JSON metadata sidecars.
 */

import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { buildJsonFileMap, findMatchingJson, isGooglePhotosJson } from './matcher.js';
import type { GooglePhotosMetadata, TakeoutAsset, TakeoutParserOptions, TakeoutStats } from './types.js';

// Common media extensions supported by Immich
const MEDIA_EXTENSIONS = new Set([
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.heic',
  '.heif',
  '.webp',
  '.tiff',
  '.tif',
  '.bmp',
  '.raw',
  '.dng',
  '.cr2',
  '.nef',
  '.arw',
  '.raf',
  '.orf',
  '.rw2',
  '.pef',
  '.srw',
  // Videos
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

// Default patterns to exclude
const DEFAULT_EXCLUDE_PATTERNS = [
  '@eaDir',
  '@__thumb',
  'SYNOFILE_THUMB_*',
  '.DS_Store',
  '._*',
  '.Spotlight-V100',
  'Thumbs.db',
  'desktop.ini',
];

/**
 * Parse a Google Photos Takeout export
 *
 * @param options - Parser options
 * @yields TakeoutAsset for each matched media file
 */
export async function* parseTakeout(options: TakeoutParserOptions): AsyncGenerator<TakeoutAsset> {
  const stats: TakeoutStats = {
    totalMediaFiles: 0,
    matchedWithJson: 0,
    missingJson: 0,
    albums: 0,
    livePhotos: 0,
    errors: [],
  };

  const excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...(options.excludePatterns || [])];

  for (const inputPath of options.paths) {
    const pathStat = await stat(inputPath);

    if (pathStat.isDirectory()) {
      yield* parseDirectory(inputPath, excludePatterns, options.includeHidden, stats);
    } else if (inputPath.toLowerCase().endsWith('.zip')) {
      yield* parseZipFile(inputPath, excludePatterns, stats);
    } else {
      stats.errors.push(`Unsupported path type: ${inputPath}`);
    }
  }
}

/**
 * Parse a directory containing extracted Takeout data
 */
async function* parseDirectory(
  dirPath: string,
  excludePatterns: string[],
  includeHidden: boolean | undefined,
  stats: TakeoutStats,
): AsyncGenerator<TakeoutAsset> {
  // First pass: collect all files
  const allFiles = await collectFiles(dirPath, excludePatterns, includeHidden);

  // Separate media files and JSON files
  const mediaFiles: string[] = [];
  const jsonFiles: string[] = [];

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (MEDIA_EXTENSIONS.has(ext)) {
      mediaFiles.push(filePath);
    } else if (isGooglePhotosJson(path.basename(filePath))) {
      jsonFiles.push(filePath);
    }
  }

  stats.totalMediaFiles = mediaFiles.length;

  // Build lookup map for JSON files
  const jsonMap = buildJsonFileMap(jsonFiles);

  // Track albums
  const albums = new Set<string>();

  // Match media files with their JSON metadata
  for (const mediaPath of mediaFiles) {
    const jsonPath = findMatchingJson(mediaPath, jsonMap, true);

    // Determine album name from directory structure
    const albumName = extractAlbumName(mediaPath, dirPath);
    if (albumName) {
      albums.add(albumName);
    }

    // Parse metadata if JSON found
    let metadata: GooglePhotosMetadata | undefined;
    if (jsonPath) {
      stats.matchedWithJson++;
      try {
        metadata = await parseJsonMetadata(jsonPath);
      } catch (error) {
        stats.errors.push(`Failed to parse ${jsonPath}: ${error}`);
      }
    } else {
      stats.missingJson++;
    }

    // Check for Live Photo companions
    const livePhotoInfo = detectLivePhoto(mediaPath, mediaFiles);

    const asset: TakeoutAsset = {
      mediaPath,
      jsonPath,
      albumName,
      metadata,
      isLivePhoto: livePhotoInfo.isLivePhoto,
      livePhotoVideoPath: livePhotoInfo.videoPath,
    };

    if (livePhotoInfo.isLivePhoto) {
      stats.livePhotos++;
    }

    yield asset;
  }

  stats.albums = albums.size;
}

/**
 * Parse a ZIP file containing Takeout data
 * Note: This is a placeholder - full implementation would use a streaming ZIP library
 */
async function* parseZipFile(
  _zipPath: string,
  _excludePatterns: string[],
  stats: TakeoutStats,
): AsyncGenerator<TakeoutAsset> {
  // TODO: Implement ZIP streaming using yauzl or similar
  // For now, recommend extracting the ZIP first
  stats.errors.push(
    'ZIP file processing not yet implemented. Please extract the ZIP file first and point to the extracted directory.',
  );
  return;
}

/**
 * Recursively collect all files in a directory
 */
async function collectFiles(
  dirPath: string,
  excludePatterns: string[],
  includeHidden: boolean | undefined,
): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip hidden files unless explicitly included
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      // Skip excluded patterns
      if (excludePatterns.some((pattern) => matchPattern(entry.name, pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dirPath);
  return files;
}

/**
 * Simple pattern matching (supports * wildcard)
 */
function matchPattern(name: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    return regex.test(name);
  }
  return name === pattern;
}

/**
 * Extract album name from the directory structure
 *
 * Google Takeout structure:
 * - Takeout/Google Photos/Album Name/photo.jpg -> "Album Name"
 * - Takeout/Google Photos/Photos from 2024/photo.jpg -> null (year folders are not albums)
 */
function extractAlbumName(mediaPath: string, basePath: string): string | undefined {
  const relativePath = path.relative(basePath, mediaPath);
  const parts = relativePath.split(path.sep);

  // Find the "Google Photos" folder
  const gpIndex = parts.findIndex((p) => p.toLowerCase() === 'google photos');
  if (gpIndex === -1 || gpIndex >= parts.length - 2) {
    return undefined;
  }

  const albumFolder = parts[gpIndex + 1];

  // Exclude year-based folders (they're not real albums)
  if (/^Photos from \d{4}$/.test(albumFolder)) {
    return undefined;
  }

  // Exclude special folders
  const excludedFolders = ['Trash', 'Archive', 'Recently Deleted'];
  if (excludedFolders.includes(albumFolder)) {
    return undefined;
  }

  return albumFolder;
}

/**
 * Parse Google Photos JSON metadata file
 */
async function parseJsonMetadata(jsonPath: string): Promise<GooglePhotosMetadata> {
  const content = await readFile(jsonPath, 'utf-8');
  const data = JSON.parse(content);

  // Validate and normalize the structure
  return {
    title: data.title || '',
    description: data.description || '',
    imageViews: data.imageViews,
    creationTime: data.creationTime || { timestamp: '0', formatted: '' },
    photoTakenTime: data.photoTakenTime || { timestamp: '0', formatted: '' },
    geoData: data.geoData || { latitude: 0, longitude: 0, altitude: 0, latitudeSpan: 0, longitudeSpan: 0 },
    geoDataExif: data.geoDataExif,
    url: data.url,
    googlePhotosOrigin: data.googlePhotosOrigin,
    people: data.people,
    favorited: data.favorited === true,
  };
}

/**
 * Detect if a media file is part of a Live Photo
 */
function detectLivePhoto(
  imagePath: string,
  allMediaFiles: string[],
): { isLivePhoto: boolean; videoPath?: string } {
  const ext = path.extname(imagePath).toLowerCase();

  // Only images can be the "main" part of a Live Photo
  const imageExtensions = ['.jpg', '.jpeg', '.heic', '.heif'];
  if (!imageExtensions.includes(ext)) {
    return { isLivePhoto: false };
  }

  const baseName = path.basename(imagePath, ext);
  const dir = path.dirname(imagePath);

  // Look for companion video with same base name
  const videoExtensions = ['.mov', '.mp4'];
  for (const videoExt of videoExtensions) {
    const candidateVideo = path.join(dir, `${baseName}${videoExt}`);
    if (allMediaFiles.includes(candidateVideo)) {
      return { isLivePhoto: true, videoPath: candidateVideo };
    }
  }

  return { isLivePhoto: false };
}

/**
 * Get parsing statistics
 */
export function getStats(assets: TakeoutAsset[]): TakeoutStats {
  const stats: TakeoutStats = {
    totalMediaFiles: assets.length,
    matchedWithJson: 0,
    missingJson: 0,
    albums: 0,
    livePhotos: 0,
    errors: [],
  };

  const albums = new Set<string>();

  for (const asset of assets) {
    if (asset.jsonPath) {
      stats.matchedWithJson++;
    } else {
      stats.missingJson++;
    }
    if (asset.albumName) {
      albums.add(asset.albumName);
    }
    if (asset.isLivePhoto) {
      stats.livePhotos++;
    }
  }

  stats.albums = albums.size;
  return stats;
}
