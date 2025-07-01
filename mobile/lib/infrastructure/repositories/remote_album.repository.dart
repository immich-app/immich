import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

enum SortRemoteAlbumsBy { id }

class DriftRemoteAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteAlbumRepository(this._db) : super(_db);

  Future<List<Album>> getAll({Set<SortRemoteAlbumsBy> sortBy = const {}}) {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count();

    final query = _db.remoteAlbumEntity.select().join([
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.remoteAlbumEntity.ownerId),
      ),
    ]);
    query
      ..addColumns([assetCount])
      ..groupBy([_db.remoteAlbumEntity.id]);

    if (sortBy.isNotEmpty) {
      final orderings = <OrderingTerm>[];
      for (final sort in sortBy) {
        orderings.add(
          switch (sort) {
            SortRemoteAlbumsBy.id => OrderingTerm.asc(_db.remoteAlbumEntity.id),
          },
        );
      }
      query.orderBy(orderings);
    }

    return query
        .map(
          (row) => row.readTable(_db.remoteAlbumEntity).toDto(
                assetCount: row.read(assetCount) ?? 0,
                ownerName: row.readTable(_db.userEntity).name,
              ),
        )
        .get();
  }
}

extension on RemoteAlbumEntityData {
  Album toDto({int assetCount = 0, required String ownerName}) {
    return Album(
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
