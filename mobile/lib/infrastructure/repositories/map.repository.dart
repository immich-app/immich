import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:stream_transform/stream_transform.dart';

class DriftMapRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftMapRepository(super._db) : _db = _db;

  MapQuery remote(String ownerId) => _mapQueryBuilder(
        assetFilter: (row) =>
            row.deletedAt.isNull() &
            row.visibility.equalsValue(AssetVisibility.timeline) &
            row.ownerId.equals(ownerId),
      );

  MapQuery _mapQueryBuilder({
    Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter,
    Expression<bool> Function($RemoteExifEntityTable row)? exifFilter,
  }) {
    return (
      markerSource: (bounds) => _watchMapMarker(
            assetFilter: assetFilter,
            exifFilter: exifFilter,
            bounds: bounds,
          )
    );
  }

  Stream<List<Marker>> _watchMapMarker({
    Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter,
    Expression<bool> Function($RemoteExifEntityTable row)? exifFilter,
    LatLngBounds? bounds,
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
            _db.remoteExifEntity.longitude.isNotNull(),
      );

    if (assetFilter != null) {
      query.where(assetFilter(_db.remoteAssetEntity));
    }

    if (exifFilter != null) {
      query.where(exifFilter(_db.remoteExifEntity));
    }

    if (bounds != null) {
      query.where(_db.remoteExifEntity.inBounds(bounds));
    }

    return query
        .map((row) => row.readTable(_db.remoteExifEntity).toMarker())
        .watch()
        .throttle(const Duration(seconds: 3));
  }
}

extension MapBounds on $RemoteExifEntityTable {
  Expression<bool> inBounds(LatLngBounds bounds) {
    final isLatitudeInBounds =
        latitude.isBiggerOrEqualValue(bounds.southwest.latitude) &
            latitude.isSmallerOrEqualValue(bounds.northeast.latitude);

    final Expression<bool> isLongitudeInBounds;

    if (bounds.southwest.longitude <= bounds.northeast.longitude) {
      isLongitudeInBounds =
          longitude.isBiggerOrEqualValue(bounds.southwest.longitude) &
              longitude.isSmallerOrEqualValue(bounds.northeast.longitude);
    } else {
      isLongitudeInBounds =
          longitude.isBiggerOrEqualValue(bounds.southwest.longitude) |
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
