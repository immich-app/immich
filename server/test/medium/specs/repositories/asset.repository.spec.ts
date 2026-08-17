import { Kysely } from 'kysely';
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

const newPersonAsset = async (
  ctx: ReturnType<typeof setup>['ctx'],
  { ownerId, personId, localDateTime }: { ownerId: string; personId: string; localDateTime: string },
) => {
  const { asset } = await ctx.newAsset({ ownerId, localDateTime });
  await Promise.all([
    ctx.newAssetFace({ assetId: asset.id, personId }),
    ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` }),
  ]);
  return asset;
};

const newBirthdayPerson = async (ctx: ReturnType<typeof setup>['ctx']) => {
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
  return { user, person };
};

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

  describe('birthday assets', () => {
    const birthDate = { year: 1990, month: 6, day: 13 };
    const until = { year: 2025, month: 6, day: 13 };

    describe('getPersonBirthdayYears', () => {
      it('should return the distinct years with assets on the birthday, newest first', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personId: person.id };
        await newPersonAsset(ctx, { ...args, localDateTime: '2020-06-13T10:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2022-06-13T08:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2022-06-13T09:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([2024, 2022, 2020]);
      });

      it('should ignore assets taken on other days', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '2024-06-14T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets of other people', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { person: otherPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personId: otherPerson.id,
          localDateTime: '2024-06-13T12:00:00.000Z',
        });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets without a preview file', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore trashed assets', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const asset = await newPersonAsset(ctx, {
          ownerId: user.id,
          personId: person.id,
          localDateTime: '2024-06-13T12:00:00.000Z',
        });
        await ctx.softDeleteAsset(asset.id);

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

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
        await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets with a soft-deleted face', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personId: person.id, deletedAt: new Date() });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets with an invisible face', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2024-06-13T12:00:00.000Z' });
        await ctx.newAssetFace({ assetId: asset.id, personId: person.id, isVisible: false });
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: `/preview/${asset.id}.jpg` });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should ignore assets taken before the person was born', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '1985-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([]);
      });

      it('should include assets taken on the day of birth', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '1990-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([1990]);
      });

      it('should ignore assets taken on or after the until date', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personId: person.id };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T12:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2025-06-13T12:00:00.000Z' });

        const years = await sut.getPersonBirthdayYears(user.id, person.id, birthDate, until);

        expect(years).toEqual([2024]);
      });
    });

    describe('getPersonAssetsByDate', () => {
      it('should return the newest assets of the given date, newest first, up to the limit', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personId: person.id };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T01:00:00.000Z' });
        const nextNewest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T02:00:00.000Z' });
        const newest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T03:00:00.000Z' });
        await newPersonAsset(ctx, { ...args, localDateTime: '2023-06-13T01:00:00.000Z' });

        const assets = await sut.getPersonAssetsByDate(user.id, person.id, { year: 2024, month: 6, day: 13 }, 2);

        expect(assets.map(({ id }) => id)).toEqual([newest2024.id, nextNewest2024.id]);
      });

      it('should return the single newest asset when the limit is 1', async () => {
        const { ctx, sut } = setup();
        const { user, person } = await newBirthdayPerson(ctx);
        const args = { ownerId: user.id, personId: person.id };
        await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T01:00:00.000Z' });
        const newest2024 = await newPersonAsset(ctx, { ...args, localDateTime: '2024-06-13T02:00:00.000Z' });

        const assets = await sut.getPersonAssetsByDate(user.id, person.id, { year: 2024, month: 6, day: 13 }, 1);

        expect(assets.map(({ id }) => id)).toEqual([newest2024.id]);
      });
    });
  });
});
