import { Kysely } from 'kysely';
import { vi } from 'vitest';
import { AssetEditAction } from 'src/dtos/editing.dto';
import { AssetFileType, AssetOrder, AssetVisibility } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
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
  describe('Fuji edited derivative commit and cleanup', () => {
    it('releases reserved outputs without changing asset files when the edit snapshot is stale', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { edits: staleEdits } = await ctx.newEdits(asset.id, {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      });
      const candidatePath = `/data/thumbs/${asset.id}_preview_fuji_${'a'.repeat(64)}_edited.jpeg`;
      await sut.reserveFujiRenderOutputs(asset.id, [candidatePath], new Date(Date.now() + 60_000));
      await ctx.newEdits(asset.id, {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }],
      });

      await expect(
        sut.commitEditedFilesIfCurrent({
          assetId: asset.id,
          expectedEditIds: staleEdits.map(({ id }) => id),
          files: [
            {
              assetId: asset.id,
              type: AssetFileType.Preview,
              path: candidatePath,
              isEdited: true,
              isProgressive: false,
              isTransparent: false,
            },
          ],
          reservedFujiPaths: [candidatePath],
          deleteLegacyWithFujiRenderer: true,
          thumbhash: factory.buffer(),
          width: 100,
          height: 100,
        }),
      ).resolves.toMatchObject({ committed: false, fujiCleanupPending: true });

      await expect(
        ctx.database
          .selectFrom('asset_file')
          .select('path')
          .where('assetId', '=', asset.id)
          .where('isEdited', '=', true)
          .execute(),
      ).resolves.toEqual([]);
      const reservation = await ctx.database
        .selectFrom('fuji_cleanup_outbox')
        .select(['path', 'availableAt'])
        .where('path', '=', candidatePath)
        .executeTakeFirstOrThrow();
      expect(reservation.path).toBe(candidatePath);
      expect(reservation.availableAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('atomically swaps the current edited file and moves the old Fuji path to the outbox', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { edits } = await ctx.newEdits(asset.id, {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      });
      const oldPath = `/data/thumbs/${asset.id}_preview_fuji_${'a'.repeat(64)}_edited.jpeg`;
      const newPath = `/data/thumbs/${asset.id}_preview_fuji_${'b'.repeat(64)}_edited.jpeg`;
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: oldPath,
        isEdited: true,
        isProgressive: false,
        isTransparent: false,
      });
      await sut.reserveFujiRenderOutputs(asset.id, [newPath], new Date(Date.now() + 60_000));

      await expect(
        sut.commitEditedFilesIfCurrent({
          assetId: asset.id,
          expectedEditIds: edits.map(({ id }) => id),
          files: [
            {
              assetId: asset.id,
              type: AssetFileType.Preview,
              path: newPath,
              isEdited: true,
              isProgressive: false,
              isTransparent: false,
            },
          ],
          reservedFujiPaths: [newPath],
          deleteLegacyWithFujiRenderer: true,
          thumbhash: factory.buffer(),
          width: 100,
          height: 100,
        }),
      ).resolves.toMatchObject({ committed: true, fujiCleanupPending: true });

      await expect(
        ctx.database
          .selectFrom('asset_file')
          .select('path')
          .where('assetId', '=', asset.id)
          .where('isEdited', '=', true)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ path: newPath });
      await expect(
        ctx.database.selectFrom('fuji_cleanup_outbox').select('path').where('assetId', '=', asset.id).execute(),
      ).resolves.toEqual([{ path: oldPath }]);
    });

    it('retains failed cleanup rows and never sends referenced paths to the sidecar', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const failedPath = `/data/thumbs/${asset.id}_preview_fuji_${'a'.repeat(64)}_edited.jpeg`;
      await sut.reserveFujiRenderOutputs(asset.id, [failedPath], new Date(0));
      await expect(
        sut.drainFujiCleanup(async () => {
          throw new Error('sidecar unavailable');
        }),
      ).rejects.toThrow('sidecar unavailable');
      await expect(
        ctx.database.selectFrom('fuji_cleanup_outbox').select('path').where('path', '=', failedPath).execute(),
      ).resolves.toEqual([{ path: failedPath }]);

      const referencedPath = `/data/thumbs/${asset.id}_thumbnail_fuji_${'b'.repeat(64)}_edited.webp`;
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Thumbnail,
        path: referencedPath,
        isEdited: true,
        isProgressive: false,
        isTransparent: false,
      });
      await sut.reserveFujiRenderOutputs(asset.id, [referencedPath], new Date(0));
      const cleanup = vi.fn().mockResolvedValue(undefined);
      await sut.drainFujiCleanup(cleanup);
      expect(cleanup).toHaveBeenCalledWith([failedPath]);
      await expect(
        ctx.database
          .selectFrom('fuji_cleanup_outbox')
          .select('path')
          .where('path', '=', referencedPath)
          .execute(),
      ).resolves.toEqual([]);
    });
  });

  describe('getTimeBucket', () => {
    it('should order assets by local day first and fileCreatedAt within each day', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      const [{ asset: previousLocalDayAsset }, { asset: nextLocalDayEarlierAsset }, { asset: nextLocalDayLaterAsset }] =
        await Promise.all([
          ctx.newAsset({
            ownerId: user.id,
            fileCreatedAt: new Date('2026-03-09T00:30:00.000Z'),
            localDateTime: new Date('2026-03-08T22:30:00.000Z'),
          }),
          ctx.newAsset({
            ownerId: user.id,
            fileCreatedAt: new Date('2026-03-08T23:30:00.000Z'),
            localDateTime: new Date('2026-03-09T01:30:00.000Z'),
          }),
          ctx.newAsset({
            ownerId: user.id,
            fileCreatedAt: new Date('2026-03-08T23:45:00.000Z'),
            localDateTime: new Date('2026-03-09T01:45:00.000Z'),
          }),
        ]);

      await Promise.all([
        ctx.newExif({ assetId: previousLocalDayAsset.id, timeZone: 'UTC-2' }),
        ctx.newExif({ assetId: nextLocalDayEarlierAsset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: nextLocalDayLaterAsset.id, timeZone: 'UTC+2' }),
      ]);

      const descendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        { order: AssetOrder.Desc, userIds: [user.id], visibility: AssetVisibility.Timeline },
        auth,
      );
      expect(JSON.parse(descendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [nextLocalDayLaterAsset.id, nextLocalDayEarlierAsset.id, previousLocalDayAsset.id],
        }),
      );

      const ascendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        { order: AssetOrder.Asc, userIds: [user.id], visibility: AssetVisibility.Timeline },
        auth,
      );
      expect(JSON.parse(ascendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [previousLocalDayAsset.id, nextLocalDayEarlierAsset.id, nextLocalDayLaterAsset.id],
        }),
      );
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

      await sut.upsertExif({
        exif: { assetId: asset.id, lockedProperties: ['description'] },
        lockedPropertiesBehavior: 'append',
      });

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

      await sut.upsertExif({
        exif: { assetId: asset.id, lockedProperties: ['description'] },
        lockedPropertiesBehavior: 'append',
      });

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
