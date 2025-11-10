import 'dart:async';

import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

enum SortCandidatesBy { createdAt, attemptCount }

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
  Future<({int total, int remainder, int processing})> getAllCounts(String userId) async {
    const sql = '''
        SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE lae.checksum IS NULL) AS processing_count,
        COUNT(*) FILTER (WHERE rae.id IS NULL) AS remainder_count
        FROM local_asset_entity lae
        LEFT JOIN main.remote_asset_entity rae
            ON lae.checksum = rae.checksum AND rae.owner_id = ?1
        WHERE EXISTS (
            SELECT 1
            FROM local_album_asset_entity laa
            INNER JOIN main.local_album_entity la on laa.album_id = la.id
            WHERE laa.asset_id = lae.id
                AND la.backup_selection = ?2
        )
        AND NOT EXISTS (
            SELECT 1
            FROM local_album_asset_entity laa
            INNER JOIN main.local_album_entity la on laa.album_id = la.id
            WHERE laa.asset_id = lae.id
                AND la.backup_selection = ?3
        );
      ''';

    final row = await _db
        .customSelect(
          sql,
          variables: [
            Variable.withString(userId),
            Variable.withInt(BackupSelection.selected.index),
            Variable.withInt(BackupSelection.excluded.index),
          ],
          readsFrom: {_db.localAlbumAssetEntity, _db.localAlbumEntity, _db.localAssetEntity, _db.remoteAssetEntity},
        )
        .getSingle();

    final data = row.data;
    return (
      total: (data['total_count'] as int?) ?? 0,
      remainder: (data['remainder_count'] as int?) ?? 0,
      processing: (data['processing_count'] as int?) ?? 0,
    );
  }

  Future<List<LocalAsset>> getCandidates(
    String userId, {
    bool onlyHashed = true,
    bool ignoreFailed = false,
    int? limit,
    SortCandidatesBy sortBy = SortCandidatesBy.createdAt,
  }) async {
    final selectedAlbumIds = _db.localAlbumEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumEntity.id])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected));

    final query =
        _db.localAssetEntity.select().join([
          leftOuterJoin(
            _db.localAssetUploadEntity,
            _db.localAssetEntity.id.equalsExp(_db.localAssetUploadEntity.assetId),
            useColumns: false,
          ),
        ])..where(
          existsQuery(
                _db.localAlbumAssetEntity.selectOnly()
                  ..addColumns([_db.localAlbumAssetEntity.assetId])
                  ..where(
                    _db.localAlbumAssetEntity.albumId.isInQuery(selectedAlbumIds) &
                        _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
                  ),
              ) &
              notExistsQuery(
                _db.remoteAssetEntity.selectOnly()
                  ..addColumns([_db.remoteAssetEntity.checksum])
                  ..where(
                    _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
                        _db.remoteAssetEntity.ownerId.equals(userId),
                  ),
              ) &
              _db.localAssetEntity.id.isNotInQuery(_getExcludedSubquery()),
        );

    switch (sortBy) {
      case SortCandidatesBy.createdAt:
        query.orderBy([OrderingTerm.asc(_db.localAssetEntity.createdAt)]);
      case SortCandidatesBy.attemptCount:
        query.orderBy([
          OrderingTerm.asc(_db.localAssetUploadEntity.numberOfAttempts, nulls: NullsOrder.first),
          OrderingTerm.asc(_db.localAssetUploadEntity.lastAttemptAt, nulls: NullsOrder.first),
          OrderingTerm.asc(_db.localAssetEntity.createdAt),
        ]);
    }

    if (onlyHashed) {
      query.where(_db.localAssetEntity.checksum.isNotNull());
    }

    if (ignoreFailed) {
      query.where(_db.localAssetUploadEntity.assetId.isNull());
    }

    if (limit != null) {
      query.limit(limit);
    }

    return query.map((row) => row.readTable(_db.localAssetEntity).toDto()).get();
  }
}
