import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AssetFileType, MemoryType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
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
      DatabaseRepository,
      MemoryRepository,
      UserRepository,
      SystemMetadataRepository,
      UserRepository,
      PartnerRepository,
      PersonRepository,
    ],
    mock: [LoggingRepository],
  });
};

const create = async (ctx: ReturnType<typeof setup>['ctx']) => {
  const { user } = await ctx.newUser();
  const { memory } = await ctx.newMemory({ ownerId: user.id });
  const { asset } = await ctx.newAsset({ ownerId: user.id });

  return { memory, asset, user };
};

const newPersonAsset = async (
  ctx: ReturnType<typeof setup>['ctx'],
  { ownerId, personId, localDateTime }: { ownerId: string; personId: string; localDateTime?: string },
) => {
  const assetRepo = ctx.get(AssetRepository);
  const { asset } = await ctx.newAsset({ ownerId, localDateTime: localDateTime ?? '2024-06-13T12:00:00.000Z' });
  await Promise.all([
    ctx.newExif({ assetId: asset.id, make: 'Canon' }),
    ctx.newJobStatus({ assetId: asset.id }),
    ctx.newAssetFace({ assetId: asset.id, personId }),
    assetRepo.upsertFiles([
      { assetId: asset.id, type: AssetFileType.Preview, path: '/path/to/preview.jpg' },
      { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/path/to/thumbnail.jpg' },
    ]),
  ]);
  return asset;
};

describe(MemoryService.name, () => {
  describe('get', () => {
    it('should return the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, user } = await create(ctx);
      const auth = factory.auth({ user });

      await expect(sut.get(auth, memory.id)).resolves.toEqual(expect.objectContaining({ id: memory.id }));
    });

    it('should not return a memory of another user', async () => {
      const { sut, ctx } = setup();
      const { memory } = await create(ctx);
      const { user: otherUser } = await ctx.newUser();
      const otherAuth = factory.auth({ user: otherUser });

      await expect(sut.get(otherAuth, memory.id)).rejects.toThrow('Not found or no memory.read access');
    });
  });

  describe('update', () => {
    it('should update the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, user } = await create(ctx);
      const auth = factory.auth({ user });

      await expect(sut.get(auth, memory.id)).resolves.toEqual(expect.objectContaining({ isSaved: false }));
      await expect(sut.update(auth, memory.id, { isSaved: true })).resolves.toEqual(
        expect.objectContaining({ id: memory.id, isSaved: true }),
      );
    });

    it('should not update a memory of another user', async () => {
      const { sut, ctx } = setup();
      const { memory } = await create(ctx);
      const { user: otherUser } = await ctx.newUser();
      const otherAuth = factory.auth({ user: otherUser });

      await expect(sut.update(otherAuth, memory.id, { isSaved: true })).rejects.toThrow(
        'Not found or no memory.update access',
      );
    });
  });

  describe('remove', () => {
    it('should remove the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, user } = await create(ctx);
      const auth = factory.auth({ user });

      await expect(sut.remove(auth, memory.id)).resolves.toBeUndefined();
      await expect(sut.get(auth, memory.id)).rejects.toThrow('Not found or no memory.read access');
    });

    it('should not remove a memory of another user', async () => {
      const { sut, ctx } = setup();
      const { memory, user } = await create(ctx);
      const auth = factory.auth({ user });
      const { user: otherUser } = await ctx.newUser();
      const otherAuth = factory.auth({ user: otherUser });

      await expect(sut.remove(otherAuth, memory.id)).rejects.toThrow('Not found or no memory.delete access');
      await expect(sut.get(auth, memory.id)).resolves.toEqual(expect.objectContaining({ id: memory.id }));
    });
  });

  describe('addAssets', () => {
    it('should add assets to the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, asset, user } = await create(ctx);
      const auth = factory.auth({ user });

      await expect(sut.addAssets(auth, memory.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: true },
      ]);
    });

    it('should require access to the asset', async () => {
      const { sut, ctx } = setup();
      const { memory, user } = await create(ctx);
      const auth = factory.auth({ user });
      const { user: other } = await ctx.newUser();
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: other.id });

      await expect(sut.addAssets(auth, memory.id, { ids: [otherAsset.id] })).resolves.toEqual([
        { id: otherAsset.id, success: false, error: BulkIdErrorReason.NO_PERMISSION },
      ]);
    });

    it('should not add assets to a memory of another user', async () => {
      const { sut, ctx } = setup();
      const { memory, asset } = await create(ctx);
      const { user: otherUser } = await ctx.newUser();
      const otherAuth = factory.auth({ user: otherUser });

      await expect(sut.addAssets(otherAuth, memory.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no memory.read access',
      );
    });
  });

  describe('removeAssets', () => {
    it('should remove assets from the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, asset, user } = await create(ctx);
      const auth = factory.auth({ user });
      await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });

      await expect(sut.removeAssets(auth, memory.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: true },
      ]);
    });

    it('should only remove assets that are in the memory', async () => {
      const { sut, ctx } = setup();
      const { memory, asset, user } = await create(ctx);
      const auth = factory.auth({ user });

      await expect(sut.removeAssets(auth, memory.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);
    });

    it('should not remove assets from a memory of another user', async () => {
      const { sut, ctx } = setup();
      const { memory, asset } = await create(ctx);
      const { user: otherUser } = await ctx.newUser();
      const otherAuth = factory.auth({ user: otherUser });
      await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });

      await expect(sut.removeAssets(otherAuth, memory.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no memory.update access',
      );
    });
  });

  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  afterEach(async () => {
    await defaultDatabase.destroy();
  });

  describe('create', () => {
    it('should create a new memory', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const dto = {
        type: MemoryType.OnThisDay as const,
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
        type: MemoryType.OnThisDay as const,
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

    it('should create a new birthday memory', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      const auth = factory.auth({ user });
      const dto = {
        type: MemoryType.Birthday as const,
        data: { personId: person.id, personName: 'Alice', year: 1990 },
        memoryAt: new Date(2025, 5, 13),
      };

      await expect(sut.create(auth, dto)).resolves.toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: MemoryType.Birthday,
          data: dto.data,
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
        type: MemoryType.OnThisDay as const,
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
  });

  describe('onMemoryCreate (birthday)', () => {
    it('should create a memory for the 3 days leading up to a birthday', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const birthday = DateTime.fromObject({ year: 2025, month: 6, day: 13 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      const asset = await newPersonAsset(ctx, { ownerId: user.id, personId: person.id });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          ownerId: user.id,
          type: 'birthday',
          data: { personId: person.id, personName: 'Alice', year: 1990 },
          memoryAt: birthday.startOf('day').toJSDate(),
          showAt: birthday.minus({ days: 3 }).startOf('day').toJSDate(),
          hideAt: birthday.endOf('day').toJSDate(),
          assets: [expect.objectContaining({ id: asset.id })],
        }),
      );
    });

    it('should create a memory on the birthday itself', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 13 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          showAt: now.minus({ days: 3 }).startOf('day').toJSDate(),
          hideAt: now.endOf('day').toJSDate(),
        }),
      );
    });

    it('should not create a birthday memory twice for the same birthday', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
    });

    it('should not create a birthday memory for a hidden person', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Alice',
        birthDate: '1990-06-13',
        isHidden: true,
      });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(0);
    });

    it('should not create a birthday memory for an unnamed person', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: '', birthDate: '1990-06-13' });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(0);
    });

    it('should only include assets taken on the birthday itself', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      const onBirthday = await newPersonAsset(ctx, {
        ownerId: user.id,
        personId: person.id,
        localDateTime: '2024-06-13T12:00:00.000Z',
      });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '2024-06-12T12:00:00.000Z' });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      expect(memories[0].assets.map(({ id }) => id)).toEqual([onBirthday.id]);
    });

    it('should not create a birthday memory for a person without any assets', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(0);
    });

    it('should include at most 5 assets from a single year, newest first', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });

      const assetIds: string[] = [];
      for (let hour = 1; hour <= 7; hour++) {
        const asset = await newPersonAsset(ctx, {
          ownerId: user.id,
          personId: person.id,
          localDateTime: `2024-06-13T${hour.toString().padStart(2, '0')}:00:00.000Z`,
        });
        assetIds.push(asset.id);
      }

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      const memoryAssetIds = memories[0].assets.map(({ id }) => id).sort();
      expect(memoryAssetIds).toEqual(assetIds.slice(-5).sort());
    });

    it('should split the asset budget evenly across years, keeping the newest assets of each year', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });

      const assetIdsByYear: Record<number, string[]> = {};
      for (let year = 2019; year <= 2024; year++) {
        assetIdsByYear[year] = [];
        for (let hour = 1; hour <= 5; hour++) {
          const asset = await newPersonAsset(ctx, {
            ownerId: user.id,
            personId: person.id,
            localDateTime: `${year}-06-13T${hour.toString().padStart(2, '0')}:00:00.000Z`,
          });
          assetIdsByYear[year].push(asset.id);
        }
      }

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      // 6 birthdays share the budget of 25 assets, so each birthday includes its 4 newest assets
      expect(memories[0].assets.length).toBe(24);
      const memoryAssetIds = new Set(memories[0].assets.map(({ id }) => id));
      for (let year = 2019; year <= 2024; year++) {
        const [oldest, ...newest] = assetIdsByYear[year];
        for (const assetId of newest) {
          expect(memoryAssetIds.has(assetId)).toBe(true);
        }
        expect(memoryAssetIds.has(oldest)).toBe(false);
      }
    });

    it('should include one asset from each of 25 random birthdays when there are more than 25', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });

      for (let year = 1997; year <= 2024; year++) {
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personId: person.id,
          localDateTime: `${year}-06-13T12:00:00.000Z`,
        });
        await newPersonAsset(ctx, {
          ownerId: user.id,
          personId: person.id,
          localDateTime: `${year}-06-13T08:00:00.000Z`,
        });
      }

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      // 28 birthdays exist, so 25 of them are sampled with one asset each
      expect(memories[0].assets.length).toBe(25);
      const years = new Set(memories[0].assets.map(({ localDateTime }) => new Date(localDateTime).getUTCFullYear()));
      expect(years.size).toBe(25);
    });

    it('should celebrate a leap-day birthday on February 28th in non-leap years', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 2, day: 25 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '2024-02-29T12:00:00.000Z' });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          data: { personId: person.id, personName: 'Alice', year: 1992 },
          memoryAt: DateTime.fromObject({ year: 2025, month: 2, day: 28 }, { zone: 'utc' }).toJSDate(),
        }),
      );
    });

    it('should not create a birthday memory when the birthday is more than 3 days away', async () => {
      const { sut, ctx } = setup();
      const memoryRepo = ctx.get(MemoryRepository);
      const now = DateTime.fromObject({ year: 2025, month: 6, day: 10 }, { zone: 'utc' }) as DateTime<true>;
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-20' });
      await newPersonAsset(ctx, { ownerId: user.id, personId: person.id, localDateTime: '2024-06-20T12:00:00.000Z' });

      vi.setSystemTime(now.toJSDate());
      await sut.onMemoriesCreate();

      const memories = await memoryRepo.search(user.id, { type: MemoryType.Birthday });
      expect(memories.length).toBe(0);
    });
  });

  describe('onMemoriesCleanup', () => {
    it('should run without error', async () => {
      const { sut } = setup();
      await expect(sut.onMemoriesCleanup()).resolves.not.toThrow();
    });
  });
});
