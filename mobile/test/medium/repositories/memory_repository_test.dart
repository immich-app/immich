import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late MemoryRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = MemoryRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getAll', () {
    // #24745: memories created via the API have no showAt/hideAt. before the fix
    // the window filter (show_at <= now AND hide_at >= now) drops them because a
    // NULL comparison is never true.
    test('includes a memory with null showAt/hideAt', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final memory = await ctx.newMemory(ownerId: user.id);
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result, hasLength(1));
      expect(result.first.id, memory.id);
      expect(result.first.assets.single.id, asset.id);
    });

    test('includes a memory whose window covers today', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final now = DateTime.now().toUtc();
      final memory = await ctx.newMemory(
        ownerId: user.id,
        showAt: now.subtract(const Duration(days: 10)),
        hideAt: now.add(const Duration(days: 10)),
      );
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result.map((m) => m.id), [memory.id]);
    });

    test('excludes a memory whose hideAt is in the past', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final now = DateTime.now().toUtc();
      final memory = await ctx.newMemory(
        ownerId: user.id,
        showAt: now.subtract(const Duration(days: 20)),
        hideAt: now.subtract(const Duration(days: 10)),
      );
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result, isEmpty);
    });

    test('excludes a memory whose showAt is in the future', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final now = DateTime.now().toUtc();
      final memory = await ctx.newMemory(
        ownerId: user.id,
        showAt: now.add(const Duration(days: 10)),
        hideAt: now.add(const Duration(days: 20)),
      );
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result, isEmpty);
    });

    test('includes a memory with showAt in the past and null hideAt', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final now = DateTime.now().toUtc();
      final memory = await ctx.newMemory(ownerId: user.id, showAt: now.subtract(const Duration(days: 10)));
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result.map((m) => m.id), [memory.id]);
    });

    test('excludes a memory with null showAt and hideAt in the past', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final now = DateTime.now().toUtc();
      final memory = await ctx.newMemory(ownerId: user.id, hideAt: now.subtract(const Duration(days: 10)));
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result, isEmpty);
    });

    test('orders memories by showAt, then memoryAt, with null showAt last', () async {
      final user = await ctx.newUser();
      final newestShowAtOlderMemory = await ctx.newMemory(
        id: 'newest-showat-older-memory',
        ownerId: user.id,
        showAt: DateTime.utc(2026, 11, 5),
        memoryAt: DateTime.utc(2020, 1, 1),
      );
      final newestShowAtNewerMemory = await ctx.newMemory(
        id: 'newest-showat-newer-memory',
        ownerId: user.id,
        showAt: DateTime.utc(2026, 11, 5),
        memoryAt: DateTime.utc(2022, 1, 1),
      );
      final olderShowAt = await ctx.newMemory(
        id: 'older-showat',
        ownerId: user.id,
        showAt: DateTime.utc(2025, 11, 5),
        memoryAt: DateTime.utc(2025, 1, 1),
      );
      final nullShowAt = await ctx.newMemory(
        id: 'null-showat',
        ownerId: user.id,
        memoryAt: DateTime.utc(2027, 1, 1),
      );

      for (final memory in [
        newestShowAtOlderMemory,
        newestShowAtNewerMemory,
        olderShowAt,
        nullShowAt,
      ]) {
        final asset = await ctx.newRemoteAsset(ownerId: user.id);
        await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);
      }

      final result = await sut.getAll(user.id);

      expect(result.map((memory) => memory.id), [
        newestShowAtNewerMemory.id,
        newestShowAtOlderMemory.id,
        olderShowAt.id,
        nullShowAt.id,
      ]);
    });

    test('includes a birthday memory with its person name', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final memory = await ctx.newMemory(ownerId: user.id, type: MemoryTypeEnum.birthday, personName: 'Alice');
      await ctx.newMemoryAsset(memoryId: memory.id, assetId: asset.id);

      final result = await sut.getAll(user.id);

      expect(result.single.type, MemoryTypeEnum.birthday);
      expect(result.single.data.personName, 'Alice');
    });
  });
}
