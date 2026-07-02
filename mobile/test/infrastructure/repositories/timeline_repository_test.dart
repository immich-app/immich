import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() {
  late Drift db;
  late DriftTimelineRepository repository;

  setUpAll(() async {
    await initializeDateFormatting('en');
  });

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    repository = DriftTimelineRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertLocalAsset({required String id, required String checksum, required DateTime createdAt}) {
    return db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: id,
            checksum: Value(checksum),
            name: '$id.jpg',
            type: AssetType.image,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
          ),
        );
  }

  Future<void> insertLocalAlbum({required String id, BackupSelection backupSelection = BackupSelection.selected}) {
    return db
        .into(db.localAlbumEntity)
        .insert(LocalAlbumEntityCompanion.insert(id: id, name: id, backupSelection: backupSelection));
  }

  Future<void> insertLocalAlbumAsset({required String albumId, required String assetId}) {
    return db
        .into(db.localAlbumAssetEntity)
        .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }

  Future<void> insertTrashSync(String checksum) {
    return db
        .into(db.trashSyncEntity)
        .insert(TrashSyncEntityCompanion.insert(checksum: checksum, remoteDeletedAt: DateTime(2025, 1, 10, 12)));
  }

  Future<void> insertTrashedLocalAsset(String checksum, {String? id}) {
    final now = DateTime(2025, 1, 10, 12);
    return db
        .into(db.trashedLocalAssetEntity)
        .insert(
          TrashedLocalAssetEntityCompanion.insert(
            id: id ?? 'trashed-$checksum',
            albumId: 'album-$checksum',
            checksum: Value(checksum),
            name: 'trashed-$checksum.jpg',
            type: AssetType.image,
            createdAt: Value(now),
            updatedAt: Value(now),
            source: TrashOrigin.localSync,
          ),
        );
  }

  group('toTrashSyncReview', () {
    test('uses local assets and returns one pending entry per checksum', () async {
      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAlbum(id: 'unselected-album', backupSelection: BackupSelection.none);

      await insertTrashSync('duplicate-checksum');
      await insertTrashSync('single-checksum');
      await insertTrashSync('missing-local-checksum');
      await insertTrashSync('unselected-checksum');

      await insertLocalAsset(id: 'a-duplicate', checksum: 'duplicate-checksum', createdAt: DateTime(2025, 1, 1, 12));
      await insertLocalAsset(
        id: 'z-newer-duplicate',
        checksum: 'duplicate-checksum',
        createdAt: DateTime(2025, 1, 2, 12),
      );
      await insertLocalAsset(id: 'single', checksum: 'single-checksum', createdAt: DateTime(2025, 1, 3, 12));
      await insertLocalAsset(id: 'unselected', checksum: 'unselected-checksum', createdAt: DateTime(2025, 1, 5, 12));

      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'a-duplicate');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'z-newer-duplicate');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'single');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'unselected');

      final query = repository.toTrashSyncReview(GroupAssetsBy.day);

      final assets = await query.assetSource(0, 10);
      final localIds = assets.whereType<LocalAsset>().map((asset) => asset.id).toList();

      expect(localIds, ['single', 'a-duplicate']);
      expect(localIds, isNot(contains('z-newer-duplicate')));
      expect(localIds, isNot(contains('unselected')));

      final buckets = await query.bucketSource().first;
      expect(buckets.map((bucket) => bucket.assetCount), [1, 1]);
    });

    test('does not hide an actionable duplicate when another copy with the same checksum is in local trash', () async {
      await insertLocalAlbum(id: 'selected-album');
      await insertTrashSync('shared-checksum');

      await insertLocalAsset(id: 'alive-copy', checksum: 'shared-checksum', createdAt: DateTime(2025, 1, 1, 12));
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'alive-copy');
      await insertTrashedLocalAsset('shared-checksum', id: 'trashed-copy');

      final query = repository.toTrashSyncReview(GroupAssetsBy.day);

      final assets = await query.assetSource(0, 10);
      final localIds = assets.whereType<LocalAsset>().map((asset) => asset.id).toList();

      expect(localIds, ['alive-copy']);
    });
  });
}
