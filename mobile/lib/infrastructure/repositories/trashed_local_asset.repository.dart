import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

typedef TrashedAsset = ({String albumId, LocalAsset asset});

class DriftTrashedLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashedLocalAssetRepository(this._db) : super(_db);

  Future<void> updateHashes(Map<String, String> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) async {
      for (final entry in hashes.entries) {
        batch.update(
          _db.trashedLocalAssetEntity,
          TrashedLocalAssetEntityCompanion(checksum: Value(entry.value)),
          where: (e) => e.id.equals(entry.key),
        );
      }
    });
  }

  Future<List<LocalAsset>> getAssetsToHash(Iterable<String> albumIds) {
    final query = _db.trashedLocalAssetEntity.select()..where((r) => r.albumId.isIn(albumIds) & r.checksum.isNull());
    return query.map((row) => row.toLocalAsset()).get();
  }

  Future<Iterable<LocalAsset>> getToRestore() async {
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

    return rows.map((result) => result.readTable(_db.trashedLocalAssetEntity).toLocalAsset());
  }

  /// Applies resulted snapshot of trashed assets:
  /// - upserts incoming rows
  /// - deletes rows that are not present in the snapshot
  Future<void> processTrashSnapshot(Iterable<TrashedAsset> trashedAssets) async {
    if (trashedAssets.isEmpty) {
      await _db.delete(_db.trashedLocalAssetEntity).go();
      return;
    }
    final assetIds = trashedAssets.map((e) => e.asset.id).toSet();
    Map<String, String> localChecksumById = await _getCachedChecksums(assetIds);

    return _db.transaction(() async {
      await _db.batch((batch) {
        for (final item in trashedAssets) {
          final effectiveChecksum = localChecksumById[item.asset.id] ?? item.asset.checksum;
          final companion = TrashedLocalAssetEntityCompanion.insert(
            id: item.asset.id,
            albumId: item.albumId,
            checksum: Value(effectiveChecksum),
            name: item.asset.name,
            type: item.asset.type,
            createdAt: Value(item.asset.createdAt),
            updatedAt: Value(item.asset.updatedAt),
            width: Value(item.asset.width),
            height: Value(item.asset.height),
            durationInSeconds: Value(item.asset.durationInSeconds),
            isFavorite: Value(item.asset.isFavorite),
            orientation: Value(item.asset.orientation),
          );

          batch.insert<$TrashedLocalAssetEntityTable, TrashedLocalAssetEntityData>(
            _db.trashedLocalAssetEntity,
            companion,
            onConflict: DoUpdate((_) => companion, where: (old) => old.updatedAt.isNotValue(item.asset.updatedAt)),
          );
        }
      });

      if (assetIds.length <= kDriftMaxChunk) {
        await (_db.delete(_db.trashedLocalAssetEntity)..where((row) => row.id.isNotIn(assetIds))).go();
      } else {
        final existingIds = await (_db.selectOnly(
          _db.trashedLocalAssetEntity,
        )..addColumns([_db.trashedLocalAssetEntity.id])).map((r) => r.read(_db.trashedLocalAssetEntity.id)!).get();
        final idToDelete = existingIds.where((id) => !assetIds.contains(id));
        for (final slice in idToDelete.slices(kDriftMaxChunk)) {
          await (_db.delete(_db.trashedLocalAssetEntity)..where((t) => t.id.isIn(slice))).go();
        }
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

  Future<void> trashLocalAsset(Map<String, List<LocalAsset>> assetsByAlbums) async {
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
            checksum: Value(asset.checksum),
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
      for (final companion in companions) {
        await _db.into(_db.trashedLocalAssetEntity).insertOnConflictUpdate(companion);
      }

      for (final slice in idToDelete.slices(kDriftMaxChunk)) {
        await (_db.delete(_db.localAssetEntity)..where((t) => t.id.isIn(slice))).go();
      }
    });
  }

  Future<void> applyRestoredAssets(List<String> idList) async {
    if (idList.isEmpty) {
      return;
    }

    final trashedAssets = <TrashedLocalAssetEntityData>[];

    for (final slice in idList.slices(kDriftMaxChunk)) {
      final q = _db.select(_db.trashedLocalAssetEntity)..where((t) => t.id.isIn(slice));
      trashedAssets.addAll(await q.get());
    }

    if (trashedAssets.isEmpty) {
      return;
    }

    final companions = trashedAssets.map((e) {
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
    });

    await _db.transaction(() async {
      for (final companion in companions) {
        await _db.into(_db.localAssetEntity).insertOnConflictUpdate(companion);
      }
      for (final slice in idList.slices(kDriftMaxChunk)) {
        await (_db.delete(_db.trashedLocalAssetEntity)..where((t) => t.id.isIn(slice))).go();
      }
    });
  }

  Future<Map<String, List<LocalAsset>>> getToTrash() async {
    final result = <String, List<LocalAsset>>{};

    final rows =
        await (_db.select(_db.localAlbumAssetEntity).join([
              innerJoin(_db.localAlbumEntity, _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id)),
              innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
              leftOuterJoin(
                _db.remoteAssetEntity,
                _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
              ),
            ])..where(
              _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected) &
                  _db.remoteAssetEntity.deletedAt.isNotNull(),
            ))
            .get();

    for (final row in rows) {
      final albumId = row.readTable(_db.localAlbumAssetEntity).albumId;
      final asset = row.readTable(_db.localAssetEntity).toDto();
      (result[albumId] ??= <LocalAsset>[]).add(asset);
    }

    return result;
  }

  //attempt to reuse existing checksums
  Future<Map<String, String>> _getCachedChecksums(Set<String> assetIds) async {
    final localChecksumById = <String, String>{};

    for (final slice in assetIds.slices(kDriftMaxChunk)) {
      final rows =
          await (_db.selectOnly(_db.localAssetEntity)
                ..where(_db.localAssetEntity.id.isIn(slice) & _db.localAssetEntity.checksum.isNotNull())
                ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum]))
              .get();

      for (final r in rows) {
        localChecksumById[r.read(_db.localAssetEntity.id)!] = r.read(_db.localAssetEntity.checksum)!;
      }
    }

    return localChecksumById;
  }
}
