import 'dart:async';

import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final backupRepositoryProvider = Provider<DriftBackupRepository>(
  (ref) => DriftBackupRepository(ref.watch(driftProvider)),
);

class DriftBackupRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftBackupRepository(this._db) : super(_db);

  _getExcludedSubquery() {
    return _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
      ])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.excluded));
  }

  Future<int> getTotalCount() async {
    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
            _db.localAlbumAssetEntity.assetId.isNotInQuery(_getExcludedSubquery()),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<int> getRemainderCount(String userId) async {
    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
          useColumns: false,
        ),
        leftOuterJoin(
          _db.remoteAssetEntity,
          _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum) &
              _db.remoteAssetEntity.ownerId.equals(userId),
          useColumns: false,
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
            _db.remoteAssetEntity.id.isNull() &
            _db.localAlbumAssetEntity.assetId.isNotInQuery(_getExcludedSubquery()),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<int> getBackupCount(String userId) async {
    final query = _db.localAlbumAssetEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
          useColumns: false,
        ),
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
          useColumns: false,
        ),
        innerJoin(
          _db.remoteAssetEntity,
          _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
          useColumns: false,
        ),
      ])
      ..where(
        _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
            _db.remoteAssetEntity.id.isNotNull() &
            _db.remoteAssetEntity.ownerId.equals(userId) &
            _db.localAlbumAssetEntity.assetId.isNotInQuery(_getExcludedSubquery()),
      );

    return query.get().then((rows) => rows.length);
  }

  Future<List<LocalAsset>> getCandidates(String userId) async {
    final selectedAlbumIds = _db.localAlbumEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumEntity.id])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected));

    final query = _db.localAssetEntity.select()
      ..where(
        (lae) =>
            lae.checksum.isNotNull() &
            existsQuery(
              _db.localAlbumAssetEntity.selectOnly()
                ..addColumns([_db.localAlbumAssetEntity.assetId])
                ..where(
                  _db.localAlbumAssetEntity.albumId.isInQuery(selectedAlbumIds) &
                      _db.localAlbumAssetEntity.assetId.equalsExp(lae.id),
                ),
            ) &
            notExistsQuery(
              _db.remoteAssetEntity.selectOnly()
                ..addColumns([_db.remoteAssetEntity.checksum])
                ..where(
                  _db.remoteAssetEntity.checksum.equalsExp(lae.checksum) & _db.remoteAssetEntity.ownerId.equals(userId),
                ),
            ) &
            lae.id.isNotInQuery(_getExcludedSubquery()),
      )
      ..orderBy([(localAsset) => OrderingTerm.desc(localAsset.createdAt)]);

    return query.map((localAsset) => localAsset.toDto()).get();
  }
}
