import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/utils/option.dart';

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

  group('watchMergedAsset', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      await ctx.newAuthUser(id: userId);
    });

    test('emits the remote asset and carries the linked local id', () async {
      const checksum = 'merged-both';
      final local = await ctx.newLocalAsset(checksum: checksum);
      final remote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);

      final updates = StreamIterator(sut.watchMergedAsset(remoteId: remote.id, checksum: checksum));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      final asset = updates.current;
      expect(asset, isA<RemoteAsset>());
      expect(asset!.id, remote.id);
      expect((asset as RemoteAsset).localId, local.id);
    });

    test('follows the full local -> remote -> deleted lifecycle', () async {
      const checksum = 'merged-lifecycle';
      final local = await ctx.newLocalAsset(checksum: checksum);

      final updates = StreamIterator(sut.watchMergedAsset(localId: local.id, checksum: checksum));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<LocalAsset>());
      expect(updates.current!.id, local.id);

      // Upload: the current user's remote copy appears.
      final remote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);
      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<RemoteAsset>());
      expect(updates.current!.id, remote.id);

      // The local row is deleted after promotion: keep watching the remote asset.
      await (ctx.db.delete(ctx.db.localAssetEntity)..where((l) => l.id.equals(local.id))).go();
      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<RemoteAsset>());
      expect(updates.current!.id, remote.id);

      // The remote row goes too: nothing left.
      await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((r) => r.id.equals(remote.id))).go();
      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isNull);
    });

    test('falls back to the local asset when the remote copy is deleted', () async {
      const checksum = 'merged-demote';
      final local = await ctx.newLocalAsset(checksum: checksum);
      final remote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);

      final updates = StreamIterator(sut.watchMergedAsset(remoteId: remote.id, checksum: checksum));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<RemoteAsset>());

      await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((r) => r.id.equals(remote.id))).go();

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<LocalAsset>());
      expect(updates.current!.id, local.id);
    });

    test('anchors an unhashed local asset by id without linking any remote', () async {
      final local = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newRemoteAsset(ownerId: userId, checksum: 'unrelated');

      final updates = StreamIterator(sut.watchMergedAsset(localId: local.id));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<LocalAsset>());
      expect(updates.current!.id, local.id);
    });

    test('emits null when neither the local nor the remote asset exists', () async {
      final updates = StreamIterator(sut.watchMergedAsset(remoteId: 'ghost', checksum: 'ghost'));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isNull);
    });

    test('does not promote a local asset to a partner-owned remote copy', () async {
      const checksum = 'merged-partner';
      final partner = await ctx.newUser();
      final local = await ctx.newLocalAsset(checksum: checksum);
      await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);

      final updates = StreamIterator(sut.watchMergedAsset(localId: local.id, checksum: checksum));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<LocalAsset>());
    });

    test('shows the opened partner-owned remote asset, even against the user\'s own same-checksum copy', () async {
      const checksum = 'merged-partner-and-own';
      final partner = await ctx.newUser();
      final partnerAsset = await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);

      final updates = StreamIterator(sut.watchMergedAsset(remoteId: partnerAsset.id, checksum: checksum));
      addTearDown(updates.cancel);

      expect(await updates.moveNext(), isTrue);
      expect(updates.current, isA<RemoteAsset>());
      expect(updates.current!.id, partnerAsset.id);
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
