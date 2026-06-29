import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftMemoryRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftMemoryRepository(ctx.db);
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
  });
}
