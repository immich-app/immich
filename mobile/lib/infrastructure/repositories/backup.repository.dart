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
  ///              (includes processing), excluding handled iOS reverts (syncedChecksum == checksum
  ///              with the prior upload still on the server — trashed counts, like the
  ///              checksum arm; only a hard delete re-opens the asset)
  /// - processing: number of those assets that are still preparing/have a null checksum
  Future<({int total, int remainder, int processing})> getAllCounts(String userId) async {
    const sql = '''
        SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE lae.checksum IS NULL) AS processing_count,
        COUNT(*) FILTER (
            WHERE rae.id IS NULL
            AND (
                lae.checksum IS NULL
                OR lae.synced_checksum IS NULL
                OR lae.synced_checksum != lae.checksum
                OR NOT EXISTS (
                    SELECT 1 FROM main.remote_asset_entity pr
                    WHERE pr.id = lae.prior_remote_id
                )
            )
        ) AS remainder_count
        FROM local_asset_entity lae
        LEFT JOIN main.remote_asset_entity rae
            ON lae.checksum = rae.checksum AND rae.owner_id = ?1
        WHERE (
          EXISTS (
            SELECT 1
            FROM local_album_asset_entity laa
            INNER JOIN main.local_album_entity la on laa.album_id = la.id
            WHERE laa.asset_id = lae.id
                AND la.backup_selection = ?2
          )
          -- iOS burst: a hidden member inherits candidacy from its representative,
          -- which is the one actually in the user's selected album.
          OR (lae.is_burst_representative = 0 AND lae.burst_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM local_asset_entity rep
            INNER JOIN local_album_asset_entity laa ON laa.asset_id = rep.id
            INNER JOIN main.local_album_entity la ON la.id = laa.album_id
            WHERE rep.burst_id = lae.burst_id AND rep.is_burst_representative = 1
                AND la.backup_selection = ?2
                -- exclude-wins propagates to the burst: the rep must not be excluded
                AND NOT EXISTS (
                    SELECT 1 FROM local_album_asset_entity laa2
                    INNER JOIN main.local_album_entity la2 ON la2.id = laa2.album_id
                    WHERE laa2.asset_id = rep.id AND la2.backup_selection = ?3
                )
          ))
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

  /// Backup candidates. With [burstId], scoped to the non-representative members
  /// of that burst — used to re-enqueue a burst's gated frames once its
  /// representative has uploaded, without re-walking (and re-enqueuing) assets
  /// already in flight from the main pass.
  Future<List<LocalAsset>> getCandidates(String userId, {bool onlyHashed = true, String? burstId}) async {
    final selectedAlbumIds = _db.localAlbumEntity.selectOnly(distinct: true)
      ..addColumns([_db.localAlbumEntity.id])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected));

    // iOS burst: a hidden member isn't a member of the user album its rep sits in
    // (Photos only adds the cover), so it inherits backup candidacy from its rep.
    // Matched with a correlated EXISTS (var-safe, mirrors getAllCounts) instead of
    // materialising the burst-id list — a large library could blow the SQLite
    // variable limit.
    final rep = _db.localAssetEntity.createAlias('rep');

    final query = _db.localAssetEntity.select()
      ..where(
        (lae) =>
            (existsQuery(
                  _db.localAlbumAssetEntity.selectOnly()
                    ..addColumns([_db.localAlbumAssetEntity.assetId])
                    ..where(
                      _db.localAlbumAssetEntity.albumId.isInQuery(selectedAlbumIds) &
                          _db.localAlbumAssetEntity.assetId.equalsExp(lae.id),
                    ),
                ) |
                (lae.isBurstRepresentative.equals(false) &
                    lae.burstId.isNotNull() &
                    existsQuery(
                      rep.selectOnly()
                        ..addColumns([rep.id])
                        ..join([
                          innerJoin(
                            _db.localAlbumAssetEntity,
                            _db.localAlbumAssetEntity.assetId.equalsExp(rep.id),
                            useColumns: false,
                          ),
                          innerJoin(
                            _db.localAlbumEntity,
                            _db.localAlbumEntity.id.equalsExp(_db.localAlbumAssetEntity.albumId),
                            useColumns: false,
                          ),
                        ])
                        ..where(
                          rep.burstId.equalsExp(lae.burstId) &
                              rep.isBurstRepresentative.equals(true) &
                              _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
                              // exclude-wins propagates to the burst: a member only
                              // inherits candidacy if its rep is itself a candidate
                              // (in a selected album AND not in an excluded one).
                              rep.id.isNotInQuery(_getExcludedSubquery()),
                        ),
                    ))) &
            notExistsQuery(
              _db.remoteAssetEntity.selectOnly()
                ..addColumns([_db.remoteAssetEntity.checksum])
                ..where(
                  _db.remoteAssetEntity.checksum.equalsExp(lae.checksum) & _db.remoteAssetEntity.ownerId.equals(userId),
                ),
            ) &
            // iOS revert: a reverted local hashes fresh (matches nothing remote),
            // but if it was already reconciled (syncedChecksum == current checksum)
            // it's handled, so don't re-queue it as a fresh upload. Suppress while
            // the prior row exists at all — trashed stays suppressed (same
            // convention as the checksum arm above); only a hard-deleted remote
            // must become a candidate again.
            (lae.checksum.isNull() |
                lae.syncedChecksum.isNull() |
                lae.syncedChecksum.equalsExp(lae.checksum).not() |
                notExistsQuery(
                  _db.remoteAssetEntity.selectOnly()
                    ..addColumns([_db.remoteAssetEntity.id])
                    ..where(_db.remoteAssetEntity.id.equalsExp(lae.priorRemoteId)),
                )) &
            lae.id.isNotInQuery(_getExcludedSubquery()),
      )
      ..orderBy([(localAsset) => OrderingTerm.desc(localAsset.createdAt)]);

    if (onlyHashed) {
      query.where((lae) => lae.checksum.isNotNull());
    }

    if (burstId != null) {
      query.where((lae) => lae.burstId.equals(burstId) & lae.isBurstRepresentative.equals(false));
    }

    return query.map((localAsset) => localAsset.toDto()).get();
  }
}
