import { AssetResponseDto } from 'src/dtos/asset-response.dto.js';
import { mimeTypes } from 'src/utils/mime-types.js';

const ICLOUD_SHARED_ALBUM_LONG_EDGE = 2048;
const TIMEZONE_TOLERANCE_MS = 26 * 3600 * 1000;
const MAX_BURST_SPAN_MS = 30 * 1000;
const MIN_VALID_CAPTURE_DATE_MS = Date.UTC(1970, 0, 2);

const RAW_MIME_REGEX = /dng|raw/i;
const HEIC_MIME_REGEX = /heic|heif|avif/i;
const STORAGE_COLLISION_SUFFIX_REGEX = /\+\d+\.[^.]+$/;
const COPY_MARKER_REGEX = /(\(\d+\)|[ _-]copy\b|-wa\d+)/i;

type FormatTier = 'raw' | 'heic' | 'standard';

const FORMAT_TIER_SCORES: Record<FormatTier, number> = {
  raw: 140,
  heic: 90,
  standard: 0,
};

const SCORE_WEIGHTS = {
  maxResolution: 2500,
  icloudDownscalePenalty: -150,
  make: 150,
  model: 150,
  lensModel: 50,
  fNumber: 50,
  iso: 50,
  exposureTime: 50,
  focalLength: 50,
  gps: 100,
  livePhoto: 80,
  earliestCaptureDate: 100,
  collisionOrCopyPenalty: -60,
  maxFileSize: 100,
  exifField: 3,
} as const;

type EvaluatedCandidate = {
  asset: AssetResponseDto;
  score: number;
  pixels: number;
  cameraExifCount: number;
  totalExifCount: number;
  fileSize: number;
  captureDateMs: number | null;
  formatTier: FormatTier;
  hasCollisionOrCopySuffix: boolean;
};

/**
Counts all truthy values in the exifInfo object.
This matches the client implementation in web/src/lib/utils/exif-utils.ts

@param asset Asset with optional exifInfo
@returns Count of truthy EXIF values
*/
export const getExifCount = (asset: AssetResponseDto): number => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};

const resolveDimensions = (asset: AssetResponseDto): { width: number; height: number } => {
  const assetWidth = asset.width ?? 0;
  const assetHeight = asset.height ?? 0;
  if (asset.isEdited && assetWidth > 0 && assetHeight > 0) {
    return { width: assetWidth, height: assetHeight };
  }

  const exifWidth = asset.exifInfo?.exifImageWidth ?? 0;
  const exifHeight = asset.exifInfo?.exifImageHeight ?? 0;
  if (exifWidth > 0 && exifHeight > 0) {
    return { width: exifWidth, height: exifHeight };
  }

  if (assetWidth > 0 && assetHeight > 0) {
    return { width: assetWidth, height: assetHeight };
  }

  return { width: 0, height: 0 };
};

const classifyFormatTier = (asset: AssetResponseDto): FormatTier => {
  const mime = asset.originalMimeType ?? '';

  if (mimeTypes.isRaw(asset.originalFileName) || mimeTypes.isRaw(asset.originalPath) || RAW_MIME_REGEX.test(mime)) {
    return 'raw';
  }

  if (
    mimeTypes.isHeifImage(asset.originalFileName) ||
    mimeTypes.isHeifImage(asset.originalPath) ||
    HEIC_MIME_REGEX.test(mime)
  ) {
    return 'heic';
  }

  return 'standard';
};

const hasCollisionOrCopySuffix = (asset: AssetResponseDto): boolean => {
  const fileNameInPath = asset.originalPath.split(/[/\\]/).at(-1) ?? '';
  const hasStorageCollisionSuffix = STORAGE_COLLISION_SUFFIX_REGEX.test(fileNameInPath);
  const hasCopyMarker = COPY_MARKER_REGEX.test(asset.originalFileName);
  return hasStorageCollisionSuffix || hasCopyMarker;
};

const parseCaptureDateMs = (asset: AssetResponseDto): number | null => {
  const rawDate = asset.exifInfo?.dateTimeOriginal ?? asset.fileCreatedAt;
  if (!rawDate) {
    return null;
  }

  const parsed = Date.parse(rawDate);
  if (Number.isNaN(parsed) || parsed < MIN_VALID_CAPTURE_DATE_MS) {
    return null;
  }

  return parsed;
};

const isPositiveNumber = (value: number | null | undefined): boolean => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
};

const hasValidGpsCoordinates = (latitude: number | null | undefined, longitude: number | null | undefined): boolean => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)
  );
};

const evaluateCandidates = (assets: AssetResponseDto[]): EvaluatedCandidate[] => {
  const metrics = assets.map((asset) => {
    const { width, height } = resolveDimensions(asset);
    const pixels = width * height;
    const longEdge = Math.max(width, height);
    const fileSize = Math.max(0, asset.exifInfo?.fileSizeInByte ?? 0);
    const captureDateMs = parseCaptureDateMs(asset);
    const formatTier = classifyFormatTier(asset);
    const collisionOrCopy = hasCollisionOrCopySuffix(asset);

    const exif = asset.exifInfo;
    const hasMake = Boolean(exif?.make?.trim());
    const hasModel = Boolean(exif?.model?.trim());
    const hasLensModel = Boolean(exif?.lensModel?.trim());
    const hasFNumber = isPositiveNumber(exif?.fNumber);
    const hasIso = isPositiveNumber(exif?.iso);
    const hasExposureTime = Boolean(exif?.exposureTime && exif.exposureTime !== '0');
    const hasFocalLength = isPositiveNumber(exif?.focalLength);
    const hasGps = hasValidGpsCoordinates(exif?.latitude, exif?.longitude);
    const hasLivePhoto = Boolean(asset.livePhotoVideoId);

    const cameraExifCount =
      Number(hasMake) +
      Number(hasModel) +
      Number(hasLensModel) +
      Number(hasFNumber) +
      Number(hasIso) +
      Number(hasExposureTime) +
      Number(hasFocalLength) +
      Number(hasGps);

    const exifScore =
      (hasMake ? SCORE_WEIGHTS.make : 0) +
      (hasModel ? SCORE_WEIGHTS.model : 0) +
      (hasLensModel ? SCORE_WEIGHTS.lensModel : 0) +
      (hasFNumber ? SCORE_WEIGHTS.fNumber : 0) +
      (hasIso ? SCORE_WEIGHTS.iso : 0) +
      (hasExposureTime ? SCORE_WEIGHTS.exposureTime : 0) +
      (hasFocalLength ? SCORE_WEIGHTS.focalLength : 0) +
      (hasGps ? SCORE_WEIGHTS.gps : 0) +
      (hasLivePhoto ? SCORE_WEIGHTS.livePhoto : 0);

    return {
      asset,
      pixels,
      longEdge,
      fileSize,
      captureDateMs,
      formatTier,
      cameraExifCount,
      totalExifCount: getExifCount(asset),
      exifScore,
      hasCollisionOrCopySuffix: collisionOrCopy,
    };
  });

  let maxPixels = 0;
  let maxLongEdge = 0;
  let maxSize = 0;
  let minDateMs = Infinity;

  for (const metric of metrics) {
    if (metric.pixels > maxPixels) {
      maxPixels = metric.pixels;
    }
    if (metric.longEdge > maxLongEdge) {
      maxLongEdge = metric.longEdge;
    }
    if (metric.fileSize > maxSize) {
      maxSize = metric.fileSize;
    }
    if (metric.captureDateMs !== null && metric.captureDateMs < minDateMs) {
      minDateMs = metric.captureDateMs;
    }
  }

  const evaluated: EvaluatedCandidate[] = metrics.map((metric) => {
    const resolutionScore = maxPixels > 0 ? Math.floor((metric.pixels * SCORE_WEIGHTS.maxResolution) / maxPixels) : 0;
    const icloudPenaltyScore =
      metric.longEdge === ICLOUD_SHARED_ALBUM_LONG_EDGE && maxLongEdge > ICLOUD_SHARED_ALBUM_LONG_EDGE
        ? SCORE_WEIGHTS.icloudDownscalePenalty
        : 0;
    const formatScore = FORMAT_TIER_SCORES[metric.formatTier];
    const dateScore =
      metric.captureDateMs !== null &&
      Number.isFinite(minDateMs) &&
      Math.abs(metric.captureDateMs - minDateMs) <= TIMEZONE_TOLERANCE_MS
        ? SCORE_WEIGHTS.earliestCaptureDate
        : 0;
    const filenameScore = metric.hasCollisionOrCopySuffix ? SCORE_WEIGHTS.collisionOrCopyPenalty : 0;
    const sizeScore = maxSize > 0 ? Math.floor((metric.fileSize * SCORE_WEIGHTS.maxFileSize) / maxSize) : 0;
    const exifCountScore = metric.totalExifCount * SCORE_WEIGHTS.exifField;

    return {
      asset: metric.asset,
      score:
        resolutionScore +
        icloudPenaltyScore +
        metric.exifScore +
        exifCountScore +
        formatScore +
        dateScore +
        filenameScore +
        sizeScore,
      pixels: metric.pixels,
      cameraExifCount: metric.cameraExifCount,
      totalExifCount: metric.totalExifCount,
      fileSize: metric.fileSize,
      captureDateMs: metric.captureDateMs,
      formatTier: metric.formatTier,
      hasCollisionOrCopySuffix: metric.hasCollisionOrCopySuffix,
    };
  });

  return evaluated.toSorted(
    (a, b) =>
      b.score - a.score ||
      b.pixels - a.pixels ||
      b.cameraExifCount - a.cameraExifCount ||
      b.totalExifCount - a.totalExifCount ||
      b.fileSize - a.fileSize ||
      (a.captureDateMs ?? Infinity) - (b.captureDateMs ?? Infinity),
  );
};

/**
Suggests the best duplicate asset to keep from a list of duplicates.

The best asset is determined by a multi-criteria authenticity and quality score:
 1. Pixel resolution (width * height), with a penalty for 2048px iCloud Shared Album downscales
 2. Camera and GPS EXIF completeness (make, model, lens, aperture, ISO, shutter speed, focal length, coordinates)
 3. Native file format tier (RAW/DNG > HEIC/HEIF/AVIF > standard JPEG/PNG)
 4. Earliest capture timestamp (within a timezone tolerance window, ignoring Unix epoch fallbacks)
 5. Filename and path cleanliness (penalizing storage collision suffixes like `+1.jpg` or copy/messaging markers)
 6. File size in bytes and total EXIF field count as tie-breakers

@param assets List of duplicate assets
@returns The best asset to keep, or undefined if empty list
*/
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  if (assets.length === 0) {
    return undefined;
  }

  return evaluateCandidates(assets)[0]?.asset;
};

/**
Suggests the best duplicate asset IDs to keep from a list of duplicates.
In groups of 3 or more assets, preserves multiple distinct full-resolution camera burst originals
when the group also contains their lower-resolution or degraded duplicate copies.

@param assets List of duplicate assets
@returns Array of suggested asset IDs to keep
*/
export const suggestDuplicateKeepAssetIds = (assets: AssetResponseDto[]): string[] => {
  if (assets.length === 0) {
    return [];
  }

  const evaluated = evaluateCandidates(assets);
  const primary = evaluated[0];
  const leaders: EvaluatedCandidate[] = [primary];

  if (evaluated.length >= 3 && primary.captureDateMs !== null) {
    for (const candidate of evaluated.slice(1)) {
      const sameTopResolution = candidate.pixels > 0 && candidate.pixels === primary.pixels;
      const sameFormat = candidate.formatTier === primary.formatTier;
      const hasCameraExif = candidate.cameraExifCount >= 3;
      const cleanPath = !candidate.hasCollisionOrCopySuffix;
      const withinBurstWindow =
        candidate.captureDateMs !== null &&
        Math.abs(candidate.captureDateMs - primary.captureDateMs) <= MAX_BURST_SPAN_MS;
      const isDistinctShot = leaders.every(
        (leader) =>
          leader.asset.originalFileName.toLowerCase() !== candidate.asset.originalFileName.toLowerCase() &&
          leader.captureDateMs !== candidate.captureDateMs,
      );

      if (sameTopResolution && sameFormat && hasCameraExif && cleanPath && withinBurstWindow && isDistinctShot) {
        leaders.push(candidate);
      }
    }
  }

  if (leaders.length === evaluated.length) {
    return [primary.asset.id];
  }

  return leaders.map((leader) => leader.asset.id);
};
