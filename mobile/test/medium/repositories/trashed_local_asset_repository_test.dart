import 'package:drift/drift.dart' show TableOrViewStatements;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftTrashedLocalAssetRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftTrashedLocalAssetRepository(ctx.db);
  });

  Future<int> trashedCount(String assetId) async =>
      await (ctx.db.trashedLocalAssetEntity.count(where: (row) => row.id.equals(assetId))).getSingle();

  group('trash and restore lifecycle', () {
    test('trashing a candidate removes the local asset and cascades its album membership', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      expect(
        await ctx.isAssetBackupCandidate(asset.id),
        isTrue,
        reason: 'asset in a selected album starts as a candidate',
      );
      expect(await ctx.albumAssetCount(album.id), 1);

      await sut.trashLocalAsset({
        album.id: [mapToLocalAsset(asset)],
      });

      expect(await ctx.hasLocalAsset(asset.id), isFalse, reason: 'row moves out of local_asset_entity');
      expect(await ctx.albumAssetCount(album.id), 0, reason: 'FK cascade removes the album membership');
      expect(await trashedCount(asset.id), 1, reason: 'asset now lives in the trashed table');
    });

    test('restoring re-inserts the asset and marks it a backup candidate', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);
      await sut.trashLocalAsset({
        album.id: [mapToLocalAsset(asset)],
      });

      await sut.applyRestoredAssets([asset.id]);

      expect(await ctx.hasLocalAsset(asset.id), isTrue, reason: 'row returns to local_asset_entity');
      expect(await trashedCount(asset.id), 0, reason: 'trashed row is consumed');
      expect(await ctx.isAssetBackupCandidate(asset.id), isTrue, reason: 'restored asset is a candidate again');
      expect(await ctx.albumAssetCount(album.id), 0, reason: 'restore does not re-link membership');
    });
  });

  group('getToRestore', () {
    test('returns trashed assets whose album is selected and whose remote copy is live again', () async {
      const checksum = 'shared-checksum';
      final owner = await ctx.newUser();
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset(checksum: checksum);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: asset.id);
      await ctx.newRemoteAsset(checksum: checksum, ownerId: owner.id);
      await sut.trashLocalAsset({
        selected.id: [mapToLocalAsset(asset)],
      });

      final toRestore = await sut.getToRestore();

      expect(toRestore.map((a) => a.id), contains(asset.id));
    });

    test('ignores trashed assets whose album is not selected', () async {
      const checksum = 'shared-checksum';
      final owner = await ctx.newUser();
      final none = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset(checksum: checksum);
      await ctx.newLocalAlbumAsset(albumId: none.id, assetId: asset.id);
      await ctx.newRemoteAsset(checksum: checksum, ownerId: owner.id);
      await sut.trashLocalAsset({
        none.id: [mapToLocalAsset(asset)],
      });

      final toRestore = await sut.getToRestore();

      expect(toRestore, isEmpty);
    });
  });
}
