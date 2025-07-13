import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart'
    hide ExifInfo;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class RemoteAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const RemoteAssetRepository(this._db) : super(_db);

  /// For testing purposes
  Future<List<RemoteAsset>> getSome(String userId) {
    final query = _db.remoteAssetEntity.select()
      ..where(
        (row) =>
            _db.remoteAssetEntity.ownerId.equals(userId) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAssetEntity.visibility
                .equalsValue(AssetVisibility.timeline),
      )
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(10);

    return query.map((row) => row.toDto()).get();
  }

  Stream<RemoteAsset?> watchAsset(String id) {
    final query = _db.remoteAssetEntity
        .select()
        .addColumns([_db.localAssetEntity.id]).join([
      leftOuterJoin(
        _db.localAssetEntity,
        _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
        useColumns: false,
      ),
    ])
      ..where(_db.remoteAssetEntity.id.equals(id));

    return query.map((row) {
      final asset = row.readTable(_db.remoteAssetEntity).toDto();
      return asset.copyWith(
        localId: row.read(_db.localAssetEntity.id),
      );
    }).watchSingleOrNull();
  }

  Future<ExifInfo?> getExif(String id) {
    return _db.managers.remoteExifEntity
        .filter((row) => row.assetId.id.equals(id))
        .map((row) => row.toDto())
        .getSingleOrNull();
  }

  Future<void> updateFavorite(List<String> ids, bool isFavorite) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(isFavorite: Value(isFavorite)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> updateVisibility(List<String> ids, AssetVisibility visibility) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(visibility: Value(visibility)),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> trash(List<String> ids) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteAssetEntity,
          RemoteAssetEntityCompanion(deletedAt: Value(DateTime.now())),
          where: (e) => e.id.equals(id),
        );
      }
    });
  }

  Future<void> delete(List<String> ids) {
    return _db.remoteAssetEntity.deleteWhere((row) => row.id.isIn(ids));
  }

  Future<void> updateLocation(List<String> ids, LatLng location) {
    return _db.batch((batch) async {
      for (final id in ids) {
        batch.update(
          _db.remoteExifEntity,
          RemoteExifEntityCompanion(
            latitude: Value(location.latitude),
            longitude: Value(location.longitude),
          ),
          where: (e) => e.assetId.equals(id),
        );
      }
    });
  }
}
