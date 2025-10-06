import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';

class DriftTrashedLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashedLocalAssetRepository(this._db) : super(_db);

  Future<void> updateHashes(Map<String, String> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }
    final now = DateTime.now();
    return _db.batch((batch) async {
      for (final entry in hashes.entries) {
        batch.update(
          _db.trashedLocalAssetEntity,
          TrashedLocalAssetEntityCompanion(checksum: Value(entry.value), updatedAt: Value(now)),
          where: (e) => e.id.equals(entry.key),
        );
      }
    });
  }

  Future<Iterable<TrashedAsset>> getAssetsToHash(Iterable<String> albumIds) {
    final query = _db.trashedLocalAssetEntity.select()..where((r) => r.albumId.isIn(albumIds) & r.checksum.isNull());
    return query.map((row) => row.toDto()).get();
  }

  Future<Iterable<TrashedAsset>> getToRestore() async {
    final selectedAlbumIds = (_db.selectOnly(_db.localAlbumEntity)
      ..addColumns([_db.localAlbumEntity.id])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected)));

    final rows =
        await (_db.select(_db.trashedLocalAssetEntity).join([
              innerJoin(
                _db.remoteAssetEntity,
                _db.remoteAssetEntity.checksum.equalsExp(_db.trashedLocalAssetEntity.checksum),
              ),
            ])..where(
              _db.trashedLocalAssetEntity.albumId.isInQuery(selectedAlbumIds) &
                  _db.remoteAssetEntity.deletedAt.isNull(),
            ))
            .get();

    return rows.map((result) => result.readTable(_db.trashedLocalAssetEntity).toDto());
  }

  /// Applies resulted snapshot of trashed assets:
  /// - upserts incoming rows
  /// - deletes rows that are not present in the snapshot
  Future<void> applyTrashSnapshot(Iterable<TrashedAsset> assets, String albumId) async {
    if (assets.isEmpty) {
      await _db.delete(_db.trashedLocalAssetEntity).go();
      return;
    }
    Map<String, String> localChecksumById = await _getCachedChecksums(assets);
    return _db.transaction(() async {
      await _db.batch((batch) {
        for (final asset in assets) {
          final effectiveChecksum = localChecksumById[asset.id] ?? asset.checksum;
          final companion = TrashedLocalAssetEntityCompanion.insert(
            id: asset.id,
            albumId: albumId,
            checksum: effectiveChecksum == null ? const Value.absent() : Value(effectiveChecksum),
            name: asset.name,
            type: asset.type,
            createdAt: Value(asset.createdAt),
            updatedAt: Value(asset.updatedAt),
            width: Value(asset.width),
            height: Value(asset.height),
            durationInSeconds: Value(asset.durationInSeconds),
            isFavorite: Value(asset.isFavorite),
            orientation: Value(asset.orientation),
          );

          batch.insert<$TrashedLocalAssetEntityTable, TrashedLocalAssetEntityData>(
            _db.trashedLocalAssetEntity,
            companion,
            onConflict: DoUpdate((_) => companion, where: (old) => old.updatedAt.isNotValue(asset.updatedAt)),
          );
        }
      });

      final keepIds = assets.map((asset) => asset.id);

      if (keepIds.length <= 32000) {
        await (_db.delete(_db.trashedLocalAssetEntity)..where((row) => row.id.isNotIn(keepIds))).go();
      } else {
        final keepIdsSet = keepIds.toSet();
        final existingIds = await (_db.selectOnly(
          _db.trashedLocalAssetEntity,
        )..addColumns([_db.trashedLocalAssetEntity.id])).map((r) => r.read(_db.trashedLocalAssetEntity.id)!).get();
        final idToDelete = existingIds.where((id) => !keepIdsSet.contains(id));
        await _db.batch((batch) {
          for (final id in idToDelete) {
            batch.deleteWhere(_db.trashedLocalAssetEntity, (row) => row.id.equals(id));
          }
        });
      }
    });
  }

  Future<void> saveTrashedAssets(Iterable<TrashedAsset> assets) async {
    if (assets.isEmpty) {
      return;
    }

    Map<String, String> localChecksumById = await _getCachedChecksums(assets);

    await _db.batch((batch) {
      for (final asset in assets) {
        final effectiveChecksum = localChecksumById[asset.id] ?? asset.checksum;
        final companion = TrashedLocalAssetEntityCompanion.insert(
          id: asset.id,
          albumId: asset.albumId,
          name: asset.name,
          type: asset.type,
          checksum: effectiveChecksum == null ? const Value.absent() : Value(effectiveChecksum),
          createdAt: Value(asset.createdAt),
          width: Value(asset.width),
          height: Value(asset.height),
          durationInSeconds: Value(asset.durationInSeconds),
          isFavorite: Value(asset.isFavorite),
          orientation: Value(asset.orientation),
        );
        batch.insert<$TrashedLocalAssetEntityTable, TrashedLocalAssetEntityData>(
          _db.trashedLocalAssetEntity,
          companion,
          onConflict: DoUpdate((_) => companion, where: (old) => old.updatedAt.isNotValue(asset.updatedAt)),
        );
      }
    });
  }

  Stream<int> watchCount() {
    return (_db.selectOnly(_db.trashedLocalAssetEntity)..addColumns([_db.trashedLocalAssetEntity.id.count()]))
        .watchSingle()
        .map((row) => row.read<int>(_db.trashedLocalAssetEntity.id.count()) ?? 0);
  }

  Stream<int> watchHashedCount() {
    return (_db.selectOnly(_db.trashedLocalAssetEntity)
          ..addColumns([_db.trashedLocalAssetEntity.id.count()])
          ..where(_db.trashedLocalAssetEntity.checksum.isNotNull()))
        .watchSingle()
        .map((row) => row.read<int>(_db.trashedLocalAssetEntity.id.count()) ?? 0);
  }

  Future<void> trashLocalAsset(Map<AlbumId, List<LocalAsset>> assetsByAlbums) async {
    if (assetsByAlbums.isEmpty) {
      return;
    }

    final companions = <TrashedLocalAssetEntityCompanion>[];
    final idToDelete = <String>{};

    for (final entry in assetsByAlbums.entries) {
      for (final asset in entry.value) {
        idToDelete.add(asset.id);
        companions.add(
          TrashedLocalAssetEntityCompanion(
            id: Value(asset.id),
            name: Value(asset.name),
            albumId: Value(entry.key),
            checksum: asset.checksum == null ? const Value.absent() : Value(asset.checksum),
            type: Value(asset.type),
            width: Value(asset.width),
            height: Value(asset.height),
            durationInSeconds: Value(asset.durationInSeconds),
            isFavorite: Value(asset.isFavorite),
            orientation: Value(asset.orientation),
            createdAt: Value(asset.createdAt),
            updatedAt: Value(asset.updatedAt),
          ),
        );
      }
    }

    await _db.transaction(() async {
      await _db.batch((batch) {
        for (final slice in companions.slices(32000)) {
          batch.insertAllOnConflictUpdate(_db.trashedLocalAssetEntity, slice);
        }

        for (final id in idToDelete) {
          batch.deleteWhere(_db.localAssetEntity, (row) => row.id.equals(id));
        }
      });
    });
  }

  Future<void> restoreLocalAssets(Iterable<String> ids) async {
    if (ids.isEmpty) {
      return;
    }

    final trashedAssets = await (_db.select(_db.trashedLocalAssetEntity)..where((tbl) => tbl.id.isIn(ids))).get();

    if (trashedAssets.isEmpty) {
      return;
    }

    final localAssets = trashedAssets.map((e) {
      return LocalAssetEntityCompanion.insert(
        id: e.id,
        name: e.name,
        type: e.type,
        createdAt: Value(e.createdAt),
        updatedAt: Value(e.updatedAt),
        width: Value(e.width),
        height: Value(e.height),
        durationInSeconds: Value(e.durationInSeconds),
        checksum: Value(e.checksum),
        isFavorite: Value(e.isFavorite),
        orientation: Value(e.orientation),
      );
    }).toList();

    await _db.transaction(() async {
      await _db.batch((batch) {
        batch.insertAllOnConflictUpdate(_db.localAssetEntity, localAssets);
        for (final id in ids) {
          batch.deleteWhere(_db.trashedLocalAssetEntity, (row) => row.id.equals(id));
        }
      });
    });
  }

  //attempt to reuse existing checksums
  Future<Map<String, String>> _getCachedChecksums(Iterable<TrashedAsset> trashUpdates) async {
    final ids = trashUpdates.map((e) => e.id).toSet();
    final rows =
        await (_db.selectOnly(_db.localAssetEntity)
              ..where(_db.localAssetEntity.id.isIn(ids) & _db.localAssetEntity.checksum.isNotNull())
              ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum]))
            .get();

    final localChecksumById = {
      for (final r in rows) r.read(_db.localAssetEntity.id)!: r.read(_db.localAssetEntity.checksum)!,
    };
    return localChecksumById;
  }
}
