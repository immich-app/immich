import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { defaults } from 'src/config';
import { MemoryType, SystemMetadataKey } from 'src/enum';
import { MemoryService } from 'src/services/memory.service';
import { OnThisDayData, RuleMemoryData } from 'src/types';
import { AssetFactory } from 'test/factories/asset.factory';
import { MemoryFactory } from 'test/factories/memory.factory';
import { getForMemory } from 'test/mappers';
import { factory, newUuid, newUuids } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MemoryService.name, () => {
  let sut: MemoryService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MemoryService));
    mocks.memory.search.mockResolvedValue([]);
    mocks.memory.searchAccessible.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('onMemoryCleanup', () => {
    it('should clean up memories using configured retention days', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ memories: { retentionDays: 0 } });
      mocks.memory.cleanup.mockResolvedValue([]);

      await sut.onMemoriesCleanup();

      expect(mocks.memory.cleanup).toHaveBeenCalledWith(0);
    });

    it('should clean up memories using default retention days', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      mocks.memory.cleanup.mockResolvedValue([]);

      await sut.onMemoriesCleanup();

      expect(mocks.memory.cleanup).toHaveBeenCalledWith(defaults.memories.retentionDays);
    });
  });

  describe('onMemoriesCreate', () => {
    it('should generate memories for all users', async () => {
      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      await sut.onMemoriesCreate();

      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
    });

    it('should skip dates that have already been processed', async () => {
      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      // Set lastOnThisDayDate to far in the future so all dates are skipped
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await sut.onMemoriesCreate();

      // Should not create any memories since all dates were already processed
      expect(mocks.asset.getByDayOfYear).not.toHaveBeenCalled();
    });

    it('should create on-this-day memories when assets exist', async () => {
      const user = factory.userAdmin();
      const asset = AssetFactory.create({ ownerId: user.id });
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockResolvedValue([{ year: 2023, assets: [asset] }] as any);
      mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

      await sut.onMemoriesCreate();

      expect(mocks.memory.create).toHaveBeenCalled();
    });

    it('should handle errors during memory creation gracefully', async () => {
      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockRejectedValue(new Error('Database error'));

      // Should not throw; errors are caught internally
      await sut.onMemoriesCreate();

      // Should still update system metadata even on error
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
    });

    it('should generate birthday rule memories only for the current day and persist lastRuleDate', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.person.getBirthdaysForDay.mockResolvedValue([
        { id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-23T00:00:00Z') },
      ]);
      mocks.asset.getMemoryAssetsForPerson.mockResolvedValue([
        { id: 'a-2025-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2024-1', localDateTime: new Date('2024-04-01T12:00:00Z') },
        { id: 'a-2023-1', localDateTime: new Date('2023-04-01T12:00:00Z') },
        { id: 'a-2022-1', localDateTime: new Date('2022-04-01T12:00:00Z') },
        { id: 'a-2021-1', localDateTime: new Date('2021-04-01T12:00:00Z') },
        { id: 'a-2020-1', localDateTime: new Date('2020-04-01T12:00:00Z') },
      ]);
      mocks.memory.hasRuleMemory.mockResolvedValue(false);
      mocks.memory.create.mockResolvedValue(
        MemoryFactory.create({
          ownerId: user.id,
          type: MemoryType.Rule,
          data: {
            ruleId: 'birthday',
            dedupeKey: 'birthday:person-1:2026-04-23',
            title: 'Happy birthday, Alice',
            subtitle: 'Photos from different years',
          },
        }) as any,
      );

      await sut.onMemoriesCreate();

      expect(mocks.person.getBirthdaysForDay).toHaveBeenCalledTimes(1);
      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: user.id,
          type: MemoryType.Rule,
          data: expect.objectContaining({
            ruleId: 'birthday',
            title: 'Happy birthday, Alice',
          }),
        }),
        new Set(['a-2025-1', 'a-2024-1', 'a-2023-1', 'a-2022-1', 'a-2021-1', 'a-2020-1']),
      );
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.MemoriesState,
        expect.objectContaining({ lastRuleDate: '2026-04-23T00:00:00.000Z' }),
      );

      vi.useRealTimers();
    });

    it('should skip birthday rule memories when birthday memories are disabled', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockImplementation((key) =>
        Promise.resolve(
          key === SystemMetadataKey.SystemConfig
            ? { memories: { birthday: false, recentTrips: true } }
            : {
                lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
                lastRuleDate: '2026-04-22T00:00:00.000Z',
              },
        ),
      );
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.asset.getMemoryLocationClusters.mockResolvedValue([]);

      await sut.onMemoriesCreate();

      expect(mocks.person.getBirthdaysForDay).not.toHaveBeenCalled();
      expect(mocks.asset.getMemoryLocationClusters).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should skip recent trip rule memories when recent trip memories are disabled', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockImplementation((key) =>
        Promise.resolve(
          key === SystemMetadataKey.SystemConfig
            ? { memories: { birthday: true, recentTrips: false } }
            : {
                lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
                lastRuleDate: '2026-04-22T00:00:00.000Z',
              },
        ),
      );
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.person.getBirthdaysForDay.mockResolvedValue([]);

      await sut.onMemoriesCreate();

      expect(mocks.person.getBirthdaysForDay).toHaveBeenCalled();
      expect(mocks.asset.getMemoryLocationClusters).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not create rule memories when all generated memory rules are disabled', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockImplementation((key) =>
        Promise.resolve(
          key === SystemMetadataKey.SystemConfig
            ? { memories: { birthday: false, recentTrips: false } }
            : {
                lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
                lastRuleDate: '2026-04-22T00:00:00.000Z',
              },
        ),
      );
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      await sut.onMemoriesCreate();

      expect(mocks.person.getBirthdaysForDay).not.toHaveBeenCalled();
      expect(mocks.asset.getMemoryLocationClusters).not.toHaveBeenCalled();
      expect(mocks.memory.create).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should only evaluate rules through today, not future precompute dates', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
        lastRuleDate: '2026-04-20T00:00:00.000Z',
      });
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      const birthdayRule = { id: 'birthday', evaluate: vi.fn().mockResolvedValue([]) };
      vi.spyOn(sut as never, 'getMemoryRules').mockReturnValue([birthdayRule] as never);

      await sut.onMemoriesCreate();

      expect(birthdayRule.evaluate.mock.calls.map(([input]) => input.target.toISODate())).toEqual([
        '2026-04-21',
        '2026-04-22',
        '2026-04-23',
      ]);

      vi.useRealTimers();
    });

    it('should keep only the top two surviving rule candidates after dedupe and fail soft', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
        lastRuleDate: '2026-04-22T00:00:00.000Z',
      });
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.memory.hasRuleMemory.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

      const failingRule = { id: 'broken', evaluate: vi.fn().mockRejectedValue(new Error('boom')) };
      const scoringRule = {
        id: 'scoring',
        evaluate: vi.fn().mockResolvedValue([
          {
            ruleId: 'birthday',
            dedupeKey: 'k-1',
            title: 'First',
            score: 100,
            assetIds: ['asset-1'],
            memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
          },
          {
            ruleId: 'birthday',
            dedupeKey: 'k-2',
            title: 'Second',
            score: 90,
            assetIds: ['asset-2'],
            memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
          },
          {
            ruleId: 'birthday',
            dedupeKey: 'k-3',
            title: 'Third',
            score: 10,
            assetIds: ['asset-3'],
            memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
          },
        ]),
      };

      vi.spyOn(sut as never, 'getMemoryRules').mockReturnValue([failingRule, scoringRule] as never);

      await sut.onMemoriesCreate();

      expect(mocks.memory.create).toHaveBeenCalledTimes(2);
      expect(mocks.memory.hasRuleMemory.mock.calls).toEqual([
        [user.id, 'birthday', 'k-1'],
        [user.id, 'birthday', 'k-2'],
        [user.id, 'birthday', 'k-3'],
      ]);
      expect(mocks.memory.create.mock.calls[0]?.[0].data).toMatchObject({ title: 'First', dedupeKey: 'k-1' });
      expect(mocks.memory.create.mock.calls[1]?.[0].data).toMatchObject({ title: 'Third', dedupeKey: 'k-3' });

      vi.useRealTimers();
    });

    it('should respect the daily rule cap across reruns when a rule memory already exists', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
        lastRuleDate: '2026-04-22T00:00:00.000Z',
      });
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.memory.search.mockResolvedValue([
        getForMemory(
          MemoryFactory.create({
            ownerId: user.id,
            type: MemoryType.Rule,
            memoryAt: new Date('2026-04-23T00:00:00Z'),
            data: {
              ruleId: 'birthday',
              dedupeKey: 'existing',
              title: 'Existing',
            } satisfies RuleMemoryData,
          }),
        ),
      ]);
      mocks.memory.hasRuleMemory.mockResolvedValue(false);
      mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

      const scoringRule = {
        id: 'scoring',
        evaluate: vi.fn().mockResolvedValue([
          {
            ruleId: 'birthday',
            dedupeKey: 'k-1',
            title: 'First',
            score: 100,
            assetIds: ['asset-1'],
            memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
          },
          {
            ruleId: 'birthday',
            dedupeKey: 'k-2',
            title: 'Second',
            score: 90,
            assetIds: ['asset-2'],
            memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
          },
        ]),
      };

      vi.spyOn(sut as never, 'getMemoryRules').mockReturnValue([scoringRule] as never);

      await sut.onMemoriesCreate();

      expect(mocks.memory.search).toHaveBeenCalledWith(user.id, {
        type: MemoryType.Rule,
        for: new Date('2026-04-23T00:00:00Z'),
      });
      expect(mocks.memory.create).toHaveBeenCalledTimes(1);
      expect(mocks.memory.create.mock.calls[0]?.[0].data).toMatchObject({ title: 'First', dedupeKey: 'k-1' });

      vi.useRealTimers();
    });

    it('prefers a fallback birthday candidate over recent trip when only one rule slot remains', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-24T12:00:00Z'));

      const user = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: '2026-04-26T00:00:00.000Z',
        lastRuleDate: '2026-04-23T00:00:00.000Z',
      });
      mocks.asset.getByDayOfYear.mockResolvedValue([]);
      mocks.memory.search.mockResolvedValue([
        getForMemory(
          MemoryFactory.create({
            ownerId: user.id,
            type: MemoryType.Rule,
            memoryAt: new Date('2026-04-24T00:00:00Z'),
            data: {
              ruleId: 'existing',
              dedupeKey: 'existing',
              title: 'Existing',
            } satisfies RuleMemoryData,
          }),
        ),
      ]);
      mocks.memory.hasRuleMemory.mockResolvedValue(false);
      mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

      const birthdayRule = {
        id: 'birthday',
        evaluate: vi.fn().mockResolvedValue([
          {
            ruleId: 'birthday',
            dedupeKey: 'birthday:person-1:2026-04-24',
            title: 'Happy birthday, Pierre',
            subtitle: 'Recent photos of Pierre',
            score: 254,
            assetIds: ['a-1', 'a-2', 'a-3', 'a-4'],
            memoryAt: DateTime.fromISO('2026-04-24T00:00:00Z'),
          },
        ]),
      };
      const recentTripRule = {
        id: 'recent_trip',
        evaluate: vi.fn().mockResolvedValue([
          {
            ruleId: 'recent_trip',
            dedupeKey: 'recent_trip:germany:nurnberg:2026-04-24',
            title: 'Recent trip to Nurnberg, Germany',
            subtitle: '20 photos over 30 days',
            score: 220,
            assetIds: ['t-1', 't-2', 't-3'],
            memoryAt: DateTime.fromISO('2026-04-24T00:00:00Z'),
          },
        ]),
      };

      vi.spyOn(sut as never, 'getMemoryRules').mockReturnValue([recentTripRule, birthdayRule] as never);

      await sut.onMemoriesCreate();

      expect(mocks.memory.create).toHaveBeenCalledTimes(1);
      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: user.id,
          type: MemoryType.Rule,
          data: expect.objectContaining({
            ruleId: 'birthday',
            title: 'Happy birthday, Pierre',
            subtitle: 'Recent photos of Pierre',
            score: 254,
          }),
        }),
        new Set(['a-1', 'a-2', 'a-3', 'a-4']),
      );

      vi.useRealTimers();
    });

    it('should not advance the rule cursor when any owner run fails', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const userA = factory.userAdmin();
      const userB = factory.userAdmin();
      mocks.user.getList.mockResolvedValue([userA, userB]);
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
        lastRuleDate: '2026-04-22T00:00:00.000Z',
      });
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      vi.spyOn(sut as never, 'createRuleMemories')
        .mockResolvedValueOnce(undefined as never)
        .mockRejectedValueOnce(new Error('boom'));

      await sut.onMemoriesCreate();

      expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(
        SystemMetadataKey.MemoriesState,
        expect.objectContaining({ lastRuleDate: '2026-04-23T00:00:00.000Z' }),
      );

      vi.useRealTimers();
    });
  });

  describe('search', () => {
    it('should search memories', async () => {
      const [userId] = newUuids();
      const asset = AssetFactory.create();
      const memory1 = MemoryFactory.from({ ownerId: userId }).asset(asset).build();
      const memory2 = MemoryFactory.create({ ownerId: userId });

      mocks.memory.searchAccessible.mockResolvedValue([getForMemory(memory1), getForMemory(memory2)]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(sut.search(factory.auth({ user: { id: userId } }), {})).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: memory1.id, assets: [expect.objectContaining({ id: asset.id })] }),
          expect.objectContaining({ id: memory2.id, assets: [] }),
        ]),
      );
    });

    it('should map ', async () => {
      mocks.memory.searchAccessible.mockResolvedValue([]);

      await expect(sut.search(factory.auth(), {})).resolves.toEqual([]);
    });

    it('should pass search dto to repository', async () => {
      const auth = factory.auth();
      const dto = { type: MemoryType.OnThisDay, isSaved: true };
      mocks.memory.searchAccessible.mockResolvedValue([]);

      await sut.search(auth, dto);

      expect(mocks.memory.searchAccessible).toHaveBeenCalledWith(auth.user.id, dto);
    });

    it('should only return assets the user can access', async () => {
      const [userId] = newUuids();
      const visibleAsset = AssetFactory.create();
      const hiddenAsset = AssetFactory.create();
      const memory = MemoryFactory.from({ ownerId: userId }).asset(visibleAsset).asset(hiddenAsset).build();
      mocks.memory.searchAccessible.mockResolvedValue([getForMemory(memory)]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([visibleAsset.id]));

      await expect(sut.search(factory.auth({ user: { id: userId } }), {})).resolves.toEqual([
        expect.objectContaining({
          id: memory.id,
          assets: [expect.objectContaining({ id: visibleAsset.id })],
        }),
      ]);
    });

    it('should expose server-owned title and subtitle for rule memories', async () => {
      const userId = newUuid();
      const memory = MemoryFactory.create({
        ownerId: userId,
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-23',
          title: 'Happy birthday, Alice',
          subtitle: 'Photos from different years',
        } satisfies RuleMemoryData,
      });

      mocks.memory.searchAccessible.mockResolvedValue([getForMemory(memory)]);

      await expect(sut.search(factory.auth({ user: { id: userId } }), {})).resolves.toEqual([
        expect.objectContaining({
          id: memory.id,
          type: MemoryType.Rule,
          title: 'Happy birthday, Alice',
          subtitle: 'Photos from different years',
        }),
      ]);
    });
  });

  describe('statistics', () => {
    it('should return memory statistics', async () => {
      const auth = factory.auth();
      const dto = { type: MemoryType.OnThisDay };
      const stats = { total: 5 };
      mocks.memory.statisticsAccessible.mockResolvedValue(stats as any);

      const result = await sut.statistics(auth, dto);

      expect(result).toEqual(stats);
      expect(mocks.memory.statisticsAccessible).toHaveBeenCalledWith(auth.user.id, dto);
    });
  });

  describe('get', () => {
    it('should throw an error when no access', async () => {
      await expect(sut.get(factory.auth(), 'not-found')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw an error when the memory is not found', async () => {
      const [memoryId] = newUuids();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memoryId]));
      mocks.memory.get.mockResolvedValue(void 0);

      await expect(sut.get(factory.auth(), memoryId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a memory by id', async () => {
      const userId = newUuid();
      const memory = MemoryFactory.create({ ownerId: userId });

      mocks.memory.get.mockResolvedValue(getForMemory(memory));
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));

      await expect(sut.get(factory.auth({ user: { id: userId } }), memory.id)).resolves.toMatchObject({
        id: memory.id,
      });

      expect(mocks.memory.get).toHaveBeenCalledWith(memory.id);
      expect(mocks.access.memory.checkOwnerAccess).toHaveBeenCalledWith(memory.ownerId, new Set([memory.id]));
    });
  });

  describe('create', () => {
    it('should skip assets the user does not have access to', async () => {
      const [assetId, userId] = newUuids();
      const memory = MemoryFactory.create({ ownerId: userId });

      mocks.memory.create.mockResolvedValue(getForMemory(memory));

      await expect(
        sut.create(factory.auth({ user: { id: userId } }), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          memoryAt: memory.memoryAt,
          isSaved: memory.isSaved,
          assetIds: [assetId],
        }),
      ).resolves.toMatchObject({ assets: [] });

      expect(mocks.memory.create).toHaveBeenCalledWith(
        {
          type: memory.type,
          data: memory.data,
          ownerId: memory.ownerId,
          memoryAt: memory.memoryAt,
          isSaved: memory.isSaved,
        },
        new Set(),
      );
    });

    it('should create a memory', async () => {
      const [assetId, userId] = newUuids();
      const asset = AssetFactory.create({ id: assetId, ownerId: userId });
      const memory = MemoryFactory.from().asset(asset).build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.create.mockResolvedValue(getForMemory(memory));

      await expect(
        sut.create(factory.auth({ user: { id: userId } }), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          assetIds: memory.assets.map((asset) => asset.id),
          memoryAt: memory.memoryAt,
        }),
      ).resolves.toBeDefined();

      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: userId }),
        new Set([assetId]),
      );
    });

    it('should create a memory without assets', async () => {
      const memory = MemoryFactory.create();

      mocks.memory.create.mockResolvedValue(getForMemory(memory));

      await expect(
        sut.create(factory.auth(), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          memoryAt: memory.memoryAt,
        }),
      ).resolves.toBeDefined();
    });

    it('should pass all optional fields when creating a memory', async () => {
      const userId = newUuid();
      const memory = MemoryFactory.create({ ownerId: userId });
      const showAt = new Date();
      const hideAt = new Date();
      const seenAt = new Date();

      mocks.memory.create.mockResolvedValue(memory as any);

      await sut.create(factory.auth({ user: { id: userId } }), {
        type: memory.type,
        data: memory.data as OnThisDayData,
        memoryAt: memory.memoryAt,
        isSaved: true,
        showAt,
        hideAt,
        seenAt,
      });

      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: userId,
          isSaved: true,
          showAt,
          hideAt,
          seenAt,
        }),
        new Set(),
      );
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(factory.auth(), 'not-found', { isSaved: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.update).not.toHaveBeenCalled();
    });

    it('should update a memory', async () => {
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(getForMemory(memory));

      await expect(sut.update(factory.auth(), memory.id, { isSaved: true })).resolves.toBeDefined();

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ isSaved: true }));
    });

    it('should update a memory with seenAt', async () => {
      const memory = MemoryFactory.create();
      const seenAt = new Date();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory as any);

      await sut.update(factory.auth(), memory.id, { seenAt });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ seenAt }));
    });

    it('should update a memory with memoryAt', async () => {
      const memory = MemoryFactory.create();
      const memoryAt = new Date();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory as any);

      await sut.update(factory.auth(), memory.id, { memoryAt });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ memoryAt }));
    });
  });

  describe('remove', () => {
    it('should require access', async () => {
      await expect(sut.remove(factory.auth(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.memory.delete).not.toHaveBeenCalled();
    });

    it('should delete a memory', async () => {
      const memoryId = newUuid();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memoryId]));
      mocks.memory.delete.mockResolvedValue();

      await expect(sut.remove(factory.auth(), memoryId)).resolves.toBeUndefined();

      expect(mocks.memory.delete).toHaveBeenCalledWith(memoryId);
    });
  });

  describe('addAssets', () => {
    it('should require memory access', async () => {
      const [memoryId, assetId] = newUuids();

      await expect(sut.addAssets(factory.auth(), memoryId, { ids: [assetId] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should require asset access', async () => {
      const assetId = newUuid();
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(getForMemory(memory));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [assetId] })).resolves.toEqual([
        { error: 'no_permission', id: assetId, success: false },
      ]);

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets already in the memory', async () => {
      const asset = AssetFactory.create();
      const memory = MemoryFactory.from().asset(asset).build();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(getForMemory(memory));
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [asset.id] })).resolves.toEqual([
        { error: 'duplicate', id: asset.id, success: false },
      ]);

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should add assets', async () => {
      const assetId = newUuid();
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.memory.get.mockResolvedValue(getForMemory(memory));
      mocks.memory.update.mockResolvedValue(getForMemory(memory));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());
      mocks.memory.addAssetIds.mockResolvedValue();

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [assetId] })).resolves.toEqual([
        { id: assetId, success: true },
      ]);

      expect(mocks.memory.addAssetIds).toHaveBeenCalledWith(memory.id, [assetId]);
    });

    it('should update memory updatedAt when assets are successfully added', async () => {
      const assetId = newUuid();
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.memory.get.mockResolvedValue(memory as any);
      mocks.memory.update.mockResolvedValue(memory as any);
      mocks.memory.getAssetIds.mockResolvedValue(new Set());
      mocks.memory.addAssetIds.mockResolvedValue();

      await sut.addAssets(factory.auth(), memory.id, { ids: [assetId] });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, { updatedAt: expect.any(Date) });
    });

    it('should not update memory updatedAt when no assets are successfully added', async () => {
      const asset = AssetFactory.create();
      const memory = MemoryFactory.from().asset(asset).build();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(memory as any);
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await sut.addAssets(factory.auth(), memory.id, { ids: [asset.id] });

      expect(mocks.memory.update).not.toHaveBeenCalled();
    });
  });

  describe('removeAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.removeAssets(factory.auth(), 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not in the memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.removeAssets(factory.auth(), 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'not_found', id: 'not-found', success: false },
      ]);

      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should remove assets', async () => {
      const memory = MemoryFactory.create();
      const asset = AssetFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));
      mocks.memory.removeAssetIds.mockResolvedValue();
      mocks.memory.update.mockResolvedValue(getForMemory(memory));

      await expect(sut.removeAssets(factory.auth(), memory.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: true },
      ]);

      expect(mocks.memory.removeAssetIds).toHaveBeenCalledWith(memory.id, [asset.id]);
    });

    it('should update memory updatedAt when assets are successfully removed', async () => {
      const memory = MemoryFactory.create();
      const asset = AssetFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));
      mocks.memory.removeAssetIds.mockResolvedValue();
      mocks.memory.update.mockResolvedValue(memory as any);

      await sut.removeAssets(factory.auth(), memory.id, { ids: [asset.id] });

      expect(mocks.memory.update).toHaveBeenCalledWith(
        memory.id,
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      );
    });

    it('should not update memory updatedAt when no assets are successfully removed', async () => {
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await sut.removeAssets(factory.auth(), memory.id, { ids: ['not-found'] });

      expect(mocks.memory.update).not.toHaveBeenCalled();
    });
  });
});
