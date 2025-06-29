import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

enum SortRemoteAlbumsBy { id }

class DriftRemoteAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteAlbumRepository(this._db) : super(_db);

  Future<List<Album>> getAll({Set<SortRemoteAlbumsBy> sortBy = const {}}) {
    final query = _db.remoteAlbumEntity.select();

    if (sortBy.isNotEmpty) {
      final orderings = <OrderClauseGenerator<$RemoteAlbumEntityTable>>[];
      for (final sort in sortBy) {
        orderings.add(
          switch (sort) {
            SortRemoteAlbumsBy.id => (row) => OrderingTerm.asc(row.id),
          },
        );
      }
      query.orderBy(orderings);
    }

    return query.map((row) => row.toDto()).get();
  }
}

extension on RemoteAlbumEntityData {
  Album toDto() {
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
    );
  }
}
