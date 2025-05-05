import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/platform/messages.g.dart' as platform;
import 'package:platform/platform.dart';

class DriftLocalAlbumRepository extends DriftDatabaseRepository
    implements ILocalAlbumRepository {
  final Drift _db;
  final Platform _platform;
  const DriftLocalAlbumRepository(this._db, {Platform? platform})
      : _platform = platform ?? const LocalPlatform(),
        super(_db);

  @override
  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy}) {
    final assetCount = _db.localAlbumAssetEntity.assetId.count();

    final query = _db.localAlbumEntity.select().join([
      innerJoin(
        _db.localAlbumAssetEntity,
        _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
        useColumns: false,
      ),
    ]);
    query
      ..addColumns([assetCount])
      ..groupBy([_db.localAlbumEntity.id]);
    if (sortBy == SortLocalAlbumsBy.id) {
      query.orderBy([OrderingTerm.asc(_db.localAlbumEntity.id)]);
    }
    return query
        .map(
          (row) => row
              .readTable(_db.localAlbumEntity)
              .toDto(assetCount: row.read(assetCount) ?? 0),
        )
        .get();
  }

  @override
  Future<void> delete(String albumId) => transaction(() async {
        // Remove all assets that are only in this particular album
        // We cannot remove all assets in the album because they might be in other albums in iOS
        // That is not the case on Android since asset <-> album has one:one mapping
        final assetsToDelete = _platform.isIOS
            ? await _getUniqueAssetsInAlbum(albumId)
            : await _getAssetsIdsInAlbum(albumId);
        await _deleteAssets(assetsToDelete);

        // All the other assets that are still associated will be unlinked automatically on-cascade
        await _db.managers.localAlbumEntity
            .filter((a) => a.id.equals(albumId))
            .delete();
      });

  @override
  Future<void> insert(LocalAlbum localAlbum, Iterable<LocalAsset> assets) =>
      transaction(() async {
        await _upsertAssets(assets);
        // Needs to be after asset upsert to link the thumbnail
        await update(localAlbum);
        await _linkAssetsToAlbum(localAlbum.id, assets);
      });

  @override
  Future<void> addAssets(String albumId, Iterable<LocalAsset> assets) {
    if (assets.isEmpty) {
      return Future.value();
    }
    return transaction(() async {
      await _upsertAssets(assets);
      await _linkAssetsToAlbum(albumId, assets);
    });
  }

  @override
  Future<void> removeMissing(String albumId, Iterable<String> assetIds) async {
    if (assetIds.isEmpty) {
      return Future.value();
    }

    final deleteSmt = _db.localAssetEntity.delete();
    deleteSmt.where((localAsset) {
      final subQuery = _db.localAlbumAssetEntity.selectOnly()
        ..addColumns([_db.localAlbumAssetEntity.assetId])
        ..join([
          innerJoin(
            _db.localAlbumEntity,
            _db.localAlbumAssetEntity.albumId
                .equalsExp(_db.localAlbumEntity.id),
          ),
        ]);
      subQuery.where(
        _db.localAlbumEntity.id.equals(albumId) &
            _db.localAlbumAssetEntity.assetId.isNotIn(assetIds),
      );
      return localAsset.id.isInQuery(subQuery);
    });
  }

  @override
  Future<void> removeAssets(String albumId, Iterable<String> assetIds) async {
    if (assetIds.isEmpty) {
      return Future.value();
    }

    if (_platform.isAndroid) {
      return _deleteAssets(assetIds);
    }

    final uniqueAssets = await _getUniqueAssetsInAlbum(albumId);
    if (uniqueAssets.isEmpty) {
      return _unlinkAssetsFromAlbum(albumId, assetIds);
    }
    // Delete unique assets and unlink others
    final uniqueSet = uniqueAssets.toSet();
    final assetsToDelete = <String>[];
    final assetsToUnLink = <String>[];
    for (final assetId in assetIds) {
      if (uniqueSet.contains(assetId)) {
        assetsToDelete.add(assetId);
      } else {
        assetsToUnLink.add(assetId);
      }
    }
    return transaction(() async {
      await _unlinkAssetsFromAlbum(albumId, assetsToUnLink);
      await _deleteAssets(assetsToDelete);
    });
  }

  @override
  Future<void> update(LocalAlbum localAlbum) {
    final companion = LocalAlbumEntityCompanion.insert(
      id: localAlbum.id,
      name: localAlbum.name,
      updatedAt: Value(localAlbum.updatedAt),
      backupSelection: localAlbum.backupSelection,
    );

    return _db.localAlbumEntity
        .insertOne(companion, onConflict: DoUpdate((_) => companion));
  }

  @override
  Future<void> updateAll(Iterable<LocalAlbum> albums) {
    return _db.transaction(() async {
      await _db.localAlbumEntity
          .update()
          .write(const LocalAlbumEntityCompanion(marker_: Value(true)));

      await _db.batch((batch) {
        for (final album in albums) {
          final companion = LocalAlbumEntityCompanion.insert(
            id: album.id,
            name: album.name,
            updatedAt: Value(album.updatedAt),
            backupSelection: album.backupSelection,
            marker_: const Value(true),
          );

          batch.insert(
            _db.localAlbumEntity,
            companion,
            onConflict: DoUpdate((_) => companion),
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
              innerJoin(
                _db.localAlbumEntity,
                _db.localAlbumAssetEntity.albumId
                    .equalsExp(_db.localAlbumEntity.id),
              ),
            ]);
          subQuery.where(_db.localAlbumEntity.marker_.equals(false));
          return localAsset.id.isInQuery(subQuery);
        });
      }

      await _db.localAlbumEntity.deleteWhere((f) => f.marker_.equals(false));
    });
  }

  @override
  Future<List<LocalAsset>> getAssetsForAlbum(String albumId) {
    final query = _db.localAlbumAssetEntity.select().join(
      [
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ],
    )
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..orderBy([OrderingTerm.desc(_db.localAssetEntity.id)]);
    return query
        .map((row) => row.readTable(_db.localAssetEntity).toDto())
        .get();
  }

  @override
  Future<List<String>> getAssetIdsForAlbum(String albumId) {
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId));
    return query
        .map((row) => row.read(_db.localAlbumAssetEntity.assetId)!)
        .get();
  }

  @override
  Future<void> handleSyncDelta(platform.SyncDelta delta) {
    return _db.transaction(() async {
      await _deleteAssets(delta.deletes);

      await _upsertAssets(delta.updates.map((a) => a.toLocalAsset()));
      await _db.batch((batch) async {
        for (final asset in delta.updates) {
          batch.deleteWhere(
            _db.localAlbumAssetEntity,
            (f) =>
                f.albumId.isNotIn(asset.albumIds) & f.assetId.equals(asset.id),
          );

          batch.insertAll(
            _db.localAlbumAssetEntity,
            asset.albumIds.map(
              (albumId) => LocalAlbumAssetEntityCompanion.insert(
                assetId: asset.id,
                albumId: albumId,
              ),
            ),
            onConflict: DoNothing(),
          );
        }
      });
    });
  }

  Future<void> _linkAssetsToAlbum(
    String albumId,
    Iterable<LocalAsset> assets,
  ) {
    if (assets.isEmpty) {
      return Future.value();
    }

    return _db.localAlbumAssetEntity.insertAll(
      assets.map(
        (a) => LocalAlbumAssetEntityCompanion.insert(
          assetId: a.id,
          albumId: albumId,
        ),
      ),
      mode: InsertMode.insertOrIgnore,
    );
  }

  Future<void> _unlinkAssetsFromAlbum(
    String albumId,
    Iterable<String> assetIds,
  ) {
    if (assetIds.isEmpty) {
      return Future.value();
    }

    return _db.batch(
      (batch) => batch.deleteWhere(
        _db.localAlbumAssetEntity,
        (f) => f.assetId.isIn(assetIds) & f.albumId.equals(albumId),
      ),
    );
  }

  Future<List<String>> _getAssetsIdsInAlbum(String albumId) {
    final query = _db.localAlbumAssetEntity.select()
      ..where((row) => row.albumId.equals(albumId));
    return query.map((row) => row.assetId).get();
  }

  /// Get all asset ids that are only in this album and not in other albums.
  /// This is useful in cases where the album is a smart album or a user-created album, especially on iOS
  Future<List<String>> _getUniqueAssetsInAlbum(String albumId) {
    final assetId = _db.localAlbumAssetEntity.assetId;
    final query = _db.localAlbumAssetEntity.selectOnly()
      ..addColumns([assetId])
      ..groupBy(
        [assetId],
        having: _db.localAlbumAssetEntity.albumId.count().equals(1) &
            _db.localAlbumAssetEntity.albumId.equals(albumId),
      );

    return query.map((row) => row.read(assetId)!).get();
  }

  Future<void> _upsertAssets(Iterable<LocalAsset> localAssets) {
    if (localAssets.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      batch.insertAllOnConflictUpdate(
        _db.localAssetEntity,
        localAssets.map(
          (a) => LocalAssetEntityCompanion.insert(
            name: a.name,
            type: a.type,
            createdAt: Value(a.createdAt),
            updatedAt: Value(a.updatedAt),
            durationInSeconds: Value.absentIfNull(a.durationInSeconds),
            id: a.id,
            checksum: Value.absentIfNull(a.checksum),
          ),
        ),
      );
    });
  }

  Future<void> _deleteAssets(Iterable<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }

    return _db.batch(
      (batch) => batch.deleteWhere(
        _db.localAssetEntity,
        (f) => f.id.isIn(ids),
      ),
    );
  }
}

extension on platform.Asset {
  LocalAsset toLocalAsset() {
    return LocalAsset(
      id: id,
      name: name,
      type: AssetType.values.elementAtOrNull(type) ?? AssetType.other,
      createdAt:
          createdAt == null ? DateTime.now() : DateTime.parse(createdAt!),
      updatedAt:
          updatedAt == null ? DateTime.now() : DateTime.parse(updatedAt!),
      durationInSeconds: durationInSeconds,
    );
  }
}
