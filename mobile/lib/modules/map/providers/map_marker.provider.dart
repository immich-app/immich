import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:latlong2/latlong.dart';

final mapMarkersProvider =
    FutureProvider.autoDispose<Set<AssetMarkerData>>((ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifier);
  DateTime? fileCreatedAfter;
  bool? isFavorite;
  bool? isIncludeArchived;

  if (mapState.relativeTime != 0) {
    fileCreatedAfter =
        DateTime.now().subtract(Duration(days: mapState.relativeTime));
  }

  if (mapState.showFavoriteOnly) {
    isFavorite = true;
  }

  if (!mapState.includeArchived) {
    isIncludeArchived = false;
  }

  final markers = await service.getMapMarkers(
    isFavorite: isFavorite,
    withArchived: isIncludeArchived,
    fileCreatedAfter: fileCreatedAfter,
  );

  final assetMarkerData = await Future.wait(
    markers.map((e) async {
      final asset = await service.getAssetForMarkerId(e.id);
      bool hasInvalidCoords = e.lat < -90 || e.lat > 90;
      hasInvalidCoords = hasInvalidCoords || (e.lon < -180 || e.lon > 180);
      if (asset == null || hasInvalidCoords) return null;
      return AssetMarkerData(asset, LatLng(e.lat, e.lon));
    }),
  );

  return assetMarkerData.nonNulls.toSet();
});

class AssetMarkerData {
  final LatLng point;
  final Asset asset;

  const AssetMarkerData(this.asset, this.point);

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AssetMarkerData && other.asset.remoteId == asset.remoteId;
  }

  @override
  int get hashCode {
    return asset.remoteId.hashCode;
  }
}
