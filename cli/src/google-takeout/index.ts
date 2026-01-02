/**
 * Google Photos Takeout Integration Module
 *
 * This module provides functionality to parse and import Google Photos
 * Takeout exports into Immich, handling the complex edge cases in
 * Google's export format.
 *
 * Key features:
 * - Parse extracted Takeout directories
 * - Match media files with their JSON metadata sidecars
 * - Convert Google JSON metadata to XMP format
 * - Preserve album structure
 * - Handle Live Photos
 *
 * @module google-takeout
 */

// Types
export type {
  GooglePhotosMetadata,
  TakeoutAsset,
  TakeoutParserOptions,
  TakeoutStats,
} from './types.js';

export {
  JSON_SIDECAR_PATTERNS,
  LOCALIZED_METADATA_NAMES,
  MAX_JSON_FILENAME_LENGTH,
} from './types.js';

// Parser
export { parseTakeout, getStats } from './parser.js';

// Matcher
export {
  findMatchingJson,
  buildJsonFileMap,
  isGooglePhotosJson,
  getMediaFilenameFromJson,
} from './matcher.js';

// XMP Converter
export {
  convertToXmp,
  getXmpSidecarPath,
  hasUsefulMetadata,
} from './xmp-converter.js';
