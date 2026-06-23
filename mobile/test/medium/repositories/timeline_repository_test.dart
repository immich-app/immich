import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
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

  group('burst display', () {
    test('local-only burst shows only the representative tile', () async {
      final user = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      final member1 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final member2 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      for (final a in [rep, member1, member2]) {
        await ctx.newLocalAlbumAsset(albumId: album.id, assetId: a.id);
      }

      final query = sut.main([user.id], .day);

      final buckets = await query.bucketSource().first;
      expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 1);

      final assets = await query.assetSource(0, 10);
      expect(assets, hasLength(1));
      expect(assets.single.localId, rep.id);
    });

    test('remote burst members are hidden by the local flag even before the stack syncs', () async {
      // Both remotes have stack_id NULL (the transient window before the server's
      // StackUpdate reaches the client). The normal stack rule would show both;
      // clause B hides the non-rep by its local flag, while stack_id IS NULL keeps the rep.
      final user = await ctx.newUser();
      final repRemote = await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-rep');
      await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-member');
      await ctx.newLocalAsset(checksum: 'c-rep', burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(checksum: 'c-member', burstId: 'b1', isBurstRepresentative: false);

      final query = sut.main([user.id], .day);

      final buckets = await query.bucketSource().first;
      expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 1);

      final assets = await query.assetSource(0, 10);
      expect(assets, hasLength(1));
      expect((assets.single as RemoteAsset).id, repRemote.id);
    });

    test('a synced burst stack still shows its primary after a Photos re-pick moves the local rep flag', () async {
      // Regression: once the stack synced (stack_id set, primary = old rep) the
      // user re-picks the cover in Photos, so the old rep's local row flips to
      // is_burst_representative = 0. Clause B must NOT hide the synced primary —
      // the stack would vanish from the grid. Scoping clause B to stack_id IS NULL
      // hands the synced case back to the primary rule.
      final user = await ctx.newUser();
      final primary = await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-rep');
      final member = await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-member');
      final stack = await ctx.newStack(ownerId: user.id, primaryAssetId: primary.id);
      await (ctx.db.update(
        ctx.db.remoteAssetEntity,
      )..where((t) => t.id.isIn([primary.id, member.id]))).write(RemoteAssetEntityCompanion(stackId: Value(stack.id)));
      // local rep flag has moved off the old rep (now a non-rep frame locally)
      await ctx.newLocalAsset(checksum: 'c-rep', burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAsset(checksum: 'c-member', burstId: 'b1', isBurstRepresentative: false);

      final query = sut.main([user.id], .day);

      final buckets = await query.bucketSource().first;
      expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 1);

      final assets = await query.assetSource(0, 10);
      expect(assets, hasLength(1));
      expect((assets.single as RemoteAsset).id, primary.id);
    });

    test('a rep-less local burst group shows every frame as an individual (no vanish)', () async {
      // After "Keep Everything"/re-pick a burst group can end up with zero
      // is_burst_representative=1 frames. Those frames must NOT all hide — show
      // each as its own tile so nothing vanishes from the grid.
      final user = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final f1 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final f2 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final f3 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      for (final a in [f1, f2, f3]) {
        await ctx.newLocalAlbumAsset(albumId: album.id, assetId: a.id);
      }

      final query = sut.main([user.id], .day);

      final buckets = await query.bucketSource().first;
      expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 3);

      final assets = await query.assetSource(0, 10);
      expect(assets.map((a) => a.localId).toSet(), {f1.id, f2.id, f3.id});
    });

    test(
      'a synced stack does not duplicate when the rep flag moves onto a non-primary member (Keep Everything)',
      () async {
        // After "Keep Everything", iOS moves representsBurst onto a different frame.
        // If that frame is a non-primary member of an already-synced stack, the grid
        // must still show only the stack primary — not also surface the moved-rep
        // member as a second tile (the clause-A duplicate this removed).
        final user = await ctx.newUser();
        final primary = await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-primary');
        final member = await ctx.newRemoteAsset(ownerId: user.id, checksum: 'c-member');
        final stack = await ctx.newStack(ownerId: user.id, primaryAssetId: primary.id);
        await (ctx.db.update(ctx.db.remoteAssetEntity)..where((t) => t.id.isIn([primary.id, member.id]))).write(
          RemoteAssetEntityCompanion(stackId: Value(stack.id)),
        );
        // the local rep flag now sits on the member frame (matches the non-primary remote)
        await ctx.newLocalAsset(checksum: 'c-primary', burstId: 'b1', isBurstRepresentative: false);
        await ctx.newLocalAsset(checksum: 'c-member', burstId: 'b1', isBurstRepresentative: true);

        final query = sut.main([user.id], .day);

        final buckets = await query.bucketSource().first;
        expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 1);

        final assets = await query.assetSource(0, 10);
        expect(assets, hasLength(1));
        expect((assets.single as RemoteAsset).id, primary.id);
      },
    );
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
}
