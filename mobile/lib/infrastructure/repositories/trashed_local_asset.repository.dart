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

  Future<void> updateChecksums(Iterable<TrashedAsset> assets) {
    if (assets.isEmpty) {
      return Future.value();
    }
    final now = DateTime.now();
    return _db.batch((batch) async {
      for (final asset in assets) {
        batch.update(
          _db.trashedLocalAssetEntity,
          TrashedLocalAssetEntityCompanion(checksum: Value(asset.checksum), updatedAt: Value(now)),
          where: (e) => e.id.equals(asset.id),
        );
      }
    });
  }

  Future<Iterable<TrashedAsset>> getToHash(String albumId) {
    final query = _db.trashedLocalAssetEntity.select()..where((r) => r.albumId.equals(albumId) & r.checksum.isNull());
    return query.map((row) => row.toDto()).get();
  }

  Future<Iterable<TrashedAsset>> getToRestore() async {
    final trashed = _db.trashedLocalAssetEntity;
    final remote = _db.remoteAssetEntity;
    final album = _db.localAlbumEntity;

    final selectedAlbumIds = (_db.selectOnly(album)
      ..addColumns([album.id])
      ..where(album.backupSelection.equalsValue(BackupSelection.selected)));

    final rows = await (_db.select(trashed).join([
      innerJoin(remote, remote.checksum.equalsExp(trashed.checksum)),
    ])..where(trashed.albumId.isInQuery(selectedAlbumIds) & remote.deletedAt.isNull())).get();

    return rows.map((result) => result.readTable(trashed).toDto());
  }

  /// Applies resulted snapshot of trashed assets:
  /// - upserts incoming rows
  /// - deletes rows that are not present in the snapshot
  Future<void> applyTrashSnapshot(Iterable<TrashedAsset> assets, String albumId) async {
    if (assets.isEmpty) {
      await _db.delete(_db.trashedLocalAssetEntity).go();
      return;
    }

    return _db.transaction(() async {
      final table = _db.trashedLocalAssetEntity;

      final companions = assets.map(
        (a) => TrashedLocalAssetEntityCompanion.insert(
          id: a.id,
          albumId: albumId,
          volume: a.volume == null ? const Value.absent() : Value(a.volume),
          checksum: a.checksum == null ? const Value.absent() : Value(a.checksum),
          name: a.name,
          type: a.type,
          createdAt: Value(a.createdAt),
          updatedAt: Value(a.updatedAt),
        ),
      );

      for (final slice in companions.slices(400)) {
        await _db.batch((b) {
          b.insertAllOnConflictUpdate(table, slice);
        });
      }

      final keepIds = assets.map((asset) => asset.id);
      if (keepIds.length <= 900) {
        await (_db.delete(table)..where((row) => row.id.isNotIn(keepIds))).go();
      } else {
        final existingIds = await (_db.selectOnly(table)..addColumns([table.id])).map((r) => r.read(table.id)!).get();
        final toDelete = existingIds.where((id) => !keepIds.contains(id));
        for (final slice in toDelete.slices(400)) {
          await (_db.delete(table)..where((row) => row.id.isIn(slice))).go();
        }
      }
    });
  }

  Future<void> insertTrashDelta(Iterable<TrashedAsset> trashUpdates) async {
    if (trashUpdates.isEmpty) {
      return;
    }
    final companions = trashUpdates.map(
      (a) => TrashedLocalAssetEntityCompanion.insert(
        id: a.id,
        volume: a.volume == null ? const Value.absent() : Value(a.volume),
        albumId: a.albumId,
        name: a.name,
        type: a.type,
        checksum: a.checksum == null ? const Value.absent() : Value(a.checksum),
        createdAt: Value(a.createdAt),
      ),
    );

    for (final slice in companions.slices(200)) {
      await _db.batch((b) {
        b.insertAllOnConflictUpdate(_db.trashedLocalAssetEntity, slice);
      });
    }
  }

  Stream<int> watchCount() {
    final t = _db.trashedLocalAssetEntity;
    return (_db.selectOnly(t)..addColumns([t.id.count()])).watchSingle().map((row) => row.read<int>(t.id.count()) ?? 0);
  }

  Stream<int> watchHashedCount() {
    final t = _db.trashedLocalAssetEntity;
    return (_db.selectOnly(t)
          ..addColumns([t.id.count()])
          ..where(t.checksum.isNotNull()))
        .watchSingle()
        .map((row) => row.read<int>(t.id.count()) ?? 0);
  }

  Future<void> trashLocalAsset(Map<AlbumId, List<LocalAsset>> assetsByAlbums) async {
    if (assetsByAlbums.isEmpty) {
      return;
    }

    final companions = <TrashedLocalAssetEntityCompanion>[];
    final idToDelete = <String>{};

    assetsByAlbums.forEach((albumId, assets) {
      for (final asset in assets) {
        idToDelete.add(asset.id);
        companions.add(
          TrashedLocalAssetEntityCompanion(
            id: Value(asset.id),
            name: Value(asset.name),
            albumId: Value(albumId),
            checksum: asset.checksum == null ? const Value.absent() : Value(asset.checksum),
            type: Value(asset.type),
            width: Value(asset.width),
            height: Value(asset.height),
            durationInSeconds: Value(asset.durationInSeconds),
            isFavorite: Value(asset.isFavorite),
            orientation: Value(asset.orientation),
          ),
        );
      }
    });

    await _db.transaction(() async {
      for (final slice in companions.slices(200)) {
        await _db.batch((batch) {
          batch.insertAllOnConflictUpdate(_db.trashedLocalAssetEntity, slice);
        });
      }
      for (final slice in idToDelete.slices(800)) {
        await (_db.delete(_db.localAssetEntity)..where((e) => e.id.isIn(slice))).go();
      }
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
        for (final slice in ids.slices(32000)) {
          batch.deleteWhere(_db.trashedLocalAssetEntity, (tbl) => tbl.id.isIn(slice));
        }
      });
    });
  }
}
