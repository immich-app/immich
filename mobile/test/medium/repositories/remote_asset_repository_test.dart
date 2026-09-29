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

  group('getCandidatesByChecksum', () {
    late String currentUserId;
    late String partnerId;
    late List<String> userIds;

    setUp(() async {
      currentUserId = (await ctx.newUser()).id;
      await ctx.newAuthUser(id: currentUserId);
      partnerId = (await ctx.newUser()).id;
      userIds = [currentUserId, partnerId];
    });

    test('returns the own candidate independently of timeline users', () async {
      const checksum = 'own-without-timeline-users';
      final ownAsset = await ctx.newRemoteAsset(
        ownerId: currentUserId,
        checksum: checksum,
        visibility: AssetVisibility.archive,
      );

      final candidates = await sut.getCandidatesByChecksum(const [], checksum);

      expect(candidates.own?.id, ownAsset.id);
      expect(candidates.timelineVisible, isNull);
    });

    test('filters out partner assets that are not visible on the timeline', () async {
      const checksum = 'excluded-partner-assets';
      final excludedPartnerId = (await ctx.newUser()).id;
      await ctx.newRemoteAsset(ownerId: excludedPartnerId, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum, visibility: AssetVisibility.archive);
      await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum, deletedAt: DateTime(2026, 8, 21));

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own, isNull);
      expect(candidates.timelineVisible, isNull);
    });

    test('returns own and partner timeline candidates independently', () async {
      const checksum = 'own-locked-partner-timeline';
      final ownAsset = await ctx.newRemoteAsset(
        ownerId: currentUserId,
        checksum: checksum,
        visibility: AssetVisibility.locked,
      );
      final partnerAsset = await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum);

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own?.id, ownAsset.id);
      expect(candidates.timelineVisible?.id, partnerAsset.id);
    });

    test('uses the current user\'s timeline asset for both candidates', () async {
      const checksum = 'owner-preference';
      final ownAsset = await ctx.newRemoteAsset(id: 'z-own', ownerId: currentUserId, checksum: checksum);
      await ctx.newRemoteAsset(id: 'a-partner', ownerId: partnerId, checksum: checksum);

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own?.id, ownAsset.id);
      expect(candidates.timelineVisible?.id, ownAsset.id);
    });

    test('prefers an own timeline asset when duplicate own checksums exist', () async {
      const checksum = 'duplicate-own-checksum';
      final ownTimeline = await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, visibility: AssetVisibility.locked);

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own?.id, ownTimeline.id);
      expect(candidates.timelineVisible?.id, ownTimeline.id);
    });

    test('returns a trashed own candidate without hiding a partner timeline candidate', () async {
      const checksum = 'own-trashed';
      final ownAsset = await ctx.newRemoteAsset(
        ownerId: currentUserId,
        checksum: checksum,
        deletedAt: DateTime(2026, 8, 21),
      );
      final partnerAsset = await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum);

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own?.id, ownAsset.id);
      expect(candidates.own?.isTrashed, isTrue);
      expect(candidates.timelineVisible?.id, partnerAsset.id);
    });

    test('never returns hidden assets as top-level candidates', () async {
      const checksum = 'own-hidden';
      await ctx.newRemoteAsset(ownerId: currentUserId, checksum: checksum, visibility: AssetVisibility.hidden);
      final partnerAsset = await ctx.newRemoteAsset(ownerId: partnerId, checksum: checksum);

      final candidates = await sut.getCandidatesByChecksum(userIds, checksum);

      expect(candidates.own, isNull);
      expect(candidates.timelineVisible?.id, partnerAsset.id);
    });
  });
}
