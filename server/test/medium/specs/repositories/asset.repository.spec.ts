import { Kysely } from 'kysely';
import { AssetFileType, AssetOrder, AssetOrderBy, AssetVisibility } from 'src/enum.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

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

const newPersonAsset = async (
  ctx: ReturnType<typeof setup>['ctx'],
  { ownerId, personGroupId, localDateTime }: { ownerId: string; personGroupId: string; localDateTime: string },
) => {
  const { asset } = await ctx.newAsset({ ownerId, localDateTime });
  await Promise.all([
    ctx.newAssetFace({ assetId: asset.id, personGroupId }),
    ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` }),
  ]);
  return asset;
};

const newBirthdayPerson = async (ctx: ReturnType<typeof setup>['ctx']) => {
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
  return { user, person };
};

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

    it('should order assets by originalFileName when fileCreatedAt is the same (takenAt)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      // create all the fake photos
      const [
        { asset: time1DSC0001Asset },
        { asset: time1DSC0002Asset },
        { asset: time2DSC0003Asset },
        { asset: time2DSC0004Asset },
      ] = await Promise.all([
        // both at 12:30AM
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T00:30:00.000Z'),
          localDateTime: new Date('2026-03-09T00:30:00.000Z'),
          originalFileName: 'DSC0001.jpg',
        }),
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T00:30:00.000Z'),
          localDateTime: new Date('2026-03-09T00:30:00.000Z'),
          originalFileName: 'DSC0002.jpg',
        }),
        // both at 1:45AM
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T01:45:00.000Z'),
          localDateTime: new Date('2026-03-09T01:45:00.000Z'),
          originalFileName: 'DSC0003.jpg',
        }),
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T01:45:00.000Z'),
          localDateTime: new Date('2026-03-09T01:45:00.000Z'),
          originalFileName: 'DSC0004.jpg',
        }),
      ]);

      // even though im not gonna do anything with these it's required!
      await Promise.all([
        ctx.newExif({ assetId: time1DSC0001Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time1DSC0002Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time2DSC0003Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time2DSC0004Asset.id, timeZone: 'UTC+2' }),
      ]);

      // check the values given by the bucket when descending
      const descendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        {
          order: AssetOrder.Desc,
          userIds: [user.id],
          visibility: AssetVisibility.Timeline,
          orderBy: AssetOrderBy.TakenAt,
        },
        auth,
      );
      // make sure they're ordered correctly
      expect(JSON.parse(descendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [time2DSC0004Asset.id, time2DSC0003Asset.id, time1DSC0002Asset.id, time1DSC0001Asset.id],
        }),
      );

      // now do the same when ascending
      const ascendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        {
          order: AssetOrder.Asc,
          userIds: [user.id],
          visibility: AssetVisibility.Timeline,
          orderBy: AssetOrderBy.TakenAt,
        },
        auth,
      );
      expect(JSON.parse(ascendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [time1DSC0001Asset.id, time1DSC0002Asset.id, time2DSC0003Asset.id, time2DSC0004Asset.id],
        }),
      );
    });

    it('should order assets by originalFileName when fileCreatedAt is the same (createdAt)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      // create all the fake photos
      const [
        { asset: time1DSC0001Asset },
        { asset: time1DSC0002Asset },
        { asset: time2DSC0003Asset },
        { asset: time2DSC0004Asset },
      ] = await Promise.all([
        // createdAt = uploadedAt, fileCreatedAt = file metadata
        // both at 12:30AM
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T00:30:00.000Z'),
          localDateTime: new Date('2026-03-09T00:30:00.000Z'),
          createdAt: new Date('2026-03-09T00:30:00.000Z'),
          originalFileName: 'DSC0001.jpg',
        }),
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T00:30:00.000Z'),
          localDateTime: new Date('2026-03-09T00:30:00.000Z'),
          createdAt: new Date('2026-03-09T00:30:00.000Z'),
          originalFileName: 'DSC0002.jpg',
        }),
        // both at 1:45AM
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T01:45:00.000Z'),
          localDateTime: new Date('2026-03-09T01:45:00.000Z'),
          createdAt: new Date('2026-03-09T01:45:00.000Z'),
          originalFileName: 'DSC0003.jpg',
        }),
        ctx.newAsset({
          ownerId: user.id,
          fileCreatedAt: new Date('2026-03-09T01:45:00.000Z'),
          localDateTime: new Date('2026-03-09T01:45:00.000Z'),
          createdAt: new Date('2026-03-09T01:45:00.000Z'),
          originalFileName: 'DSC0004.jpg',
        }),
      ]);

      // even though im not gonna do anything with these it's required!
      await Promise.all([
        ctx.newExif({ assetId: time1DSC0001Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time1DSC0002Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time2DSC0003Asset.id, timeZone: 'UTC+2' }),
        ctx.newExif({ assetId: time2DSC0004Asset.id, timeZone: 'UTC+2' }),
      ]);

      // check the values given by the bucket when descending
      const descendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        {
          order: AssetOrder.Desc,
          userIds: [user.id],
          visibility: AssetVisibility.Timeline,
          orderBy: AssetOrderBy.CreatedAt,
        },
        auth,
      );
      // make sure they're ordered correctly
      expect(JSON.parse(descendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [time2DSC0004Asset.id, time2DSC0003Asset.id, time1DSC0002Asset.id, time1DSC0001Asset.id],
        }),
      );

      // now do the same when ascending
      const ascendingBucket = await sut.getTimeBucket(
        '2026-03-01',
        {
          order: AssetOrder.Asc,
          userIds: [user.id],
          visibility: AssetVisibility.Timeline,
          orderBy: AssetOrderBy.CreatedAt,
        },
        auth,
      );
      expect(JSON.parse(ascendingBucket.assets)).toEqual(
        expect.objectContaining({
          id: [time1DSC0001Asset.id, time1DSC0002Asset.id, time2DSC0003Asset.id, time2DSC0004Asset.id],
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

  describe('birthday assets', () => {
    const birthDate = { year: 1990, month: 6, day: 13 };
    const until = { year: 2025, month: 6, day: 13 };

    describe('getPersonBirthdayYears', () => {
      it('should return the distinct years with assets on the birthday, newest first', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personGroupId: person.personGroupId };
        await newPersonAsset(ctx, { ...args, localDateTime: '2020-06-13T10:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2022-06-13T08:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2022-06-13T09:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([2024, 2022, 2020]);
      });

      it('should ignore assets taken on other days', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personGroupId: person.personGroupId,
          localDateTime: '2024-06-14T12:00:00.000Z',
        });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets of other people', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { person: otherPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personGroupId: otherPerson.personGroupId,
          localDateTime: '2024-06-13T12:00:00.000Z',
        });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets without a preview file', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore trashed assets', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const asset = await newPersonAsset(ctx, {
          ownerId: user.id,
          personGroupId: person.personGroupId,
          localDateTime: '2024-06-13T12:00:00.000Z',
        });
        await ctx.softDeleteAsset(asset.id);

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets that are not timeline-visible', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({
          ownerId: user.id,
          localDateTime: '2024-06-13T12:00:00.000Z',
          visibility: AssetVisibility.Archive,
        });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets with a soft-deleted face', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId, deletedAt: new Date() });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets with an invisible face', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId, isVisible: false });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets taken before the person was born', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personGroupId: person.personGroupId,
          localDateTime: '1985-06-13T12:00:00.000Z',
        });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should include assets taken on the day of birth', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personGroupId: person.personGroupId,
          localDateTime: '1990-06-13T12:00:00.000Z',
        });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([1990]);
      });

      it('should ignore assets taken on or after the until date', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personGroupId: person.personGroupId };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T12:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2025-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.personGroupId, birthDate, until);

        expect(years).toEqual([2024]);
      });
    });

    describe('getPersonAssetsByDate', () => {
      it('should return the newest assets of the given date, newest first, up to the limit', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personGroupId: person.personGroupId };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T01:00:00.000Z' });
        const nextNewest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T02:00:00.000Z' });
        const newest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T03:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2023-06-13T01:00:00.000Z' });

        const assets = await sut.getPersonAssetsByDate(
          user.id,
          person.personGroupId,
          { year: 2024, month: 6, day: 13 },
          2,
        );

        expect(assets.map(({ id }) => id)).toEqual([newest2024.id, nextNewest2024.id]);
      });

      it('should return the single newest asset when the limit is 1', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personGroupId: person.personGroupId };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T01:00:00.000Z' });
        const newest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T02:00:00.000Z' });

        const assets = await sut.getPersonAssetsByDate(
          user.id,
          person.personGroupId,
          { year: 2024, month: 6, day: 13 },
          1,
        );

        expect(assets.map(({ id }) => id)).toEqual([newest2024.id]);
      });
    });
  });
});
