import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftLocalAssetRepository(this._db) : super(_db);

  SingleOrNullSelectable<LocalAsset?> _assetSelectable(String id) {
    final query = _db.localAssetEntity.select().addColumns([_db.remoteAssetEntity.id]).join([
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
        useColumns: false,
      ),
    ])..where(_db.localAssetEntity.id.equals(id));

    return query.map((row) {
      final asset = row.readTable(_db.localAssetEntity).toDto();
      return asset.copyWith(remoteId: row.read(_db.remoteAssetEntity.id));
    });
  }

  Future<LocalAsset?> get(String id) => _assetSelectable(id).getSingleOrNull();

  Future<List<LocalAsset?>> getByChecksum(String checksum) {
    final query = _db.localAssetEntity.select()..where((lae) => lae.checksum.equals(checksum));

    return query.map((row) => row.toDto()).get();
  }

  Stream<LocalAsset?> watch(String id) => _assetSelectable(id).watchSingleOrNull();

  Future<void> updateHashes(Map<String, String> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final entry in hashes.entries) {
        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: Value(entry.value)),
          where: (e) => e.id.equals(entry.key),
        );
      }
    });
  }

  Future<void> delete(List<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) {
      for (final id in ids) {
        batch.deleteWhere(_db.localAssetEntity, (e) => e.id.equals(id));
      }
    });
  }

  Future<LocalAsset?> getById(String id) {
    final query = _db.localAssetEntity.select()..where((lae) => lae.id.equals(id));

    return query.map((row) => row.toDto()).getSingleOrNull();
  }

  Future<int> getCount() {
    return _db.managers.localAssetEntity.count();
  }

  Future<int> getHashedCount() {
    return _db.managers.localAssetEntity.filter((e) => e.checksum.isNull().not()).count();
  }

  Future<List<LocalAlbum>> getSourceAlbums(String localAssetId, {BackupSelection? backupSelection}) {
    final query = _db.localAlbumEntity.select()
      ..where(
        (lae) => existsQuery(
          _db.localAlbumAssetEntity.selectOnly()
            ..addColumns([_db.localAlbumAssetEntity.albumId])
            ..where(
              _db.localAlbumAssetEntity.albumId.equalsExp(lae.id) &
                  _db.localAlbumAssetEntity.assetId.equals(localAssetId),
            ),
        ),
      )
      ..orderBy([(lae) => OrderingTerm.asc(lae.name)]);
    if (backupSelection != null) {
      query.where((lae) => lae.backupSelection.equalsValue(backupSelection));
    }
    return query.map((localAlbum) => localAlbum.toDto()).get();
  }

  Future<Map<String, List<LocalAsset>>> getAssetsFromBackupAlbums(Iterable<String> checksums) async {
    if (checksums.isEmpty) {
      return {};
    }

    final result = <String, List<LocalAsset>>{};

    for (final slice in checksums.toSet().slices(kDriftMaxChunk)) {
      final rows =
          await (_db.select(_db.localAlbumAssetEntity).join([
                innerJoin(_db.localAlbumEntity, _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id)),
                innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
              ])..where(
                _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
                    _db.localAssetEntity.checksum.isIn(slice),
              ))
              .get();

      for (final row in rows) {
        final albumId = row.readTable(_db.localAlbumAssetEntity).albumId;
        final assetData = row.readTable(_db.localAssetEntity);
        final asset = assetData.toDto();
        (result[albumId] ??= <LocalAsset>[]).add(asset);
      }
    }
    return result;
  }

  Future<List<LocalAsset>> getRemovalCandidates(
    String userId,
    DateTime cutoffDate, {
    AssetFilterType filterType = AssetFilterType.all,
    bool keepFavorites = true,
  }) async {
    final iosSharedAlbumAssets = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
      ])
      ..where(_db.localAlbumEntity.isIosSharedAlbum.equals(true));

    final query = _db.localAssetEntity.select().join([
      innerJoin(_db.remoteAssetEntity, _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum)),
    ]);

    Expression<bool> whereClause =
        _db.localAssetEntity.createdAt.isSmallerOrEqualValue(cutoffDate) &
        _db.remoteAssetEntity.ownerId.equals(userId) &
        _db.remoteAssetEntity.deletedAt.isNull();

    // Exclude assets that are in iOS shared albums
    whereClause = whereClause & _db.localAssetEntity.id.isNotInQuery(iosSharedAlbumAssets);

    if (filterType == AssetFilterType.photosOnly) {
      whereClause = whereClause & _db.localAssetEntity.type.equalsValue(AssetType.image);
    } else if (filterType == AssetFilterType.videosOnly) {
      whereClause = whereClause & _db.localAssetEntity.type.equalsValue(AssetType.video);
    }

    if (keepFavorites) {
      whereClause = whereClause & _db.localAssetEntity.isFavorite.equals(false);
    }

    query.where(whereClause);

    final rows = await query.get();
    return rows.map((row) => row.readTable(_db.localAssetEntity).toDto()).toList();
  }
}
