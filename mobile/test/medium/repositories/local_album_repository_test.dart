import 'package:drift/drift.dart' show TableStatements, Value;
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftLocalAlbumRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftLocalAlbumRepository(ctx.db);
  });

  group('recomputeAllBackupCandidates', () {
    test('sets flag true when asset is only in a selected album', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);

      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);
    });

    test('keeps flag false when asset is only in a none / excluded album', () async {
      final none = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final excluded = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final inNone = await ctx.newLocalAsset();
      final inExcluded = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: inNone.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: inExcluded.id, recomputeBackupCandidates: false);

      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(inNone.id), isFalse);
      expect(await ctx.isAssetBackupCandidate(inExcluded.id), isFalse);
    });

    test('keeps flag false when asset is in both a selected and an excluded album', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: asset.id, recomputeBackupCandidates: false);

      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);
    });

    test('flipping selection to excluded flips a candidate back to false', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await (ctx.db.localAlbumEntity.update()..where((row) => row.id.equals(album.id))).write(
        const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.excluded)),
      );
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);
    });
  });

  group('recomputeBackupCandidatesForAlbum', () {
    test('only touches assets in the given album', () async {
      final albumA = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final albumB = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final inAlbumA = await ctx.newLocalAsset();
      final inAlbumB = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: albumA.id, assetId: inAlbumA.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: albumB.id, assetId: inAlbumB.id, recomputeBackupCandidates: false);
      await sut.recomputeBackupCandidatesForAlbum(albumA.id);

      expect(await ctx.isAssetBackupCandidate(inAlbumA.id), isTrue);
      expect(
        await ctx.isAssetBackupCandidate(inAlbumB.id),
        isFalse,
        reason: 'asset in album B should be untouched by an album A-scoped recompute',
      );
    });
  });

  group('recomputeBackupCandidatesForAssets', () {
    test('only touches the listed assets', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final touched = await ctx.newLocalAsset();
      final untouched = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: touched.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: untouched.id, recomputeBackupCandidates: false);
      await sut.recomputeBackupCandidatesForAssets([touched.id]);

      expect(await ctx.isAssetBackupCandidate(touched.id), isTrue);
      expect(await ctx.isAssetBackupCandidate(untouched.id), isFalse);
    });
  });

  group('upsert', () {
    test('flipping selection via upsert recomputes the album', () async {
      final asset = await ctx.newLocalAsset();
      final album = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.none), assetCount: 1);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);

      await sut.upsert(album.copyWith(backupSelection: BackupSelection.selected, updatedAt: DateTime.now()));
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);
    });
  });

  group('delete (iOS)', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    });
    tearDown(() {
      debugDefaultTargetPlatformOverride = null;
    });

    test('flips candidate flag when the only selected album is deleted', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final other = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: other.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.delete(selected.id);
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse, reason: 'survivor lost its only selected membership');
      expect(await ctx.albumAssetCount(selected.id), 0, reason: 'memberships must reflect the now-empty album');
      expect(await ctx.hasLocalAlbum(selected.id), isTrue, reason: 'selected album row is preserved as a bookmark');
    });

    test('keeps candidate flag when another selected album remains', () async {
      final albumA = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final albumB = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: albumA.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: albumB.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.delete(albumA.id);
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue, reason: 'albumB still keeps the asset a candidate');
      expect(await ctx.albumAssetCount(albumA.id), 0);
    });

    test('deleting an excluded album can flip a flag from false to true', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isFalse,
        reason: 'excluded suppresses an otherwise-candidate asset',
      );

      await sut.delete(excluded.id);
      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isTrue,
        reason: 'with excluded gone, the selected membership wins',
      );
      expect(await ctx.albumAssetCount(excluded.id), 0);
      expect(await ctx.hasLocalAlbum(excluded.id), isTrue, reason: 'excluded album row is preserved as a bookmark');
    });

    test('deleting a none album does not flip flags, and the row is removed', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final none = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.delete(none.id);
      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isTrue,
        reason: 'none membership never affected the predicate',
      );
      expect(await ctx.albumAssetCount(none.id), 0);
      expect(await ctx.hasLocalAlbum(none.id), isFalse, reason: 'none album row is hard-deleted');
    });
  });

  group('updateAll (iOS)', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    });
    tearDown(() {
      debugDefaultTargetPlatformOverride = null;
    });

    test('drops selected memberships when album removed from device', () async {
      final selected = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final kept = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.none));
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: kept.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.updateAll([kept]);
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse, reason: 'survivor lost its only selected membership');
      expect(await ctx.albumAssetCount(selected.id), 0, reason: 'selected album must be empty');
      expect(await ctx.hasLocalAlbum(selected.id), isTrue, reason: 'selected album row preserved as bookmark');
    });

    test('drops excluded memberships when album removed from device', () async {
      final excluded = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded));
      final selected = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isFalse,
        reason: 'excluded suppresses an otherwise-candidate asset',
      );

      await sut.updateAll([selected]);
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue, reason: 'with excluded gone, selected wins');
      expect(await ctx.albumAssetCount(excluded.id), 0);
      expect(await ctx.hasLocalAlbum(excluded.id), isTrue, reason: 'excluded album row preserved as a bookmark');
    });

    test('removes none rows entirely and leaves untouched albums alone', () async {
      final selected = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final none = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.none));
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.updateAll([selected]);

      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isTrue,
        reason: 'none membership never affected the predicate',
      );
      expect(await ctx.hasLocalAlbum(none.id), isFalse, reason: 'none removed rows are hard-deleted');
      expect(await ctx.hasLocalAlbum(selected.id), isTrue);
      expect(await ctx.albumAssetCount(selected.id), 1, reason: 'kept album retains its membership');
    });
  });

  group('delete (Android)', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
    });
    tearDown(() {
      debugDefaultTargetPlatformOverride = null;
    });

    test('hard-deletes all member assets and preserves a selected album as a bookmark', () async {
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final other = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final assetA = await ctx.newLocalAsset();
      final assetB = await ctx.newLocalAsset();
      final assetC = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: assetA.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: assetB.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: other.id, assetId: assetC.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(assetA.id), isTrue);

      await sut.delete(selected.id);
      expect(await ctx.hasLocalAsset(assetA.id), isFalse, reason: 'Android removes every member asset of the album');
      expect(await ctx.hasLocalAsset(assetB.id), isFalse, reason: 'Android removes every member asset of the album');
      expect(await ctx.albumAssetCount(selected.id), 0, reason: 'cascade clears memberships of deleted assets');
      expect(await ctx.hasLocalAlbum(selected.id), isTrue, reason: 'selected album row is preserved as a bookmark');
      expect(await ctx.hasLocalAsset(assetC.id), isTrue, reason: 'a different album keeps its own distinct assets');
    });

    test('hard-deletes member assets and removes a none album row', () async {
      final none = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: asset.id, recomputeBackupCandidates: false);

      await sut.delete(none.id);
      expect(await ctx.hasLocalAsset(asset.id), isFalse);
      expect(await ctx.albumAssetCount(none.id), 0);
      expect(await ctx.hasLocalAlbum(none.id), isFalse, reason: 'none album row is hard-deleted');
    });
  });

  group('updateAll (Android)', () {
    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
    });
    tearDown(() {
      debugDefaultTargetPlatformOverride = null;
    });

    test('hard-deletes assets of a removed selected album, preserving its row as a bookmark', () async {
      final removed = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final kept = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final removedAsset = await ctx.newLocalAsset();
      final keptAsset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: removed.id, assetId: removedAsset.id, recomputeBackupCandidates: false);
      await ctx.newLocalAlbumAsset(albumId: kept.id, assetId: keptAsset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      await sut.updateAll([kept]);

      expect(
        await ctx.hasLocalAsset(removedAsset.id),
        isFalse,
        reason: 'removed album assets are gone from the device',
      );
      expect(await ctx.albumAssetCount(removed.id), 0, reason: 'cascade clears the removed album memberships');
      expect(await ctx.hasLocalAlbum(removed.id), isTrue, reason: 'selected removed row preserved as bookmark');
      expect(await ctx.isAssetBackupCandidate(keptAsset.id), isTrue, reason: 'surviving album assets are untouched');
      expect(await ctx.albumAssetCount(kept.id), 1);
    });

    test('hard-deletes assets of a removed none album and removes the row', () async {
      final removed = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.none));
      final kept = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected));
      final removedAsset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: removed.id, assetId: removedAsset.id, recomputeBackupCandidates: false);

      await sut.updateAll([kept]);

      expect(await ctx.hasLocalAsset(removedAsset.id), isFalse);
      expect(await ctx.hasLocalAlbum(removed.id), isFalse, reason: 'none removed rows are hard-deleted');
      expect(await ctx.hasLocalAlbum(kept.id), isTrue);
    });
  });

  group('upsert selection flips', () {
    test('flipping selected to excluded flips a candidate back to false', () async {
      final asset = await ctx.newLocalAsset();
      final album = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected), assetCount: 1);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.upsert(album.copyWith(backupSelection: BackupSelection.excluded, updatedAt: DateTime.now()));
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);
    });

    test('flipping selected to none flips a candidate back to false', () async {
      final asset = await ctx.newLocalAsset();
      final album = mapToLocalAlbum(await ctx.newLocalAlbum(backupSelection: BackupSelection.selected), assetCount: 1);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id, recomputeBackupCandidates: false);
      await sut.recomputeAllBackupCandidates();
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue);

      await sut.upsert(album.copyWith(backupSelection: BackupSelection.none, updatedAt: DateTime.now()));
      expect(await ctx.isAssetBackupCandidate(asset.id), isFalse);
    });
  });
}
