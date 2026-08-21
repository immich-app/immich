import { Kysely } from 'kysely';
import { AssetOrder, AssetVisibility } from 'src/enum';
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

// Metadata extraction is repeatable: probing improves, files get repaired,
// and a re-run has to be able to correct what an earlier run stored.
const audioRow = (assetId: string, n: number) => ({
  assetId,
  bitrate: 100_000 + n,
  index: n,
  profile: n,
  codecName: `codec-${n}`,
});

const videoRow = (assetId: string, n: number) => ({
  assetId,
  bitrate: 200_000 + n,
  frameCount: 300 + n,
  timeBase: 600 + n,
  index: n,
  profile: n,
  level: n,
  colorPrimaries: n,
  colorTransfer: n,
  colorMatrix: n,
  dvProfile: n,
  dvLevel: n,
  dvBlSignalCompatibilityId: n,
  codecName: `vcodec-${n}`,
  formatName: `format-${n}`,
  formatLongName: `format long ${n}`,
  pixelFormat: `pixfmt-${n}`,
});

const keyframeRow = (assetId: string, n: number) => ({
  assetId,
  pts: [n],
  accDuration: [n],
  ownDuration: [n],
  totalDuration: 1000 + n,
  packetCount: 10 + n,
  outputFrames: 20 + n,
});

describe(AssetRepository.name, () => {
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
    it('should replace stored audio metadata on a second extraction', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'first' },
        audio: audioRow(asset.id, 2),
        lockedPropertiesBehavior: 'skip',
      });
      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'second' },
        audio: audioRow(asset.id, 1),
        lockedPropertiesBehavior: 'skip',
      });

      await expect(
        ctx.database.selectFrom('asset_audio').selectAll().where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual(audioRow(asset.id, 1));
    });

    it('should replace stored video metadata on a second extraction', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'first' },
        video: videoRow(asset.id, 2),
        lockedPropertiesBehavior: 'skip',
      });
      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'second' },
        video: videoRow(asset.id, 1),
        lockedPropertiesBehavior: 'skip',
      });

      await expect(
        ctx.database.selectFrom('asset_video').selectAll().where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual(videoRow(asset.id, 1));
    });

    it('should replace stored keyframe metadata on a second extraction', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'first' },
        keyframes: keyframeRow(asset.id, 2),
        lockedPropertiesBehavior: 'skip',
      });
      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'second' },
        keyframes: keyframeRow(asset.id, 1),
        lockedPropertiesBehavior: 'skip',
      });

      await expect(
        ctx.database.selectFrom('asset_keyframe').selectAll().where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual(keyframeRow(asset.id, 1));
    });

    // A probe that could not read a stream sends no object at all, and that must
    // not be read as "delete what is already known".
    it('should leave stored media metadata alone when an extraction omits it', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'first' },
        audio: audioRow(asset.id, 2),
        lockedPropertiesBehavior: 'skip',
      });
      await sut.upsertExif({
        exif: { assetId: asset.id, description: 'second' },
        lockedPropertiesBehavior: 'skip',
      });

      await expect(
        ctx.database.selectFrom('asset_audio').selectAll().where('assetId', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual(audioRow(asset.id, 2));
    });
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

  describe('createAll', () => {
    it('should return an empty array when given an empty input', async () => {
      const { sut } = setup();
      await expect(sut.createAll([])).resolves.toStrictEqual([]);
    });
  });
});
