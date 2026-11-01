import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:openapi/api.dart' as api;

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late TimelineRepository sut;

  setUpAll(() async {
    await initializeDateFormatting();
  });

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = TimelineRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  test('hides a confirmed private upload from Photos before sync, preserving the device album', () async {
    final user = await ctx.newUser();
    final other = await ctx.newUser();
    await ctx.newAuthUser(id: user.id);
    final album = await ctx.newLocalAlbum(backupSelection: .selected);
    final local = await ctx.newLocalAsset();
    await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);
    final timeline = sut.main([user.id], .day);
    expect(await timeline.assetSource(0, 10), hasLength(1));

    await LocalAssetRepository(ctx.db).rememberUploadedAsset(user.id, local.id, 'private-checksum');

    expect(await timeline.assetSource(0, 10), isEmpty);
    expect(await timeline.bucketSource().first, isEmpty);
    expect((await LocalAssetRepository(ctx.db).get(local.id))?.checksum, 'private-checksum');
    expect(await sut.localAlbum(album.id, .day).assetSource(0, 10), hasLength(1));
    expect(await sut.main([other.id], .day).assetSource(0, 10), hasLength(1));
  });

  test('keeps album-granted private photos out of the partner timeline and prunes the last revoked grant', () async {
    final viewer = await ctx.newUser();
    final owner = await ctx.newUser();
    await ctx.newAuthUser(id: viewer.id);
    final secret = await ctx.newRemoteAsset(ownerId: owner.id, visibility: AssetVisibility.locked);
    final public = await ctx.newRemoteAsset(ownerId: owner.id);
    final own = await ctx.newRemoteAsset(ownerId: viewer.id, visibility: AssetVisibility.locked);
    final first = await ctx.newRemoteAlbum(ownerId: owner.id);
    final second = await ctx.newRemoteAlbum(ownerId: owner.id);
    for (final album in [first, second]) {
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: secret.id);
    }
    final sync = SyncStreamRepository(ctx.db);
    expect(await sut.remoteAlbum(first.id, .day).assetSource(0, 10), hasLength(1));
    expect((await sut.main([owner.id, viewer.id], .day).assetSource(0, 10)).map((asset) => asset.id), [public.id]);

    await sync.deleteAlbumToAssetsV1([api.SyncAlbumToAssetDeleteV1(albumId: first.id, assetId: secret.id)]);
    expect(await sync.pruneUnsharedPrivateAssets(), 0);
    expect(await sut.remoteAlbum(second.id, .day).assetSource(0, 10), hasLength(1));
    await sync.deleteAlbumToAssetsV1([api.SyncAlbumToAssetDeleteV1(albumId: second.id, assetId: secret.id)]);
    expect(await sync.pruneUnsharedPrivateAssets(), 1);
    expect(
      (await ctx.db.select(ctx.db.remoteAssetEntity).get()).map((asset) => asset.id),
      unorderedEquals([own.id, public.id]),
    );
  });

  group('remoteAlbum assets', () {
    test('no duplicate assets when identical checksum appears in multiple local asset rows', () async {
      // Regression check for #23273: a LEFT OUTER JOIN on checksum would fan out and create duplicates
      // happens when same photo exists in multiple albums on device
      final user = await ctx.newUser();
      const checksum = 'yolo';
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final remoteAsset = await ctx.newRemoteAsset(ownerId: user.id, checksum: checksum);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: remoteAsset.id);

      final localAsset1 = await ctx.newLocalAsset(checksum: checksum);
      final localAsset2 = await ctx.newLocalAsset(checksum: checksum);

      final query = sut.remoteAlbum(album.id, .day);

      final buckets = await query.bucketSource().first;
      expect(buckets, hasLength(1));
      expect(buckets.single.assetCount, 1);

      final assets = await query.assetSource(0, 10);
      expect(assets, hasLength(1));
      expect((assets.first as RemoteAsset).id, remoteAsset.id);
      expect([localAsset1.id, localAsset2.id], contains((assets.first as RemoteAsset).localId));
    });

    test('orders shifted album assets in both directions and keeps normal asset order (#28852)', () async {
      final user = await ctx.newUser();
      final descendingAlbum = await ctx.newRemoteAlbum(ownerId: user.id, order: .desc);
      final ascendingAlbum = await ctx.newRemoteAlbum(ownerId: user.id, order: .asc);
      final shiftedLater = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 2, 12),
        localDateTime: DateTime.utc(2024, 9, 3, 12),
      );
      final shiftedEarlier = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 3, 12),
        localDateTime: DateTime.utc(2024, 9, 2, 12),
      );
      final normalLater = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 4, 14),
        localDateTime: DateTime.utc(2024, 9, 4, 14),
      );
      final normalEarlier = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 4, 12),
        localDateTime: DateTime.utc(2024, 9, 4, 12),
      );
      final seeded = [shiftedLater, shiftedEarlier, normalLater, normalEarlier];
      for (final asset in seeded) {
        await ctx.newRemoteAlbumAsset(albumId: descendingAlbum.id, assetId: asset.id);
        await ctx.newRemoteAlbumAsset(albumId: ascendingAlbum.id, assetId: asset.id);
      }

      final descending = sut.remoteAlbum(descendingAlbum.id, .day);
      final ascending = sut.remoteAlbum(ascendingAlbum.id, .day);

      final buckets = await descending.bucketSource().first;
      expect(buckets, hasLength(3));
      expect(buckets.map((bucket) => bucket.assetCount), [2, 1, 1]);

      final descendingAssets = await descending.assetSource(0, 10);
      expect(descendingAssets.map((asset) => (asset as RemoteAsset).id), [
        normalLater.id,
        normalEarlier.id,
        shiftedLater.id,
        shiftedEarlier.id,
      ]);

      final ascendingAssets = await ascending.assetSource(0, 10);
      expect(ascendingAssets.map((asset) => (asset as RemoteAsset).id), [
        shiftedEarlier.id,
        shiftedLater.id,
        normalEarlier.id,
        normalLater.id,
      ]);
    });
  });

  group('person assets', () {
    test('includes partner assets even when the partner is not shown in the timeline', () async {
      final user = await ctx.newUser();
      final partner = await ctx.newUser();
      final stranger = await ctx.newUser();
      await ctx.newPartner(sharedById: partner.id, sharedWithId: user.id, inTimeline: false);

      final person = await ctx.newPerson(ownerId: user.id);
      final partnerAsset = await ctx.newRemoteAsset(ownerId: partner.id);
      final strangerAsset = await ctx.newRemoteAsset(ownerId: stranger.id);
      await ctx.newFace(assetId: partnerAsset.id, personId: person.id);
      await ctx.newFace(assetId: strangerAsset.id, personId: person.id);

      final assets = await sut.person(user.id, person.id, .day).assetSource(0, 10);
      expect(assets.map((a) => (a as RemoteAsset).id), [partnerAsset.id]);
    });

    test('does not duplicate an asset that has multiple face records for the same person', () async {
      // Regression check for #26723: an INNER JOIN between remote_asset_entity and asset_face_entity
      // fanned out one asset into N rows when N face records pointed at the same (asset, person) pair
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      final person = await ctx.newPerson(ownerId: user.id);
      await ctx.newFace(assetId: asset.id, personId: person.id);
      await ctx.newFace(assetId: asset.id, personId: person.id);

      final query = sut.person(user.id, person.id, .day);

      final buckets = await query.bucketSource().first;
      expect(buckets, hasLength(1));
      expect(buckets.single.assetCount, 1);

      final assets = await query.assetSource(0, 10);
      expect(assets, hasLength(1));
      expect((assets.first as RemoteAsset).id, asset.id);
    });

    test('orders shifted person assets by effective date (#28852)', () async {
      final user = await ctx.newUser();
      final person = await ctx.newPerson(ownerId: user.id);
      final shiftedLater = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 2, 12),
        localDateTime: DateTime.utc(2024, 9, 3, 12),
      );
      final shiftedEarlier = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 3, 12),
        localDateTime: DateTime.utc(2024, 9, 2, 12),
      );
      await ctx.newFace(assetId: shiftedLater.id, personId: person.id);
      await ctx.newFace(assetId: shiftedEarlier.id, personId: person.id);

      final query = sut.person(user.id, person.id, .day);

      final buckets = await query.bucketSource().first;
      expect(buckets, hasLength(2));

      final assets = await query.assetSource(0, 10);
      expect(assets.map((asset) => (asset as RemoteAsset).id), [shiftedLater.id, shiftedEarlier.id]);
    });
  });

  group('live photos', () {
    test('remote-only live photo contains livePhotoVideoId and is marked as a motion photo', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id, livePhotoVideoId: 'motion-photo-1');

      final assets = await sut.main([user.id], .day).assetSource(0, 10);

      expect(assets, hasLength(1));
      final remote = assets.single as RemoteAsset;
      expect(remote.id, asset.id);
      expect(remote.livePhotoVideoId, 'motion-photo-1');
      expect(remote.isMotionPhoto, isTrue);
      expect(remote.localId, isNull);
    });

    test('merged live photo resolves localId and is marked as a motion photo', () async {
      final user = await ctx.newUser();
      const checksum = 'shared-live-photo-checksum';
      final asset = await ctx.newRemoteAsset(ownerId: user.id, checksum: checksum, livePhotoVideoId: 'motion-photo-2');
      final local = await ctx.newLocalAsset(checksum: checksum);

      final assets = await sut.main([user.id], .day).assetSource(0, 10);

      expect(assets, hasLength(1));
      final remote = assets.single as RemoteAsset;
      expect(remote.id, asset.id);
      expect(remote.livePhotoVideoId, 'motion-photo-2');
      expect(remote.isMotionPhoto, isTrue);
      expect(remote.localId, local.id);
    });
  });

  group('localAlbum assets', () {
    late String userId;
    late String otherUserId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      await ctx.newAuthUser(id: userId);
      final other = await ctx.newUser();
      otherUserId = other.id;
    });

    test('does not duplicate assets when a partner shares the checksum', () async {
      const checksum = 'shared-partner-checksum';
      final album = await ctx.newLocalAlbum();
      final local = await ctx.newLocalAsset(checksum: checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);
      final myRemote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: otherUserId, checksum: checksum);

      final assets = await sut.localAlbum(album.id, .day).assetSource(0, 10);

      expect(assets, hasLength(1));
      final asset = assets.single as LocalAsset;
      expect(asset.id, local.id);
      // Must resolve the current user's remote id
      expect(asset.remoteId, myRemote.id);
    });

    test('bucket count ignores a partner sharing the checksum', () async {
      const checksum = 'shared-partner-checksum';
      final album = await ctx.newLocalAlbum();
      final local = await ctx.newLocalAsset(checksum: checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);
      await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);
      await ctx.newRemoteAsset(ownerId: otherUserId, checksum: checksum);

      final buckets = await sut.localAlbum(album.id, .day).bucketSource().first;

      expect(buckets, hasLength(1));
      expect(buckets.single.assetCount, 1);
    });
  });
}
