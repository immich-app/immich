import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_album.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftOfflineAlbumRepository sut;

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = DriftOfflineAlbumRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('album markers', () {
    test('addAlbum marks an album as offline', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      expect(await sut.isAlbumOffline(album.id), isFalse);

      await sut.addAlbum(album.id);

      expect(await sut.isAlbumOffline(album.id), isTrue);
      expect(await sut.getAlbumIds(), [album.id]);
    });

    test('addAlbum is idempotent', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      await sut.addAlbum(album.id);
      await sut.addAlbum(album.id);

      expect(await sut.getAlbumIds(), [album.id]);
    });

    test('removeAlbum removes the offline marker', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      await sut.addAlbum(album.id);
      await sut.removeAlbum(album.id);

      expect(await sut.isAlbumOffline(album.id), isFalse);
      expect(await sut.getAlbumIds(), isEmpty);
    });

    test('deleting the remote album cascades to the offline marker', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      await sut.addAlbum(album.id);

      await ctx.db.remoteAlbumEntity.deleteWhere((row) => row.id.equals(album.id));

      expect(await sut.getAlbumIds(), isEmpty);
    });

    test('watchIsAlbumOffline emits on changes', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      expect(await sut.watchIsAlbumOffline(album.id).first, isFalse);

      await sut.addAlbum(album.id);

      expect(await sut.watchIsAlbumOffline(album.id).first, isTrue);
    });
  });

  group('getRequiredAssets', () {
    test('returns distinct assets from all offline albums', () async {
      final user = await ctx.newUser();
      final album1 = await ctx.newRemoteAlbum(ownerId: user.id);
      final album2 = await ctx.newRemoteAlbum(ownerId: user.id);
      final otherAlbum = await ctx.newRemoteAlbum(ownerId: user.id);
      final shared = await ctx.newRemoteAsset(ownerId: user.id);
      final only1 = await ctx.newRemoteAsset(ownerId: user.id);
      final onlyOther = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: shared.id);
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: shared.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: only1.id);
      await ctx.newRemoteAlbumAsset(albumId: otherAlbum.id, assetId: onlyOther.id);

      await sut.addAlbum(album1.id);
      await sut.addAlbum(album2.id);

      final assets = await sut.getRequiredAssets();

      expect(assets.map((asset) => asset.id).toSet(), {shared.id, only1.id});
    });

    test('excludes trashed assets', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final trashed = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: trashed.id);

      await sut.addAlbum(album.id);

      final assets = await sut.getRequiredAssets();

      expect(assets.map((a) => a.id), [asset.id]);
    });
  });

  group('downloaded assets', () {
    test('setOriginalDownloaded and setThumbnailDownloaded upsert the same row', () async {
      await sut.setOriginalDownloaded('asset-1', 'asset-1.jpg', 42);
      await sut.setThumbnailDownloaded('asset-1', 'asset-1.thumb.webp');

      final rows = await ctx.db.offlineAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.assetId, 'asset-1');
      expect(rows.first.fileName, 'asset-1.jpg');
      expect(rows.first.thumbFileName, 'asset-1.thumb.webp');
      expect(rows.first.fileSize, 42);
    });

    test('thumbnail first, then original keeps both file names', () async {
      await sut.setThumbnailDownloaded('asset-1', 'asset-1.thumb.webp');
      await sut.setOriginalDownloaded('asset-1', 'asset-1.jpg', 42);

      final rows = await ctx.db.offlineAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.fileName, 'asset-1.jpg');
      expect(rows.first.thumbFileName, 'asset-1.thumb.webp');
    });

    test('removeAssets deletes tracked rows', () async {
      await sut.setOriginalDownloaded('asset-1', 'asset-1.jpg', 1);
      await sut.setOriginalDownloaded('asset-2', 'asset-2.jpg', 2);

      await sut.removeAssets(['asset-1']);

      expect(await sut.getDownloadedAssetIds(), {'asset-2'});
    });
  });

  group('watchAlbumProgress', () {
    test('reports total and downloaded counts', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset1 = await ctx.newRemoteAsset(ownerId: user.id);
      final asset2 = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset1.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset2.id);
      await sut.addAlbum(album.id);

      expect(await sut.watchAlbumProgress(album.id).first, const OfflineAlbumProgress(total: 2, downloaded: 0));

      await sut.setOriginalDownloaded(asset1.id, '${asset1.id}.jpg', 1);

      expect(await sut.watchAlbumProgress(album.id).first, const OfflineAlbumProgress(total: 2, downloaded: 1));

      await sut.setOriginalDownloaded(asset2.id, '${asset2.id}.jpg', 1);

      expect(await sut.watchAlbumProgress(album.id).first, const OfflineAlbumProgress(total: 2, downloaded: 2));
    });

    test('a thumbnail-only download does not count as downloaded', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);
      await sut.addAlbum(album.id);

      await sut.setThumbnailDownloaded(asset.id, '${asset.id}.thumb.webp');

      expect(await sut.watchAlbumProgress(album.id).first, const OfflineAlbumProgress(total: 1, downloaded: 0));
    });
  });
}
