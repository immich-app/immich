import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:latlong2/latlong.dart';

final mapMarkerFutureProvider =
    FutureProvider.autoDispose<List<AssetMarkerData>>((ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifier);
  DateTime? fileCreatedAfter;
  bool? isFavorite;

  int? relativeTime = mapState.relativeTime;
  if (relativeTime != null && relativeTime != 0) {
    fileCreatedAfter =
        DateTime.now().subtract(Duration(days: mapState.relativeTime!));
  }

  if (mapState.showFavoriteOnly) {
    isFavorite = true;
  }

  final markers = await service.getMapMarkers(
    isFavorite: isFavorite,
    fileCreatedAfter: fileCreatedAfter,
  );

  final assetMarkerData = await Future.wait(
    markers.map((e) async {
      final asset = await service.getAssetForMarkerId(e.id);
      if (asset == null) return null;
      return AssetMarkerData(asset, LatLng(e.lat, e.lon));
    }),
  );

  return assetMarkerData.nonNulls.toList();
});

class AssetMarkerData {
  final LatLng point;
  final Asset asset;

  const AssetMarkerData(this.asset, this.point);
}
