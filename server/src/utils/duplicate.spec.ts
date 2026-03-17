import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetType, AssetVisibility } from 'src/enum';
import { getExifCount, suggestDuplicate, suggestDuplicateKeepAssetIds } from 'src/utils/duplicate';
import { describe, expect, it } from 'vitest';

const createAsset = (
  id: string,
  overrides: {
    fileSizeInByte?: number | null;
    exifImageWidth?: number | null;
    exifImageHeight?: number | null;
    bitsPerSample?: number | null;
    profileDescription?: string | null;
    colorspace?: string | null;
    livePhotoVideoId?: string | null;
    exifFields?: Record<string, unknown>;
    width?: number;
    height?: number;
  } = {},
): AssetResponseDto => {
  const {
    fileSizeInByte = null,
    exifImageWidth,
    exifImageHeight,
    bitsPerSample,
    profileDescription,
    colorspace,
    livePhotoVideoId = null,
    exifFields = {},
    width = 1920,
    height = 1080,
  } = overrides;

  const exifObj: Record<string, unknown> = { fileSizeInByte, ...exifFields };
  if (exifImageWidth !== undefined) {
    exifObj.exifImageWidth = exifImageWidth;
  }
  if (exifImageHeight !== undefined) {
    exifObj.exifImageHeight = exifImageHeight;
  }
  if (bitsPerSample !== undefined) {
    exifObj.bitsPerSample = bitsPerSample;
  }
  if (profileDescription !== undefined) {
    exifObj.profileDescription = profileDescription;
  }
  if (colorspace !== undefined) {
    exifObj.colorspace = colorspace;
  }

  const hasExif = fileSizeInByte !== null || Object.keys(exifFields).length > 0 || Object.keys(exifObj).length > 1;

  return {
    id,
    type: AssetType.Image,
    thumbhash: null,
    localDateTime: new Date(),
    duration: '0:00:00.00000',
    hasMetadata: true,
    width,
    height,
    createdAt: new Date(),
    deviceAssetId: 'device-asset-1',
    deviceId: 'device-1',
    ownerId: 'owner-1',
    originalPath: '/path/to/asset',
    originalFileName: 'asset.jpg',
    fileCreatedAt: new Date(),
    fileModifiedAt: new Date(),
    updatedAt: new Date(),
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    isEdited: false,
    visibility: AssetVisibility.Timeline,
    checksum: 'checksum',
    livePhotoVideoId,
    exifInfo: hasExif ? exifObj : undefined,
  } as AssetResponseDto;
};

describe('duplicate utils', () => {
  describe('getExifCount', () => {
    it('should return 0 for asset without exifInfo', () => {
      const asset = createAsset('asset-1');
      asset.exifInfo = undefined;
      expect(getExifCount(asset)).toBe(0);
    });

    it('should count all truthy values in exifInfo', () => {
      const asset = createAsset('asset-1', {
        fileSizeInByte: 1000,
        exifFields: { make: 'Canon', model: 'EOS 5D', city: 'New York' },
      });
      // fileSizeInByte (1000) + make + model + city = 4
      expect(getExifCount(asset)).toBe(4);
    });
  });

  describe('suggestDuplicate', () => {
    it('should return undefined for empty list', () => {
      expect(suggestDuplicate([])).toBeUndefined();
    });

    it('should return the single asset for list with one asset', () => {
      const asset = createAsset('asset-1', { fileSizeInByte: 1000 });
      expect(suggestDuplicate([asset])).toEqual(asset);
    });

    it('should prefer HEIC (10-bit, P3, Live Photo) over JPEG (8-bit, sRGB, no Live)', () => {
      const heic = createAsset('heic', {
        fileSizeInByte: 2_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
        livePhotoVideoId: 'live-video-123',
      });
      const jpeg = createAsset('jpeg', {
        fileSizeInByte: 4_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
        profileDescription: 'sRGB IEC61966-2.1',
      });

      expect(suggestDuplicate([heic, jpeg])?.id).toBe('heic');
      expect(suggestDuplicate([jpeg, heic])?.id).toBe('heic');
    });

    it('should prefer RAW (14-bit, ProPhoto) over HEIC', () => {
      const raw = createAsset('raw', {
        fileSizeInByte: 25_000_000,
        exifImageWidth: 6000,
        exifImageHeight: 4000,
        bitsPerSample: 14,
        profileDescription: 'ProPhoto RGB',
        exifFields: { make: 'Canon', model: 'EOS R5', iso: 100, fNumber: 2.8, focalLength: 50, exposureTime: '1/250' },
      });
      const heic = createAsset('heic', {
        fileSizeInByte: 3_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
        livePhotoVideoId: 'live-video-123',
      });

      expect(suggestDuplicate([raw, heic])?.id).toBe('raw');
      expect(suggestDuplicate([heic, raw])?.id).toBe('raw');
    });

    it('should prefer higher resolution when format is the same', () => {
      const lowRes = createAsset('low-res', {
        fileSizeInByte: 2_000_000,
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        bitsPerSample: 8,
      });
      const highRes = createAsset('high-res', {
        fileSizeInByte: 4_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
      });

      expect(suggestDuplicate([lowRes, highRes])?.id).toBe('high-res');
    });

    it('should handle all null exif without crashing', () => {
      const asset1 = createAsset('asset-1');
      asset1.exifInfo = undefined;
      const asset2 = createAsset('asset-2');
      asset2.exifInfo = undefined;

      const result = suggestDuplicate([asset1, asset2]);
      expect(result).toBeDefined();
      expect(['asset-1', 'asset-2']).toContain(result?.id);
    });

    it('should prefer 16-bit TIFF over 8-bit JPEG', () => {
      const tiff = createAsset('tiff', {
        fileSizeInByte: 50_000_000,
        exifImageWidth: 4000,
        exifImageHeight: 3000,
        bitsPerSample: 16,
        profileDescription: 'ProPhoto RGB',
      });
      const jpeg = createAsset('jpeg', {
        fileSizeInByte: 3_000_000,
        exifImageWidth: 4000,
        exifImageHeight: 3000,
        bitsPerSample: 8,
        profileDescription: 'sRGB',
      });

      expect(suggestDuplicate([tiff, jpeg])?.id).toBe('tiff');
      expect(suggestDuplicate([jpeg, tiff])?.id).toBe('tiff');
    });

    it('should prefer Live Photo HEIC over non-Live HEIC', () => {
      const live = createAsset('live', {
        fileSizeInByte: 2_500_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
        livePhotoVideoId: 'live-video-456',
      });
      const noLive = createAsset('no-live', {
        fileSizeInByte: 2_500_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
      });

      expect(suggestDuplicate([live, noLive])?.id).toBe('live');
      expect(suggestDuplicate([noLive, live])?.id).toBe('live');
    });

    it('should prefer HEIC over JPEG when both are 8-bit Display P3 (real iPhone pair)', () => {
      const heic = createAsset('heic', {
        fileSizeInByte: 2_371_889,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
        profileDescription: 'Display P3',
        colorspace: 'Uncalibrated',
      });
      const jpeg = createAsset('jpeg', {
        fileSizeInByte: 4_288_721,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
        profileDescription: 'Display P3',
        colorspace: 'Uncalibrated',
      });

      expect(suggestDuplicate([heic, jpeg])?.id).toBe('heic');
      expect(suggestDuplicate([jpeg, heic])?.id).toBe('heic');
    });

    it('should use colorspace fallback when profileDescription is absent', () => {
      const wideGamut = createAsset('wide', {
        fileSizeInByte: 2_500_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
        colorspace: 'Display P3',
      });
      const srgb = createAsset('srgb', {
        fileSizeInByte: 2_500_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 10,
      });

      expect(suggestDuplicate([wideGamut, srgb])?.id).toBe('wide');
    });

    it('should return first asset when scores are tied', () => {
      const asset1 = createAsset('first', {
        fileSizeInByte: 2_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
      });
      const asset2 = createAsset('second', {
        fileSizeInByte: 2_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        bitsPerSample: 8,
      });

      expect(suggestDuplicate([asset1, asset2])?.id).toBe('first');
    });

    it('should handle fileSize = 0 without NaN', () => {
      const zeroSize = createAsset('zero-size', {
        exifImageWidth: 4032,
        exifImageHeight: 3024,
      });
      zeroSize.exifInfo = { fileSizeInByte: 0 };
      const normalSize = createAsset('normal', {
        fileSizeInByte: 2_000_000,
        exifImageWidth: 4032,
        exifImageHeight: 3024,
      });

      const result = suggestDuplicate([zeroSize, normalSize]);
      expect(result?.id).toBe('normal');
    });

    it('should clamp pixel score at 30MP', () => {
      // 100MP vs 50MP — both clamp at 30 for pixel score, so other factors decide
      const huge = createAsset('huge', {
        fileSizeInByte: 80_000_000,
        exifImageWidth: 12000,
        exifImageHeight: 8000,
        bitsPerSample: 8,
      });
      const large = createAsset('large', {
        fileSizeInByte: 50_000_000,
        exifImageWidth: 8000,
        exifImageHeight: 6000,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
      });

      // large wins via bit depth (10) + gamut (8) despite fewer pixels (both clamped)
      expect(suggestDuplicate([huge, large])?.id).toBe('large');
    });

    it('should fall back to asset width/height when exif dimensions are null', () => {
      const highRes = createAsset('high-res', {
        fileSizeInByte: 3_000_000,
        width: 4032,
        height: 3024,
      });
      const lowRes = createAsset('low-res', {
        fileSizeInByte: 3_000_000,
        width: 1920,
        height: 1080,
      });

      expect(suggestDuplicate([highRes, lowRes])?.id).toBe('high-res');
    });
  });

  describe('suggestDuplicateKeepAssetIds', () => {
    it('should return empty array for empty list', () => {
      expect(suggestDuplicateKeepAssetIds([])).toEqual([]);
    });

    it('should return array with single asset ID', () => {
      const asset = createAsset('asset-1', { fileSizeInByte: 1000 });
      expect(suggestDuplicateKeepAssetIds([asset])).toEqual(['asset-1']);
    });

    it('should return array with best asset ID', () => {
      const heic = createAsset('heic', {
        fileSizeInByte: 2_000_000,
        bitsPerSample: 10,
        profileDescription: 'Display P3',
        livePhotoVideoId: 'live-123',
      });
      const jpeg = createAsset('jpeg', {
        fileSizeInByte: 4_000_000,
        bitsPerSample: 8,
      });

      expect(suggestDuplicateKeepAssetIds([heic, jpeg])).toEqual(['heic']);
    });
  });
});
