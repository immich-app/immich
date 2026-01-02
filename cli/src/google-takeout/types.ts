/**
 * Google Photos Takeout Integration Types
 */

/**
 * Google Photos JSON metadata structure as exported by Takeout
 */
export interface GooglePhotosMetadata {
  title: string;
  description: string;
  imageViews?: string;
  creationTime: {
    timestamp: string;
    formatted: string;
  };
  photoTakenTime: {
    timestamp: string;
    formatted: string;
  };
  geoData: {
    latitude: number;
    longitude: number;
    altitude: number;
    latitudeSpan: number;
    longitudeSpan: number;
  };
  geoDataExif?: {
    latitude: number;
    longitude: number;
    altitude: number;
    latitudeSpan: number;
    longitudeSpan: number;
  };
  url?: string;
  googlePhotosOrigin?: {
    mobileUpload?: {
      deviceType: string;
    };
    fromPartnerSharing?: Record<string, unknown>;
  };
  people?: Array<{ name: string }>;
  favorited?: boolean;
}

/**
 * Represents a matched asset from a Google Takeout export
 */
export interface TakeoutAsset {
  /** Absolute path to the media file */
  mediaPath: string;
  /** Absolute path to the JSON metadata file (if found) */
  jsonPath?: string;
  /** Album name derived from folder structure */
  albumName?: string;
  /** Parsed metadata from JSON sidecar */
  metadata?: GooglePhotosMetadata;
  /** Whether this is part of a Live Photo (image or video) */
  isLivePhoto?: boolean;
  /** Path to companion Live Photo video */
  livePhotoVideoPath?: string;
}

/**
 * Options for parsing Google Takeout exports
 */
export interface TakeoutParserOptions {
  /** Paths to Takeout directories or ZIP files */
  paths: string[];
  /** Include hidden files */
  includeHidden?: boolean;
  /** Custom exclusion patterns */
  excludePatterns?: string[];
}

/**
 * Statistics from a Takeout parsing operation
 */
export interface TakeoutStats {
  totalMediaFiles: number;
  matchedWithJson: number;
  missingJson: number;
  albums: number;
  livePhotos: number;
  errors: string[];
}

/**
 * Localized names for metadata JSON files across different Google account languages
 */
export const LOCALIZED_METADATA_NAMES = [
  'metadata',
  'métadonnées', // French
  'metadatos', // Spanish
  'metadades', // Catalan
  'metadaten', // German
  'metadati', // Italian
  'metagegevens', // Dutch
  'metadata', // Portuguese, Polish, etc.
  'メタデータ', // Japanese
  '元数据', // Chinese Simplified
  '메타데이터', // Korean
] as const;

/**
 * Known JSON sidecar filename patterns
 */
export const JSON_SIDECAR_PATTERNS = [
  '.supplemental-metadata.json',
  '.json',
] as const;

/**
 * Maximum filename length for JSON sidecars (Google truncates at 46 chars)
 */
export const MAX_JSON_FILENAME_LENGTH = 46;
