import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { DB } from 'src/db';
import { AssetFileType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { MemoryService } from 'src/services/memory.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(MemoryService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      DatabaseRepository,
      MemoryRepository,
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
          { assetId: asset.id, type: AssetFileType.PREVIEW, path: '/path/to/preview.jpg' },
          { assetId: asset.id, type: AssetFileType.THUMBNAIL, path: '/path/to/thumbnail.jpg' },
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
      const { sut } = setup();
      await expect(sut.onMemoriesCleanup()).resolves.not.toThrow();
    });
  });
});
