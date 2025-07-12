import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:stream_transform/stream_transform.dart';

class DriftMapRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftMapRepository(super._db) : _db = _db;

  Stream<List<Marker>> watchMainMarker(
    List<String> userIds, {
    required LatLngBounds bounds,
  }) {
    final query = _db.remoteExifEntity.select().join([
      innerJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteExifEntity.assetId),
        useColumns: false,
      ),
    ])
      ..where(
        _db.remoteExifEntity.latitude.isNotNull() &
            _db.remoteExifEntity.longitude.isNotNull() &
            _db.remoteExifEntity.inBounds(bounds) &
            _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
            _db.remoteAssetEntity.deletedAt.isNull(),
      );

    return query
        .map((row) => row.readTable(_db.remoteExifEntity).toMarker())
        .watch().throttle(const Duration(seconds: 3));
  }

  Stream<List<Marker>> watchRemoteAlbumMarker(
    String albumId, {
    required LatLngBounds bounds,
  }) {
    final query = _db.remoteExifEntity.select().join([
      innerJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteExifEntity.assetId),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
    ])
      ..where(
        _db.remoteExifEntity.latitude.isNotNull() &
            _db.remoteExifEntity.longitude.isNotNull() &
            _db.remoteExifEntity.inBounds(bounds) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAlbumAssetEntity.albumId.equals(albumId),
      );

    return query
        .map((row) => row.readTable(_db.remoteExifEntity).toMarker())
        .watch().throttle(const Duration(seconds: 3));
  }
}

extension on $RemoteExifEntityTable {
  Expression<bool> inBounds(LatLngBounds bounds) {
    final isLatitudeInBounds = latitude.isBiggerOrEqualValue(bounds.southwest.latitude) &
        latitude.isSmallerOrEqualValue(bounds.northeast.latitude);

    final Expression<bool> isLongitudeInBounds;

    if (bounds.southwest.longitude <= bounds.northeast.longitude) {
      isLongitudeInBounds = longitude.isBiggerOrEqualValue(bounds.southwest.longitude) &
          longitude.isSmallerOrEqualValue(bounds.northeast.longitude);
    } else {
      isLongitudeInBounds = longitude.isBiggerOrEqualValue(bounds.southwest.longitude) |
          longitude.isSmallerOrEqualValue(bounds.northeast.longitude);
    }

    return isLatitudeInBounds & isLongitudeInBounds;
  }
}

extension on RemoteExifEntityData {
  Marker toMarker() {
    return Marker(
      assetId: assetId,
      location: LatLng(latitude!, longitude!),
    );
  }
}
