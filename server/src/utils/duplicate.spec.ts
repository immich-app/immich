import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { AssetResponseDto } from 'src/dtos/asset-response.dto.js';
import { ExifResponseSchema } from 'src/dtos/exif.dto.js';
import { AssetType, AssetVisibility } from 'src/enum.js';
import { getExifCount, suggestDuplicate, suggestDuplicateKeepAssetIds } from 'src/utils/duplicate.js';

type ExifInfoInput = Partial<z.infer<typeof ExifResponseSchema>>;
type AssetOverrides = Partial<Omit<AssetResponseDto, 'id' | 'exifInfo'>>;

const createAsset = (
  id: string,
  fileSizeInByte: number | null = null,
  exifFields: ExifInfoInput = {},
  overrides: AssetOverrides = {},
): AssetResponseDto => {
  const timestamp = '2024-01-01T00:00:00.000Z';
  return {
    id,
    type: AssetType.Image,
    thumbhash: null,
    localDateTime: timestamp,
    duration: 0,
    hasMetadata: true,
    width: 1920,
    height: 1080,
    createdAt: timestamp,
    ownerId: 'owner-1',
    originalPath: '/path/to/asset.jpg',
    originalFileName: 'asset.jpg',
    fileCreatedAt: timestamp,
    fileModifiedAt: timestamp,
    updatedAt: timestamp,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    isEdited: false,
    visibility: AssetVisibility.Timeline,
    checksum: 'checksum',
    ...overrides,
    exifInfo:
      fileSizeInByte !== null || Object.keys(exifFields).length > 0
        ? ExifResponseSchema.parse({ fileSizeInByte, ...exifFields })
        : undefined,
  };
};

describe('duplicate utils', () => {
  describe('getExifCount', () => {
    it('should return 0 for asset without exifInfo', () => {
      const asset = createAsset('asset-1');
      asset.exifInfo = undefined;
      expect(getExifCount(asset)).toBe(0);
    });

    it('should return 0 for empty exifInfo', () => {
      const asset = createAsset('asset-1');
      asset.exifInfo = ExifResponseSchema.parse({});
      expect(getExifCount(asset)).toBe(0);
    });

    it('should count all truthy values in exifInfo', () => {
      const asset = createAsset('asset-1', 1000, {
        make: 'Canon',
        model: 'EOS 5D',
        dateTimeOriginal: '2024-01-01T00:00:00.000Z',
        timeZone: 'UTC',
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        state: 'NY',
        country: 'USA',
        description: 'A photo',
        rating: 5,
      });
      // fileSizeInByte (1000) + 11 other truthy fields = 12
      expect(getExifCount(asset)).toBe(12);
    });

    it('should not count null, undefined, or empty string values', () => {
      const asset = createAsset('asset-1', 1000, {
        make: 'Canon',
        model: null,
        latitude: undefined,
        city: '',
        rating: null,
      });
      // fileSizeInByte (1000) + make ('Canon') = 2 truthy values
      expect(getExifCount(asset)).toBe(2);
    });
  });

  describe('suggestDuplicate', () => {
    it('should return undefined for empty list', () => {
      expect(suggestDuplicate([])).toBeUndefined();
    });

    it('should return the single asset for list with one asset', () => {
      const asset = createAsset('asset-1', 1000);
      expect(suggestDuplicate([asset])).toEqual(asset);
    });

    it('should return asset with largest file size when resolution and EXIF are equal', () => {
      const small = createAsset('small', 1000);
      const large = createAsset('large', 5000);
      const medium = createAsset('medium', 3000);

      expect(suggestDuplicate([small, large, medium])?.id).toBe('large');
      expect(suggestDuplicate([large, small, medium])?.id).toBe('large');
      expect(suggestDuplicate([medium, small, large])?.id).toBe('large');
    });

    it('should use EXIF completeness when file sizes and resolutions are equal', () => {
      const lessExif = createAsset('less-exif', 1000, { make: 'Canon' });
      const moreExif = createAsset('more-exif', 1000, {
        make: 'Canon',
        model: 'EOS 5D',
        dateTimeOriginal: '2024-01-01T00:00:00.000Z',
        city: 'New York',
      });

      expect(suggestDuplicate([lessExif, moreExif])?.id).toBe('more-exif');
      expect(suggestDuplicate([moreExif, lessExif])?.id).toBe('more-exif');
    });

    it('should handle assets with no exifInfo (treat as 0 file size)', () => {
      const noExif = createAsset('no-exif');
      noExif.exifInfo = undefined;
      const withExif = createAsset('with-exif', 1000);

      expect(suggestDuplicate([noExif, withExif])?.id).toBe('with-exif');
      expect(suggestDuplicate([withExif, noExif])?.id).toBe('with-exif');
    });

    it('should handle assets with exifInfo but no fileSizeInByte', () => {
      const noFileSize = createAsset('no-file-size');
      noFileSize.exifInfo = ExifResponseSchema.parse({});
      const withFileSize = createAsset('with-file-size', 1000);

      expect(suggestDuplicate([noFileSize, withFileSize])?.id).toBe('with-file-size');
      expect(suggestDuplicate([withFileSize, noFileSize])?.id).toBe('with-file-size');
    });

    it('should fall back to asset width and height when EXIF dimensions are missing or 0, and handle 0x0 assets', () => {
      const zeroDimensions = createAsset(
        'zero-dims',
        2_000_000,
        { exifImageWidth: 0, exifImageHeight: 0 },
        { width: null, height: null },
      );
      const assetLevelDimensions = createAsset(
        'asset-dims',
        1_500_000,
        { exifImageWidth: 0, exifImageHeight: null },
        { width: 3024, height: 4032 },
      );

      expect(suggestDuplicate([zeroDimensions, assetLevelDimensions])?.id).toBe('asset-dims');
      expect(suggestDuplicate([assetLevelDimensions, zeroDimensions])?.id).toBe('asset-dims');

      const anotherZero = createAsset('zero-dims-2', 3_000_000, {}, { width: 0, height: 0 });
      expect(suggestDuplicate([zeroDimensions, anotherZero])?.id).toBe('zero-dims-2');
    });

    it('should prioritize higher pixel resolution and penalize 2048px iCloud Shared Album downscales', () => {
      const fullRes = createAsset(
        'full-res',
        5_000_000,
        { exifImageWidth: 4032, exifImageHeight: 3024, make: 'Apple', model: 'iPhone' },
        { width: 4032, height: 3024, originalPath: '/library/IMG_0001.jpg' },
      );
      const icloudDownscaled = createAsset(
        'icloud-2048px',
        1_000_000,
        { exifImageWidth: 2048, exifImageHeight: 1536, make: 'Apple', model: 'iPhone' },
        { width: 2048, height: 1536, originalPath: '/library/IMG_0001+1.jpg' },
      );

      expect(suggestDuplicate([icloudDownscaled, fullRes])?.id).toBe('full-res');
      expect(suggestDuplicate([fullRes, icloudDownscaled])?.id).toBe('full-res');
    });

    it('should never let a low-resolution downscaled copy with rich EXIF beat a full-resolution photo with stripped EXIF', () => {
      const fullResStripped = createAsset(
        'full-res-stripped',
        4_500_000,
        {
          exifImageWidth: 4032,
          exifImageHeight: 3024,
          dateTimeOriginal: '2024-06-01T10:00:00.000Z',
        },
        { width: 4032, height: 3024, originalFileName: 'exported.jpg' },
      );

      const downscaledWithExif = createAsset(
        'downscaled-with-exif',
        900_000,
        {
          exifImageWidth: 2048,
          exifImageHeight: 1536,
          dateTimeOriginal: '2023-06-01T10:00:00.000Z',
          make: 'Apple',
          model: 'iPhone',
          lensModel: 'Back camera 4mm f/1.8',
          fNumber: 1.8,
          focalLength: 4,
          iso: 50,
          exposureTime: '1/120',
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
          state: 'Ile-de-France',
          country: 'France',
        },
        {
          width: 2048,
          height: 1536,
          originalFileName: 'IMG_0001.HEIC',
          originalPath: '/library/IMG_0001.heic',
          originalMimeType: 'image/heic',
        },
      );

      expect(suggestDuplicate([downscaledWithExif, fullResStripped])?.id).toBe('full-res-stripped');
      expect(suggestDuplicate([fullResStripped, downscaledWithExif])?.id).toBe('full-res-stripped');
    });

    it('should prioritize RAW format over HEIC and standard JPEG when resolution and EXIF are comparable', () => {
      const commonExif: ExifInfoInput = {
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        make: 'Canon',
        model: 'EOS R5',
      };

      const rawAsset = createAsset('raw-dng', 12_000_000, commonExif, {
        width: 4032,
        height: 3024,
        originalFileName: 'IMG_0001.CR3',
        originalPath: '/library/IMG_0001.cr3',
        originalMimeType: 'image/x-canon-cr3',
      });
      const heicAsset = createAsset('heic-asset', 12_000_000, commonExif, {
        width: 4032,
        height: 3024,
        originalFileName: 'IMG_0001.HIF',
        originalPath: '/library/IMG_0001.hif',
        originalMimeType: 'image/heif',
      });
      const jpegAsset = createAsset('jpeg-asset', 12_000_000, commonExif, {
        width: 4032,
        height: 3024,
        originalFileName: 'IMG_0001.JPG',
        originalPath: '/library/IMG_0001.jpg',
        originalMimeType: 'image/jpeg',
      });

      expect(suggestDuplicate([jpegAsset, heicAsset, rawAsset])?.id).toBe('raw-dng');
      expect(suggestDuplicate([rawAsset, heicAsset, jpegAsset])?.id).toBe('raw-dng');
      expect(suggestDuplicate([jpegAsset, heicAsset])?.id).toBe('heic-asset');
    });

    it('should prioritize authentic camera EXIF and HEIC format over slightly larger stripped JPEG re-exports', () => {
      const heicOriginal = createAsset(
        'heic-original',
        3_000_000,
        {
          exifImageWidth: 4032,
          exifImageHeight: 3024,
          dateTimeOriginal: '2023-05-01T10:00:00.000Z',
          make: 'Apple',
          model: 'iPhone',
          lensModel: 'Back camera 4mm f/1.8',
          fNumber: 1.8,
          focalLength: 4,
          iso: 50,
          exposureTime: '1/120',
        },
        {
          width: 4032,
          height: 3024,
          originalFileName: 'IMG_0001.HEIC',
          originalPath: '/library/IMG_0001.heic',
          originalMimeType: 'image/heic',
        },
      );

      const strippedJpeg = createAsset(
        'stripped-jpeg',
        3_100_000,
        {
          exifImageWidth: 4032,
          exifImageHeight: 3024,
          dateTimeOriginal: '2024-05-01T10:00:00.000Z',
        },
        {
          width: 4032,
          height: 3024,
          originalFileName: 'IMG_0002.JPG',
          originalPath: '/library/IMG_0002+1.jpg',
          originalMimeType: 'image/jpeg',
        },
      );

      expect(suggestDuplicate([strippedJpeg, heicOriginal])?.id).toBe('heic-original');
      expect(suggestDuplicate([heicOriginal, strippedJpeg])?.id).toBe('heic-original');
    });

    it('should prioritize camera JPEG with full EXIF over slightly larger metadata-stripped JPEG copy', () => {
      const cameraOriginal = createAsset(
        'camera-original',
        2_500_000,
        {
          exifImageWidth: 4000,
          exifImageHeight: 3000,
          dateTimeOriginal: '2023-07-01T12:00:00.000Z',
          make: 'Canon',
          model: 'EOS 5D',
          lensModel: 'EF 24-70mm f/2.8L',
          fNumber: 2.8,
          focalLength: 35,
          iso: 100,
          exposureTime: '1/250',
        },
        { width: 4000, height: 3000 },
      );

      const strippedCopy = createAsset(
        'stripped-copy',
        2_600_000,
        {
          exifImageWidth: 4000,
          exifImageHeight: 3000,
          dateTimeOriginal: '2024-05-01T12:00:00.000Z',
        },
        { width: 4000, height: 3000 },
      );

      expect(suggestDuplicate([strippedCopy, cameraOriginal])?.id).toBe('camera-original');
      expect(suggestDuplicate([cameraOriginal, strippedCopy])?.id).toBe('camera-original');
    });

    it('should validate GPS coordinates (rejecting Null Island 0,0 and partial GPS) and exposure values > 0', () => {
      const validGpsAsset = createAsset('valid-gps', 2_000_000, {
        latitude: -33.8688,
        longitude: 151.2093,
      });
      const nullIslandAsset = createAsset('null-island', 2_050_000, {
        latitude: 0,
        longitude: 0,
        fNumber: 0,
        iso: 0,
        focalLength: 0,
        exposureTime: '0',
      });
      const partialGpsAsset = createAsset('partial-gps', 2_050_000, {
        latitude: 40.7128,
        longitude: null,
      });

      expect(suggestDuplicate([nullIslandAsset, validGpsAsset])?.id).toBe('valid-gps');
      expect(suggestDuplicate([partialGpsAsset, validGpsAsset])?.id).toBe('valid-gps');
    });

    it('should ignore Unix epoch fallback timestamps (1970-01-01) so corrupt dates do not win earliest capture bonus', () => {
      const corruptEpochCopy = createAsset(
        'corrupt-epoch',
        2_000_000,
        { dateTimeOriginal: '1970-01-01T00:00:00.000Z' },
        { fileCreatedAt: '1970-01-01T00:00:00.000Z' },
      );
      const authenticPhoto = createAsset(
        'authentic-2023',
        2_000_000,
        { dateTimeOriginal: '2023-09-15T14:30:00.000Z' },
        { fileCreatedAt: '2023-09-15T14:30:00.000Z' },
      );

      expect(suggestDuplicate([corruptEpochCopy, authenticPhoto])?.id).toBe('authentic-2023');
      expect(suggestDuplicate([authenticPhoto, corruptEpochCopy])?.id).toBe('authentic-2023');
    });

    it('should prefer Live Photos (with livePhotoVideoId) over unlinked still copies when resolution and EXIF tie', () => {
      const stillCopy = createAsset('still-copy', 2_500_000, { make: 'Apple', model: 'iPhone' });
      const livePhoto = createAsset(
        'live-photo',
        2_400_000,
        { make: 'Apple', model: 'iPhone' },
        { livePhotoVideoId: 'video-asset-1' },
      );

      expect(suggestDuplicate([stillCopy, livePhoto])?.id).toBe('live-photo');
      expect(suggestDuplicate([livePhoto, stillCopy])?.id).toBe('live-photo');
    });

    it('should penalize storage collision suffixes (+1.jpg) and messaging/copy filename markers', () => {
      const cleanOriginal = createAsset(
        'clean-original',
        70_000,
        { dateTimeOriginal: '2023-08-01T08:00:00.000Z' },
        {
          originalFileName: 'IMG_20230801_080000.jpg',
          originalPath: '/library/20230801_080000.jpg',
        },
      );
      const messagingCopy = createAsset(
        'messaging-copy',
        72_000,
        { dateTimeOriginal: '2023-08-05T10:00:00.000Z' },
        {
          originalFileName: 'IMG-20230805-WA0001.jpg',
          originalPath: '/library/20230805_100000+1.jpg',
        },
      );

      expect(suggestDuplicate([messagingCopy, cleanOriginal])?.id).toBe('clean-original');
      expect(suggestDuplicate([cleanOriginal, messagingCopy])?.id).toBe('clean-original');
    });
  });

  describe('suggestDuplicateKeepAssetIds', () => {
    it('should return empty array for empty list', () => {
      expect(suggestDuplicateKeepAssetIds([])).toEqual([]);
    });

    it('should return array with single asset ID', () => {
      const asset = createAsset('asset-1', 1000);
      expect(suggestDuplicateKeepAssetIds([asset])).toEqual(['asset-1']);
    });

    it('should return array with best asset ID', () => {
      const small = createAsset('small', 1000);
      const large = createAsset('large', 5000);

      expect(suggestDuplicateKeepAssetIds([small, large])).toEqual(['large']);
    });

    it('should keep multiple distinct full-resolution burst originals when grouped with their downscaled copies', () => {
      const cameraExif = {
        make: 'Apple',
        model: 'iPhone',
        lensModel: 'Back camera 6.86mm f/1.6',
        fNumber: 1.6,
        focalLength: 6.86,
        iso: 50,
        exposureTime: '1/1000',
      };

      const burstOriginalA = createAsset(
        'burst-orig-a',
        1_900_000,
        { ...cameraExif, exifImageWidth: 4032, exifImageHeight: 3024, dateTimeOriginal: '2024-05-01T12:00:01.000Z' },
        {
          width: 4032,
          height: 3024,
          originalFileName: 'IMG_0101.HEIC',
          originalPath: '/library/IMG_0101.heic',
          originalMimeType: 'image/heic',
        },
      );
      const burstOriginalB = createAsset(
        'burst-orig-b',
        2_000_000,
        { ...cameraExif, exifImageWidth: 4032, exifImageHeight: 3024, dateTimeOriginal: '2024-05-01T12:00:03.000Z' },
        {
          width: 4032,
          height: 3024,
          originalFileName: 'IMG_0102.HEIC',
          originalPath: '/library/IMG_0102.heic',
          originalMimeType: 'image/heic',
        },
      );
      const downscaledCopyA = createAsset(
        'downscaled-a',
        900_000,
        { ...cameraExif, exifImageWidth: 2048, exifImageHeight: 1536, dateTimeOriginal: '2024-05-01T12:00:01.000Z' },
        {
          width: 2048,
          height: 1536,
          originalFileName: 'IMG_0101.HEIC',
          originalPath: '/library/IMG_0101+1.heic',
          originalMimeType: 'image/heic',
        },
      );
      const downscaledCopyB = createAsset(
        'downscaled-b',
        950_000,
        { ...cameraExif, exifImageWidth: 2048, exifImageHeight: 1536, dateTimeOriginal: '2024-05-01T12:00:03.000Z' },
        {
          width: 2048,
          height: 1536,
          originalFileName: 'IMG_0102.HEIC',
          originalPath: '/library/IMG_0102+1.heic',
          originalMimeType: 'image/heic',
        },
      );

      const keepIds = suggestDuplicateKeepAssetIds([downscaledCopyA, burstOriginalA, downscaledCopyB, burstOriginalB]);

      expect(keepIds).toEqual(['burst-orig-b', 'burst-orig-a']);
    });

    it('should fall back to keeping a single best asset when all assets in a 3+ group are distinct burst shots with no copies to trash', () => {
      const cameraExif = {
        make: 'Apple',
        model: 'iPhone',
        lensModel: 'Back camera 6.86mm f/1.6',
        fNumber: 1.6,
        focalLength: 6.86,
        iso: 50,
        exposureTime: '1/1000',
      };

      const shot1 = createAsset(
        'shot-1',
        1_800_000,
        { ...cameraExif, exifImageWidth: 4032, exifImageHeight: 3024, dateTimeOriginal: '2024-05-01T12:00:01.000Z' },
        { width: 4032, height: 3024, originalFileName: 'IMG_0101.HEIC', originalPath: '/library/IMG_0101.heic' },
      );
      const shot2 = createAsset(
        'shot-2',
        2_100_000,
        { ...cameraExif, exifImageWidth: 4032, exifImageHeight: 3024, dateTimeOriginal: '2024-05-01T12:00:02.000Z' },
        { width: 4032, height: 3024, originalFileName: 'IMG_0102.HEIC', originalPath: '/library/IMG_0102.heic' },
      );
      const shot3 = createAsset(
        'shot-3',
        1_900_000,
        { ...cameraExif, exifImageWidth: 4032, exifImageHeight: 3024, dateTimeOriginal: '2024-05-01T12:00:03.000Z' },
        { width: 4032, height: 3024, originalFileName: 'IMG_0103.HEIC', originalPath: '/library/IMG_0103.heic' },
      );

      expect(suggestDuplicateKeepAssetIds([shot1, shot2, shot3])).toEqual(['shot-2']);
    });
  });
});
