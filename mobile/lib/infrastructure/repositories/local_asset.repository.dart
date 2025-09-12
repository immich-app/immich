import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/domain/models/local_trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_trashed_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_trashed_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

typedef LocalRemoteIds = ({String localId, String remoteId});

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

  Future<void> updateHashes(Iterable<LocalAsset> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final asset in hashes) {
        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: Value(asset.checksum)),
          where: (e) => e.id.equals(asset.id),
        );
      }
    });
  }

  Future<void> delete(Iterable<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) {
      for (final slice in ids.slices(32000)) {
        batch.deleteWhere(_db.localAssetEntity, (e) => e.id.isIn(slice));
      }
    });
  }

  Future<void> trash(Iterable<LocalRemoteIds> ids) async {
    if (ids.isEmpty) return;

    final Map<String, String> idToRemote = {for (final e in ids) e.localId: e.remoteId};

    final localRows = await (_db.localAssetEntity.select()..where((t) => t.id.isIn(idToRemote.keys))).get();

    await _db.batch((batch) {
      for (final row in localRows) {
        final remoteId = idToRemote[row.id];
        if (remoteId == null) {
          continue;
        }
        batch.insert(
          _db.localTrashedAssetEntity,
          LocalTrashedAssetEntityCompanion(id: Value(row.id), remoteId: Value(remoteId)),
          mode: InsertMode.insertOrReplace,
        );
      }
      for (final slice in idToRemote.keys.slices(32000)) {
        batch.deleteWhere(_db.localAssetEntity, (e) => e.id.isIn(slice));
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

  Future<List<LocalAsset>> getBackupSelectedAssets(Iterable<String> checksums) {
    if (checksums.isEmpty) {
      return Future.value([]);
    }
    final backedUpAssetIds = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
      ])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected));
    final query = _db.localAssetEntity.select()
      ..where((la) => la.checksum.isIn(checksums) & la.id.isInQuery(backedUpAssetIds));
    return query.map((row) => row.toDto()).get();
  }

  Future<List<LocalTrashedAsset>> getLocalTrashedAssets(Iterable<String> remoteIds) {
    if (remoteIds.isEmpty) {
      return Future.value([]);
    }
    final query = _db.localTrashedAssetEntity.select()..where((t) => t.remoteId.isIn(remoteIds));
    return query.map((row) => row.toDto()).get();
  }

  Future<void> deleteLocalTrashedAssets(Iterable<String> remoteIds) {
    if (remoteIds.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      for (final slice in remoteIds.slices(32000)) {
        batch.deleteWhere(_db.localTrashedAssetEntity, (e) => e.remoteId.isIn(slice));
      }
    });
  }
}
