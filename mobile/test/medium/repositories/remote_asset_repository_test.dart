import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late RemoteAssetRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = RemoteAssetRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getStackChildren', () {
    test('returns stack children from oldest to newest', () async {
      final user = await ctx.newUser();
      const stackId = 'stack';
      final primary = await ctx.newRemoteAsset(
        id: 'primary',
        ownerId: user.id,
        stackId: stackId,
        createdAt: DateTime(2026, 1, 2),
      );
      final beforePrimary = await ctx.newRemoteAsset(
        id: 'before-primary',
        ownerId: user.id,
        stackId: stackId,
        createdAt: DateTime(2026, 1, 1),
      );
      final afterPrimary = await ctx.newRemoteAsset(
        id: 'after-primary',
        ownerId: user.id,
        stackId: stackId,
        createdAt: DateTime(2026, 1, 3),
      );
      await ctx.newRemoteAsset(ownerId: user.id, stackId: 'other-stack');

      final primaryAsset = await sut.get(primary.id);
      final stack = await sut.getStackChildren(primaryAsset!);

      expect(stack.map((asset) => asset.id), [beforePrimary.id, afterPrimary.id]);
    });
  });

  group('getByChecksum', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      await ctx.newAuthUser(id: userId);
    });

    test('returns all assets when a partner shares the checksum', () async {
      const checksum = 'shared-partner-checksum';
      final mine = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);
      final partner = await ctx.newUser();
      final theirs = await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);

      final result = await sut.getAllDebugForChecksum(checksum);
      final mineResult = result.firstWhere((asset) => asset.id == mine.id);
      final theirResult = result.firstWhere((asset) => asset.id == theirs.id);

      expect(result, isNotEmpty);
      expect(mineResult.id, mine.id);
      expect(mineResult.ownerId, userId);

      expect(theirResult.id, theirs.id);
      expect(theirResult.ownerId, partner.id);
    });

    test('returns partner asset only if there is no matching user asset', () async {
      const checksum = 'partner-only';
      final partner = await ctx.newUser();
      final theirs = await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);

      final result = await sut.getAllDebugForChecksum(checksum);

      expect(result.length, 1);
      expect(result[0].id, theirs.id);
    });

    test('returns the current user\'s asset', () async {
      const checksum = 'simple';
      final remote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);

      final result = await sut.getAllDebugForChecksum(checksum);

      expect(result.length, 1);
      expect(result[0].id, remote.id);
    });
  });
}
