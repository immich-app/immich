import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/map.model.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class DriftMapRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftMapRepository(super._db) : _db = _db;

  MapQuery remote(List<String> ownerIds, TimelineMapOptions options) => _mapQueryBuilder(
    assetFilter: (row) {
      Expression<bool> condition =
          row.deletedAt.isNull() &
          row.ownerId.isIn(ownerIds) &
          _db.remoteAssetEntity.visibility.isIn([
            AssetVisibility.timeline.index,
            if (options.includeArchived) AssetVisibility.archive.index,
          ]);

      if (options.onlyFavorites) {
        condition = condition & _db.remoteAssetEntity.isFavorite.equals(true);
      }

      if (options.relativeDays != 0) {
        final cutoffDate = DateTime.now().toUtc().subtract(Duration(days: options.relativeDays));
        condition = condition & _db.remoteAssetEntity.createdAt.isBiggerOrEqualValue(cutoffDate);
      }

      return condition;
    },
  );

  MapQuery _mapQueryBuilder({Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter}) {
    return (markerSource: (bounds) => _watchMapMarker(assetFilter: assetFilter, bounds: bounds));
  }

  Future<List<Marker>> _watchMapMarker({
    Expression<bool> Function($RemoteAssetEntityTable row)? assetFilter,
    LatLngBounds? bounds,
  }) async {
    final assetId = _db.remoteExifEntity.assetId;
    final latitude = _db.remoteExifEntity.latitude;
    final longitude = _db.remoteExifEntity.longitude;

    final query = _db.remoteExifEntity.selectOnly()
      ..addColumns([assetId, latitude, longitude])
      ..join([innerJoin(_db.remoteAssetEntity, _db.remoteAssetEntity.id.equalsExp(assetId), useColumns: false)])
      ..limit(10000);

    if (assetFilter != null) {
      query.where(assetFilter(_db.remoteAssetEntity));
    }

    if (bounds != null) {
      query.where(_db.remoteExifEntity.inBounds(bounds));
    } else {
      query.where(latitude.isNotNull() & longitude.isNotNull());
    }

    final rows = await query.get();
    return List.generate(rows.length, (i) {
      final row = rows[i];
      return Marker(assetId: row.read(assetId)!, location: LatLng(row.read(latitude)!, row.read(longitude)!));
    }, growable: false);
  }
}

extension MapBounds on $RemoteExifEntityTable {
  Expression<bool> inBounds(LatLngBounds bounds) {
    final southwest = bounds.southwest;
    final northeast = bounds.northeast;

    final latInBounds = latitude.isBetweenValues(southwest.latitude, northeast.latitude);
    final longInBounds = southwest.longitude <= northeast.longitude
        ? longitude.isBetweenValues(southwest.longitude, northeast.longitude)
        : (longitude.isBiggerOrEqualValue(southwest.longitude) | longitude.isSmallerOrEqualValue(northeast.longitude));
    return latInBounds & longInBounds;
  }
}
