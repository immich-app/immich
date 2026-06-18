import 'dart:async';

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

class RemovalCandidatesResult {
  final List<LocalAsset> assets;
  final int totalBytes;

  const RemovalCandidatesResult({required this.assets, required this.totalBytes});
}

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

  Future<void> markSynced(String localId, {required String priorRemoteId, required String? syncedChecksum}) {
    return (_db.localAssetEntity.update()..where((e) => e.id.equals(localId))).write(
      LocalAssetEntityCompanion(priorRemoteId: Value(priorRemoteId), syncedChecksum: Value(syncedChecksum)),
    );
  }

  /// The remote id to stack a burst member under: the prior_remote_id of any
  /// already-uploaded member of the same burst (null until the first one lands).
  /// The representative uploads first (non-reps gate on this), so the first hit
  /// is the rep and `keepPrimary` pins it as the stack primary. Deliberately NOT
  /// filtered to the representative: iOS can move the rep flag (a Photos re-pick),
  /// and any in-stack member resolves to the same stack via linkAsset — so
  /// returning whichever member uploaded keeps every later frame in one stack
  /// instead of spawning a second when the cover moves. Stable order so repeated
  /// lookups pick the same anchor.
  Future<String?> getBurstParentRemoteId(String burstId, {String? ownerId}) async {
    // Prefer the remote id stamped by a frame this device already uploaded.
    final row =
        await (_db.localAssetEntity.selectOnly()
              ..addColumns([_db.localAssetEntity.priorRemoteId])
              ..where(_db.localAssetEntity.burstId.equals(burstId) & _db.localAssetEntity.priorRemoteId.isNotNull())
              ..orderBy([OrderingTerm.asc(_db.localAssetEntity.createdAt), OrderingTerm.asc(_db.localAssetEntity.id)])
              ..limit(1))
            .getSingleOrNull();
    final priorRemoteId = row?.read(_db.localAssetEntity.priorRemoteId);
    if (priorRemoteId != null) {
      return priorRemoteId;
    }
    if (ownerId == null) {
      return null;
    }
    // Pre-existing burst: the representative was backed up before this feature, so
    // no local frame ever stamped a prior. Anchor onto the rep's already-synced
    // remote row (matched by checksum) so the hidden members can still stack.
    final rep =
        await (_db.localAssetEntity.selectOnly()
              ..addColumns([_db.remoteAssetEntity.id])
              ..join([
                innerJoin(
                  _db.remoteAssetEntity,
                  _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
                      _db.remoteAssetEntity.ownerId.equals(ownerId),
                  useColumns: false,
                ),
              ])
              ..where(
                _db.localAssetEntity.burstId.equals(burstId) & _db.localAssetEntity.isBurstRepresentative.equals(true),
              )
              ..orderBy([OrderingTerm.asc(_db.localAssetEntity.createdAt), OrderingTerm.asc(_db.localAssetEntity.id)])
              ..limit(1))
            .getSingleOrNull();
    return rep?.read(_db.remoteAssetEntity.id);
  }

  /// Whether the burst group still has a representative frame. A group can end up
  /// rep-less (every frame is_burst_representative=0) after a Photos "Keep
  /// Everything" / re-pick — its members can never anchor a stack, so callers
  /// upload them standalone instead of gating forever.
  Future<bool> burstHasRepresentative(String burstId) async {
    final row =
        await (_db.localAssetEntity.selectOnly()
              ..addColumns([_db.localAssetEntity.id])
              ..where(
                _db.localAssetEntity.burstId.equals(burstId) & _db.localAssetEntity.isBurstRepresentative.equals(true),
              )
              ..limit(1))
            .getSingleOrNull();
    return row != null;
  }

  /// Drops the edit-stacking stamps so the next backup cycle re-resolves the
  /// asset from scratch (used when the server says the stamped prior is gone).
  Future<void> clearSyncStamps(String localId) {
    return (_db.localAssetEntity.update()..where((e) => e.id.equals(localId))).write(
      const LocalAssetEntityCompanion(priorRemoteId: Value(null), syncedChecksum: Value(null)),
    );
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

  Future<Map<String, List<LocalAsset>>> getAssetsFromBackupAlbums(Iterable<String> remoteIds) async {
    if (remoteIds.isEmpty) {
      return {};
    }

    final result = <String, List<LocalAsset>>{};

    for (final slice in remoteIds.toSet().slices(kDriftMaxChunk)) {
      final rows =
          await (_db.select(_db.localAlbumAssetEntity).join([
                innerJoin(
                  _db.localAlbumEntity,
                  _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
                  useColumns: false,
                ),
                innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
                innerJoin(
                  _db.remoteAssetEntity,
                  _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
                  useColumns: false,
                ),
              ])..where(
                _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
                    _db.remoteAssetEntity.id.isIn(slice),
              ))
              .get();

      for (final row in rows) {
        final albumId = row.readTable(_db.localAlbumAssetEntity).albumId;
        final asset = row.readTable(_db.localAssetEntity).toDto();
        (result[albumId] ??= <LocalAsset>[]).add(asset);
      }
    }

    return result;
  }

  Future<RemovalCandidatesResult> getRemovalCandidates(
    String userId,
    DateTime cutoffDate, {
    AssetKeepType keepMediaType = AssetKeepType.none,
    bool keepFavorites = true,
    Set<String> keepAlbumIds = const {},
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
      leftOuterJoin(_db.remoteExifEntity, _db.remoteAssetEntity.id.equalsExp(_db.remoteExifEntity.assetId)),
    ]);

    Expression<bool> whereClause =
        _db.localAssetEntity.createdAt.isSmallerOrEqualValue(cutoffDate) &
        _db.remoteAssetEntity.ownerId.equals(userId) &
        _db.remoteAssetEntity.deletedAt.isNull();

    // Exclude assets that are in iOS shared albums
    whereClause = whereClause & _db.localAssetEntity.id.isNotInQuery(iosSharedAlbumAssets);

    if (keepAlbumIds.isNotEmpty) {
      final keepAlbumAssets = _db.localAlbumAssetEntity.selectOnly()
        ..addColumns([_db.localAlbumAssetEntity.assetId])
        ..where(_db.localAlbumAssetEntity.albumId.isIn(keepAlbumIds));
      whereClause = whereClause & _db.localAssetEntity.id.isNotInQuery(keepAlbumAssets);
    }

    if (keepMediaType == AssetKeepType.photosOnly) {
      // Keep photos = delete only videos
      whereClause = whereClause & _db.localAssetEntity.type.equalsValue(AssetType.video);
    } else if (keepMediaType == AssetKeepType.videosOnly) {
      // Keep videos = delete only photos
      whereClause = whereClause & _db.localAssetEntity.type.equalsValue(AssetType.image);
    }

    if (keepFavorites) {
      whereClause =
          whereClause & _db.localAssetEntity.isFavorite.equals(false) & _db.remoteAssetEntity.isFavorite.equals(false);
    }

    query.where(whereClause);

    final rows = await query.get();
    final assets = rows.map((row) => row.readTable(_db.localAssetEntity).toDto()).toList();
    final totalBytes = rows.fold<int>(0, (sum, row) {
      final fileSize = row.readTableOrNull(_db.remoteExifEntity)?.fileSize;
      return sum + (fileSize ?? 0);
    });

    return RemovalCandidatesResult(assets: assets, totalBytes: totalBytes);
  }

  Future<List<LocalAsset>> getEmptyCloudIdAssets() {
    final query = _db.localAssetEntity.select()..where((row) => row.iCloudId.isNull());
    return query.map((row) => row.toDto()).get();
  }

  Future<void> reconcileHashesFromCloudId() async {
    await _db.customUpdate(
      '''
      UPDATE local_asset_entity
      SET checksum = remote_asset_entity.checksum
      FROM remote_asset_cloud_id_entity
      INNER JOIN remote_asset_entity
        ON remote_asset_cloud_id_entity.asset_id = remote_asset_entity.id
      WHERE local_asset_entity.i_cloud_id = remote_asset_cloud_id_entity.cloud_id
        AND local_asset_entity.checksum IS NULL
        AND remote_asset_cloud_id_entity.adjustment_time IS local_asset_entity.adjustment_time
        AND remote_asset_cloud_id_entity.latitude IS local_asset_entity.latitude
        AND remote_asset_cloud_id_entity.longitude IS local_asset_entity.longitude
        AND remote_asset_cloud_id_entity.created_at IS local_asset_entity.created_at
      ''',
      updates: {_db.localAssetEntity},
      updateKind: UpdateKind.update,
    );
  }
}
