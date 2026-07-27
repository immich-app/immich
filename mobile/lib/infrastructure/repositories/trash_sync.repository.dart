import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  // Prunes asset markers for assets that are now live on the server
  Future<void> pruneStaleMarkers() async {
    final liveChecksums = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull() & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()));

    await _db.transaction(() async {
      await (_db.delete(_db.serverDeletedChecksumEntity)..where((t) => t.checksum.isInQuery(liveChecksums))).go();
      await (_db.delete(_db.trashSyncEntity)..where(
            (t) =>
                t.checksum.isInQuery(liveChecksums) &
                t.status.isInValues([
                  TrashSyncStatus.pending,
                  TrashSyncStatus.reviewPending,
                  TrashSyncStatus.reviewRejected,
                ]),
          ))
          .go();
    });
  }

  // Prunes dismissed assets marker for assets that are not on the server anymore
  Future<void> pruneDismissedMarkers() async {
    final softDeletedChecksums = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(
        _db.remoteAssetEntity.deletedAt.isNotNull() & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
      );

    final serverDeletedChecksums = _db.selectOnly(_db.serverDeletedChecksumEntity)
      ..addColumns([_db.serverDeletedChecksumEntity.checksum]);

    await (_db.delete(_db.trashSyncEntity)..where(
          (t) =>
              t.status.equalsValue(.dismissed) &
              t.checksum.isNotInQuery(softDeletedChecksums) &
              t.checksum.isNotInQuery(serverDeletedChecksums),
        ))
        .go();
  }

  // Prunes pending markers for assets that has been modified locally
  Future<void> prunePendingMarkers() async {
    final staleIds = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.assetId])
      ..join([
        innerJoin(
          _db.localAssetEntity,
          _db.localAssetEntity.id.equalsExp(_db.trashSyncEntity.assetId),
          useColumns: false,
        ),
      ])
      ..where(
        _db.trashSyncEntity.status.equalsValue(.pending) &
            _db.localAssetEntity.checksum.isNotNull() &
            _db.localAssetEntity.checksum.equalsExp(_db.trashSyncEntity.checksum).not(),
      );
    await (_db.delete(_db.trashSyncEntity)..where((t) => t.assetId.isInQuery(staleIds))).go();
  }

  Future<void> recordHardDeletedChecksums(Iterable<String> remoteIds) async {
    for (final slice in remoteIds.toSet().slices(kDriftMaxChunk)) {
      final timelineAt = coalesce([_db.remoteAssetEntity.localDateTime, _db.remoteAssetEntity.createdAt]);
      final rows =
          await (_db.selectOnly(_db.remoteAssetEntity, distinct: true)
                ..addColumns([_db.remoteAssetEntity.checksum, timelineAt])
                ..where(
                  _db.remoteAssetEntity.id.isIn(slice) & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
                ))
              .map((r) => (checksum: r.read(_db.remoteAssetEntity.checksum)!, timelineAt: r.read(timelineAt)))
              .get();
      if (rows.isEmpty) {
        continue;
      }

      await _db.batch((batch) {
        for (final row in rows) {
          batch.insert(
            _db.serverDeletedChecksumEntity,
            ServerDeletedChecksumEntityCompanion.insert(checksum: row.checksum, timelineAt: Value(row.timelineAt)),
            onConflict: DoUpdate((_) => ServerDeletedChecksumEntityCompanion(timelineAt: Value(row.timelineAt))),
          );
        }
      });
    }
  }

  Future<void> recordSoftDeleteAssets() => _recordAssets(
    innerJoin(
      _db.remoteAssetEntity,
      _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
          _db.remoteAssetEntity.deletedAt.isNotNull() &
          _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
      useColumns: false,
    ),
  );

  Future<void> recordHardDeletedAssets() => _recordAssets(
    innerJoin(
      _db.serverDeletedChecksumEntity,
      _db.serverDeletedChecksumEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
      useColumns: false,
    ),
  );

  Future<void> recordSoftDeleteReviewAssets() => _recordReviewAssets(
    innerJoin(
      _db.remoteAssetEntity,
      _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
          _db.remoteAssetEntity.deletedAt.isNotNull() &
          _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
      useColumns: false,
    ),
    remoteDeletedAt: _db.remoteAssetEntity.deletedAt,
  );

  Future<void> recordHardDeletedReviewAssets() => _recordReviewAssets(
    innerJoin(
      _db.serverDeletedChecksumEntity,
      _db.serverDeletedChecksumEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
      useColumns: false,
    ),
  );

  Future<void> _recordReviewAssets(Join contentJoin, {Expression<DateTime>? remoteDeletedAt}) async {
    final reviewPending = Constant(TrashSyncStatus.reviewPending.index);
    final selectedAssetsQuery = _selectedAssetsQuery();
    final reviewDecisionsQuery = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.checksum])
      ..where(
        _db.trashSyncEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
            _db.trashSyncEntity.status.isIn([
              TrashSyncStatus.reviewRejected.index,
              TrashSyncStatus.reviewApproved.index,
            ]),
      );
    final nonReviewPendingMarkerQuery = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.assetId])
      ..where(
        _db.trashSyncEntity.assetId.equalsExp(_db.localAssetEntity.id) &
            _db.trashSyncEntity.status.equalsValue(.reviewPending).not(),
      );
    final source = _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum, reviewPending])
      ..join([contentJoin])
      ..where(
        _db.localAssetEntity.checksum.isNotNull() &
            existsQuery(selectedAssetsQuery) &
            notExistsQuery(reviewDecisionsQuery) &
            notExistsQuery(nonReviewPendingMarkerQuery),
      );
    if (remoteDeletedAt != null) {
      final newerOrEqualReviewPendingMarkerQuery = _db.selectOnly(_db.trashSyncEntity)
        ..addColumns([_db.trashSyncEntity.assetId])
        ..where(
          _db.trashSyncEntity.assetId.equalsExp(_db.localAssetEntity.id) &
              _db.trashSyncEntity.status.equalsValue(.reviewPending) &
              _db.trashSyncEntity.remoteDeletedAt.isNotNull() &
              _db.trashSyncEntity.remoteDeletedAt.isBiggerOrEqual(remoteDeletedAt),
        );
      source
        ..addColumns([remoteDeletedAt])
        ..where(notExistsQuery(newerOrEqualReviewPendingMarkerQuery));
    }

    await _db
        .into(_db.trashSyncEntity)
        .insertFromSelect(
          source,
          columns: {
            _db.trashSyncEntity.assetId: _db.localAssetEntity.id,
            _db.trashSyncEntity.checksum: _db.localAssetEntity.checksum,
            _db.trashSyncEntity.status: reviewPending,
            if (remoteDeletedAt != null) _db.trashSyncEntity.remoteDeletedAt: remoteDeletedAt,
          },
          mode: .insertOrReplace,
        );
  }

  Future<void> approveReviewChecksums(Iterable<String> checksums) async {
    final set = checksums.toSet();
    if (set.isEmpty) {
      return;
    }

    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.update(_db.trashSyncEntity)
            ..where((t) => t.checksum.isIn(slice) & t.status.equalsValue(.reviewPending)))
          .write(const TrashSyncEntityCompanion(status: .new(.reviewApproved)));
    }
  }

  Future<void> approveReviewAssetIds(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }

    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.update(_db.trashSyncEntity)
            ..where((t) => t.assetId.isIn(slice) & t.status.equalsValue(.reviewPending)))
          .write(const TrashSyncEntityCompanion(status: .new(.reviewApproved)));
    }
  }

  Future<void> approveSelectedReviewChecksums(Map<String, List<String>> approvedAssetIdsByChecksum) async {
    final approved = approvedAssetIdsByChecksum.map(
      (checksum, assetIds) => MapEntry(checksum, assetIds.toSet().toList(growable: false)),
    )..removeWhere((_, assetIds) => assetIds.isEmpty);
    if (approved.isEmpty) {
      return;
    }

    await _db.transaction(() async {
      for (final checksumSlice in approved.keys.slices(kDriftMaxChunk)) {
        final pending = await (_db.select(
          _db.trashSyncEntity,
        )..where((t) => t.checksum.isIn(checksumSlice) & t.status.equalsValue(.reviewPending))).get();
        final pendingByChecksum = groupBy(pending, (row) => row.checksum);

        for (final checksum in checksumSlice) {
          final approvedAssetIds = approved[checksum] ?? const <String>[];
          for (final assetId in approvedAssetIds) {
            final pendingForChecksum = pendingByChecksum[checksum];
            if (pendingForChecksum == null || pendingForChecksum.isEmpty) {
              continue;
            }

            final source = pendingForChecksum.first;
            if (source.assetId != assetId) {
              await (_db.delete(_db.trashSyncEntity)..where((t) => t.assetId.equals(source.assetId))).go();
            }
            await _db
                .into(_db.trashSyncEntity)
                .insertOnConflictUpdate(
                  TrashSyncEntityCompanion.insert(
                    assetId: assetId,
                    checksum: checksum,
                    status: const Value(TrashSyncStatus.reviewApproved),
                    remoteDeletedAt: Value.absentIfNull(source.remoteDeletedAt),
                    assetUpdatedAt: Value.absentIfNull(source.assetUpdatedAt),
                  ),
                );
          }
        }
      }
    });
  }

  Future<List<String>> getReviewAssetIdsForChecksums(Iterable<String> checksums) async {
    final assetIdsByChecksum = await getReviewAssetIdsByChecksum(checksums);
    return assetIdsByChecksum.values.expand((ids) => ids).toList();
  }

  Future<Map<String, List<String>>> getReviewAssetIdsByChecksum(Iterable<String> checksums) async {
    final set = checksums.toSet();
    if (set.isEmpty) {
      return const {};
    }

    final assetIdsByChecksum = <String, List<String>>{};
    final selectedAssetsQuery = _selectedAssetsQuery();
    for (final slice in set.slices(kDriftMaxChunk)) {
      final rows =
          await (_db.selectOnly(_db.localAssetEntity, distinct: true)
                ..addColumns([_db.localAssetEntity.checksum, _db.localAssetEntity.id])
                ..join([
                  innerJoin(
                    _db.trashSyncEntity,
                    _db.trashSyncEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
                    useColumns: false,
                  ),
                ])
                ..where(
                  _db.localAssetEntity.checksum.isIn(slice) &
                      _db.trashSyncEntity.checksum.isIn(slice) &
                      _db.trashSyncEntity.status.equalsValue(.reviewPending) &
                      existsQuery(selectedAssetsQuery),
                ))
              .map(
                (row) =>
                    (checksum: row.read(_db.localAssetEntity.checksum)!, assetId: row.read(_db.localAssetEntity.id)!),
              )
              .get();
      for (final row in rows) {
        (assetIdsByChecksum[row.checksum] ??= []).add(row.assetId);
      }
    }
    return assetIdsByChecksum;
  }

  Future<Set<String>> rejectReviewChecksums(Iterable<String> checksums) async {
    final set = checksums.toSet();
    if (set.isEmpty) {
      return const {};
    }
    final rejectedChecksums = <String>{};
    final matchingSelectedLocalAssets = _selectedLocalAssetsMatchingReviewChecksum(_db.trashSyncEntity);
    for (final slice in set.slices(kDriftMaxChunk)) {
      final matchingChecksums =
          await (_db.selectOnly(_db.trashSyncEntity, distinct: true)
                ..addColumns([_db.trashSyncEntity.checksum])
                ..where(
                  _db.trashSyncEntity.checksum.isIn(slice) &
                      _db.trashSyncEntity.status.equalsValue(.reviewPending) &
                      existsQuery(matchingSelectedLocalAssets),
                ))
              .map((row) => row.read(_db.trashSyncEntity.checksum)!)
              .get();
      rejectedChecksums.addAll(matchingChecksums);

      if (matchingChecksums.isNotEmpty) {
        await (_db.update(_db.trashSyncEntity)..where(
              (t) =>
                  t.checksum.isIn(slice) &
                  t.status.equalsValue(.reviewPending) &
                  existsQuery(_selectedLocalAssetsMatchingReviewChecksum(t)),
            ))
            .write(const TrashSyncEntityCompanion(status: .new(.reviewRejected)));
      }
    }
    return rejectedChecksums;
  }

  Future<void> upsertReviewRejections(Iterable<String> checksums) async {
    final set = checksums.toSet();
    if (set.isEmpty) {
      return;
    }

    final selectedAssetsQuery = _selectedAssetsQuery();
    for (final slice in set.slices(kDriftMaxChunk)) {
      final reviewRejected = Constant(TrashSyncStatus.reviewRejected.index);
      await (_db.update(_db.trashSyncEntity)..where(
            (t) =>
                t.checksum.isIn(slice) &
                t.status.isIn([TrashSyncStatus.reviewPending.index, TrashSyncStatus.reviewRejected.index]),
          ))
          .write(const TrashSyncEntityCompanion(status: .new(.reviewRejected)));

      final existingReviewDecisionQuery = _db.selectOnly(_db.trashSyncEntity)
        ..addColumns([_db.trashSyncEntity.checksum])
        ..where(
          _db.trashSyncEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
              _db.trashSyncEntity.status.isIn([
                TrashSyncStatus.reviewRejected.index,
                TrashSyncStatus.reviewApproved.index,
              ]),
        );
      final source = _db.selectOnly(_db.localAssetEntity)
        ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum, reviewRejected])
        ..where(
          _db.localAssetEntity.checksum.isIn(slice) &
              existsQuery(selectedAssetsQuery) &
              notExistsQuery(existingReviewDecisionQuery),
        );

      await _db
          .into(_db.trashSyncEntity)
          .insertFromSelect(
            source,
            columns: {
              _db.trashSyncEntity.assetId: _db.localAssetEntity.id,
              _db.trashSyncEntity.checksum: _db.localAssetEntity.checksum,
              _db.trashSyncEntity.status: reviewRejected,
            },
            mode: .insertOrIgnore,
          );
    }
  }

  JoinedSelectStatement _selectedAssetsQuery() => _db.selectOnly(_db.localAlbumAssetEntity)
    ..addColumns([_db.localAlbumAssetEntity.assetId])
    ..where(
      _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id) &
          _db.localAlbumAssetEntity.albumId.isInQuery(
            _db.selectOnly(_db.localAlbumEntity)
              ..addColumns([_db.localAlbumEntity.id])
              ..where(_db.localAlbumEntity.backupSelection.equalsValue(.selected)),
          ),
    );

  Future<void> _recordAssets(Join contentJoin) async {
    final excludedAssetIds = _db.selectOnly(_db.localAlbumAssetEntity)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumEntity.id.equalsExp(_db.localAlbumAssetEntity.albumId),
          useColumns: false,
        ),
      ])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(.excluded));

    final selectedAssetsQuery = _selectedAssetsQuery();

    final dismissedAssetsQuery = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.assetId])
      ..where(
        _db.trashSyncEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
            _db.trashSyncEntity.status.equalsValue(.dismissed),
      );

    final source = _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum, _db.localAssetEntity.updatedAt])
      ..join([contentJoin])
      ..where(
        _db.localAssetEntity.checksum.isNotNull() &
            existsQuery(selectedAssetsQuery) &
            _db.localAssetEntity.id.isNotInQuery(excludedAssetIds) &
            notExistsQuery(dismissedAssetsQuery),
      );

    await _db
        .into(_db.trashSyncEntity)
        .insertFromSelect(
          source,
          columns: {
            _db.trashSyncEntity.assetId: _db.localAssetEntity.id,
            _db.trashSyncEntity.checksum: _db.localAssetEntity.checksum,
            _db.trashSyncEntity.assetUpdatedAt: _db.localAssetEntity.updatedAt,
          },
          mode: .insertOrIgnore,
        );
  }

  Future<void> markTrashed(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    await _db.transaction(() async {
      for (final slice in set.slices(kDriftMaxChunk)) {
        await (_db.update(
          _db.trashSyncEntity,
        )..where((t) => t.assetId.isIn(slice))).write(const TrashSyncEntityCompanion(status: .new(.trashed)));
        await (_db.delete(_db.localAssetEntity)..where((t) => t.id.isIn(slice))).go();
      }
    });
  }

  Future<void> markRestored(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.update(
        _db.trashSyncEntity,
      )..where((t) => t.assetId.isIn(slice))).write(const TrashSyncEntityCompanion(status: .new(.restored)));
    }
  }

  Future<void> restoreChecksums() async {
    final restored = await (_db.select(_db.trashSyncEntity)..where((t) => t.status.equalsValue(.restored))).get();
    if (restored.isEmpty) {
      return;
    }

    await _db.batch((batch) {
      for (final row in restored) {
        final assetUpdatedAt = row.assetUpdatedAt;
        if (assetUpdatedAt == null) {
          continue;
        }

        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: .new(row.checksum)),
          where: (t) => t.id.equals(row.assetId) & t.checksum.isNull() & t.updatedAt.equals(assetUpdatedAt),
        );
      }

      batch.deleteWhere(_db.trashSyncEntity, (t) => t.status.equalsValue(.restored));
    });
  }

  // Mark assets that were previously marked as trashed but are now live on the device as dismissed
  Future<void> reconcileTrashed(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }

    JoinedSelectStatement localAssetQuery($TrashSyncEntityTable trash) => _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.id])
      ..where(_db.localAssetEntity.id.equalsExp(trash.assetId));

    await _db.transaction(() async {
      for (final slice in set.slices(kDriftMaxChunk)) {
        await (_db.update(_db.trashSyncEntity)..where((t) => t.assetId.isIn(slice) & existsQuery(localAssetQuery(t))))
            .write(const TrashSyncEntityCompanion(status: .new(.dismissed)));

        await (_db.delete(
          _db.trashSyncEntity,
        )..where((t) => t.assetId.isIn(slice) & notExistsQuery(localAssetQuery(t)))).go();
      }
    });
  }

  Future<void> deleteMarkers(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.delete(_db.trashSyncEntity)..where((t) => t.assetId.isIn(slice))).go();
    }
  }

  Future<List<String>> getPendingAssetIds() =>
      _trashSyncAssetIdsWhere(_db.trashSyncEntity.status.equalsValue(.pending));

  Future<List<String>> getTrashedAssetIds() =>
      _trashSyncAssetIdsWhere(_db.trashSyncEntity.status.equalsValue(.trashed));

  Stream<int> watchPendingReviewCount() {
    final matchingSelectedLocalAssets = _selectedLocalAssetsMatchingReviewChecksum(_db.trashSyncEntity);
    final pendingChecksumCount = _db.trashSyncEntity.checksum.count(distinct: true);
    return (_db.selectOnly(_db.trashSyncEntity)
          ..addColumns([pendingChecksumCount])
          ..where(_db.trashSyncEntity.status.equalsValue(.reviewPending) & existsQuery(matchingSelectedLocalAssets)))
        .map((row) => row.read(pendingChecksumCount) ?? 0)
        .watchSingle();
  }

  Stream<bool> isWaitingForTrashApproval(String checksum) {
    final matchingSelectedLocalAssets = _selectedLocalAssetsMatchingReviewChecksum(_db.trashSyncEntity);
    return (_db.selectOnly(_db.trashSyncEntity)
          ..addColumns([_db.trashSyncEntity.assetId.count()])
          ..where(
            _db.trashSyncEntity.checksum.equals(checksum) &
                _db.trashSyncEntity.status.equalsValue(.reviewPending) &
                existsQuery(matchingSelectedLocalAssets),
          ))
        .map((row) => (row.read(_db.trashSyncEntity.assetId.count()) ?? 0) > 0)
        .watchSingle();
  }

  JoinedSelectStatement _selectedLocalAssetsMatchingReviewChecksum($TrashSyncEntityTable trash) =>
      _db.selectOnly(_db.localAssetEntity)
        ..addColumns([_db.localAssetEntity.id])
        ..where(_db.localAssetEntity.checksum.equalsExp(trash.checksum) & existsQuery(_selectedAssetsQuery()));

  Future<List<String>> _trashSyncAssetIdsWhere(Expression<bool> filter) {
    return (_db.selectOnly(_db.trashSyncEntity)
          ..addColumns([_db.trashSyncEntity.assetId])
          ..where(filter))
        .map((row) => row.read(_db.trashSyncEntity.assetId)!)
        .get();
  }

  Future<List<String>> getRestorableAssetIds() {
    return (_db.selectOnly(_db.trashSyncEntity, distinct: true)
          ..addColumns([_db.trashSyncEntity.assetId])
          ..join([
            innerJoin(
              _db.remoteAssetEntity,
              _db.remoteAssetEntity.checksum.equalsExp(_db.trashSyncEntity.checksum),
              useColumns: false,
            ),
          ])
          ..where(
            _db.trashSyncEntity.status.isIn([TrashSyncStatus.trashed.index, TrashSyncStatus.reviewApproved.index]) &
                _db.remoteAssetEntity.deletedAt.isNull() &
                _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
          ))
        .map((row) => row.read(_db.trashSyncEntity.assetId)!)
        .get();
  }
}
