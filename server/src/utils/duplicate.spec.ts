import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ExifResponseSchema } from 'src/dtos/exif.dto';
import { AssetType, AssetVisibility } from 'src/enum';
import { getExifCount, suggestDuplicate, suggestDuplicateKeepAssetIds } from 'src/utils/duplicate';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

type ExifInfoInput = Partial<z.infer<typeof ExifResponseSchema>> & { localDateTime?: string };

const createAsset = (
  id: string,
  fileSizeInByte: number | null = null,
  exifFields: ExifInfoInput = {},
): AssetResponseDto => {
  const { localDateTime: localDateTimeValue, ...restExifFields } = exifFields;

  return {
    id,
    type: AssetType.Image,
    thumbhash: null,
    localDateTime: localDateTimeValue ?? new Date().toISOString(),
    duration: 0,
    hasMetadata: true,
    width: 1920,
    height: 1080,
    createdAt: new Date().toISOString(),
    ownerId: 'owner-1',
    originalPath: '/path/to/asset',
    originalFileName: 'asset.jpg',
    fileCreatedAt: new Date().toISOString(),
    fileModifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    isEdited: false,
    visibility: AssetVisibility.Timeline,
    checksum: 'checksum',
    exifInfo:
      fileSizeInByte !== null || Object.keys(restExifFields).length > 0
        ? ExifResponseSchema.parse({ fileSizeInByte, ...restExifFields })
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
        dateTimeOriginal: new Date().toISOString(),
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

    it('should not count null or undefined values', () => {
      const asset = createAsset('asset-1', 1000, {
        make: 'Canon',
        model: null,
        latitude: undefined,
        city: '',
        rating: 0,
      });
      // fileSizeInByte (1000) + make ('Canon') = 2 truthy values
      // model (null), latitude (undefined), city (''), rating (0) are all falsy
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

    it('should return asset with largest file size', () => {
      const small = createAsset('small', 1000);
      const large = createAsset('large', 5000);
      const medium = createAsset('medium', 3000);

      expect(suggestDuplicate([small, large, medium])?.id).toBe('large');
      expect(suggestDuplicate([large, small, medium])?.id).toBe('large');
      expect(suggestDuplicate([medium, small, large])?.id).toBe('large');
    });

    it('should use EXIF count as tie-breaker when file sizes are equal', () => {
      const lessExif = createAsset('less-exif', 1000, { make: 'Canon' });
      const moreExif = createAsset('more-exif', 1000, {
        make: 'Canon',
        model: 'EOS 5D',
        dateTimeOriginal: new Date().toISOString(),
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
    });

    it('should handle assets with exifInfo but no fileSizeInByte', () => {
      const noFileSize = createAsset('no-file-size');
      noFileSize.exifInfo = ExifResponseSchema.parse({ make: 'Canon', model: 'EOS 5D' });
      const withFileSize = createAsset('with-file-size', 1000);

      expect(suggestDuplicate([noFileSize, withFileSize])?.id).toBe('with-file-size');
    });

    it('should return an asset when all have same file size, EXIF count, and localDateTime', () => {
      const asset1 = createAsset('asset-1', 1000, { make: 'Canon' });
      const asset2 = createAsset('asset-2', 1000, { make: 'Nikon' });

      // Both have same file size (1000), same EXIF count (2), and same localDateTime
      // Should return the first asset after all tiebreakers are exhausted
      const result = suggestDuplicate([asset1, asset2]);
      expect(result).toBeDefined();
      expect(['asset-1', 'asset-2']).toContain(result?.id);
    });

    it('should prioritize earliest localDateTime when file size and EXIF count are equal', () => {
      const earlier = createAsset('earlier', 1000, {
        make: 'Canon',
        localDateTime: '2023-01-01T00:00:00.000Z',
      });
      const later = createAsset('later', 1000, {
        make: 'Canon',
        localDateTime: '2024-01-01T00:00:00.000Z',
      });

      expect(suggestDuplicate([later, earlier])?.id).toBe('earlier');
      expect(suggestDuplicate([earlier, later])?.id).toBe('earlier');
    });

    it('should prioritize EXIF count over localDateTime', () => {
      const olderLessExif = createAsset('older-less-exif', 1000, {
        make: 'Canon',
        localDateTime: '2023-01-01T00:00:00.000Z',
      });
      const newerMoreExif = createAsset('newer-more-exif', 1000, {
        make: 'Canon',
        model: 'EOS 5D',
        localDateTime: '2024-01-01T00:00:00.000Z',
      });

      expect(suggestDuplicate([olderLessExif, newerMoreExif])?.id).toBe('newer-more-exif');
    });

    it('should prioritize file size over localDateTime', () => {
      const largeWithLessExif = createAsset('large-less-exif', 5000, { make: 'Canon' });
      const smallWithMoreExif = createAsset('small-more-exif', 1000, {
        make: 'Canon',
        model: 'EOS 5D',
        dateTimeOriginal: new Date().toISOString(),
        city: 'New York',
        state: 'NY',
        country: 'USA',
      });

      expect(suggestDuplicate([largeWithLessExif, smallWithMoreExif])?.id).toBe('large-less-exif');
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
  });
});
