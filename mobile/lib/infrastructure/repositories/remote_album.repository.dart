import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

enum SortRemoteAlbumsBy { id, updatedAt }

class DriftRemoteAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteAlbumRepository(this._db) : super(_db);

  Future<List<RemoteAlbum>> getAll({
    Set<SortRemoteAlbumsBy> sortBy = const {SortRemoteAlbumsBy.updatedAt},
  }) {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count();

    final query = _db.remoteAlbumEntity.select().join([
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.remoteAlbumEntity.ownerId),
        useColumns: false,
      ),
    ]);
    query
      ..where(_db.remoteAssetEntity.deletedAt.isNull())
      ..addColumns([assetCount])
      ..addColumns([_db.userEntity.name])
      ..groupBy([_db.remoteAlbumEntity.id]);

    if (sortBy.isNotEmpty) {
      final orderings = <OrderingTerm>[];
      for (final sort in sortBy) {
        orderings.add(
          switch (sort) {
            SortRemoteAlbumsBy.id => OrderingTerm.asc(_db.remoteAlbumEntity.id),
            SortRemoteAlbumsBy.updatedAt =>
              OrderingTerm.desc(_db.remoteAlbumEntity.updatedAt),
          },
        );
      }
      query.orderBy(orderings);
    }

    return query
        .map(
          (row) => row.readTable(_db.remoteAlbumEntity).toDto(
                assetCount: row.read(assetCount) ?? 0,
                ownerName: row.read(_db.userEntity.name)!,
              ),
        )
        .get();
  }

  Future<void> create(
    RemoteAlbum album,
    List<String> assetIds,
  ) async {
    await _db.transaction(() async {
      final entity = RemoteAlbumEntityCompanion(
        id: Value(album.id),
        name: Value(album.name),
        ownerId: Value(album.ownerId),
        createdAt: Value(album.createdAt),
        updatedAt: Value(album.updatedAt),
        description: Value(album.description),
        thumbnailAssetId: Value(album.thumbnailAssetId),
        isActivityEnabled: Value(album.isActivityEnabled),
        order: Value(album.order),
      );

      await _db.remoteAlbumEntity.insertOne(entity);

      if (assetIds.isNotEmpty) {
        final albumAssets = assetIds.map(
          (assetId) => RemoteAlbumAssetEntityCompanion(
            albumId: Value(album.id),
            assetId: Value(assetId),
          ),
        );

        await _db.batch((batch) {
          batch.insertAll(
            _db.remoteAlbumAssetEntity,
            albumAssets,
          );
        });
      }
    });
  }

  Future<int> removeAssets(String albumId, List<String> assetIds) {
    return _db.remoteAlbumAssetEntity.deleteWhere(
      (tbl) => tbl.albumId.equals(albumId) & tbl.assetId.isIn(assetIds),
    );
  }
}

extension on RemoteAlbumEntityData {
  RemoteAlbum toDto({int assetCount = 0, required String ownerName}) {
    return RemoteAlbum(
      id: id,
      name: name,
      ownerId: ownerId,
      createdAt: createdAt,
      updatedAt: updatedAt,
      description: description,
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
      assetCount: assetCount,
      ownerName: ownerName,
    );
  }
}
