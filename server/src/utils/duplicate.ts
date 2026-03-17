import { AssetResponseDto } from 'src/dtos/asset-response.dto';

/**
 * Color gamut scores based on ICC profile description.
 * Wider gamuts score higher as they preserve more color information.
 */
const COLOR_GAMUT_SCORES: [string, number][] = [
  ['prophoto rgb', 15],
  ['rec. 2020', 15],
  ['rec.2020', 15],
  ['bt.2020', 15],
  ['adobe rgb', 10],
  ['display p3', 8],
];

/**
 * Scores bit depth on a non-linear scale: 8→0, 10→10, 12→18, 14→22, 16→25.
 * Null defaults to 8-bit (consumer default).
 */
function scoreBitDepth(bitsPerSample: number | null | undefined): number {
  const bps = bitsPerSample ?? 8;
  if (bps <= 8) {
    return 0;
  }
  if (bps >= 16) {
    return 25;
  }
  // Linear interpolation from 8→0 to 16→25
  return Math.round(((bps - 8) / 8) * 25);
}

/**
 * Scores color gamut by matching profileDescription against known gamut names.
 * Falls back to colorspace field. Null/unknown defaults to sRGB (score 0).
 */
function scoreColorGamut(profileDescription: string | null | undefined, colorspace: string | null | undefined): number {
  for (const field of [profileDescription, colorspace]) {
    if (!field) {
      continue;
    }
    const lower = field.toLowerCase();
    // Skip conversion profiles like "ProPhoto RGB to sRGB"
    if (lower.includes(' to ')) {
      continue;
    }
    for (const [key, score] of COLOR_GAMUT_SCORES) {
      if (lower.includes(key)) {
        return score;
      }
    }
  }
  return 0;
}

interface GroupContext {
  maxFileSize: number;
  maxExifCount: number;
  maxBitsPerPixelPerByte: number;
}

interface ScoringCandidate {
  asset: AssetResponseDto;
  pixels: number;
  bitsPerSample: number;
  fileSize: number;
  exifCount: number;
  bitsPerPixelPerByte: number;
}

/**
 * Counts all truthy values in the exifInfo object.
 */
export const getExifCount = (asset: AssetResponseDto): number => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};

function buildCandidate(asset: AssetResponseDto): ScoringCandidate {
  const exif = asset.exifInfo;
  const width = exif?.exifImageWidth ?? asset.width ?? 0;
  const height = exif?.exifImageHeight ?? asset.height ?? 0;
  const pixels = width * height;
  const bitsPerSample = exif?.bitsPerSample ?? 8;
  const fileSize = exif?.fileSizeInByte ?? 0;
  const exifCount = getExifCount(asset);
  // Higher = more raw image data per stored byte = better compression efficiency.
  // Inversely correlated with fileSize score (which rewards larger files).
  const bitsPerPixelPerByte = fileSize > 0 ? (pixels * bitsPerSample) / fileSize : 0;

  return { asset, pixels, bitsPerSample, fileSize, exifCount, bitsPerPixelPerByte };
}

function buildGroupContext(candidates: ScoringCandidate[]): GroupContext {
  return {
    maxFileSize: Math.max(...candidates.map((c) => c.fileSize), 1),
    maxExifCount: Math.max(...candidates.map((c) => c.exifCount), 1),
    maxBitsPerPixelPerByte: Math.max(...candidates.map((c) => c.bitsPerPixelPerByte), 1),
  };
}

/**
 * Computes a multi-factor quality score (0-100) for a duplicate candidate.
 *
 * | Factor                  | Weight | Description                          |
 * |-------------------------|--------|--------------------------------------|
 * | Pixel count             | 30     | Megapixels, clamped 0-30             |
 * | Bit depth               | 25     | 8-bit=0 .. 16-bit=25                |
 * | Color gamut             | 15     | sRGB=0, P3=8, AdobeRGB=10, etc.     |
 * | Live Photo              | 10     | Has live photo video = 10            |
 * | Compression efficiency  | 10     | Bits-per-pixel/byte, scaled 0-10     |
 * | File size               | 5      | Ratio to group max, scaled 0-5       |
 * | Metadata richness       | 5      | Ratio to group max, scaled 0-5       |
 */
function computeQualityScore(candidate: ScoringCandidate, ctx: GroupContext): number {
  const megapixels = candidate.pixels / 1_000_000;
  const pixelScore = Math.min(megapixels, 30);

  const bitDepthScore = scoreBitDepth(candidate.bitsPerSample);

  const exif = candidate.asset.exifInfo;
  const gamutScore = scoreColorGamut(exif?.profileDescription, exif?.colorspace);

  const livePhotoScore = candidate.asset.livePhotoVideoId ? 10 : 0;

  const compressionScore = (candidate.bitsPerPixelPerByte / ctx.maxBitsPerPixelPerByte) * 10;

  const fileSizeScore = (candidate.fileSize / ctx.maxFileSize) * 5;

  const metadataScore = (candidate.exifCount / ctx.maxExifCount) * 5;

  return pixelScore + bitDepthScore + gamutScore + livePhotoScore + compressionScore + fileSizeScore + metadataScore;
}

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * Uses a multi-factor quality score based on objective, measurable properties:
 * pixel count, bit depth, color gamut, live photo presence, file size,
 * metadata richness, and compression efficiency.
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep, or undefined if empty list
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  if (assets.length === 0) {
    return undefined;
  }

  const candidates = assets.map(buildCandidate);
  const ctx = buildGroupContext(candidates);

  let bestCandidate = candidates[0];
  let bestScore = computeQualityScore(bestCandidate, ctx);

  for (let i = 1; i < candidates.length; i++) {
    const score = computeQualityScore(candidates[i], ctx);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidates[i];
    }
  }

  return bestCandidate.asset;
};

/**
 * Suggests the best duplicate asset IDs to keep from a list of duplicates.
 * Returns an array with a single asset ID (the best candidate), or empty if no assets.
 */
export const suggestDuplicateKeepAssetIds = (assets: AssetResponseDto[]): string[] => {
  const suggested = suggestDuplicate(assets);
  return suggested ? [suggested.id] : [];
};
