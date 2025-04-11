import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAlbumRepository extends DriftDatabaseRepository
    implements ILocalAlbumRepository {
  final Drift _db;
  const DriftLocalAlbumRepository(this._db) : super(_db);

  @override
  Future<void> upsert(LocalAlbum localAlbum) {
    final companion = LocalAlbumEntityCompanion.insert(
      id: localAlbum.id,
      name: localAlbum.name,
      updatedAt: Value(localAlbum.updatedAt),
      assetCount: Value(localAlbum.assetCount),
      thumbnailId: Value.absentIfNull(localAlbum.thumbnailId),
      backupSelection: localAlbum.backupSelection,
      isAll: Value(localAlbum.isAll),
    );

    return _db.localAlbumEntity
        .insertOne(companion, onConflict: DoUpdate((_) => companion));
  }

  @override
  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy}) {
    final query = _db.localAlbumEntity.select();
    if (sortBy == SortLocalAlbumsBy.id) {
      query.orderBy([(a) => OrderingTerm.asc(a.id)]);
    }
    return query.map((a) => a.toDto()).get();
  }

  @override
  Future<void> delete(String albumId) => _db.managers.localAlbumEntity
      .filter((a) => a.id.equals(albumId))
      .delete();

  @override
  Future<List<String>> getAssetIdsOnlyInAlbum(String albumId) {
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
}
