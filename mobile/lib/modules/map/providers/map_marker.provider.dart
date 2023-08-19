import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/services/map.service.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:latlong2/latlong.dart';

final mapMarkerFutureProvider =
    FutureProvider.autoDispose<List<AssetMarkerData>>((ref) async {
  final service = ref.read(mapServiceProvider);
  final mapState = ref.read(mapStateNotifier);
  DateTime? fileCreatedAfter;

  int? relativeTime = mapState.relativeTime;
  if (relativeTime != null && relativeTime != 0) {
    fileCreatedAfter =
        DateTime.now().subtract(Duration(days: mapState.relativeTime!));
  }

  final markers = await service.getMapMarkers(
    isFavorite: mapState.showFavoriteOnly,
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

final mapMarkerAssetsInBoundProvider = FutureProvider.family
    .autoDispose<RenderList, List<Asset>>((ref, assets) async {
  final settings = ref.watch(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  return await RenderList.fromAssets(assets, groupBy);
});

final mapMarkerExifInfoProvider =
    FutureProvider.family.autoDispose<ExifInfo?, String>((ref, remoteId) async {
  final service = ref.watch(mapServiceProvider);
  return await service.getExifInfoForMarker(remoteId);
});

class AssetMarkerData {
  final LatLng point;
  final Asset asset;

  const AssetMarkerData(this.asset, this.point);
}
