import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:intl/date_symbol_data_local.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftTimelineRepository sut;

  setUpAll(() async {
    await initializeDateFormatting();
  });

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftTimelineRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('remoteAlbum assets', () {
    test('no duplicate assets when identical checksum appears in multiple local asset rows', () async {
      // Regression check for #23273: a LEFT OUTER JOIN on checksum would fan out and create duplicates
      // happens when same photo exists in multiple albums on device
      final user = await ctx.newUser();
      final checksum = 'yolo';
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
  });

  group('person assets', () {
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

  group('sync trash assets', () {
    Future<({String localId, String albumId})> createPendingReviewAssetInSelectedAlbum({
      String? id,
      String checksum = 'pending-review-checksum',
      DateTime? createdAt,
    }) async {
      final asset = await ctx.newLocalAsset(id: id, checksum: checksum, createdAt: createdAt);
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);
      await ctx.db
          .into(ctx.db.trashSyncEntity)
          .insert(
            TrashSyncEntityCompanion.insert(
              assetId: asset.id,
              checksum: asset.checksum!,
              status: const Value(TrashSyncStatus.reviewPending),
            ),
          );
      return (localId: asset.id, albumId: album.id);
    }

    test('sync trash timeline shows pending review local assets from selected albums', () async {
      final asset = await createPendingReviewAssetInSelectedAlbum();

      final timeline = sut.syncTrash(.day);
      final assets = await timeline.assetSource(0, 10);

      expect(assets.map((asset) => asset.localId), [asset.localId]);
    });

    test('sync trash timeline hides pending review local assets after album is unselected', () async {
      final asset = await createPendingReviewAssetInSelectedAlbum();
      await (ctx.db.update(ctx.db.localAlbumEntity)..where((album) => album.id.equals(asset.albumId))).write(
        const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.none)),
      );

      final timeline = sut.syncTrash(.day);
      final assets = await timeline.assetSource(0, 10);

      expect(assets, isEmpty);
    });

    test('sync trash timeline shows a selected duplicate after the marked copy is unselected', () async {
      final markedAsset = await createPendingReviewAssetInSelectedAlbum();
      final selectedDuplicate = await ctx.newLocalAsset(checksum: 'pending-review-checksum');
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: selectedDuplicate.id);
      await (ctx.db.update(ctx.db.localAlbumEntity)..where((album) => album.id.equals(markedAsset.albumId))).write(
        const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.none)),
      );

      final assets = await sut.syncTrash(.day).assetSource(0, 10);

      expect(assets.map((asset) => asset.localId), [selectedDuplicate.id]);
    });

    test('sync trash timeline groups selected duplicate checksums', () async {
      final older = await createPendingReviewAssetInSelectedAlbum(id: 'local-a');
      final newer = await ctx.newLocalAsset(
        id: 'local-z',
        checksum: 'pending-review-checksum',
      );
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: newer.id);

      final timeline = sut.syncTrash(.day);
      final buckets = await timeline.bucketSource().first;
      final assets = await timeline.assetSource(0, 10);

      expect(buckets.single.assetCount, 1);
      expect(assets.map((asset) => asset.localId), [newer.id]);
      expect(assets.map((asset) => asset.localId), isNot(contains(older.localId)));
    });

    test('sync trash timeline groups soft-deleted assets by remote timeline date', () async {
      final user = await ctx.newUser();
      await ctx.newAuthUser(id: user.id);
      const checksum = 'soft-deleted-checksum';
      final local = await createPendingReviewAssetInSelectedAlbum(
        id: 'local-soft',
        checksum: checksum,
        createdAt: DateTime(2026, 1, 1),
      );
      await ctx.newRemoteAsset(
        ownerId: user.id,
        checksum: checksum,
        createdAt: DateTime(2026, 3, 4, 12),
        deletedAt: DateTime(2026, 5, 6),
      );

      final timeline = sut.syncTrash(.day);
      final buckets = await timeline.bucketSource().first;
      final assets = await timeline.assetSource(0, 10);

      expect(buckets.single, isA<TimeBucket>().having((bucket) => bucket.date, 'date', DateTime(2026, 3, 4)));
      expect(assets.map((asset) => asset.localId), [local.localId]);
    });

    test('sync trash timeline groups hard-deleted assets by server deleted checksum timeline date', () async {
      const checksum = 'hard-deleted-checksum';
      final local = await createPendingReviewAssetInSelectedAlbum(
        id: 'local-hard',
        checksum: checksum,
        createdAt: DateTime(2026, 1, 1),
      );
      await ctx.db
          .into(ctx.db.serverDeletedChecksumEntity)
          .insert(
            ServerDeletedChecksumEntityCompanion.insert(
              checksum: checksum,
              timelineAt: Value(DateTime(2026, 4, 5, 12)),
            ),
          );

      final timeline = sut.syncTrash(.day);
      final buckets = await timeline.bucketSource().first;
      final assets = await timeline.assetSource(0, 10);

      expect(buckets.single, isA<TimeBucket>().having((bucket) => bucket.date, 'date', DateTime(2026, 4, 5)));
      expect(assets.map((asset) => asset.localId), [local.localId]);
    });
  });
}
