import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { AssetFileType, MemoryType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { MemoryService } from 'src/services/memory.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(MemoryService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AssetRepository,
      ConfigRepository,
      DatabaseRepository,
      MemoryRepository,
      PersonRepository,
      UserRepository,
      SystemMetadataRepository,
      UserRepository,
      PartnerRepository,
    ],
    mock: [LoggingRepository],
  });
};

describe(MemoryService.name, () => {
  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('create', () => {
    it('should create a new memory', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const dto = {
        type: MemoryType.OnThisDay,
        data: { year: 2021 },
        memoryAt: new Date(2021),
      };

      await expect(sut.create(auth, dto)).resolves.toEqual({
        id: expect.any(String),
        type: dto.type,
        data: dto.data,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isSaved: false,
        memoryAt: dto.memoryAt,
        ownerId: user.id,
        assets: [],
      });
    });

    it('should create a new memory (with assets)', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      const auth = factory.auth({ user });
      const dto = {
        type: MemoryType.OnThisDay,
        data: { year: 2021 },
        memoryAt: new Date(2021),
        assetIds: [asset1.id, asset2.id],
      };

      await expect(sut.create(auth, dto)).resolves.toEqual(
        expect.objectContaining({
          id: expect.any(String),
          assets: [expect.objectContaining({ id: asset1.id }), expect.objectContaining({ id: asset2.id })],
        }),
      );
    });

    it('should create a new memory and ignore assets the user does not have access to', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user1.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
      const auth = factory.auth({ user: user1 });
      const dto = {
        type: MemoryType.OnThisDay,
        data: { year: 2021 },
        memoryAt: new Date(2021),
        assetIds: [asset1.id, asset2.id],
      };

      await expect(sut.create(auth, dto)).resolves.toEqual(
        expect.objectContaining({
          id: expect.any(String),
          assets: [expect.objectContaining({ id: asset1.id })],
        }),
      );
    });
  });

  describe('search', () => {
    it('should return memories containing assets visible through a shared space', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const { memory } = await ctx.newMemory({ ownerId: owner.id });
      await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });

      await expect(sut.search(factory.auth({ user: member }), {})).resolves.toEqual([
        expect.objectContaining({
          id: memory.id,
          assets: [expect.objectContaining({ id: asset.id })],
        }),
      ]);
    });
  });

  describe('onMemoryCreate', () => {
    it('should work on an empty database', async () => {
      const { sut } = setup();
      await expect(sut.onMemoriesCreate()).resolves.not.toThrow();
    });

    it('should create a memory from an asset', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 2, day: 25 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: now.minus({ years: 1 }).toISO() });
      await Promise.all([
        ctx.newExif({ assetId: asset.id, make: 'Canon' }),
        ctx.newJobStatus({ assetId: asset.id }),
        assetRepo.upsertFiles([
          { assetId: asset.id, type: AssetFileType.Preview, path: '/path/to/preview.jpg' },
          { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/path/to/thumbnail.jpg' },
        ]),
      ]);

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, {});
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Date),
          memoryAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
          ownerId: user.id,
          assets: expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
          isSaved: false,
          showAt: now.startOf('day').toJSDate(),
          hideAt: now.endOf('day').toJSDate(),
          seenAt: null,
          type: 'on_this_day',
          data: { year: 2024 },
        }),
      );
    });

    it('should create a memory from an asset - in advance', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2035, month: 2, day: 26 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: now.minus({ years: 1 }).toISO() });
      await Promise.all([
        ctx.newExif({ assetId: asset.id, make: 'Canon' }),
        ctx.newJobStatus({ assetId: asset.id }),
        assetRepo.upsertFiles([
          { assetId: asset.id, type: AssetFileType.Preview, path: '/path/to/preview.jpg' },
          { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/path/to/thumbnail.jpg' },
        ]),
      ]);

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, {});
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Date),
          memoryAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
          ownerId: user.id,
          assets: expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
          isSaved: false,
          showAt: now.startOf('day').toJSDate(),
          hideAt: now.endOf('day').toJSDate(),
          seenAt: null,
          type: 'on_this_day',
          data: { year: 2034 },
        }),
      );
    });

    it('should not generate a memory twice for the same day', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 2, day: 20 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      for (const dto of [
        {
          ownerId: user.id,
          localDateTime: now.minus({ year: 1 }).plus({ days: 3 }).toISO(),
        },
        {
          ownerId: user.id,
          localDateTime: now.minus({ year: 1 }).plus({ days: 4 }).toISO(),
        },
        {
          ownerId: user.id,
          localDateTime: now.minus({ year: 1 }).plus({ days: 5 }).toISO(),
        },
      ]) {
        const { asset } = await ctx.newAsset(dto);
        await Promise.all([
          ctx.newExif({ assetId: asset.id, make: 'Canon' }),
          ctx.newJobStatus({ assetId: asset.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: '/path/to/preview.jpg' },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/path/to/thumbnail.jpg' },
          ]),
        ]);
      }

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, {});
      expect(memories.length).toBe(1);

      await sut.onMemoriesCreate();

      const memoriesAfter = await memoryRepo.search(user.id, {});
      expect(memoriesAfter.length).toBe(1);
    });

    it('creates a birthday rule memory on the birthday itself', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Alice',
        birthDate: new Date('1990-04-23T00:00:00Z'),
      });

      const addBirthdayAsset = async (localDateTime: string) => {
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
        await Promise.all([
          ctx.newExif({ assetId: asset.id, city: 'Berlin', country: 'Germany' }),
          ctx.newJobStatus({ assetId: asset.id }),
          ctx.newAssetFace({ assetId: asset.id, personId: person.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
          ]),
        ]);
      };

      await addBirthdayAsset('2025-04-01T12:00:00Z');
      await addBirthdayAsset('2024-04-01T12:00:00Z');
      await addBirthdayAsset('2023-04-01T12:00:00Z');
      await addBirthdayAsset('2022-04-01T12:00:00Z');
      await addBirthdayAsset('2021-04-01T12:00:00Z');
      await addBirthdayAsset('2020-04-01T12:00:00Z');

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
      expect(memories).toEqual([
        expect.objectContaining({
          type: MemoryType.Rule,
          data: expect.objectContaining({
            ruleId: 'birthday',
            title: 'Happy birthday, Alice',
            subtitle: 'Photos from different years',
          }),
        }),
      ]);
    });

    it('creates a fallback birthday memory from four single-year Pierre photos', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2026, month: 4, day: 24 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Pierre',
        birthDate: new Date('2025-04-24T00:00:00Z'),
      });
      const pierreAssetIds: string[] = [];

      const addPierreAsset = async (localDateTime: string) => {
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
        pierreAssetIds.push(asset.id);
        await Promise.all([
          ctx.newExif({ assetId: asset.id, city: 'Berlin', country: 'Germany' }),
          ctx.newJobStatus({ assetId: asset.id }),
          ctx.newAssetFace({ assetId: asset.id, personId: person.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
          ]),
        ]);
      };

      await addPierreAsset('2026-04-18T15:25:07.335Z');
      await addPierreAsset('2026-04-18T15:25:08.244Z');
      await addPierreAsset('2026-04-18T15:25:09.803Z');
      await addPierreAsset('2026-04-18T15:25:11.543Z');

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
      expect(memories).toEqual([
        expect.objectContaining({
          type: MemoryType.Rule,
          data: expect.objectContaining({
            ruleId: 'birthday',
            title: 'Happy birthday, Pierre',
            subtitle: 'Recent photos of Pierre',
          }),
        }),
      ]);
      expect(memories[0]?.assets).toHaveLength(4);
      expect(memories[0]?.assets.map(({ id }) => id).toSorted()).toEqual([...pierreAssetIds].toSorted());
    });

    it('creates a recent-trip rule memory for a dense non-home cluster', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();

      const addTripAsset = async ({
        localDateTime,
        city,
        country,
      }: {
        localDateTime: string;
        city: string;
        country: string;
      }) => {
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
        await Promise.all([
          ctx.newExif({ assetId: asset.id, city, country }),
          ctx.newJobStatus({ assetId: asset.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
          ]),
        ]);
      };

      await addTripAsset({ localDateTime: '2026-01-15T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-01-22T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-02-01T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-02-10T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-02-18T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-03-01T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-03-12T12:00:00Z', city: 'Berlin', country: 'Germany' });
      await addTripAsset({ localDateTime: '2026-04-15T10:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-15T18:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-16T10:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-16T18:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-17T10:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-17T18:00:00Z', city: 'Paris', country: 'France' });
      await addTripAsset({ localDateTime: '2026-04-18T10:00:00Z', city: 'Paris', country: 'France' });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
      expect(memories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: MemoryType.Rule,
            data: expect.objectContaining({
              ruleId: 'recent_trip',
              title: 'Recent trip to Paris, France',
            }),
          }),
        ]),
      );
    });

    it('reads back curated recent-trip assets in chronological localDateTime order', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();

      const addTripAsset = async ({
        localDateTime,
        fileCreatedAt,
        city,
        country,
      }: {
        localDateTime: string;
        fileCreatedAt: string;
        city: string;
        country: string;
      }) => {
        const { asset } = await ctx.newAsset({
          ownerId: user.id,
          localDateTime: new Date(localDateTime),
          fileCreatedAt: new Date(fileCreatedAt),
        });
        await Promise.all([
          ctx.newExif({ assetId: asset.id, city, country }),
          ctx.newJobStatus({ assetId: asset.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
          ]),
        ]);
        return asset.id;
      };

      await addTripAsset({
        localDateTime: '2026-01-15T12:00:00Z',
        fileCreatedAt: '2026-01-15T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-01-22T12:00:00Z',
        fileCreatedAt: '2026-01-22T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-02-01T12:00:00Z',
        fileCreatedAt: '2026-02-01T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-02-10T12:00:00Z',
        fileCreatedAt: '2026-02-10T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-02-18T12:00:00Z',
        fileCreatedAt: '2026-02-18T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-03-01T12:00:00Z',
        fileCreatedAt: '2026-03-01T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });
      await addTripAsset({
        localDateTime: '2026-03-12T12:00:00Z',
        fileCreatedAt: '2026-03-12T12:00:00Z',
        city: 'Berlin',
        country: 'Germany',
      });

      const expectedTripIds = [
        await addTripAsset({
          localDateTime: '2026-04-15T10:00:00Z',
          fileCreatedAt: '2026-04-16T20:00:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-15T10:01:00Z',
          fileCreatedAt: '2026-04-16T19:59:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-15T12:00:00Z',
          fileCreatedAt: '2026-04-16T19:58:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-15T12:01:00Z',
          fileCreatedAt: '2026-04-16T19:57:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-15T16:00:00Z',
          fileCreatedAt: '2026-04-16T19:56:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-16T09:00:00Z',
          fileCreatedAt: '2026-04-16T19:55:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-16T09:01:00Z',
          fileCreatedAt: '2026-04-16T19:54:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-16T13:00:00Z',
          fileCreatedAt: '2026-04-16T19:53:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-16T17:00:00Z',
          fileCreatedAt: '2026-04-16T19:52:00Z',
          city: 'Paris',
          country: 'France',
        }),
        await addTripAsset({
          localDateTime: '2026-04-16T20:00:00Z',
          fileCreatedAt: '2026-04-16T19:51:00Z',
          city: 'Paris',
          country: 'France',
        }),
      ];

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const [memory] = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
      expect(memory?.data).toMatchObject({
        ruleId: 'recent_trip',
        title: 'Recent trip to Paris, France',
      });
      expect(memory?.assets).toHaveLength(7);
      expect(memory?.assets.map(({ id }) => id)).toEqual([
        expectedTripIds[0],
        expectedTripIds[2],
        expectedTripIds[4],
        expectedTripIds[5],
        expectedTripIds[7],
        expectedTripIds[8],
        expectedTripIds[9],
      ]);
      expect(memory?.assets.map(({ localDateTime }) => new Date(localDateTime).toISOString())).toEqual([
        '2026-04-15T10:00:00.000Z',
        '2026-04-15T12:00:00.000Z',
        '2026-04-15T16:00:00.000Z',
        '2026-04-16T09:00:00.000Z',
        '2026-04-16T13:00:00.000Z',
        '2026-04-16T17:00:00.000Z',
        '2026-04-16T20:00:00.000Z',
      ]);
    });

    it('does not create a recent-trip rule memory for weak signals', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();

      const addWeakAsset = async (localDateTime: string, city: string, country: string) => {
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
        await Promise.all([
          ctx.newExif({ assetId: asset.id, city, country }),
          ctx.newJobStatus({ assetId: asset.id }),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
            { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
          ]),
        ]);
      };

      await addWeakAsset('2026-02-01T12:00:00Z', 'Berlin', 'Germany');
      await addWeakAsset('2026-03-01T12:00:00Z', 'Berlin', 'Germany');
      await addWeakAsset('2026-04-15T10:00:00Z', 'Paris', 'France');
      await addWeakAsset('2026-04-15T18:00:00Z', 'Paris', 'France');
      await addWeakAsset('2026-04-16T10:00:00Z', 'Paris', 'France');

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
      expect(memories).toEqual([]);
    });
  });

  describe('onMemoriesCleanup', () => {
    it('should run without error', async () => {
      const { sut } = setup();
      await expect(sut.onMemoriesCleanup()).resolves.not.toThrow();
    });
  });
});
