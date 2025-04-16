import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { DB } from 'src/db';
import { AssetFileType } from 'src/enum';
import { UserRepository } from 'src/repositories/user.repository';
import { MemoryService } from 'src/services/memory.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

describe(MemoryService.name, () => {
  let defaultDatabase: Kysely<DB>;

  const createSut = (db?: Kysely<DB>) => {
    return newMediumService(MemoryService, {
      database: db || defaultDatabase,
      repos: {
        asset: 'real',
        memory: 'real',
        user: 'real',
        systemMetadata: 'real',
        partner: 'real',
      },
    });
  };

  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
    const userRepo = new UserRepository(defaultDatabase);
    const admin = mediumFactory.userInsert({ isAdmin: true });
    await userRepo.create(admin);
  });

  describe('onMemoryCreate', () => {
    it('should work on an empty database', async () => {
      const { sut } = createSut();
      await expect(sut.onMemoriesCreate()).resolves.not.toThrow();
    });

    it('should create a memory from an asset', async () => {
      const { sut, repos, getRepository } = createSut();

      const now = DateTime.fromObject({ year: 2025, month: 2, day: 25 }, { zone: 'utc' });
      const user = mediumFactory.userInsert();
      const asset = mediumFactory.assetInsert({ ownerId: user.id, localDateTime: now.minus({ years: 1 }).toISO() });
      const jobStatus = mediumFactory.assetJobStatusInsert({ assetId: asset.id });

      const userRepo = getRepository('user');
      const assetRepo = getRepository('asset');

      await userRepo.create(user);
      await assetRepo.create(asset);
      await Promise.all([
        assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' }),
        assetRepo.upsertFiles([
          { assetId: asset.id, type: AssetFileType.PREVIEW, path: '/path/to/preview.jpg' },
          { assetId: asset.id, type: AssetFileType.THUMBNAIL, path: '/path/to/thumbnail.jpg' },
        ]),
        assetRepo.upsertJobStatus(jobStatus),
      ]);

      vi.setSystemTime(now.toJSDate());

      await sut.onMemoriesCreate();

      const memories = await repos.memory.search(user.id, {});
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

    it('should not generate a memory twice for the same day', async () => {
      const { sut, repos, getRepository } = createSut();

      const now = DateTime.fromObject({ year: 2025, month: 2, day: 20 }, { zone: 'utc' });

      const assetRepo = getRepository('asset');
      const memoryRepo = getRepository('memory');

      const user = mediumFactory.userInsert();
      await repos.user.create(user);

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
        const asset = mediumFactory.assetInsert(dto);
        await assetRepo.create(asset);
        await Promise.all([
          assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' }),
          assetRepo.upsertJobStatus(mediumFactory.assetJobStatusInsert({ assetId: asset.id })),
          assetRepo.upsertFiles([
            { assetId: asset.id, type: AssetFileType.PREVIEW, path: '/path/to/preview.jpg' },
            { assetId: asset.id, type: AssetFileType.THUMBNAIL, path: '/path/to/thumbnail.jpg' },
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

  describe('onMemoriesCleanup', () => {
    it('should run without error', async () => {
      const { sut } = createSut();
      await expect(sut.onMemoriesCleanup()).resolves.not.toThrow();
    });
  });
});
