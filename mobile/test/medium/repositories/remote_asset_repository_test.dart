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

  group('getCounterpartByChecksum', () {
    late String currentUserId;
    late String partnerId;
    late List<String> userIds;

    setUp(() async {
      currentUserId = (await ctx.newUser()).id;
      await ctx.newAuthUser(id: currentUserId);
      partnerId = (await ctx.newUser()).id;
      userIds = [currentUserId, partnerId];
    });

    test('returns only assets visible on the main timeline by default', () async {
      const checksum = 'visible-only';
      final excludedPartnerId = (await ctx.newUser()).id;
      await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, deletedAt: DateTime(2026, 8, 21));
      await ctx.newRemoteAsset(ownerId: excludedPartnerId, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum, visibility: AssetVisibility.archive);
      expect(await sut.getCounterpartByChecksum(userIds, checksum), isNull);

      final partnerAsset = await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum);

      expect((await sut.getCounterpartByChecksum(userIds, checksum))?.id, partnerAsset.id);
    });

    test('does not return the current user\'s asset hidden from the main timeline by default', () async {
      final hidden = AssetVisibility.values.where((visibility) => visibility != AssetVisibility.timeline);
      for (final visibility in hidden) {
        final checksum = 'own-default-${visibility.name}';
        await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, visibility: visibility);

        expect(await sut.getCounterpartByChecksum(userIds, checksum), isNull, reason: visibility.name);
      }
    });

    test('prefers the current user\'s asset over a partner\'s', () async {
      const checksum = 'owner-preference';
      final ownAsset = await ctx.newRemoteAsset(id: 'z-own', ownerId: currentUserId, checksum: checksum);
      await ctx.newRemoteAsset(id: 'a-partner', ownerId: partnerId, checksum: checksum);

      expect((await sut.getCounterpartByChecksum(userIds, checksum))?.id, ownAsset.id);
    });

    group('with ownInAnyVisibility', () {
      test('returns the current user\'s asset in any visibility', () async {
        for (final visibility in AssetVisibility.values) {
          final checksum = 'own-${visibility.name}';
          final ownAsset = await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, visibility: visibility);

          final asset = await sut.getCounterpartByChecksum(userIds, checksum, ownInAnyVisibility: true);

          expect(asset?.id, ownAsset.id, reason: visibility.name);
        }
      });

      test('returns nothing when the current user\'s asset is trashed, even if a partner has a copy', () async {
        const checksum = 'own-trashed';
        await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, deletedAt: DateTime(2026, 8, 21));
        await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum);

        expect(await sut.getCounterpartByChecksum(userIds, checksum, ownInAnyVisibility: true), isNull);
      });
    });
  });
}
