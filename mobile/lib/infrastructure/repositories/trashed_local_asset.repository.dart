import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashedLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashedLocalAssetRepository(this._db) : super(_db);

  Future<void> updateChecksums(Iterable<TrashedAsset> assets) {
    if (assets.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final asset in assets) {
        batch.update(
          _db.trashedLocalAssetEntity,
          TrashedLocalAssetEntityCompanion(checksum: Value(asset.checksum)),
          where: (e) => e.id.equals(asset.id),
        );
      }
    });
  }

  Future<Iterable<TrashedAsset>> getToHash(String albumId) {
    final query = _db.trashedLocalAssetEntity.select()..where((r) => r.albumId.equals(albumId) & r.checksum.isNull());
    return query.map((row) => row.toDto(albumId)).get();
  }

  Future<List<TrashedAsset>> getToRestore() async {
    final trashed = _db.trashedLocalAssetEntity;
    final remote = _db.remoteAssetEntity;
    final album = _db.localAlbumEntity;

    final selectedAlbumIds = (_db.selectOnly(album)
      ..addColumns([album.id])
      ..where(album.backupSelection.equalsValue(BackupSelection.selected)));

    final rows = await (_db.select(trashed).join([
      innerJoin(remote, remote.checksum.equalsExp(trashed.checksum)),
    ])..where(trashed.albumId.isInQuery(selectedAlbumIds) & remote.deletedAt.isNull())).get();

    return rows.map((result) {
      final assetData = result.readTable(trashed);
      return assetData.toDto(assetData.albumId);
    }).toList();
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
          checksum: a.checksum == null ? const Value.absent() : Value(a.checksum),
          name: a.name,
          type: a.type,
          createdAt: Value(a.createdAt),
          updatedAt: Value(a.updatedAt),
          size: a.size == null ? const Value.absent() : Value(a.size),
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

  Future<void> delete(Iterable<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      for (final slice in ids.slices(32000)) {
        batch.deleteWhere(_db.trashedLocalAssetEntity, (e) => e.id.isIn(slice));
      }
    });
  }
}
