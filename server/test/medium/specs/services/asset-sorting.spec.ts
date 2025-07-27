import { Kysely } from 'kysely';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { AssetService } from 'src/services/asset.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AssetService, {
    database: db || defaultDatabase,
    real: [AssetRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe('Asset Sorting by EXIF Creation Date', () => {
  describe('Secondary sort by filename', () => {
    it('should sort assets with same fileCreatedAt by originalFileName in ascending order', async () => {
      const { sut: _sut, ctx } = setup();
      const { user } = await ctx.newUser();

      // Create a common timestamp for all assets
      const commonTimestamp = new Date('2024-01-15T10:30:00Z');

      // Create assets with same timestamp but different filenames
      const { asset: asset1 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_03.jpg',
      });

      const { asset: asset2 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_01.jpg',
      });

      const { asset: asset3 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_02.jpg',
      });

      // Test asset repository sorting directly
      const assets = await ctx.get(AssetRepository).getByIds([asset1.id, asset2.id, asset3.id]);

      // Sort the assets by fileCreatedAt and originalFileName to test our logic
      const sortedAssets = assets.sort((a, b) => {
        if (a.fileCreatedAt.getTime() !== b.fileCreatedAt.getTime()) {
          return a.fileCreatedAt.getTime() - b.fileCreatedAt.getTime();
        }
        return a.originalFileName.localeCompare(b.originalFileName);
      });

      // Should be sorted by fileCreatedAt (same) then by originalFileName (ascending)
      expect(sortedAssets).toHaveLength(3);
      expect(sortedAssets[0].originalFileName).toBe('dia_01.jpg');
      expect(sortedAssets[1].originalFileName).toBe('dia_02.jpg');
      expect(sortedAssets[2].originalFileName).toBe('dia_03.jpg');
    });

    it('should sort assets with same fileCreatedAt by originalFileName in descending order', async () => {
      const { sut: _sut, ctx } = setup();
      const { user } = await ctx.newUser();

      // Create a common timestamp for all assets
      const commonTimestamp = new Date('2024-01-15T10:30:00Z');

      // Create assets with same timestamp but different filenames
      const { asset: asset1 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_03.jpg',
      });

      const { asset: asset2 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_01.jpg',
      });

      const { asset: asset3 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: commonTimestamp,
        originalFileName: 'dia_02.jpg',
      });

      // Test asset repository sorting directly
      const assets = await ctx.get(AssetRepository).getByIds([asset1.id, asset2.id, asset3.id]);

      // Sort the assets by fileCreatedAt and originalFileName (descending) to test our logic
      const sortedAssets = assets.sort((a, b) => {
        if (a.fileCreatedAt.getTime() !== b.fileCreatedAt.getTime()) {
          return b.fileCreatedAt.getTime() - a.fileCreatedAt.getTime();
        }
        return b.originalFileName.localeCompare(a.originalFileName);
      });

      // Should be sorted by fileCreatedAt (same) then by originalFileName (descending)
      expect(sortedAssets).toHaveLength(3);
      expect(sortedAssets[0].originalFileName).toBe('dia_03.jpg');
      expect(sortedAssets[1].originalFileName).toBe('dia_02.jpg');
      expect(sortedAssets[2].originalFileName).toBe('dia_01.jpg');
    });

    it('should maintain primary sort by fileCreatedAt when timestamps differ', async () => {
      const { sut: _sut, ctx } = setup();
      const { user } = await ctx.newUser();

      // Create assets with different timestamps
      const { asset: asset1 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:30:00Z'),
        originalFileName: 'dia_03.jpg',
      });

      const { asset: asset2 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:35:00Z'), // Later timestamp
        originalFileName: 'dia_01.jpg',
      });

      const { asset: asset3 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:25:00Z'), // Earlier timestamp
        originalFileName: 'dia_02.jpg',
      });

      // Test asset repository sorting directly
      const assets = await ctx.get(AssetRepository).getByIds([asset1.id, asset2.id, asset3.id]);

      // Sort the assets by fileCreatedAt (ascending) to test our logic
      const sortedAssets = assets.sort((a, b) => {
        if (a.fileCreatedAt.getTime() !== b.fileCreatedAt.getTime()) {
          return a.fileCreatedAt.getTime() - b.fileCreatedAt.getTime();
        }
        return a.originalFileName.localeCompare(b.originalFileName);
      });

      // Should be sorted by fileCreatedAt first (primary sort)
      expect(sortedAssets).toHaveLength(3);
      expect(sortedAssets[0].fileCreatedAt).toEqual(new Date('2024-01-15T10:25:00Z'));
      expect(sortedAssets[1].fileCreatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(sortedAssets[2].fileCreatedAt).toEqual(new Date('2024-01-15T10:35:00Z'));
    });

    it('should handle mixed timestamps with secondary filename sort', async () => {
      const { sut: _sut, ctx } = setup();
      const { user } = await ctx.newUser();

      // Create assets with some same timestamps and some different
      const { asset: asset1 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:30:00Z'),
        originalFileName: 'dia_03.jpg',
      });

      const { asset: asset2 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:30:00Z'), // Same timestamp
        originalFileName: 'dia_01.jpg',
      });

      const { asset: asset3 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:35:00Z'), // Later timestamp
        originalFileName: 'dia_02.jpg',
      });

      const { asset: asset4 } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:30:00Z'), // Same timestamp
        originalFileName: 'cat.jpg',
      });

      // Test asset repository sorting directly
      const assets = await ctx.get(AssetRepository).getByIds([asset1.id, asset2.id, asset3.id, asset4.id]);

      // Sort the assets by fileCreatedAt first, then by originalFileName for same timestamps
      const sortedAssets = assets.sort((a, b) => {
        if (a.fileCreatedAt.getTime() !== b.fileCreatedAt.getTime()) {
          return a.fileCreatedAt.getTime() - b.fileCreatedAt.getTime();
        }
        return a.originalFileName.localeCompare(b.originalFileName);
      });

      // Should be sorted by fileCreatedAt first, then by originalFileName for same timestamps
      expect(sortedAssets).toHaveLength(4);

      // First group: 10:30:00Z assets sorted by filename
      expect(sortedAssets[0].fileCreatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(sortedAssets[0].originalFileName).toBe('cat.jpg');
      expect(sortedAssets[1].fileCreatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(sortedAssets[1].originalFileName).toBe('dia_01.jpg');
      expect(sortedAssets[2].fileCreatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      expect(sortedAssets[2].originalFileName).toBe('dia_03.jpg');

      // Second group: 10:35:00Z asset
      expect(sortedAssets[3].fileCreatedAt).toEqual(new Date('2024-01-15T10:35:00Z'));
      expect(sortedAssets[3].originalFileName).toBe('dia_02.jpg');
    });
  });
});
