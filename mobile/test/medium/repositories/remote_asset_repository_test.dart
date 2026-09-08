import 'package:async/async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
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

  group('watchMatchingIds', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      await ctx.newAuthUser(id: userId);
    });

    test('excludes trashed, deleted and archived assets', () async {
      final timeline = await ctx.newRemoteAsset(ownerId: userId);
      final trashed = await ctx.newRemoteAsset(ownerId: userId, deletedAt: DateTime(2020));
      final archived = await ctx.newRemoteAsset(ownerId: userId, visibility: AssetVisibility.archive);

      final result = await sut.watchMatchingIds([
        timeline.id,
        trashed.id,
        archived.id,
        'never-synced',
      ], AssetVisibility.timeline).first;

      expect(result, {timeline.id});
    });

    test('matches the requested visibility for archive searches', () async {
      final timeline = await ctx.newRemoteAsset(ownerId: userId);
      final archived = await ctx.newRemoteAsset(ownerId: userId, visibility: AssetVisibility.archive);

      final result = await sut.watchMatchingIds([timeline.id, archived.id], AssetVisibility.archive).first;

      expect(result, {archived.id});
    });

    test('emits again when a matching asset is trashed', () async {
      final asset = await ctx.newRemoteAsset(ownerId: userId);
      final queue = StreamQueue(sut.watchMatchingIds([asset.id], AssetVisibility.timeline));

      expect(await queue.next, {asset.id});

      await sut.trash([asset.id]);

      expect(await queue.next, isEmpty);
      await queue.cancel();
    });
  });
}
