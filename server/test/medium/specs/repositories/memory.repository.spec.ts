import { Kysely } from 'kysely';
import { AssetFileType, AssetVisibility } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MemoryRepository } from 'src/repositories/memory.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(MemoryRepository) };
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

describe(MemoryRepository.name, () => {
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
