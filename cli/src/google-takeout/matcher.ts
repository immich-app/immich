/**
 * JSON Metadata Matcher for Google Photos Takeout
 *
 * Handles the complex edge cases in Google's export format:
 * - 46-character filename truncation
 * - Localized metadata filenames
 * - Numbered duplicate suffixes: photo(1).jpg -> photo.json(1).json
 * - Split archives where JSON and media may be in different locations
 */

import path from 'node:path';
import { JSON_SIDECAR_PATTERNS, LOCALIZED_METADATA_NAMES, MAX_JSON_FILENAME_LENGTH } from './types.js';

/**
 * Find the matching JSON metadata file for a media file
 *
 * @param mediaPath - Absolute path to the media file
 * @param jsonFiles - Map of all available JSON files (path -> content or path)
 * @param crossDirectorySearch - Also search in sibling directories (for split archives)
 * @returns Path to matching JSON file, or undefined if not found
 */
export function findMatchingJson(
  mediaPath: string,
  jsonFiles: Map<string, string>,
  crossDirectorySearch = false,
): string | undefined {
  const baseName = path.basename(mediaPath);
  const dir = path.dirname(mediaPath);
  const ext = path.extname(baseName);
  const nameWithoutExt = path.basename(baseName, ext);

  // Generate all possible JSON filename candidates
  const candidates = generateJsonCandidates(baseName, nameWithoutExt);

  // First, check in the same directory
  for (const candidate of candidates) {
    const fullPath = path.join(dir, candidate);
    if (jsonFiles.has(fullPath)) {
      return fullPath;
    }
  }

  // Handle numbered duplicates: photo(1).jpg should match photo.jpg.supplemental-metadata(1).json
  const numberedMatch = baseName.match(/^(.+?)\((\d+)\)(\.[^.]+)$/);
  if (numberedMatch) {
    const [, originalName, number, originalExt] = numberedMatch;
    const numberedCandidates = generateNumberedCandidates(originalName, originalExt, number);
    for (const candidate of numberedCandidates) {
      const fullPath = path.join(dir, candidate);
      if (jsonFiles.has(fullPath)) {
        return fullPath;
      }
    }
  }

  // Cross-directory search for split archives
  if (crossDirectorySearch) {
    const parentDir = path.dirname(dir);
    for (const [jsonPath] of jsonFiles) {
      const jsonBaseName = path.basename(jsonPath);
      if (candidates.includes(jsonBaseName) && path.dirname(path.dirname(jsonPath)) === parentDir) {
        return jsonPath;
      }
    }
  }

  return undefined;
}

/**
 * Generate all possible JSON filename candidates for a media file
 */
function generateJsonCandidates(baseName: string, nameWithoutExt: string): string[] {
  const candidates: string[] = [];

  // Standard patterns
  for (const pattern of JSON_SIDECAR_PATTERNS) {
    // Full filename: photo.jpg.supplemental-metadata.json
    candidates.push(`${baseName}${pattern}`);

    // Without extension: photo.supplemental-metadata.json
    candidates.push(`${nameWithoutExt}${pattern}`);
  }

  // Truncated filenames (Google limits to 46 chars)
  const maxBaseLength = MAX_JSON_FILENAME_LENGTH - '.supplemental-metadata.json'.length;
  if (baseName.length > maxBaseLength) {
    const truncated = baseName.slice(0, maxBaseLength);
    candidates.push(`${truncated}.supplemental-metadata.json`);
  }

  // Also try with truncated name (common in older exports)
  if (nameWithoutExt.length > maxBaseLength) {
    const truncated = nameWithoutExt.slice(0, maxBaseLength);
    candidates.push(`${truncated}.json`);
  }

  // Localized metadata filenames (for album-level metadata)
  for (const localizedName of LOCALIZED_METADATA_NAMES) {
    candidates.push(`${localizedName}.json`);
  }

  return [...new Set(candidates)]; // Remove duplicates
}

/**
 * Generate JSON candidates for numbered duplicates
 * photo(1).jpg -> photo.jpg.supplemental-metadata(1).json
 */
function generateNumberedCandidates(originalName: string, originalExt: string, number: string): string[] {
  const candidates: string[] = [];

  // photo.jpg.supplemental-metadata(1).json
  candidates.push(`${originalName}${originalExt}.supplemental-metadata(${number}).json`);

  // photo.supplemental-metadata(1).json
  candidates.push(`${originalName}.supplemental-metadata(${number}).json`);

  // photo(1).json (simple format)
  candidates.push(`${originalName}(${number}).json`);

  // photo.json(1).json (malformed but sometimes seen)
  candidates.push(`${originalName}.json(${number}).json`);

  return candidates;
}

/**
 * Build a map of all JSON files in the given paths for efficient lookup
 *
 * @param jsonPaths - Array of paths to JSON files
 * @returns Map of normalized path -> original path
 */
export function buildJsonFileMap(jsonPaths: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const jsonPath of jsonPaths) {
    // Normalize path for consistent lookup
    const normalized = path.normalize(jsonPath);
    map.set(normalized, jsonPath);
  }
  return map;
}

/**
 * Check if a file appears to be a Google Photos JSON metadata file
 */
export function isGooglePhotosJson(filename: string): boolean {
  const lower = filename.toLowerCase();

  // Check for standard patterns
  if (lower.endsWith('.supplemental-metadata.json')) {
    return true;
  }

  // Check for simple .json that accompanies a media file
  // (not standalone JSON files like print-subscriptions.json)
  if (lower.endsWith('.json')) {
    // Exclude known non-metadata JSON files
    const excludedPatterns = [
      'print-subscriptions.json',
      'shared_album_comments.json',
      'user-generated-memory-titles.json',
    ];
    const baseName = path.basename(lower);
    return !excludedPatterns.some((pattern) => baseName === pattern);
  }

  return false;
}

/**
 * Extract the media filename that a JSON file is associated with
 *
 * @param jsonPath - Path to the JSON metadata file
 * @returns Expected media filename, or undefined if not determinable
 */
export function getMediaFilenameFromJson(jsonPath: string): string | undefined {
  const baseName = path.basename(jsonPath);

  // Handle .supplemental-metadata.json pattern
  const suppMatch = baseName.match(/^(.+?)\.supplemental-metadata(\(\d+\))?\.json$/i);
  if (suppMatch) {
    const mediaName = suppMatch[1];
    const suffix = suppMatch[2] || '';
    // If there's a suffix, insert it before the extension
    if (suffix) {
      const ext = path.extname(mediaName);
      const nameWithoutExt = path.basename(mediaName, ext);
      return `${nameWithoutExt}${suffix}${ext}`;
    }
    return mediaName;
  }

  // Handle simple .json pattern
  const simpleMatch = baseName.match(/^(.+?)(\(\d+\))?\.json$/i);
  if (simpleMatch) {
    return simpleMatch[1] + (simpleMatch[2] || '');
  }

  return undefined;
}
