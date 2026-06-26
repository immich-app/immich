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

    test('orders assets by effective date so they land under the correct date bucket (#28852)', () async {
      // Buckets group by the effective date = coalesce(localDateTime, createdAt). The asset
      // list must use the same ordering, otherwise offset paging puts an asset whose
      // localDateTime differs from createdAt under the wrong date header.
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id, order: .desc);
      // A: shown on Sep 3 (localDateTime) but only has the earlier Sep 2 createdAt.
      final assetA = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 2, 12),
        localDateTime: DateTime.utc(2024, 9, 3, 12),
      );
      // B: the inverse — shown on Sep 2 but has the later Sep 3 createdAt.
      final assetB = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 3, 12),
        localDateTime: DateTime.utc(2024, 9, 2, 12),
      );
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: assetA.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: assetB.id);

      final query = sut.remoteAlbum(album.id, .day);

      final buckets = await query.bucketSource().first;
      expect(buckets, hasLength(2));
      expect(buckets.every((b) => b.assetCount == 1), isTrue);

      // Buckets are ordered by effective date desc (Sep 3 then Sep 2), so the asset list
      // must be A then B. The pre-fix raw-createdAt ordering returned B first (Sep 3 createdAt),
      // which slotted B under the Sep 3 header and A under Sep 2.
      final assets = await query.assetSource(0, 10);
      expect(assets.map((a) => (a as RemoteAsset).id).toList(), [assetA.id, assetB.id]);
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

    test('orders assets by effective date so they land under the correct date bucket (#28852)', () async {
      final user = await ctx.newUser();
      final person = await ctx.newPerson(ownerId: user.id);
      // A shown on Sep 3 (localDateTime) with the earlier Sep 2 createdAt; B is the inverse.
      final assetA = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 2, 12),
        localDateTime: DateTime.utc(2024, 9, 3, 12),
      );
      final assetB = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 9, 3, 12),
        localDateTime: DateTime.utc(2024, 9, 2, 12),
      );
      await ctx.newFace(assetId: assetA.id, personId: person.id);
      await ctx.newFace(assetId: assetB.id, personId: person.id);

      final query = sut.person(user.id, person.id, .day);

      final buckets = await query.bucketSource().first;
      expect(buckets, hasLength(2));

      // Buckets are date-desc (Sep 3 then Sep 2); the asset list must match (A then B).
      // The pre-fix raw-createdAt order returned B first.
      final assets = await query.assetSource(0, 10);
      expect(assets.map((a) => (a as RemoteAsset).id).toList(), [assetA.id, assetB.id]);
    });
  });
}
