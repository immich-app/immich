import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/local_album_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAlbumAssetRepository extends DriftDatabaseRepository
    implements ILocalAlbumAssetRepository {
  final Drift _db;
  const DriftLocalAlbumAssetRepository(super._db) : _db = _db;

  @override
  Future<void> linkAssetsToAlbum(String albumId, Iterable<String> assetIds) =>
      _db.batch(
        (batch) => batch.insertAll(
          _db.localAlbumAssetEntity,
          assetIds.map(
            (a) => LocalAlbumAssetEntityCompanion.insert(
              assetId: a,
              albumId: albumId,
            ),
          ),
          mode: InsertMode.insertOrIgnore,
        ),
      );

  @override
  Future<List<LocalAsset>> getAssetsForAlbum(String albumId) {
    final query = _db.localAlbumAssetEntity.select().join(
      [
        innerJoin(
          _db.localAssetEntity,
          _db.localAlbumAssetEntity.assetId
              .equalsExp(_db.localAssetEntity.localId),
        ),
      ],
    )..where(_db.localAlbumAssetEntity.albumId.equals(albumId));
    return query
        .map((row) => row.readTable(_db.localAssetEntity).toDto())
        .get();
  }

  @override
  Future<void> unlinkAssetsFromAlbum(
    String albumId,
    Iterable<String> assetIds,
  ) =>
      _db.batch(
        (batch) => batch.deleteWhere(
          _db.localAlbumAssetEntity,
          (f) => f.assetId.isIn(assetIds),
        ),
      );
}
