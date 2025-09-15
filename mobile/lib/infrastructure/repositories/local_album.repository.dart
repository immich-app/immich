import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:platform/platform.dart';

enum SortLocalAlbumsBy { id, backupSelection, isIosSharedAlbum, name, assetCount, newestAsset }

class DriftLocalAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  final Platform _platform;
  const DriftLocalAlbumRepository(this._db, {Platform? platform})
    : _platform = platform ?? const LocalPlatform(),
      super(_db);

  Future<List<LocalAlbum>> getAll({Set<SortLocalAlbumsBy> sortBy = const {}}) {
    final assetCount = _db.localAlbumAssetEntity.assetId.count();

    final query = _db.localAlbumEntity.select().join([
      leftOuterJoin(
        _db.localAlbumAssetEntity,
        _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        useColumns: false,
      ),
    ]);
    query
      ..addColumns([assetCount])
      ..groupBy([_db.localAlbumEntity.id]);

    if (sortBy.isNotEmpty) {
      final orderings = <OrderingTerm>[];
      for (final sort in sortBy) {
        orderings.add(switch (sort) {
          SortLocalAlbumsBy.id => OrderingTerm.asc(_db.localAlbumEntity.id),
          SortLocalAlbumsBy.backupSelection => OrderingTerm.asc(_db.localAlbumEntity.backupSelection),
          SortLocalAlbumsBy.isIosSharedAlbum => OrderingTerm.asc(_db.localAlbumEntity.isIosSharedAlbum),
          SortLocalAlbumsBy.name => OrderingTerm.asc(_db.localAlbumEntity.name),
          SortLocalAlbumsBy.assetCount => OrderingTerm.desc(assetCount),
          SortLocalAlbumsBy.newestAsset => OrderingTerm.desc(_db.localAlbumEntity.updatedAt),
        });
      }
      query.orderBy(orderings);
    }

    return query.map((row) => row.readTable(_db.localAlbumEntity).toDto(assetCount: row.read(assetCount) ?? 0)).get();
  }

  Future<List<LocalAlbum>> getBackupAlbums() async {
    final query = _db.localAlbumEntity.select()
      ..where((row) => row.backupSelection.equalsValue(BackupSelection.selected));

    return query.map((row) => row.toDto()).get();
  }

  Future<void> delete(String albumId) => transaction(() async {
    // Remove all assets that are only in this particular album
    // We cannot remove all assets in the album because they might be in other albums in iOS
    // That is not the case on Android since asset <-> album has one:one mapping
    final assetsToDelete = _platform.isIOS ? await _getUniqueAssetsInAlbum(albumId) : await getAssetIds(albumId);
    await _deleteAssets(assetsToDelete);

    await _db.managers.localAlbumEntity
        .filter((a) => a.id.equals(albumId) & a.backupSelection.equals(BackupSelection.none))
        .delete();
  });

  Future<void> syncDeletes(String albumId, Iterable<String> assetIdsToKeep) async {
    if (assetIdsToKeep.isEmpty) {
      return Future.value();
    }

    final deleteSmt = _db.localAssetEntity.delete();
    deleteSmt.where((localAsset) {
      final subQuery = _db.localAlbumAssetEntity.selectOnly()
        ..addColumns([_db.localAlbumAssetEntity.assetId])
        ..join([innerJoin(_db.localAlbumEntity, _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id))]);
      subQuery.where(
        _db.localAlbumEntity.id.equals(albumId) & _db.localAlbumAssetEntity.assetId.isNotIn(assetIdsToKeep),
      );
      return localAsset.id.isInQuery(subQuery);
    });
    await deleteSmt.go();
  }

  Future<void> upsert(
    LocalAlbum localAlbum, {
    Iterable<LocalAsset> toUpsert = const [],
    Iterable<String> toDelete = const [],
  }) {
    final companion = LocalAlbumEntityCompanion.insert(
      id: localAlbum.id,
      name: localAlbum.name,
      updatedAt: Value(localAlbum.updatedAt),
      backupSelection: localAlbum.backupSelection,
      isIosSharedAlbum: Value(localAlbum.isIosSharedAlbum),
    );

    return _db.transaction(() async {
      await _db.localAlbumEntity.insertOne(companion, onConflict: DoUpdate((_) => companion));
      if (toUpsert.isNotEmpty) {
        await _upsertAssets(toUpsert);
        await _db.localAlbumAssetEntity.insertAll(
          toUpsert.map((a) => LocalAlbumAssetEntityCompanion.insert(assetId: a.id, albumId: localAlbum.id)),
          mode: InsertMode.insertOrIgnore,
        );
      }
      await _removeAssets(localAlbum.id, toDelete);
    });
  }

  Future<void> updateAll(Iterable<LocalAlbum> albums) {
    return _db.transaction(() async {
      await _db.localAlbumEntity.update().write(const LocalAlbumEntityCompanion(marker_: Value(true)));

      await _db.batch((batch) {
        for (final album in albums) {
          final companion = LocalAlbumEntityCompanion.insert(
            id: album.id,
            name: album.name,
            updatedAt: Value(album.updatedAt),
            backupSelection: album.backupSelection,
            isIosSharedAlbum: Value(album.isIosSharedAlbum),
            marker_: const Value(null),
          );

          batch.insert(
            _db.localAlbumEntity,
            companion,
            onConflict: DoUpdate(
              (old) => LocalAlbumEntityCompanion(
                id: companion.id,
                name: companion.name,
                updatedAt: companion.updatedAt,
                isIosSharedAlbum: companion.isIosSharedAlbum,
                marker_: companion.marker_,
              ),
            ),
          );
        }
      });

      if (_platform.isAndroid) {
        // On Android, an asset can only be in one album
        // So, get the albums that are marked for deletion
        // and delete all the assets that are in those albums
        final deleteSmt = _db.localAssetEntity.delete();
        deleteSmt.where((localAsset) {
          final subQuery = _db.localAlbumAssetEntity.selectOnly()
            ..addColumns([_db.localAlbumAssetEntity.assetId])
            ..join([
              innerJoin(_db.localAlbumEntity, _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id)),
            ]);
          subQuery.where(_db.localAlbumEntity.marker_.isNotNull());
          return localAsset.id.isInQuery(subQuery);
        });
        await deleteSmt.go();
      }

      // Only remove albums that are not explicitly selected or excluded from backups
      await _db.localAlbumEntity.deleteWhere(
        (f) => f.marker_.isNotNull() & f.backupSelection.equalsValue(BackupSelection.none),
      );
    });
  }

  Future<List<LocalAsset>> getAssets(String albumId) {
    final query =
        _db.localAlbumAssetEntity.select().join([
            innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
          ])
          ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
          ..orderBy([OrderingTerm.asc(_db.localAssetEntity.id)]);
    return query.map((row) => row.readTable(_db.localAssetEntity).toDto()).get();
  }

  Future<List<String>> getAssetIds(String albumId) {
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId));
    return query.map((row) => row.read(_db.localAlbumAssetEntity.assetId)!).get();
  }

  Future<void> processDelta({
    required List<LocalAsset> updates,
    required List<String> deletes,
    required Map<String, List<String>> assetAlbums,
  }) {
    return _db.transaction(() async {
      await _deleteAssets(deletes);

      await _upsertAssets(updates);
      // The ugly casting below is required for now because the generated code
      // casts the returned values from the platform during decoding them
      // and iterating over them causes the type to be List<Object?> instead of
      // List<String>
      await _db.batch((batch) async {
        assetAlbums.cast<String, List<Object?>>().forEach((assetId, albumIds) {
          batch.deleteWhere(
            _db.localAlbumAssetEntity,
            (f) => f.albumId.isNotIn(albumIds.cast<String?>().nonNulls) & f.assetId.equals(assetId),
          );
        });
      });
      await _db.batch((batch) async {
        assetAlbums.cast<String, List<Object?>>().forEach((assetId, albumIds) {
          batch.insertAll(
            _db.localAlbumAssetEntity,
            albumIds.cast<String?>().nonNulls.map(
              (albumId) => LocalAlbumAssetEntityCompanion.insert(assetId: assetId, albumId: albumId),
            ),
            onConflict: DoNothing(),
          );
        });
      });
    });
  }

  Future<List<LocalAsset>> getAssetsToHash(String albumId) {
    final query =
        _db.localAlbumAssetEntity.select().join([
            innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
          ])
          ..where(_db.localAlbumAssetEntity.albumId.equals(albumId) & _db.localAssetEntity.checksum.isNull())
          ..orderBy([OrderingTerm.asc(_db.localAssetEntity.id)]);

    return query.map((row) => row.readTable(_db.localAssetEntity).toDto()).get();
  }

  Future<void> _upsertAssets(Iterable<LocalAsset> localAssets) {
    if (localAssets.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final asset in localAssets) {
        final companion = LocalAssetEntityCompanion.insert(
          name: asset.name,
          type: asset.type,
          createdAt: Value(asset.createdAt),
          updatedAt: Value(asset.updatedAt),
          width: Value(asset.width),
          height: Value(asset.height),
          durationInSeconds: Value(asset.durationInSeconds),
          id: asset.id,
          orientation: Value(asset.orientation),
          checksum: const Value(null),
          isFavorite: Value(asset.isFavorite),
        );
        batch.insert<$LocalAssetEntityTable, LocalAssetEntityData>(
          _db.localAssetEntity,
          companion,
          onConflict: DoUpdate((_) => companion, where: (old) => old.updatedAt.isNotValue(asset.updatedAt)),
        );
      }
    });
  }

  Future<void> _removeAssets(String albumId, Iterable<String> assetIds) async {
    if (assetIds.isEmpty) {
      return Future.value();
    }

    if (_platform.isAndroid) {
      return _deleteAssets(assetIds);
    }

    List<String> assetsToDelete = [];
    List<String> assetsToUnLink = [];

    final uniqueAssets = await _getUniqueAssetsInAlbum(albumId);
    if (uniqueAssets.isEmpty) {
      assetsToUnLink = assetIds.toList();
    } else {
      // Delete unique assets and unlink others
      final uniqueSet = uniqueAssets.toSet();

      for (final assetId in assetIds) {
        if (uniqueSet.contains(assetId)) {
          assetsToDelete.add(assetId);
        } else {
          assetsToUnLink.add(assetId);
        }
      }
    }

    return transaction(() async {
      if (assetsToUnLink.isNotEmpty) {
        await _db.batch(
          (batch) => batch.deleteWhere(
            _db.localAlbumAssetEntity,
            (f) => f.assetId.isIn(assetsToUnLink) & f.albumId.equals(albumId),
          ),
        );
      }

      await _deleteAssets(assetsToDelete);
    });
  }

  /// Get all asset ids that are only in this album and not in other albums.
  /// This is useful in cases where the album is a smart album or a user-created album, especially on iOS
  Future<List<String>> _getUniqueAssetsInAlbum(String albumId) {
    final assetId = _db.localAlbumAssetEntity.assetId;
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([assetId])
      ..groupBy(
        [assetId],
        having: _db.localAlbumAssetEntity.albumId.count().equals(1) & _db.localAlbumAssetEntity.albumId.equals(albumId),
      );

    return query.map((row) => row.read(assetId)!).get();
  }

  Future<void> _deleteAssets(Iterable<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) {
      batch.deleteWhere(_db.localAssetEntity, (f) => f.id.isIn(ids));
    });
  }

  Future<LocalAsset?> getThumbnail(String albumId) async {
    final query =
        _db.localAlbumAssetEntity.select().join([
            innerJoin(_db.localAssetEntity, _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id)),
          ])
          ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
          ..orderBy([OrderingTerm.desc(_db.localAssetEntity.createdAt)])
          ..limit(1);

    final results = await query.map((row) => row.readTable(_db.localAssetEntity).toDto()).get();

    return results.isNotEmpty ? results.first : null;
  }

  Future<int> getCount() {
    return _db.managers.localAlbumEntity.count();
  }

  Future unlinkRemoteAlbum(String id) async {
    return _db.localAlbumEntity.update()
      ..where((row) => row.id.equals(id))
      ..write(const LocalAlbumEntityCompanion(linkedRemoteAlbumId: Value(null)));
  }

  Future linkRemoteAlbum(String localAlbumId, String remoteAlbumId) async {
    return _db.localAlbumEntity.update()
      ..where((row) => row.id.equals(localAlbumId))
      ..write(LocalAlbumEntityCompanion(linkedRemoteAlbumId: Value(remoteAlbumId)));
  }
}
