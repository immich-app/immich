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

  /// Returns all backup-related counts in a single query.
  ///
  /// - total:     number of distinct assets in selected albums, excluding those that are also in excluded albums
  /// - backup:    number of those assets that already exist on the server for [userId]
  /// - remainder: number of those assets that do not yet exist on the server for [userId]
  ///              (includes processing)
  /// - processing: number of those assets that are still preparing/have a null checksum
  Future<({int total, int backup, int remainder, int processing})> getAllCounts(String userId) async {
    const sql = '''
      WITH base AS (
          SELECT DISTINCT laa.asset_id, lae.checksum
          FROM local_album_asset_entity laa
          INNER JOIN local_album_entity la ON laa.album_id = la.id
          INNER JOIN local_asset_entity lae ON laa.asset_id = lae.id
          LEFT JOIN (
              SELECT DISTINCT laa2.asset_id
              FROM local_album_asset_entity laa2
              INNER JOIN local_album_entity la2 ON laa2.album_id = la2.id
              WHERE la2.backup_selection = ?1
          ) excluded ON laa.asset_id = excluded.asset_id
          WHERE la.backup_selection = ?2
            AND excluded.asset_id IS NULL
      )
            SELECT
              COUNT(*) AS total_count,
              SUM(CASE WHEN base.checksum IS NULL THEN 1 ELSE 0 END) AS processing_count,
              SUM(CASE WHEN rae.id IS NULL THEN 1 ELSE 0 END) AS remainder_count,
              SUM(CASE WHEN rae.id IS NOT NULL THEN 1 ELSE 0 END) AS backup_count
            FROM base
            LEFT JOIN remote_asset_entity rae
              ON rae.checksum = base.checksum AND rae.owner_id = ?3
      ''';

    final row = await _db
        .customSelect(
          sql,
          variables: [
            Variable.withInt(BackupSelection.excluded.index),
            Variable.withInt(BackupSelection.selected.index),
            Variable.withString(userId),
          ],
          readsFrom: {_db.localAlbumAssetEntity, _db.localAlbumEntity, _db.localAssetEntity, _db.remoteAssetEntity},
        )
        .getSingle();

    final data = row.data;
    return (
      total: (data['total_count'] as int?) ?? 0,
      backup: (data['backup_count'] as int?) ?? 0,
      remainder: (data['remainder_count'] as int?) ?? 0,
      processing: (data['processing_count'] as int?) ?? 0,
    );
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
