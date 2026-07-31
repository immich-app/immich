import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
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

  group('main backup selection', () {
    test('excludes local assets whose album is not selected for backup', () async {
      final user = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: .none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final query = sut.main([user.id], .day);

      expect(await query.bucketSource().first, isEmpty);
      expect(await query.assetSource(0, 10), isEmpty);
    });

    test('excludes local assets in an excluded album even when also in a selected album', () async {
      final user = await ctx.newUser();
      final selected = await ctx.newLocalAlbum(backupSelection: .selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: asset.id);

      final query = sut.main([user.id], .day);

      expect(await query.bucketSource().first, isEmpty);
      expect(await query.assetSource(0, 10), isEmpty);
    });

    test('ignoreBackupSelection includes local assets regardless of album selection', () async {
      final user = await ctx.newUser();
      final none = await ctx.newLocalAlbum(backupSelection: .none);
      final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
      final unselectedAsset = await ctx.newLocalAsset();
      final excludedAsset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: unselectedAsset.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: excludedAsset.id);

      final query = sut.main([user.id], .day, ignoreBackupSelection: true);

      final buckets = await query.bucketSource().first;
      expect(buckets.fold<int>(0, (sum, bucket) => sum + bucket.assetCount), 2);

      final assets = await query.assetSource(0, 10);
      expect(assets.map((asset) => (asset as LocalAsset).id), containsAll([unselectedAsset.id, excludedAsset.id]));
    });
  });
}
