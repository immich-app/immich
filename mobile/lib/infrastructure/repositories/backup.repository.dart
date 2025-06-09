import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/backup.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:platform/platform.dart';

final backupRepositoryProvider = Provider<IBackupRepository>(
  (ref) => DriftBackupRepository(ref.watch(driftProvider)),
);

class DriftBackupRepository extends DriftDatabaseRepository
    implements IBackupRepository {
  final Drift _db;
  final Platform _platform;
  const DriftBackupRepository(this._db, {Platform? platform})
      : _platform = platform ?? const LocalPlatform(),
        super(_db);

  @override
  Future<List<LocalAsset>> getAssets(String albumId) {
    final query = _db.localAlbumAssetEntity.select().join(
      [
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ],
    )
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..orderBy([OrderingTerm.asc(_db.localAssetEntity.id)]);
    return query
        .map((row) => row.readTable(_db.localAssetEntity).toDto())
        .get();
  }

  @override
  Future<List<String>> getAssetIds(String albumId) {
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId));
    return query
        .map((row) => row.read(_db.localAlbumAssetEntity.assetId)!)
        .get();
  }

  @override
  Future<int> getTotalCount(BackupSelection selection) {
    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection.equals(selection.index),
      );

    return query.get().then((rows) => rows.length);
  }

  @override
  Future<int> getBackupCount() {
    final query = _db.localAlbumEntity.select().join(
      [
        innerJoin(
          _db.localAlbumAssetEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        ),
      ],
    )..where(
        _db.localAlbumEntity.backupSelection.equals(
          BackupSelection.selected.index,
        ),
      );

    return query.get().then((rows) => rows.length);
  }
}

extension on LocalAlbumEntityData {
  LocalAlbum toDto({int assetCount = 0}) {
    return LocalAlbum(
      id: id,
      name: name,
      updatedAt: updatedAt,
      assetCount: assetCount,
      backupSelection: backupSelection,
    );
  }
}

extension on LocalAssetEntityData {
  LocalAsset toDto() {
    return LocalAsset(
      id: id,
      name: name,
      checksum: checksum,
      type: type,
      createdAt: createdAt,
      updatedAt: updatedAt,
      durationInSeconds: durationInSeconds,
      isFavorite: isFavorite,
    );
  }
}
