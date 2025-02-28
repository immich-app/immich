import { DateTime } from 'luxon';
import { MemoryService } from 'src/services/memory.service';
import { TestContext, TestFactory } from 'test/factory';
import { getKyselyDB, newTestService } from 'test/utils';

const setup = async () => {
  const db = await getKyselyDB();

  const context = await TestContext.from(db).withUser({ isAdmin: true }).create();
  const { sut } = newTestService(MemoryService, context);

  return { sut, context };
};

describe(MemoryService.name, () => {
  describe('onMemoryCreate', () => {
    it('should work on an empty database', async () => {
      const { sut } = await setup();
      await expect(sut.onMemoriesCreate()).resolves.not.toThrow();
    });

    it('should create a memory from an asset', async () => {
      const { sut, context } = await setup();

      const now = DateTime.fromObject({ year: 2025, month: 2, day: 25 }, { zone: 'utc' });
      const userDto = TestFactory.user();
      const assetDto = TestFactory.asset({ ownerId: userDto.id, localDateTime: now.minus({ years: 1 }).toISO() });

      await context
        .getFactory()
        .withAsset(assetDto)
        .withUser(userDto)
        .withOptions({
          assetFiles: true,
          assetJobStatus: true,
          assetExif: true,
        })
        .create();

      vi.setSystemTime(now.toJSDate());

      await sut.onMemoriesCreate();

      const memories = await context.memoryRepository.search(userDto.id, {});
      expect(memories.length).toBe(1);
      expect(memories[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Date),
          memoryAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
          ownerId: userDto.id,
          assets: expect.arrayContaining([expect.objectContaining({ id: assetDto.id })]),
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
      const { sut, context } = await setup();

      const now = DateTime.fromObject({ year: 2025, month: 2, day: 20 }, { zone: 'utc' });
      const userDto = TestFactory.user();

      await context
        .getFactory()
        .withAssets([
          {
            ownerId: userDto.id,
            localDateTime: now.minus({ year: 1 }).plus({ days: 3 }).toISO(),
          },
          {
            ownerId: userDto.id,
            localDateTime: now.minus({ year: 1 }).plus({ days: 4 }).toISO(),
          },
          {
            ownerId: userDto.id,
            localDateTime: now.minus({ year: 1 }).plus({ days: 5 }).toISO(),
          },
        ])
        .withUser(userDto)
        .withOptions({
          assetFiles: true,
          assetJobStatus: true,
          assetExif: true,
        })
        .create();

      vi.setSystemTime(now.toJSDate());

      await sut.onMemoriesCreate();

      const memories = await context.memoryRepository.search(userDto.id, {});
      expect(memories.length).toBe(1);

      await sut.onMemoriesCreate();
      const memoriesAfter = await context.memoryRepository.search(userDto.id, {});
      expect(memoriesAfter.length).toBe(1);
    });
  });

  describe('onMemoriesCleanup', () => {
    it('should run without error', async () => {
      const { sut } = await setup();
      await expect(sut.onMemoriesCleanup()).resolves.not.toThrow();
    });
  });
});
