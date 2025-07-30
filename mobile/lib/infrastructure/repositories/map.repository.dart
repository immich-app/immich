import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class DriftMapRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftMapRepository(super._db) : _db = _db;

  MapQuery remote(String ownerId) => _mapQueryBuilder(
    assetFilter: (row) =>
        row.deletedAt.isNull() & row.visibility.equalsValue(AssetVisibility.timeline) & row.ownerId.equals(ownerId),
  );

  MapQuery _mapQueryBuilder({Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter}) {
    return (markerSource: (bounds) => _watchMapMarker(assetFilter: assetFilter, bounds: bounds));
  }

  Future<List<Marker>> _watchMapMarker({
    Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter,
    LatLngBounds? bounds,
  }) {
    final query = _db.remoteExifEntity.selectOnly()
      ..addColumns([_db.remoteExifEntity.assetId, _db.remoteExifEntity.latitude, _db.remoteExifEntity.longitude])
      ..join([
        innerJoin(
          _db.remoteAssetEntity,
          _db.remoteAssetEntity.id.equalsExp(_db.remoteExifEntity.assetId),
          useColumns: false,
        ),
      ])
      ..limit(10000);

    if (assetFilter != null) {
      query.where(assetFilter(_db.remoteAssetEntity));
    }

    if (bounds != null) {
      query.where(_db.remoteExifEntity.inBounds(bounds));
    } else {
      query.where(_db.remoteExifEntity.latitude.isNotNull() & _db.remoteExifEntity.longitude.isNotNull());
    }

    return query.map((row) {
      return Marker(
        assetId: row.read(_db.remoteExifEntity.assetId)!,
        location: LatLng(row.read(_db.remoteExifEntity.latitude)!, row.read(_db.remoteExifEntity.longitude)!),
      );
    }).get();
  }
}

extension MapBounds on $RemoteExifEntityTable {
  Expression<bool> inBounds(LatLngBounds bounds) {
    final southwest = bounds.southwest;
    final northeast = bounds.northeast;

    if (southwest.longitude <= northeast.longitude) {
      return latitude.isBetweenValues(southwest.latitude, northeast.latitude) &
          longitude.isBetweenValues(southwest.longitude, northeast.longitude);
    } else {
      return latitude.isBetweenValues(southwest.latitude, northeast.latitude) &
          (longitude.isBiggerOrEqualValue(southwest.longitude) | longitude.isSmallerOrEqualValue(northeast.longitude));
    }
  }
}
