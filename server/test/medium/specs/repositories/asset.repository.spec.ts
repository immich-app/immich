import { Kysely } from 'kysely';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AssetRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetRepository.name, () => {
  describe('create', () => {
    it('should return the asset on successful insert', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const checksum = Buffer.from('duplicate-test-checksum');

      const result = await sut.create({
        ownerId: user.id,
        checksum,
        originalPath: '/path/to/file.jpg',
        originalFileName: 'file.jpg',
        deviceAssetId: 'device-1',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });

      expect(result).toBeDefined();
      expect(result!.ownerId).toBe(user.id);
    });

    it('should return undefined on duplicate checksum for the same owner', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const checksum = Buffer.from('duplicate-test-checksum-2');

      const first = await sut.create({
        ownerId: user.id,
        checksum,
        originalPath: '/path/to/file1.jpg',
        originalFileName: 'file1.jpg',
        deviceAssetId: 'device-1',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });
      expect(first).toBeDefined();

      const second = await sut.create({
        ownerId: user.id,
        checksum,
        originalPath: '/path/to/file2.jpg',
        originalFileName: 'file2.jpg',
        deviceAssetId: 'device-2',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });
      expect(second).toBeUndefined();
    });

    it('should allow the same checksum for different owners', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const checksum = Buffer.from('shared-checksum');

      const first = await sut.create({
        ownerId: user1.id,
        checksum,
        originalPath: '/path/to/file1.jpg',
        originalFileName: 'file1.jpg',
        deviceAssetId: 'device-1',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });
      expect(first).toBeDefined();

      const second = await sut.create({
        ownerId: user2.id,
        checksum,
        originalPath: '/path/to/file2.jpg',
        originalFileName: 'file2.jpg',
        deviceAssetId: 'device-2',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });
      expect(second).toBeDefined();
      expect(second!.ownerId).toBe(user2.id);
    });
  });

  describe('createStrict', () => {
    it('should throw on duplicate checksum', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const checksum = Buffer.from('strict-duplicate-checksum');

      await sut.createStrict({
        ownerId: user.id,
        checksum,
        originalPath: '/path/to/file1.jpg',
        originalFileName: 'file1.jpg',
        deviceAssetId: 'device-1',
        deviceId: 'device',
        type: 'IMAGE' as any,
        fileCreatedAt: new Date().toISOString(),
        fileModifiedAt: new Date().toISOString(),
        localDateTime: new Date().toISOString(),
        isFavorite: false,
      });

      await expect(
        sut.createStrict({
          ownerId: user.id,
          checksum,
          originalPath: '/path/to/file2.jpg',
          originalFileName: 'file2.jpg',
          deviceAssetId: 'device-2',
          deviceId: 'device',
          type: 'IMAGE' as any,
          fileCreatedAt: new Date().toISOString(),
          fileModifiedAt: new Date().toISOString(),
          localDateTime: new Date().toISOString(),
          isFavorite: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe('upsertExif', () => {
    it('should append to locked columns', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        dateTimeOriginal: '2023-11-19T18:11:00',
        lockedProperties: ['dateTimeOriginal'],
      });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['dateTimeOriginal'] });

      await sut.upsertExif(
        { assetId: asset.id, lockedProperties: ['description'] },
        { lockedPropertiesBehavior: 'append' },
      );

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['description', 'dateTimeOriginal'] });
    });

    it('should deduplicate locked columns', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        dateTimeOriginal: '2023-11-19T18:11:00',
        lockedProperties: ['dateTimeOriginal', 'description'],
      });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['dateTimeOriginal', 'description'] });

      await sut.upsertExif(
        { assetId: asset.id, lockedProperties: ['description'] },
        { lockedPropertiesBehavior: 'append' },
      );

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['description', 'dateTimeOriginal'] });
    });
  });

  describe('unlockProperties', () => {
    it('should unlock one property', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        dateTimeOriginal: '2023-11-19T18:11:00',
        lockedProperties: ['dateTimeOriginal', 'description'],
      });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['dateTimeOriginal', 'description'] });

      await sut.unlockProperties(asset.id, ['dateTimeOriginal']);

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['description'] });
    });

    it('should unlock all properties', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        dateTimeOriginal: '2023-11-19T18:11:00',
        lockedProperties: ['dateTimeOriginal', 'description'],
      });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: ['dateTimeOriginal', 'description'] });

      await sut.unlockProperties(asset.id, ['description', 'dateTimeOriginal']);

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('lockedProperties')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ lockedProperties: null });
    });
  });
});
