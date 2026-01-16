import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { DuplicateResolveSettingsDto } from 'src/dtos/duplicate.dto';
import { AssetType, AssetVisibility } from 'src/enum';
import { computeResolvePolicy, getSyncedInfo } from 'src/utils/duplicate-resolve';
import { describe, expect, it } from 'vitest';

const createAsset = (
  id: string,
  overrides: Partial<AssetResponseDto> = {},
): AssetResponseDto => ({
  id,
  type: AssetType.Image,
  thumbhash: null,
  localDateTime: new Date(),
  duration: '0:00:00.00000',
  hasMetadata: true,
  width: 1920,
  height: 1080,
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
  visibility: AssetVisibility.Timeline,
  checksum: 'checksum',
  ...overrides,
});

const allDisabledSettings: DuplicateResolveSettingsDto = {
  synchronizeAlbums: false,
  synchronizeVisibility: false,
  synchronizeFavorites: false,
  synchronizeRating: false,
  synchronizeDescription: false,
  synchronizeLocation: false,
  synchronizeTags: false,
};

const _allEnabledSettings: DuplicateResolveSettingsDto = {
  synchronizeAlbums: true,
  synchronizeVisibility: true,
  synchronizeFavorites: true,
  synchronizeRating: true,
  synchronizeDescription: true,
  synchronizeLocation: true,
  synchronizeTags: true,
};

describe('duplicate-resolve utils', () => {
  describe('getSyncedInfo', () => {
    it('should return defaults for empty list', () => {
      const result = getSyncedInfo([]);
      expect(result).toEqual({
        isFavorite: false,
        visibility: undefined,
        rating: 0,
        description: null,
        latitude: null,
        longitude: null,
        tagIds: [],
      });
    });

    describe('isFavorite', () => {
      it('should return false if no assets are favorite', () => {
        const assets = [createAsset('1', { isFavorite: false }), createAsset('2', { isFavorite: false })];
        expect(getSyncedInfo(assets).isFavorite).toBe(false);
      });

      it('should return true if any asset is favorite', () => {
        const assets = [createAsset('1', { isFavorite: false }), createAsset('2', { isFavorite: true })];
        expect(getSyncedInfo(assets).isFavorite).toBe(true);
      });
    });

    describe('visibility', () => {
      it('should return undefined if no special visibility', () => {
        const assets = [createAsset('1', { visibility: AssetVisibility.Timeline })];
        expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Timeline);
      });

      it('should prioritize Locked over Archive and Timeline', () => {
        const assets = [
          createAsset('1', { visibility: AssetVisibility.Timeline }),
          createAsset('2', { visibility: AssetVisibility.Archive }),
          createAsset('3', { visibility: AssetVisibility.Locked }),
        ];
        expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Locked);
      });

      it('should prioritize Archive over Timeline', () => {
        const assets = [
          createAsset('1', { visibility: AssetVisibility.Timeline }),
          createAsset('2', { visibility: AssetVisibility.Archive }),
        ];
        expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Archive);
      });

      it('should use Hidden if no standard visibility but Hidden is present', () => {
        const assets = [createAsset('1', { visibility: AssetVisibility.Hidden })];
        expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Hidden);
      });
    });

    describe('rating', () => {
      it('should return 0 if no ratings', () => {
        const assets = [createAsset('1'), createAsset('2')];
        expect(getSyncedInfo(assets).rating).toBe(0);
      });

      it('should return max rating', () => {
        const assets = [
          createAsset('1', { exifInfo: { rating: 3 } }),
          createAsset('2', { exifInfo: { rating: 5 } }),
          createAsset('3', { exifInfo: { rating: 1 } }),
        ];
        expect(getSyncedInfo(assets).rating).toBe(5);
      });
    });

    describe('description', () => {
      it('should return null if no descriptions', () => {
        const assets = [createAsset('1'), createAsset('2')];
        expect(getSyncedInfo(assets).description).toBeNull();
      });

      it('should concatenate unique non-empty lines', () => {
        const assets = [
          createAsset('1', { exifInfo: { description: 'Line 1\nLine 2' } }),
          createAsset('2', { exifInfo: { description: 'Line 2\nLine 3' } }),
        ];
        expect(getSyncedInfo(assets).description).toBe('Line 1\nLine 2\nLine 3');
      });

      it('should trim lines and skip empty', () => {
        const assets = [createAsset('1', { exifInfo: { description: '  Line 1  \n\n  Line 2  \n  ' } })];
        expect(getSyncedInfo(assets).description).toBe('Line 1\nLine 2');
      });
    });

    describe('location', () => {
      it('should return null if no location data', () => {
        const assets = [createAsset('1'), createAsset('2')];
        const result = getSyncedInfo(assets);
        expect(result.latitude).toBeNull();
        expect(result.longitude).toBeNull();
      });

      it('should return coordinates if all assets have same location', () => {
        const assets = [
          createAsset('1', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
          createAsset('2', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
        ];
        const result = getSyncedInfo(assets);
        expect(result.latitude).toBe(40.7128);
        expect(result.longitude).toBe(-74.006);
      });

      it('should return null if locations differ', () => {
        const assets = [
          createAsset('1', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
          createAsset('2', { exifInfo: { latitude: 34.0522, longitude: -118.2437 } }),
        ];
        const result = getSyncedInfo(assets);
        expect(result.latitude).toBeNull();
        expect(result.longitude).toBeNull();
      });

      it('should ignore assets with missing location', () => {
        const assets = [
          createAsset('1', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
          createAsset('2', { exifInfo: {} }),
        ];
        const result = getSyncedInfo(assets);
        expect(result.latitude).toBe(40.7128);
        expect(result.longitude).toBe(-74.006);
      });
    });

    describe('tagIds', () => {
      it('should return empty array if no tags', () => {
        const assets = [createAsset('1'), createAsset('2')];
        expect(getSyncedInfo(assets).tagIds).toEqual([]);
      });

      it('should collect unique tag IDs from all assets', () => {
        const assets = [
          createAsset('1', { tags: [{ id: 'tag-1', name: 'Tag 1', value: 'tag-1', createdAt: new Date(), updatedAt: new Date() }] }),
          createAsset('2', { tags: [{ id: 'tag-1', name: 'Tag 1', value: 'tag-1', createdAt: new Date(), updatedAt: new Date() }, { id: 'tag-2', name: 'Tag 2', value: 'tag-2', createdAt: new Date(), updatedAt: new Date() }] }),
        ];
        const result = getSyncedInfo(assets);
        expect(result.tagIds).toHaveLength(2);
        expect(result.tagIds).toContain('tag-1');
        expect(result.tagIds).toContain('tag-2');
      });
    });
  });

  describe('computeResolvePolicy', () => {
    it('should always set duplicateId to null in assetBulkUpdate', () => {
      const assets = [createAsset('1'), createAsset('2')];
      const policy = computeResolvePolicy(assets, ['1'], allDisabledSettings);
      expect(policy.assetBulkUpdate.duplicateId).toBeNull();
    });

    it('should set ids to idsToKeep', () => {
      const assets = [createAsset('1'), createAsset('2')];
      const policy = computeResolvePolicy(assets, ['1', '2'], allDisabledSettings);
      expect(policy.assetBulkUpdate.ids).toEqual(['1', '2']);
    });

    it('should not set sync fields when all settings disabled', () => {
      const assets = [
        createAsset('1', {
          isFavorite: true,
          visibility: AssetVisibility.Archive,
          exifInfo: { rating: 5, description: 'test' },
        }),
      ];
      const policy = computeResolvePolicy(assets, ['1'], allDisabledSettings);

      expect(policy.assetBulkUpdate.isFavorite).toBeUndefined();
      expect(policy.assetBulkUpdate.visibility).toBeUndefined();
      expect(policy.assetBulkUpdate.rating).toBeUndefined();
      expect(policy.assetBulkUpdate.description).toBeUndefined();
      expect(policy.mergedAlbumIds).toEqual([]);
      expect(policy.mergedTagIds).toEqual([]);
    });

    it('should set isFavorite when synchronizeFavorites enabled', () => {
      const assets = [createAsset('1', { isFavorite: true }), createAsset('2', { isFavorite: false })];
      const settings = { ...allDisabledSettings, synchronizeFavorites: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.isFavorite).toBe(true);
    });

    it('should set visibility when synchronizeVisibility enabled', () => {
      const assets = [
        createAsset('1', { visibility: AssetVisibility.Archive }),
        createAsset('2', { visibility: AssetVisibility.Timeline }),
      ];
      const settings = { ...allDisabledSettings, synchronizeVisibility: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.visibility).toBe(AssetVisibility.Archive);
    });

    it('should set rating when synchronizeRating enabled', () => {
      const assets = [createAsset('1', { exifInfo: { rating: 3 } }), createAsset('2', { exifInfo: { rating: 5 } })];
      const settings = { ...allDisabledSettings, synchronizeRating: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.rating).toBe(5);
    });

    it('should set description when synchronizeDescription enabled and non-null', () => {
      const assets = [createAsset('1', { exifInfo: { description: 'Test description' } })];
      const settings = { ...allDisabledSettings, synchronizeDescription: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.description).toBe('Test description');
    });

    it('should not set description when null', () => {
      const assets = [createAsset('1')];
      const settings = { ...allDisabledSettings, synchronizeDescription: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.description).toBeUndefined();
    });

    it('should set location when synchronizeLocation enabled and coordinates match', () => {
      const assets = [
        createAsset('1', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
        createAsset('2', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
      ];
      const settings = { ...allDisabledSettings, synchronizeLocation: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.latitude).toBe(40.7128);
      expect(policy.assetBulkUpdate.longitude).toBe(-74.006);
    });

    it('should not set location when coordinates differ', () => {
      const assets = [
        createAsset('1', { exifInfo: { latitude: 40.7128, longitude: -74.006 } }),
        createAsset('2', { exifInfo: { latitude: 34.0522, longitude: -118.2437 } }),
      ];
      const settings = { ...allDisabledSettings, synchronizeLocation: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.assetBulkUpdate.latitude).toBeUndefined();
      expect(policy.assetBulkUpdate.longitude).toBeUndefined();
    });

    it('should return merged album IDs when synchronizeAlbums enabled', () => {
      const assets = [createAsset('1'), createAsset('2')];
      const settings = { ...allDisabledSettings, synchronizeAlbums: true };
      const assetAlbumMap = new Map([
        ['1', ['album-1', 'album-2']],
        ['2', ['album-2', 'album-3']],
      ]);
      const policy = computeResolvePolicy(assets, ['1'], settings, assetAlbumMap);
      expect(policy.mergedAlbumIds).toHaveLength(3);
      expect(policy.mergedAlbumIds).toContain('album-1');
      expect(policy.mergedAlbumIds).toContain('album-2');
      expect(policy.mergedAlbumIds).toContain('album-3');
    });

    it('should return merged tag IDs when synchronizeTags enabled', () => {
      const assets = [
        createAsset('1', { tags: [{ id: 'tag-1', name: 'Tag 1', value: 'tag-1', createdAt: new Date(), updatedAt: new Date() }] }),
        createAsset('2', { tags: [{ id: 'tag-2', name: 'Tag 2', value: 'tag-2', createdAt: new Date(), updatedAt: new Date() }] }),
      ];
      const settings = { ...allDisabledSettings, synchronizeTags: true };
      const policy = computeResolvePolicy(assets, ['1'], settings);
      expect(policy.mergedTagIds).toHaveLength(2);
      expect(policy.mergedTagIds).toContain('tag-1');
      expect(policy.mergedTagIds).toContain('tag-2');
    });
  });
});
